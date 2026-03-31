/**
 * Pin Edge Scroll Module
 * Auto-rotates the globe when the pin is dragged near screen edges.
 * Module-level singleton state — same pattern as pin-manager.ts.
 */

import { Scene } from '@babylonjs/core/scene';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { getZoomValue } from '../animation/camera-utils';
import { EARTH_RADIUS } from '../../earth-globe/constants';

// --- Constants ---

const EDGE_LEFT = 0.10;
const EDGE_RIGHT = 0.10;
const EDGE_TOP = 0.20;
const EDGE_BOTTOM = 0.10;

const GLOBE_EDGE_MARGIN = 0.3;

const ACTIVATION_DELAY_MS = 500;
const ACCELERATION = 0.003;
const MAX_SPEED_CLOSE = 0.004;
const MAX_SPEED_FAR = 0.02;
const DAMPING = 0.85;
const VELOCITY_THRESHOLD = 0.0001;
const BETA_MIN = 0.1;
const BETA_MAX = Math.PI - 0.1;

// --- Module-level state ---

let scene: Scene;
let camera: ArcRotateCamera;
let canvas: HTMLCanvasElement;

let active = false;
let activationTime = 0;
let velocityAlpha = 0;
let velocityBeta = 0;
let lastPointerX = 0;
let lastPointerY = 0;
let pointerValid = false;
let scrolledThisFrame = false;
let bottomDeadZone = 0; // pixels from bottom reserved for cancel zone

// --- Private functions ---

function tick(): void {
    if (!active) return;

    // Wait for activation delay
    if (performance.now() - activationTime < ACTIVATION_DELAY_MS) return;

    if (!pointerValid) return;

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return;

    // Normalized pointer position (0..1)
    const nx = lastPointerX / w;
    const ny = lastPointerY / h;

    // Compute push from each edge (linear gradient: 1.0 at edge, 0.0 at margin boundary)
    let pushX = 0;
    let pushY = 0;

    if (nx < EDGE_LEFT) {
        pushX = -(EDGE_LEFT - nx) / EDGE_LEFT;
    } else if (nx > 1 - EDGE_RIGHT) {
        pushX = (nx - (1 - EDGE_RIGHT)) / EDGE_RIGHT;
    }

    const deadNy = bottomDeadZone / h;
    if (ny < EDGE_TOP) {
        pushY = -(EDGE_TOP - ny) / EDGE_TOP;  // negative = rotate up (beta decreases)
    } else if (ny > 1 - EDGE_BOTTOM - deadNy && ny <= 1 - deadNy) {
        pushY = (ny - (1 - EDGE_BOTTOM - deadNy)) / EDGE_BOTTOM;  // positive = rotate down (beta increases)
    }

    // Globe silhouette edge detection
    const D = camera.radius;
    if (D > EARTH_RADIUS) {
        const silhouetteAngle = Math.asin(EARTH_RADIUS / D);
        const radiusNy = Math.tan(silhouetteAngle) / Math.tan(camera.fov / 2) * 0.5;
        const radiusNx = radiusNy * (h / w);

        const dx = (nx - 0.5) / radiusNx;
        const dy = (ny - 0.5) / radiusNy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 1.2) {
            const globePush = Math.min((dist - 1.0) / GLOBE_EDGE_MARGIN, 1.0);
            const invDist = 1.0 / dist;
            const globePushX = (dx * invDist) * globePush;
            const globePushY = (dy * invDist) * globePush;

            // Take whichever source has greater magnitude, per axis
            if (Math.abs(globePushX) > Math.abs(pushX)) pushX = globePushX;
            if (Math.abs(globePushY) > Math.abs(pushY)) pushY = globePushY;
        }
    }

    const maxSpeed = getZoomValue(camera, MAX_SPEED_CLOSE, MAX_SPEED_FAR);
    const inEdgeZone = pushX !== 0 || pushY !== 0;

    if (inEdgeZone) {
        velocityAlpha += pushX * ACCELERATION;
        velocityBeta += pushY * ACCELERATION;

        // Clamp velocity magnitude per axis
        velocityAlpha = Math.max(-maxSpeed, Math.min(maxSpeed, velocityAlpha));
        velocityBeta = Math.max(-maxSpeed, Math.min(maxSpeed, velocityBeta));
    } else {
        velocityAlpha *= DAMPING;
        velocityBeta *= DAMPING;

        if (Math.abs(velocityAlpha) < VELOCITY_THRESHOLD) velocityAlpha = 0;
        if (Math.abs(velocityBeta) < VELOCITY_THRESHOLD) velocityBeta = 0;
    }

    if (velocityAlpha === 0 && velocityBeta === 0) return;

    // Apply to camera
    camera.alpha += velocityAlpha;
    camera.beta += velocityBeta;

    // Clamp beta to prevent pole flip
    if (camera.beta < BETA_MIN) camera.beta = BETA_MIN;
    if (camera.beta > BETA_MAX) camera.beta = BETA_MAX;

    scrolledThisFrame = true;
}

// --- Exported functions ---

export function initPinScroll(_scene: Scene, _camera: ArcRotateCamera, _canvas: HTMLCanvasElement): void {
    scene = _scene;
    camera = _camera;
    canvas = _canvas;

    scene.registerBeforeRender(tick);
}

export function startPinScroll(): void {
    active = true;
    activationTime = performance.now();
    velocityAlpha = 0;
    velocityBeta = 0;
    pointerValid = false;
    scrolledThisFrame = false;
}

export function stopPinScroll(): void {
    active = false;
    velocityAlpha = 0;
    velocityBeta = 0;
    pointerValid = false;
    scrolledThisFrame = false;
}

export function updatePointer(clientX: number, clientY: number): void {
    lastPointerX = clientX;
    lastPointerY = clientY;
    pointerValid = true;
}

export function setBottomDeadZone(pixels: number): void {
    bottomDeadZone = pixels;
}

export function consumeScrolledFlag(): boolean {
    const was = scrolledThisFrame;
    scrolledThisFrame = false;
    return was;
}
