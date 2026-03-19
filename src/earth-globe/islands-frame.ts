/**
 * Earth Globe Module - Islands Frame
 *
 * Creates special bounding polygon visualizations for island nations
 * like Kiribati whose islands are too spread out for standard visualization.
 */

import { Scene } from '@babylonjs/core/scene';
import type { AbstractEngine } from '@babylonjs/core/Engines/abstractEngine';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { VertexBuffer } from '@babylonjs/core/Buffers/buffer';
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';
import { Vector3 } from '@babylonjs/core/Maths/math';

import { OUTLINE_TUBE_RADIUS, TUBE_TESSELLATION } from './constants';
import { latLonToSphere } from './geo-math';
import type { LatLonPoint } from './types';

/**
 * Islands bounding region definition
 */
export interface IslandsRegion {
    /** Name of the island group */
    name: string;
    /** Bounding polygon points (lat/lon) */
    points: LatLonPoint[];
}

/**
 * Islands definition with one or more bounding regions
 */
export interface IslandsDefinition {
    /** ISO2 country code */
    iso2: string;
    /** Display name */
    name: string;
    /** Bounding regions (can be multiple for scattered island groups) */
    regions: IslandsRegion[];
}

// ============================================================================
// Islands Definitions
// ============================================================================

/**
 * Kiribati consists of 3 island groups spread across the Pacific:
 * 1. Gilbert Islands (western group, near 0° lat, 173-177° E)
 * 2. Phoenix Islands (central group, around -4° lat, -172° W)
 * 3. Line Islands (eastern group, 2° N to -11° S, -157° to -151° W)
 */
export const KIRIBATI_DEFINITION: IslandsDefinition = {
    iso2: 'KI',
    name: 'Kiribati',
    regions: [
        {
            name: 'Gilbert Islands',
            points: [
                { lat: 4.0, lon: 172.0 },
                { lat: 4.0, lon: 178.0 },
                { lat: -1.0, lon: 178.0 },
                { lat: -3.5, lon: 177.5 },
                { lat: -3.5, lon: 172.0 },
            ]
        },
        {
            name: 'Phoenix Islands',
            points: [
                { lat: -2.0, lon: -176.0 },
                { lat: -2.0, lon: -170.5 },
                { lat: -5.0, lon: -170.5 },
                { lat: -6.5, lon: -172.5 },
                { lat: -6.5, lon: -176.0 },
            ]
        },
        {
            name: 'Line Islands',
            points: [
                { lat: 3.0, lon: -160.5 },
                { lat: 3.0, lon: -156.0 },
                { lat: 5.0, lon: -156.0 },
                { lat: 5.0, lon: -150.5 },
                { lat: -4.5, lon: -150.5 },
                { lat: -4.5, lon: -153.5 },
                { lat: -6.0, lon: -155.5 },
                { lat: -12.5, lon: -155.5 },
                { lat: -12.5, lon: -160.5 },
            ]
        }
    ]
};

/** Maldives - chain of atolls in Indian Ocean */
export const MALDIVES_DEFINITION: IslandsDefinition = {
    iso2: 'MV',
    name: 'Maldives',
    regions: [
        {
            name: 'Maldives Atolls',
            points: [
                { lat: 7.5, lon: 72.5 },
                { lat: 7.5, lon: 74.0 },
                { lat: 1.5, lon: 74.0 },
                { lat: 1.5, lon: 72.5 },
            ]
        }
    ]
};

/** Micronesia - scattered islands across western Pacific */
export const MICRONESIA_DEFINITION: IslandsDefinition = {
    iso2: 'FM',
    name: 'Micronesia',
    regions: [
        {
            name: 'Micronesia Islands',
            points: [
                { lat: 10.0, lon: 137.0 },
                { lat: 10.0, lon: 164.0 },
                { lat: 5.0, lon: 164.0 },
                { lat: 5.0, lon: 137.0 },
            ]
        }
    ]
};

/** Marshall Islands - two parallel chains of atolls */
export const MARSHALL_ISLANDS_DEFINITION: IslandsDefinition = {
    iso2: 'MH',
    name: 'Marshall Islands',
    regions: [
        {
            name: 'Marshall Islands',
            points: [
                { lat: 12.0, lon: 166.0 },
                { lat: 12.0, lon: 172.5 },
                { lat: 5.0, lon: 172.5 },
                { lat: 5.0, lon: 166.0 },
            ]
        }
    ]
};

/** Palau - island group in western Pacific */
export const PALAU_DEFINITION: IslandsDefinition = {
    iso2: 'PW',
    name: 'Palau',
    regions: [
        {
            name: 'Palau Islands',
            points: [
                { lat: 8.5, lon: 130.5 },
                { lat: 8.5, lon: 135.0 },
                { lat: 2.5, lon: 135.0 },
                { lat: 2.5, lon: 130.5 },
            ]
        }
    ]
};

/** Tuvalu - nine islands in south Pacific */
export const TUVALU_DEFINITION: IslandsDefinition = {
    iso2: 'TV',
    name: 'Tuvalu',
    regions: [
        {
            name: 'Tuvalu Islands',
            points: [
                { lat: -5.0, lon: 175.5 },
                { lat: -5.0, lon: 180.0 },
                { lat: -11.5, lon: 180.0 },
                { lat: -11.5, lon: 175.5 },
            ]
        }
    ]
};

/** Tonga - archipelago in south Pacific */
export const TONGA_DEFINITION: IslandsDefinition = {
    iso2: 'TO',
    name: 'Tonga',
    regions: [
        {
            name: 'Tonga Islands',
            points: [
                { lat: -15.0, lon: -176.0 },
                { lat: -15.0, lon: -173.5 },
                { lat: -22.0, lon: -173.5 },
                { lat: -22.0, lon: -176.0 },
            ]
        }
    ]
};

/** Fiji - scattered islands, crosses antimeridian - use 180+ notation to avoid wrap */
export const FIJI_DEFINITION: IslandsDefinition = {
    iso2: 'FJ',
    name: 'Fiji',
    regions: [
        {
            name: 'Fiji Islands',
            points: [
                { lat: -15.5, lon: 177.0 },
                { lat: -15.5, lon: 180.5 },  // Use 180+ instead of negative to cross antimeridian correctly
                { lat: -19.0, lon: 180.5 },
                { lat: -19.0, lon: 177.0 },
            ]
        }
    ]
};

/** French Polynesia - vast archipelago spread across south Pacific */
export const FRENCH_POLYNESIA_DEFINITION: IslandsDefinition = {
    iso2: 'PF',
    name: 'French Polynesia',
    regions: [
        {
            name: 'French Polynesia',
            points: [
                { lat: -7.0, lon: -152.0 },
                { lat: -7.0, lon: -134.0 },
                { lat: -28.0, lon: -134.0 },
                { lat: -28.0, lon: -152.0 },
            ]
        }
    ]
};

/** Cook Islands - two groups in south Pacific */
export const COOK_ISLANDS_DEFINITION: IslandsDefinition = {
    iso2: 'CK',
    name: 'Cook Islands',
    regions: [
        {
            name: 'Cook Islands',
            points: [
                { lat: -8.0, lon: -160.5 },
                { lat: -8.0, lon: -157.0 },
                { lat: -22.5, lon: -157.0 },
                { lat: -22.5, lon: -160.5 },
            ]
        }
    ]
};

/** Seychelles - two island groups in Indian Ocean */
export const SEYCHELLES_DEFINITION: IslandsDefinition = {
    iso2: 'SC',
    name: 'Seychelles',
    regions: [
        {
            name: 'Inner Islands',
            points: [
                { lat: -4.0, lon: 55.0 },
                { lat: -4.0, lon: 56.5 },
                { lat: -5.0, lon: 56.5 },
                { lat: -5.0, lon: 55.0 },
            ]
        },
        {
            name: 'Outer Islands',
            points: [
                { lat: -7.0, lon: 46.0 },
                { lat: -7.0, lon: 47.0 },
                { lat: -10.0, lon: 47.0 },
                { lat: -10.0, lon: 46.0 },
            ]
        }
    ]
};

/** Cape Verde - island group off west Africa */
export const CAPE_VERDE_DEFINITION: IslandsDefinition = {
    iso2: 'CV',
    name: 'Cape Verde',
    regions: [
        {
            name: 'Cape Verde Islands',
            points: [
                { lat: 17.5, lon: -25.5 },
                { lat: 17.5, lon: -22.5 },
                { lat: 14.5, lon: -22.5 },
                { lat: 14.5, lon: -25.5 },
            ]
        }
    ]
};

/** Mauritius - island nation east of Madagascar */
export const MAURITIUS_DEFINITION: IslandsDefinition = {
    iso2: 'MU',
    name: 'Mauritius',
    regions: [
        {
            name: 'Mauritius Islands',
            points: [
                { lat: -19.5, lon: 56.5 },
                { lat: -19.5, lon: 58.0 },
                { lat: -20.7, lon: 58.0 },
                { lat: -20.7, lon: 56.5 },
            ]
        }
    ]
};

/** Comoros - island nation between Madagascar and Africa */
export const COMOROS_DEFINITION: IslandsDefinition = {
    iso2: 'KM',
    name: 'Comoros',
    regions: [
        {
            name: 'Comoros Islands',
            points: [
                { lat: -11.0, lon: 43.0 },
                { lat: -11.0, lon: 44.7 },
                { lat: -13.0, lon: 44.7 },
                { lat: -13.0, lon: 43.0 },
            ]
        }
    ]
};

// Registry of all islands definitions
export const ISLANDS_DEFINITIONS: Map<string, IslandsDefinition> = new Map([
    ['KI', KIRIBATI_DEFINITION],
    ['MV', MALDIVES_DEFINITION],
    ['FM', MICRONESIA_DEFINITION],
    ['MH', MARSHALL_ISLANDS_DEFINITION],
    ['PW', PALAU_DEFINITION],
    ['TV', TUVALU_DEFINITION],
    ['TO', TONGA_DEFINITION],
    ['FJ', FIJI_DEFINITION],
    ['PF', FRENCH_POLYNESIA_DEFINITION],
    ['CK', COOK_ISLANDS_DEFINITION],
    ['SC', SEYCHELLES_DEFINITION],
    ['CV', CAPE_VERDE_DEFINITION],
    ['MU', MAURITIUS_DEFINITION],
    ['KM', COMOROS_DEFINITION],
]);

/**
 * Islands Frame Renderer
 *
 * Creates tube mesh outlines around island nation bounding regions.
 * Supports pre-creating all frames on load and showing/hiding on demand.
 */
export class IslandsFrame {
    private scene: Scene;
    private engine: AbstractEngine;

    /** Pre-created frame meshes by ISO2 code */
    private frameMeshMap: Map<string, Mesh[]> = new Map();

    /** Legacy: dynamically created frame meshes */
    private frameMeshes: Mesh[] = [];

    constructor(scene: Scene) {
        this.scene = scene;
        this.engine = scene.getEngine();
    }

    /**
     * Pre-create all island frames (hidden by default)
     * Call this once during scene initialization
     */
    createAllFrames(
        getCountryIndex: (iso2: string) => number | undefined,
        material: ShaderMaterial,
        tubeRadius?: number
    ): void {
        const radius = tubeRadius ?? OUTLINE_TUBE_RADIUS;

        for (const [iso2, definition] of ISLANDS_DEFINITIONS) {
            const countryIndex = getCountryIndex(iso2);
            if (countryIndex === undefined) {
                console.warn(`Country ${iso2} not found, skipping frame`);
                continue;
            }

            const meshes: Mesh[] = [];
            for (const region of definition.regions) {
                const mesh = this.createRegionMesh(region, countryIndex, material, radius);
                if (mesh) {
                    mesh.setEnabled(false);  // Hidden by default
                    meshes.push(mesh);
                }
            }

            if (meshes.length > 0) {
                this.frameMeshMap.set(iso2, meshes);
            }
        }

        console.log(`Pre-created frames for ${this.frameMeshMap.size} island nations`);
    }

    /**
     * Show the pre-created frame for a country
     */
    showFrameByCode(iso2: string): void {
        const meshes = this.frameMeshMap.get(iso2);
        if (meshes) {
            for (const mesh of meshes) {
                mesh.setEnabled(true);
            }
        }
    }

    /**
     * Hide the pre-created frame for a country
     */
    hideFrameByCode(iso2: string): void {
        const meshes = this.frameMeshMap.get(iso2);
        if (meshes) {
            for (const mesh of meshes) {
                mesh.setEnabled(false);
            }
        }
    }

    /**
     * Hide all pre-created frames
     */
    hideAllFrames(): void {
        for (const meshes of this.frameMeshMap.values()) {
            for (const mesh of meshes) {
                mesh.setEnabled(false);
            }
        }
    }

    /**
     * Show all pre-created frames
     */
    showAllFrames(): void {
        for (const meshes of this.frameMeshMap.values()) {
            for (const mesh of meshes) {
                mesh.setEnabled(true);
            }
        }
    }

    /**
     * Show frames only for specified country codes
     * Hides all others
     */
    showFramesForCountries(enabledCodes: Set<string>): void {
        for (const [iso2, meshes] of this.frameMeshMap) {
            const enabled = enabledCodes.has(iso2);
            for (const mesh of meshes) {
                mesh.setEnabled(enabled);
            }
        }
    }

    /**
     * Set material for a specific country's frame
     */
    setMaterialByCode(iso2: string, material: ShaderMaterial): void {
        const meshes = this.frameMeshMap.get(iso2);
        if (meshes) {
            for (const mesh of meshes) {
                mesh.material = material;
            }
        }
    }

    /**
     * Set material for all frames
     */
    setMaterialForAll(material: ShaderMaterial): void {
        for (const meshes of this.frameMeshMap.values()) {
            for (const mesh of meshes) {
                mesh.material = material;
            }
        }
    }

    /**
     * Check if a country has a pre-created frame
     */
    hasFrame(iso2: string): boolean {
        return this.frameMeshMap.has(iso2);
    }

    /**
     * Show islands frame for a country (legacy dynamic creation)
     * @param iso2 Country ISO2 code
     * @param countryIndex Country animation index
     * @param material Shader material to apply
     * @param tubeRadius Optional custom tube radius
     * @param clearExisting Whether to clear existing frames first (default: true)
     */
    showFrame(
        iso2: string,
        countryIndex: number,
        material: ShaderMaterial,
        tubeRadius?: number,
        clearExisting: boolean = true
    ): void {
        if (clearExisting) {
            this.clearFrame();
        }

        const definition = ISLANDS_DEFINITIONS.get(iso2);
        if (!definition) {
            console.warn(`No islands definition for ${iso2}`);
            return;
        }

        const radius = tubeRadius ?? OUTLINE_TUBE_RADIUS;

        for (const region of definition.regions) {
            const mesh = this.createRegionMesh(
                region,
                countryIndex,
                material,
                radius
            );
            if (mesh) {
                this.frameMeshes.push(mesh);
            }
        }
    }

    /**
     * Get all island nation ISO2 codes
     */
    getAllIslandsCodes(): string[] {
        return Array.from(ISLANDS_DEFINITIONS.keys());
    }

    /**
     * Interpolate points along a great circle arc between two lat/lon points
     * This ensures the path follows Earth's curvature instead of cutting through
     */
    private interpolateArc(
        start: LatLonPoint,
        end: LatLonPoint,
        segmentsPerDegree: number = 0.5
    ): Vector3[] {
        // Calculate angular distance
        const latDiff = Math.abs(end.lat - start.lat);
        const lonDiff = Math.abs(end.lon - start.lon);
        const maxDiff = Math.max(latDiff, lonDiff);

        // Determine number of segments based on distance
        const numSegments = Math.max(1, Math.ceil(maxDiff * segmentsPerDegree));

        const points: Vector3[] = [];
        for (let i = 0; i <= numSegments; i++) {
            const t = i / numSegments;
            const lat = start.lat + (end.lat - start.lat) * t;
            const lon = start.lon + (end.lon - start.lon) * t;
            points.push(latLonToSphere(lat, lon, 0));
        }

        return points;
    }

    /**
     * Create a curved path that follows Earth's surface
     */
    private createCurvedPath(points: LatLonPoint[]): Vector3[] {
        const path: Vector3[] = [];

        for (let i = 0; i < points.length; i++) {
            const start = points[i];
            const end = points[(i + 1) % points.length];

            // Get interpolated arc points (exclude last point to avoid duplicates)
            const arcPoints = this.interpolateArc(start, end);
            for (let j = 0; j < arcPoints.length - 1; j++) {
                path.push(arcPoints[j]);
            }
        }

        // Close the loop
        path.push(path[0].clone());

        return path;
    }

    /**
     * Create a tube mesh for a single islands region
     */
    private createRegionMesh(
        region: IslandsRegion,
        countryIndex: number,
        material: ShaderMaterial,
        tubeRadius: number
    ): Mesh | null {
        if (region.points.length < 3) {
            console.warn(`Region ${region.name} has too few points`);
            return null;
        }

        // Create curved path that follows Earth's curvature
        const path = this.createCurvedPath(region.points);

        try {
            const tube = MeshBuilder.CreateTube(
                `islands_${region.name}`,
                {
                    path,
                    radius: tubeRadius,
                    tessellation: TUBE_TESSELLATION,
                    cap: Mesh.NO_CAP
                },
                this.scene
            );

            // NOTE: We do NOT modify UVs here - the dashed shader uses UV.y for the dash pattern
            // The dashed vertex shader always animates fully regardless of UV.y

            // Set countryIndex attribute on all vertices
            const totalVertices = tube.getTotalVertices();
            const countryIndices = new Float32Array(totalVertices);
            countryIndices.fill(countryIndex);

            const buffer = new VertexBuffer(
                this.engine,
                countryIndices,
                "countryIndex",
                false, false, 1, false
            );
            tube.setVerticesBuffer(buffer);

            // Apply shader material
            tube.material = material;

            return tube;
        } catch (error) {
            console.error(`Error creating islands tube for ${region.name}:`, error);
            return null;
        }
    }

    /**
     * Clear the current frame
     */
    clearFrame(): void {
        for (const mesh of this.frameMeshes) {
            mesh.dispose();
        }
        this.frameMeshes = [];
    }

    /**
     * Check if a country has an islands definition
     */
    hasDefinition(iso2: string): boolean {
        return ISLANDS_DEFINITIONS.has(iso2);
    }

    /**
     * Get the definition for a country
     */
    getDefinition(iso2: string): IslandsDefinition | undefined {
        return ISLANDS_DEFINITIONS.get(iso2);
    }

    /**
     * Dispose of all resources
     */
    dispose(): void {
        this.clearFrame();

        // Dispose pre-created meshes
        for (const meshes of this.frameMeshMap.values()) {
            for (const mesh of meshes) {
                mesh.dispose();
            }
        }
        this.frameMeshMap.clear();
    }
}
