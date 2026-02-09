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

const EARTH_RADIUS = 2.0;

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
            updatePreviewPinPosition(e);
        }
    });

    canvas.addEventListener('pointerup', (e) => {
        if (isPlacingMode && (e.button === 0 || e.button === 2)) {
            exitPlacingMode(true);
        }
    });

    canvas.addEventListener('pointerleave', () => {
        if (isPlacingMode) {
            exitPlacingMode(false);
        }
    });

    canvas.addEventListener('pointerdown', (e) => {
        if (e.button === 2 && !isPlacingMode) {
            const pickResult = scene.pick(e.clientX, e.clientY, (mesh) => mesh === earthSphere);
            if (pickResult.hit) {
                enterPlacingMode();
                updatePreviewPinPosition(e);
            }
        }
    });

    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
}

function updatePreviewPinPosition(event: PointerEvent): void {
    if (!previewPin) return;

    const pickResult = scene.pick(event.clientX, event.clientY, (mesh) => mesh === earthSphere);

    if (pickResult.hit && pickResult.pickedPoint) {
        // Show the pin when we hit the globe
        if (!previewPin.isEnabled()) {
            previewPin.setEnabled(true);
        }

        // Scale pin based on camera zoom (using config values)
        if (previewPinContainer) {
            const config = getConfig();
            const pinScale = getZoomValue(
                camera,
                config.zoom.pinScale.closeValue,
                config.zoom.pinScale.farValue,
                config.zoom.pinScale.easing
            );
            previewPinContainer.scaling.setAll(pinScale);
        }

        // Calculate surface normal
        const normal = pickResult.pickedPoint.normalizeToNew();

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
    } else {
        // Not over globe - hide pin
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
    setupEventHandlers();
}

export function enterPlacingMode(): void {
    if (!previewPin) return;
    isPlacingMode = true;
    document.body.classList.add('placing-mode');

    camera.detachControl();
    pinRecorder.startRecording();

    if (onPlacingModeChangeCallback) {
        onPlacingModeChangeCallback(true);
    }
}

export function exitPlacingMode(placePin: boolean = false): void {
    isPlacingMode = false;
    document.body.classList.remove('placing-mode');

    camera.attachControl(canvas, true);
    pinRecorder.stopRecording();

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
