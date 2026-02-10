/**
 * Earth Globe Module - Collider Debug Visualization
 *
 * Dev-only module loaded via dynamic import. Draws tube rings at surface level
 * for each lofi collider circle. Red = override, yellow = catch-only.
 * Hides country/border meshes so the circles are visible on the bare globe.
 */

import { Scene } from '@babylonjs/core/scene';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math';

import { TUBE_TESSELLATION } from './constants';
import { latLonToSphere } from './geo-math';
import type { CountryPicker } from './country-picker';

const CIRCLE_SEGMENTS = 32;
const DEBUG_TUBE_RADIUS = 0.003;
const SURFACE_ALTITUDE = 0.005; // Just above globe surface, below country meshes

// Module-level state
let activeMesh: Mesh | null = null;
let hiddenMeshes: Mesh[] = [];
let storedScene: Scene | null = null;
let storedPicker: CountryPicker | null = null;
let lastMultiplier = 1.0;

function buildCirclePath(lat: number, lon: number, radiusDeg: number) {
    const points = [];
    for (let i = 0; i <= CIRCLE_SEGMENTS; i++) {
        const angle = (i / CIRCLE_SEGMENTS) * Math.PI * 2;
        const dLat = radiusDeg * Math.cos(angle);
        const dLon = radiusDeg * Math.sin(angle);
        points.push(latLonToSphere(lat + dLat, lon + dLon, SURFACE_ALTITUDE));
    }
    return points;
}

function createColorMaterial(scene: Scene, color: Color3): StandardMaterial {
    const mat = new StandardMaterial("colliderDebugMat", scene);
    mat.diffuseColor = color;
    mat.emissiveColor = color.scale(0.5);
    mat.disableLighting = true;
    mat.backFaceCulling = false;
    return mat;
}

/**
 * Build all collider circle tubes and merge them into one mesh.
 * Returns the merged mesh (or null if no circles).
 */
function buildTubes(scene: Scene, picker: CountryPicker): Mesh | null {
    const { overrides, catches } = picker.getColliderDebugInfo();
    const multiplier = picker.getColliderMultiplier();

    const overrideKeys = new Set<string>();
    for (const c of overrides) {
        overrideKeys.add(`${c.lat},${c.lon},${c.radiusDeg}`);
    }

    const redMat = createColorMaterial(scene, new Color3(1, 0.15, 0.15));
    const yellowMat = createColorMaterial(scene, new Color3(1, 0.9, 0.1));

    const tubes: Mesh[] = [];

    for (const c of overrides) {
        const path = buildCirclePath(c.lat, c.lon, c.radiusDeg * multiplier);
        const tube = MeshBuilder.CreateTube("colliderOverride", {
            path,
            radius: DEBUG_TUBE_RADIUS,
            tessellation: TUBE_TESSELLATION,
            cap: Mesh.NO_CAP,
            updatable: false
        }, scene);
        tube.material = redMat;
        tubes.push(tube);
    }

    for (const c of catches) {
        const key = `${c.lat},${c.lon},${c.radiusDeg}`;
        if (overrideKeys.has(key)) continue;

        const path = buildCirclePath(c.lat, c.lon, c.radiusDeg * multiplier);
        const tube = MeshBuilder.CreateTube("colliderCatch", {
            path,
            radius: DEBUG_TUBE_RADIUS,
            tessellation: TUBE_TESSELLATION,
            cap: Mesh.NO_CAP,
            updatable: false
        }, scene);
        tube.material = yellowMat;
        tubes.push(tube);
    }

    if (tubes.length === 0) return null;
    return Mesh.MergeMeshes(tubes, true, true, undefined, true, false);
}

function show(scene: Scene, picker: CountryPicker, surfaceMeshes: Mesh[]): void {
    storedScene = scene;
    storedPicker = picker;
    lastMultiplier = picker.getColliderMultiplier();

    activeMesh = buildTubes(scene, picker);

    // Hide country/border meshes so circles are visible
    hiddenMeshes = [];
    for (const mesh of surfaceMeshes) {
        if (mesh.isEnabled()) {
            mesh.setEnabled(false);
            hiddenMeshes.push(mesh);
        }
    }

    const { overrides, catches } = picker.getColliderDebugInfo();
    const catchOnly = catches.length - overrides.length;
    console.log(`[ColliderDebug] Showing ${overrides.length} override (red) + ${catchOnly} catch-only (yellow) circles`);
}

function hide(): void {
    if (activeMesh) {
        activeMesh.dispose();
        activeMesh = null;
    }

    // Restore hidden meshes
    for (const mesh of hiddenMeshes) {
        mesh.setEnabled(true);
    }
    hiddenMeshes = [];

    storedScene = null;
    storedPicker = null;
}

export function toggleColliderDebug(scene: Scene, picker: CountryPicker, surfaceMeshes: Mesh[]): void {
    if (activeMesh) {
        hide();
        console.log('[ColliderDebug] Hidden');
    } else {
        show(scene, picker, surfaceMeshes);
    }
}

/**
 * Called each frame from the update loop. Rebuilds debug circles
 * if the collider multiplier has changed since last build.
 */
export function updateColliderDebugScale(): void {
    if (!activeMesh || !storedScene || !storedPicker) return;

    const m = storedPicker.getColliderMultiplier();
    if (Math.abs(m - lastMultiplier) < 0.001) return;
    lastMultiplier = m;

    activeMesh.dispose();
    activeMesh = buildTubes(storedScene, storedPicker);
}
