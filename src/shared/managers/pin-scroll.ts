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

const EDGE_X_BASE = 0.10;        // Base horizontal edge zone (10%)
const EDGE_X_PORTRAIT_MAX = 0.20; // Max edge zone in extreme portrait
const EDGE_TOP = 0.20;
const EDGE_BOTTOM = 0.05;
// const GLOBE_EDGE_PADDING = 0.05;  // Extra padding inside globe edge when zoomed out
const GLOBE_EDGE_PADDING = 0.00;  // Extra padding inside globe edge when zoomed out

const ACTIVATION_DELAY_MS = 500;
const ACCELERATION = 0.0005;
const MAX_SPEED_CLOSE = 0.002;
const MAX_SPEED_FAR = 0.008;
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

/**
 * Computes dynamic horizontal edge zone based on aspect ratio and zoom level.
 * - Portrait mode: wider zones (up to 20%)
 * - Zoomed out (full globe visible): zones clamp to globe edge
 */
function getEdgeX(): number {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return EDGE_X_BASE;

    const aspectRatio = w / h;

    // 1. Aspect ratio adjustment: wider zones in portrait
    // Linear interpolation from EDGE_X_PORTRAIT_MAX at ratio 0.5 to EDGE_X_BASE at ratio 1.0
    let edge = EDGE_X_BASE;
    if (aspectRatio < 1) {
        const t = Math.max(0, Math.min(1, (1 - aspectRatio) * 2)); // 0 at ratio 1, 1 at ratio 0.5
        edge = EDGE_X_BASE + t * (EDGE_X_PORTRAIT_MAX - EDGE_X_BASE);
    }

    // 2. Zoom adjustment: when globe is fully visible, clamp to globe edge
    // Calculate horizontal FOV from vertical FOV and aspect ratio
    const verticalFOV = camera.fov;
    const horizontalFOV = 2 * Math.atan(Math.tan(verticalFOV / 2) * aspectRatio);

    // Globe's angular diameter from current camera distance
    const globeAngularDiameter = 2 * Math.atan(EARTH_RADIUS / camera.radius);

    // Fraction of screen width the globe occupies
    const globeScreenFraction = globeAngularDiameter / horizontalFOV;

    if (globeScreenFraction < 1) {
        // Globe is fully visible horizontally
        // Empty space on each side
        const emptySpace = (1 - globeScreenFraction) / 2;
        // Ensure scroll zone starts at least at globe edge + padding
        const minEdge = emptySpace + GLOBE_EDGE_PADDING;
        edge = Math.max(edge, minEdge);
    }

    return edge;
}

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

    const edgeX = getEdgeX();
    if (nx < edgeX) {
        pushX = -(edgeX - nx) / edgeX;
    } else if (nx > 1 - edgeX) {
        pushX = (nx - (1 - edgeX)) / edgeX;
    }

    const deadNy = bottomDeadZone / h;
    if (ny < EDGE_TOP) {
        pushY = -(EDGE_TOP - ny) / EDGE_TOP;  // negative = rotate up (beta decreases)
    } else if (ny > 1 - EDGE_BOTTOM - deadNy && ny <= 1 - deadNy) {
        pushY = (ny - (1 - EDGE_BOTTOM - deadNy)) / EDGE_BOTTOM;  // positive = rotate down (beta increases)
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

/**
 * Returns the current horizontal edge zone fraction (0-1).
 * Useful for debug visualization.
 */
export function getCurrentEdgeX(): number {
    if (!canvas || !camera) return EDGE_X_BASE;
    return getEdgeX();
}
