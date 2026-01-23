/**
 * Earth Globe Module - Type Definitions
 *
 * Shared interfaces and types for the earth-globe rendering module.
 */

import type { Scene } from '@babylonjs/core/scene';
import type { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import type { Engine } from '@babylonjs/core/Engines/engine';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';

// ============================================================================
// Geographic Types
// ============================================================================

/**
 * Latitude/Longitude coordinates
 */
export interface LatLon {
    lat: number;
    lon: number;
}

/**
 * Alias for lat/lon point used in rendering
 */
export interface LatLonPoint {
    lat: number;
    lon: number;
}

/**
 * Bounding box for geographic regions
 */
export interface BoundingBox {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
}

// ============================================================================
// Country Data Types
// ============================================================================

/**
 * Country polygon for spatial lookup
 */
export interface CountryPolygon {
    iso2: string;
    name: string;
    countryIndex: number;
    polygonIndex: number;  // Index within the country's polygons
    points: LatLon[];
    bbox: BoundingBox;
}

/**
 * Internal polygon rendering data
 */
export interface PolygonData {
    mesh: Mesh;
    extrudedBorder: Mesh | null;
    borderPoints: LatLonPoint[];
    countryIndex: number;  // Back-reference to parent country
}

/**
 * Neighbor relationship between countries
 */
export interface NeighborInfo {
    countryIndex: number;           // Which country is the neighbor
    polygonIndex: number;           // Which of OUR polygons touches them
    neighbourPolygonIndex: number;  // Which of THEIR polygons we touch
}

/**
 * Country metadata
 */
export interface CountryData {
    name: string;
    iso2: string;
    index: number;
    polygonIndices: number[];    // Indices into polygonsData array
    neighbourCountries: NeighborInfo[];
}

/**
 * Raw country data from JSON file
 */
export interface CountryJSON {
    name_en: string;
    iso2: string;
    paths: string;
    holes?: string[][];  // Array of hole ISO2 codes per polygon (enclaves)
    lakes?: number[][];  // For each polygon, list of polygon indices that are lakes inside it
    skipHole?: boolean;  // If true, don't create a hole for this enclave (too small)
}

// ============================================================================
// Segment Types
// ============================================================================

/**
 * 2D point for segment data
 */
export interface Point2D {
    lat: number;
    lon: number;
}

/**
 * 2D segment (from JSON)
 */
export interface Segment2D {
    points: Point2D[];
    countries: string[];  // ISO2 codes
    type: 'standalone' | 'shared' | 'multipoint';
}

/**
 * 3D segment (converted for rendering)
 */
export interface Segment3D {
    points: import('@babylonjs/core/Maths/math').Vector3[];
    countries: string[];
    type: 'standalone' | 'shared' | 'multipoint';
}

/**
 * Loaded segment data
 */
export interface SegmentData {
    segments: Segment3D[];
    segmentsByCountry: Map<string, Segment3D[]>;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Asset paths configuration
 */
export interface AssetPaths {
    countriesJson?: string;
    segmentsJson?: string;
    oceanDepthMap?: string;
    causticsTexture?: string;
    pinModel?: string;
    spaceTextureMid?: string;
    spaceTextureTop?: string;
    spaceTextureBottom?: string;
}

/**
 * Earth Globe initialization options
 */
export interface EarthGlobeOptions {
    /** Canvas element ID */
    canvasId?: string;

    /** Callback when globe is ready */
    onReady?: (globe: EarthGlobeAPI) => void;

    /** Disable country selection visual behavior */
    disableSelectionBehavior?: boolean;

    /** Asset paths configuration */
    assets?: AssetPaths;
}

// ============================================================================
// Event Types
// ============================================================================

/**
 * Country hover event data
 */
export interface CountryHoverEvent {
    country: CountryPolygon | null;
    latLon: LatLon;
}

/**
 * Country click event data
 */
export interface CountryClickEvent {
    country: CountryPolygon | null;
    latLon: LatLon;
}

// ============================================================================
// Public API Interface
// ============================================================================

/**
 * Public API for the EarthGlobe class
 * This interface defines the methods available to consumers of the module.
 */
export interface EarthGlobeAPI {
    // Scene access
    getScene(): Scene;
    getCamera(): ArcRotateCamera;
    getEngine(): Engine;
    getCanvas(): HTMLCanvasElement;
    getEarthSphere(): Mesh;
    getCountryPicker(): import('./CountryPicker').CountryPicker;

    // Material creation
    createUnlitMaterial(originalMaterial: import('@babylonjs/core/Materials/material').Material | null): import('@babylonjs/core/Materials/shaderMaterial').ShaderMaterial;

    // Coordinate conversion
    latLonToPosition(lat: number, lon: number, altitude?: number): import('@babylonjs/core/Maths/math').Vector3;
    positionToLatLon(position: import('@babylonjs/core/Maths/math').Vector3): LatLon;
    positionAtLatLon(lat: number, lon: number, altitude?: number): {
        position: import('@babylonjs/core/Maths/math').Vector3;
        normal: import('@babylonjs/core/Maths/math').Vector3;
    };

    // Country queries
    getCountryAtLatLon(lat: number, lon: number): CountryPolygon | null;
    getCountryByISO2(iso2: string): CountryData | undefined;
    getCountryByIndex(index: number): CountryData | undefined;
    getAltitudeAtLatLon(lat: number, lon: number): number;

    // Animation control - Altitude
    setCountryAltitude(countryIndex: number, altitude: number): void;
    getCountryAltitude(countryIndex: number): number;
    animateCountryAltitude(countryIndex: number, targetAltitude: number, durationMs: number): Promise<void>;

    // Animation control - State (STATE_NORMAL, STATE_DISABLED, STATE_CLEARED)
    setCountryState(countryIndex: number, state: number): void;
    getCountryState(countryIndex: number): number;

    // Animation control - Blend (0 = full state effect, 1 = normal appearance)
    setCountryBlend(countryIndex: number, blend: number): void;
    getCountryBlend(countryIndex: number): number;
    animateCountryBlend(countryIndex: number, targetBlend: number, durationMs: number): Promise<void>;

    // Event callbacks
    onCountryHover(callback: (event: CountryHoverEvent) => void): void;
    onCountryClick(callback: (event: CountryClickEvent) => void): void;

    // Lifecycle
    isReady(): boolean;
    dispose(): void;
}

// ============================================================================
// Rendering Types
// ============================================================================

/**
 * Triangulation result
 */
export interface TriangulationResult {
    vertices: { x: number; y: number }[];
    indices: number[];
}

/**
 * Grid cell for spatial indexing
 */
export interface GridCell {
    polygons: CountryPolygon[];
}
