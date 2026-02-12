/**
 * Pin Manager Module
 * Handles pin placement mode, preview pin, and pin events
 *
 * Module-level singleton state — only one pin manager per page.
 */

import { Scene } from '@babylonjs/core/scene';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Quaternion } from '@babylonjs/core/Maths/math.vector';
import { Material } from '@babylonjs/core/Materials/material';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import '@babylonjs/loaders/glTF';
import type { CountryPicker, CountryPolygon, LatLon } from '../../earth-globe';
import { cartesianToLatLon, ANIMATION_AMPLITUDE } from '../../earth-globe';
import { PinRecorder, type RecordedPosition } from '../animation/pin-recorder';
import { getZoomValue } from '../animation/camera-utils';
import { getConfig } from '../config/global-config';
import { initPinScroll, startPinScroll, stopPinScroll, updatePointer, consumeScrolledFlag } from './pin-scroll';

const EARTH_RADIUS = 2.0;
const TOUCH_Y_OFFSET = -50; // negative = upward in screen space, ~50px above fingertip

// --- Module-level state ---

let scene: Scene;
let camera: ArcRotateCamera;
let canvas: HTMLCanvasElement;
let countryPicker: CountryPicker;
let earthSphere: Mesh;
let createUnlitMaterial: (mat: Material | null) => Material;
let getCountryAltitude: (idx: number) => number;

let bossPinTemplate: AbstractMesh | null = null;
let previewPin: TransformNode | null = null;
let previewPinContainer: TransformNode | null = null;
let isPlacingMode = false;
let hoveredCountry: CountryPolygon | null = null;
let pinRecorder = new PinRecorder();

let lastClientX = 0;
let lastClientY = 0;

let onPinPlacedCallback: ((country: CountryPolygon | null, latLon: LatLon) => void) | null = null;
let onCountryHoverCallback: ((country: CountryPolygon | null, latLon: LatLon) => void) | null = null;
let onPlacingModeChangeCallback: ((isPlacing: boolean) => void) | null = null;
let onPinMoveCallback: ((latLon: LatLon) => void) | null = null;

// --- Private functions ---

async function loadBossPinModel(): Promise<void> {
    try {
        const result = await SceneLoader.ImportMeshAsync("", "/", "BossPin.glb", scene);
        if (result.meshes.length === 0) {
            console.error('No meshes found in BossPin model');
            return;
        }
        const rootMesh = result.meshes[0];
        rootMesh.setEnabled(false);
        bossPinTemplate = rootMesh;
    } catch (error) {
        console.error('[PinManager] Failed to load BossPin model:', error);
    }
}

function createPreviewPin(): void {
    if (!bossPinTemplate) return;

    // Create pivot transform node
    const pinPivot = new TransformNode("previewPinPivot", scene);

    // Create container for the pin meshes
    previewPinContainer = new TransformNode("previewPinContainer", scene);
    previewPinContainer.parent = pinPivot;

    // Scale the pin (adjust based on your model size)
    const pinScale = 150;
    previewPinContainer.scaling = new Vector3(pinScale, pinScale, pinScale);

    // Clone all child meshes from the template and apply unlit material
    bossPinTemplate.getChildMeshes().forEach(mesh => {
        const cloned = mesh.clone("previewPinMesh", previewPinContainer);
        if (cloned) {
            cloned.setEnabled(true);
            const unlitMaterial = createUnlitMaterial(mesh.material);
            cloned.material = unlitMaterial;
        }
    });

    previewPin = pinPivot;
    previewPin.setEnabled(false);
}

function setupEventHandlers(): void {
    canvas.addEventListener('pointermove', (e) => {
        if (isPlacingMode && previewPin) {
            updatePreviewPinFromEvent(e);
        }
    });

    canvas.addEventListener('pointerup', (e) => {
        if (isPlacingMode && (e.button === 0 || e.button === 2)) {
            // Check if pointer is in bottom cancel zone (near pin UI)
            const cancelZoneHeight = 200; // pixels from bottom
            const isInCancelZone = e.clientY > canvas.height - cancelZoneHeight;

            // If in cancel zone, don't place pin (returns to UI)
            // Otherwise, place pin normally
            exitPlacingMode(!isInCancelZone);
        }
    });

    canvas.addEventListener('pointerleave', () => {
        if (isPlacingMode) {
            exitPlacingMode(false);
        }
    });

    canvas.addEventListener('pointerdown', (e) => {
        if (e.button === 2 && !isPlacingMode) {
            const pickY = e.pointerType === 'touch' ? e.clientY + TOUCH_Y_OFFSET : e.clientY;
            const pickResult = scene.pick(e.clientX, pickY, (mesh) => mesh === earthSphere);
            if (pickResult.hit) {
                enterPlacingMode();
                updatePreviewPinFromEvent(e);
            }
        }
    });

    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
}

function updatePreviewPinFromEvent(event: PointerEvent): void {
    const pickY = event.pointerType === 'touch' ? event.clientY + TOUCH_Y_OFFSET : event.clientY;
    lastClientX = event.clientX;
    lastClientY = pickY;
    updatePointer(event.clientX, event.clientY);
    updatePreviewPinAtScreenCoords(event.clientX, pickY);
}

function positionPinAtNormal(normal: Vector3): void {
    if (!previewPin) return;

    if (!previewPin.isEnabled()) {
        previewPin.setEnabled(true);
    }

    // Note: Pin scaling is handled by updatePinScaleIfPlacing() in the render loop

    // Detect which country the pin is over
    const latLon = cartesianToLatLon(normal.x, normal.y, normal.z);
    const country = countryPicker.getCountryAt(latLon);

    // Get altitude: use country altitude if over land, otherwise base EARTH_RADIUS
    const altitudeNormalized = country ? getCountryAltitude(country.countryIndex) : 0.0;
    const altitudeWorldSpace = altitudeNormalized * ANIMATION_AMPLITUDE;

    // Position pin at globe surface + country altitude
    previewPin.position.copyFrom(normal).scaleInPlace(EARTH_RADIUS + altitudeWorldSpace);

    // Orient the pivot so its local Y-axis points along the normal
    const upVector = Vector3.Up();
    const quaternion = new Quaternion();
    Quaternion.FromUnitVectorsToRef(upVector, normal, quaternion);
    previewPin.rotationQuaternion = quaternion;

    // Fire pin move callback (every pointermove, not gated by country change)
    if (onPinMoveCallback) {
        onPinMoveCallback(latLon);
    }

    // Record this position
    pinRecorder.recordPosition(latLon.lat, latLon.lon);

    // Update hovered country and trigger callback if changed
    if (country !== hoveredCountry) {
        hoveredCountry = country;
        if (onCountryHoverCallback) {
            onCountryHoverCallback(country, latLon);
        }
    }
}

function updatePreviewPinAtScreenCoords(clientX: number, clientY: number): void {
    if (!previewPin) return;

    const pickResult = scene.pick(clientX, clientY, (mesh) => mesh === earthSphere);

    if (pickResult.hit && pickResult.pickedPoint) {
        const normal = pickResult.pickedPoint.normalizeToNew();
        positionPinAtNormal(normal);
    } else if (isPlacingMode) {
        // Ray missed the globe — project pointer ray to nearest point on sphere edge
        const ray = scene.createPickingRay(clientX, clientY, null, camera);
        const t = -Vector3.Dot(ray.origin, ray.direction);
        const closestOnRay = ray.origin.add(ray.direction.scale(Math.max(0, t)));
        const normal = closestOnRay.normalizeToNew();
        positionPinAtNormal(normal);
    } else {
        // Not over globe and not dragging - hide pin
        if (previewPin.isEnabled()) {
            previewPin.setEnabled(false);
        }

        // Clear hovered country
        if (hoveredCountry) {
            hoveredCountry = null;
            if (onCountryHoverCallback) {
                onCountryHoverCallback(null, { lat: 0, lon: 0 });
            }
        }
    }
}

// --- Exported functions ---

export async function initPinManager(
    _scene: Scene,
    _camera: ArcRotateCamera,
    _canvas: HTMLCanvasElement,
    _countryPicker: CountryPicker,
    _earthSphere: Mesh,
    _createUnlitMaterial: (mat: Material | null) => Material,
    _getCountryAltitude: (idx: number) => number
): Promise<void> {
    scene = _scene;
    camera = _camera;
    canvas = _canvas;
    countryPicker = _countryPicker;
    earthSphere = _earthSphere;
    createUnlitMaterial = _createUnlitMaterial;
    getCountryAltitude = _getCountryAltitude;

    await loadBossPinModel();
    createPreviewPin();
    initPinScroll(scene, camera, canvas);
    setupEventHandlers();

    // Re-pick pin position when globe scrolls under stationary pointer
    scene.registerBeforeRender(() => {
        if (isPlacingMode && consumeScrolledFlag()) {
            updatePreviewPinAtScreenCoords(lastClientX, lastClientY);
        }
    });
}

export function enterPlacingMode(): void {
    if (!previewPin) return;
    isPlacingMode = true;
    document.body.classList.add('placing-mode');

    camera.detachControl();
    pinRecorder.startRecording();
    startPinScroll();

    if (onPlacingModeChangeCallback) {
        onPlacingModeChangeCallback(true);
    }
}

export function exitPlacingMode(placePin: boolean = false): void {
    isPlacingMode = false;
    document.body.classList.remove('placing-mode');

    camera.attachControl(canvas, true);
    pinRecorder.stopRecording();
    stopPinScroll();

    if (onPlacingModeChangeCallback) {
        onPlacingModeChangeCallback(false);
    }

    if (previewPin) {
        previewPin.setEnabled(false);
    }

    if (placePin && previewPin) {
        const pinPos = previewPin.position;
        const latLon = cartesianToLatLon(pinPos.x, pinPos.y, pinPos.z);
        const country = countryPicker.getCountryAt(latLon);

        if (onPinPlacedCallback) {
            onPinPlacedCallback(country, latLon);
        }
    }

    hoveredCountry = null;
}

export function isPlacing(): boolean {
    return isPlacingMode;
}

export function getPreviewPin(): TransformNode | null {
    return previewPin;
}

export function getRecordedPositions(): RecordedPosition[] {
    return pinRecorder.createRecording('', '', '').positions;
}

export function clearRecordedPositions(): void {
    pinRecorder.clear();
}

export function onPinPlaced(callback: (country: CountryPolygon | null, latLon: LatLon) => void): void {
    onPinPlacedCallback = callback;
}

export function onCountryHover(callback: (country: CountryPolygon | null, latLon: LatLon) => void): void {
    onCountryHoverCallback = callback;
}

export function onPlacingModeChange(callback: (isPlacing: boolean) => void): void {
    onPlacingModeChangeCallback = callback;
}

export function onPinMove(callback: (latLon: LatLon) => void): void {
    onPinMoveCallback = callback;
}

/**
 * Update pin scale based on current camera zoom.
 * Call this every frame to ensure smooth scaling during zoom.
 * No-op if not in placing mode.
 */
export function updatePinScaleIfPlacing(): void {
    if (!isPlacingMode || !previewPinContainer) return;

    const config = getConfig();
    const pinScale = getZoomValue(
        camera,
        config.zoom.pinScale.closeValue,
        config.zoom.pinScale.farValue,
        config.zoom.pinScale.easing
    );

    previewPinContainer.scaling.x = pinScale;
    previewPinContainer.scaling.y = pinScale;
    previewPinContainer.scaling.z = pinScale;
}
