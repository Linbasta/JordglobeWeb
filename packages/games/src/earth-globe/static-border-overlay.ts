/**
 * Earth Globe Module - Static Border Overlay
 *
 * Creates non-animated border overlays that sit above the globe surface.
 * Used for providing visual context when zoomed into a region.
 *
 * Use cases:
 * - Capital medals: Show country borders when zoomed into a city
 * - Province quizzes: Show province borders for location questions
 *
 * Unlike segment borders (which animate with regions), these are:
 * - Static (no animation)
 * - Zoom-responsive (thickness and alpha change with camera)
 * - Rendered as simple quad strips
 * - Always visible once enabled
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
import staticBorderOverlayVertexShader from './shaders/static-border-overlay.vertex.glsl?raw';
import staticBorderOverlayFragmentShader from './shaders/static-border-overlay.fragment.glsl?raw';

/**
 * Segment data format - works with both country and province segments
 */
interface SegmentData {
    points: Array<[number, number] | {lat: number, lon: number}>; // Province: [lat, lon][], Country: {lat, lon}[]
    regions?: string[]; // Region IDs (for country format: ["US", "CA"])
    countries?: string[]; // Alternative name in country format
    provinces?: string[]; // Province IDs (for province format: ["US-0", "US-1"])
    type: string;
}

/**
 * Province segments JSON format
 */
interface ProvinceSegmentsJSON {
    country: string;
    segments: SegmentData[];
}

/**
 * Country segments JSON format
 */
type CountrySegmentsJSON = SegmentData[];

/**
 * State for a loaded static border overlay
 */
export interface StaticBorderOverlayState {
    name: string;
    borderMesh: Mesh | null;
    material: ShaderMaterial | null;
    isVisible: boolean;
}

/**
 * Configuration for loading static border overlay
 */
export interface StaticBorderOverlayConfig {
    segmentUrl: string;           // e.g., "/segments.json" or "/province-segments/US.json"
    name: string;                  // Mesh identifier (e.g., "US-provinces" or "countries")
    segmentFormat: 'country' | 'province'; // Which JSON format to expect
}

/**
 * Load static border overlay from segment data
 *
 * Example usage for capital medals:
 * ```typescript
 * const overlay = await loadStaticBorderOverlay(scene, {
 *     segmentUrl: "/segments.json",
 *     name: "russia-overlay",
 *     segmentFormat: 'country'
 * });
 * showStaticBorderOverlay(overlay);
 * ```
 *
 * Example usage for province quizzes:
 * ```typescript
 * const overlay = await loadStaticBorderOverlay(scene, {
 *     segmentUrl: "/province-segments/US.json",
 *     name: "US-provinces",
 *     segmentFormat: 'province'
 * });
 * showStaticBorderOverlay(overlay);
 * ```
 */
export async function loadStaticBorderOverlay(
    scene: Scene,
    config: StaticBorderOverlayConfig
): Promise<StaticBorderOverlayState> {
    const { segmentUrl, name, segmentFormat } = config;

    console.log(`Loading static border overlay: ${name} from ${segmentUrl}...`);

    const response = await fetch(segmentUrl);
    if (!response.ok) {
        throw new Error(`Failed to load segments: ${response.statusText}`);
    }

    const rawData = await response.json();

    // Parse based on format
    let segments: SegmentData[];
    if (segmentFormat === 'province') {
        const data = rawData as ProvinceSegmentsJSON;
        segments = data.segments;
    } else {
        segments = rawData as CountrySegmentsJSON;
    }

    // Generate quad strip meshes for all segments
    const meshes: Mesh[] = [];

    for (const segment of segments) {
        if (segment.points.length < 2) continue;

        // Regions at rest sit at exactly REGION_ALTITUDE above the sphere surface.
        // Place borders just above that with a small clearance to prevent z-fighting.
        const BORDER_ALTITUDE = REGION_ALTITUDE + 0.002;

        // Convert lat/lon to 3D sphere points
        // Handle both province format [lat, lon][] and country format {lat, lon}[]
        const points3D: Vector3[] = segment.points.map(point => {
            if (Array.isArray(point)) {
                // Province format: [lat, lon]
                return latLonToSphere(point[0], point[1], BORDER_ALTITUDE);
            } else {
                // Country format: {lat, lon}
                return latLonToSphere(point.lat, point.lon, BORDER_ALTITUDE);
            }
        });

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
            borderMesh.name = `staticBorderOverlay_${name}`;
        }
    }

    // Create shader material
    const material = createStaticBorderOverlayMaterial(scene);
    if (borderMesh && material) {
        borderMesh.material = material;
    }

    console.log(`Loaded ${segments.length} border segments for ${name}`);

    return {
        name,
        borderMesh,
        material,
        isVisible: false
    };
}

/**
 * Convenience function for loading province borders (legacy API)
 */
export async function loadProvinceBorders(
    scene: Scene,
    iso2: string
): Promise<StaticBorderOverlayState> {
    return loadStaticBorderOverlay(scene, {
        segmentUrl: `/province-segments/${iso2}.json`,
        name: `${iso2}-provinces`,
        segmentFormat: 'province'
    });
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
    const mesh = new Mesh("staticBorderQuadStrip", scene);
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
 * Create static border overlay shader material
 */
function createStaticBorderOverlayMaterial(scene: Scene): ShaderMaterial {
    const name = "staticBorderOverlayShader";

    Effect.ShadersStore[`${name}VertexShader`] = staticBorderOverlayVertexShader;
    Effect.ShadersStore[`${name}FragmentShader`] = staticBorderOverlayFragmentShader;

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
 * Show static border overlay
 */
export function showStaticBorderOverlay(state: StaticBorderOverlayState): void {
    if (state.borderMesh) {
        state.borderMesh.setEnabled(true);
        state.isVisible = true;
    }
}

/**
 * Hide static border overlay
 */
export function hideStaticBorderOverlay(state: StaticBorderOverlayState): void {
    if (state.borderMesh) {
        state.borderMesh.setEnabled(false);
        state.isVisible = false;
    }
}

/**
 * Convenience function (legacy API)
 */
export function showProvinceBorders(state: StaticBorderOverlayState): void {
    showStaticBorderOverlay(state);
}

/**
 * Convenience function (legacy API)
 */
export function hideProvinceBorders(state: StaticBorderOverlayState): void {
    hideStaticBorderOverlay(state);
}

/**
 * Update static border overlay uniforms based on camera zoom.
 * Uses the same getZoomValue interpolation as the rest of the codebase.
 */
export function updateStaticBorderOverlayUniforms(
    state: StaticBorderOverlayState,
    camera: ArcRotateCamera
): void {
    if (!state.material || !state.isVisible) return;

    const lineThickness = getZoomValue(camera, zoom.provinceBorderThicknessClose, zoom.provinceBorderThicknessFar);
    const lineAlpha = getZoomValue(camera, zoom.provinceBorderAlphaClose, zoom.provinceBorderAlphaFar);

    state.material.setFloat("lineThickness", lineThickness);
    state.material.setFloat("lineAlpha", lineAlpha);
}

/**
 * Convenience function (legacy API)
 */
export function updateProvinceBorderUniforms(
    state: StaticBorderOverlayState,
    camera: ArcRotateCamera
): void {
    updateStaticBorderOverlayUniforms(state, camera);
}

/**
 * Dispose static border overlay state
 */
export function disposeStaticBorderOverlay(state: StaticBorderOverlayState): void {
    if (state.borderMesh) {
        state.borderMesh.dispose();
        state.borderMesh = null;
    }
    if (state.material) {
        state.material.dispose();
        state.material = null;
    }
}

/**
 * Convenience function (legacy API)
 */
export function disposeProvinceBorders(state: StaticBorderOverlayState): void {
    disposeStaticBorderOverlay(state);
}
