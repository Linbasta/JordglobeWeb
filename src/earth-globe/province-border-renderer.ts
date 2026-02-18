/**
 * Earth Globe Module - Province Border Renderer
 *
 * Renders static province borders as a visual overlay (Mode A).
 * Used for location questions to show province boundaries.
 */

import { Scene } from '@babylonjs/core/scene';
import type { AbstractEngine } from '@babylonjs/core/Engines/abstractEngine';
import { Vector3, Color4 } from '@babylonjs/core/Maths/math';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { VertexBuffer } from '@babylonjs/core/Buffers/buffer';
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';
import { Effect } from '@babylonjs/core/Materials/effect';

import { REGION_ALTITUDE, zoom } from './constants';
import { latLonToSphere } from './geo-math';
import type { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { getZoomValue } from '../shared/animation/camera-utils';

// Import shaders
import provinceBorderVertexShader from './shaders/province-border.vertex.glsl?raw';
import provinceBorderFragmentShader from './shaders/province-border.fragment.glsl?raw';

interface ProvinceSegmentData {
    points: number[][]; // [lat, lon][]
    provinces: number[]; // Province IDs
    type: string;
}

interface ProvinceSegmentsJSON {
    country: string;
    segments: ProvinceSegmentData[];
}

/**
 * State for a loaded province border overlay
 */
export interface ProvinceBorderState {
    countryISO2: string;
    borderMesh: Mesh | null;
    material: ShaderMaterial | null;
    isVisible: boolean;
}

/**
 * Load province border data from JSON
 */
export async function loadProvinceBorders(
    scene: Scene,
    iso2: string
): Promise<ProvinceBorderState> {
    const url = `/province-segments/${iso2}.json`;

    console.log(`Loading province borders for ${iso2}...`);

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to load province segments: ${response.statusText}`);
    }

    const data: ProvinceSegmentsJSON = await response.json();

    // Generate quad strip meshes for all segments
    const meshes: Mesh[] = [];

    for (const segment of data.segments) {
        if (segment.points.length < 2) continue;

        // Regions at rest sit at exactly REGION_ALTITUDE above the sphere surface.
        // Place borders just above that with a small clearance to prevent z-fighting.
        const PROVINCE_BORDER_ALTITUDE = REGION_ALTITUDE + 0.002;

        // Convert lat/lon to 3D sphere points
        const points3D: Vector3[] = segment.points.map(([lat, lon]) =>
            latLonToSphere(lat, lon, PROVINCE_BORDER_ALTITUDE)
        );

        const mesh = createQuadStripBorder(scene, points3D);
        if (mesh) {
            meshes.push(mesh);
        }
    }

    // Merge all segment meshes
    let borderMesh: Mesh | null = null;
    if (meshes.length > 0) {
        borderMesh = Mesh.MergeMeshes(meshes, true, true, undefined, false, false);
        if (borderMesh) {
            borderMesh.name = `provinceBorders_${iso2}`;
        }
    }

    // Create shader material
    const material = createProvinceBorderMaterial(scene);
    if (borderMesh && material) {
        borderMesh.material = material;
    }

    console.log(`Loaded ${data.segments.length} province border segments for ${iso2}`);

    return {
        countryISO2: iso2,
        borderMesh,
        material,
        isVisible: false
    };
}

/**
 * Create quad strip border mesh from a path of 3D points
 */
function createQuadStripBorder(scene: Scene, points: Vector3[]): Mesh | null {
    if (points.length < 2) return null;

    const positions: number[] = [];
    const tangents: number[] = [];
    const indices: number[] = [];

    // Generate quad strip
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];

        // Line direction
        const lineDir = p1.subtract(p0).normalizeToNew();

        // Surface normal at p0 and p1
        const normal0 = p0.normalizeToNew();
        const normal1 = p1.normalizeToNew();

        // Bitangent (perpendicular to line direction on sphere surface)
        const bitangent0 = Vector3.Cross(lineDir, normal0).normalizeToNew();
        const bitangent1 = Vector3.Cross(lineDir, normal1).normalizeToNew();

        // Pre-scale bitangent to ±0.5 (shader multiplies by lineThickness)
        const tangent0Plus = bitangent0.scale(0.5);
        const tangent0Minus = bitangent0.scale(-0.5);
        const tangent1Plus = bitangent1.scale(0.5);
        const tangent1Minus = bitangent1.scale(-0.5);

        // 4 vertices per edge: p0-, p0+, p1-, p1+
        const baseIndex = positions.length / 3;

        // p0-
        positions.push(p0.x, p0.y, p0.z);
        tangents.push(tangent0Minus.x, tangent0Minus.y, tangent0Minus.z, 0);

        // p0+
        positions.push(p0.x, p0.y, p0.z);
        tangents.push(tangent0Plus.x, tangent0Plus.y, tangent0Plus.z, 0);

        // p1-
        positions.push(p1.x, p1.y, p1.z);
        tangents.push(tangent1Minus.x, tangent1Minus.y, tangent1Minus.z, 0);

        // p1+
        positions.push(p1.x, p1.y, p1.z);
        tangents.push(tangent1Plus.x, tangent1Plus.y, tangent1Plus.z, 0);

        // Two triangles per quad
        indices.push(baseIndex, baseIndex + 2, baseIndex + 1);
        indices.push(baseIndex + 1, baseIndex + 2, baseIndex + 3);
    }

    // Create mesh
    const mesh = new Mesh("provinceQuadStrip", scene);
    const vertexData = new VertexData();
    vertexData.positions = new Float32Array(positions);
    vertexData.indices = new Uint32Array(indices);

    // Tangent attribute (vec4)
    const tangentBuffer = new Float32Array(tangents);
    mesh.setVerticesData(VertexBuffer.TangentKind, tangentBuffer, false, 4);

    vertexData.applyToMesh(mesh, false);

    return mesh;
}

/**
 * Create province border shader material
 */
function createProvinceBorderMaterial(scene: Scene): ShaderMaterial {
    const name = "provinceBorderShader";

    Effect.ShadersStore[`${name}VertexShader`] = provinceBorderVertexShader;
    Effect.ShadersStore[`${name}FragmentShader`] = provinceBorderFragmentShader;

    const shaderMaterial = new ShaderMaterial(name, scene, {
        vertex: name,
        fragment: name,
    }, {
        attributes: ["position", "tangent"],
        uniforms: ["worldViewProjection", "altitudeOffset", "lineThickness", "borderColor", "lineAlpha"],
        samplers: []
    });

    shaderMaterial.onCompiled = () => console.log(`Shader ${name} compiled successfully`);
    shaderMaterial.onError = (effect, errors) => {
        console.error(`Shader compilation error in ${name}:`, errors);
    };

    // altitudeOffset = 0: border altitude is fully baked into vertex positions
    shaderMaterial.setFloat("altitudeOffset", 0.0);
    shaderMaterial.setFloat("lineThickness", zoom.provinceBorderThicknessClose);
    shaderMaterial.setColor4("borderColor", new Color4(0, 0, 0, 1)); // Black
    shaderMaterial.setFloat("lineAlpha", zoom.provinceBorderAlphaClose);
    shaderMaterial.backFaceCulling = false;
    shaderMaterial.transparencyMode = 2; // ALPHA_BLEND

    return shaderMaterial;
}

/**
 * Show province borders
 */
export function showProvinceBorders(state: ProvinceBorderState): void {
    if (state.borderMesh) {
        state.borderMesh.setEnabled(true);
        state.isVisible = true;
    }
}

/**
 * Hide province borders
 */
export function hideProvinceBorders(state: ProvinceBorderState): void {
    if (state.borderMesh) {
        state.borderMesh.setEnabled(false);
        state.isVisible = false;
    }
}

/**
 * Update province border uniforms based on camera zoom.
 * Uses the same getZoomValue interpolation as the rest of the codebase.
 */
export function updateProvinceBorderUniforms(
    state: ProvinceBorderState,
    camera: ArcRotateCamera
): void {
    if (!state.material || !state.isVisible) return;

    const lineThickness = getZoomValue(camera, zoom.provinceBorderThicknessClose, zoom.provinceBorderThicknessFar);
    const lineAlpha = getZoomValue(camera, zoom.provinceBorderAlphaClose, zoom.provinceBorderAlphaFar);

    state.material.setFloat("lineThickness", lineThickness);
    state.material.setFloat("lineAlpha", lineAlpha);
}

/**
 * Dispose province border state
 */
export function disposeProvinceBorders(state: ProvinceBorderState): void {
    if (state.borderMesh) {
        state.borderMesh.dispose();
        state.borderMesh = null;
    }
    if (state.material) {
        state.material.dispose();
        state.material = null;
    }
}
