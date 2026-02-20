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
// Region Types (generic — used for both countries and provinces)
// ============================================================================

export type RegionType = 'country' | 'province';

/**
 * Generic region metadata
 */
export interface RegionData {
    type?: RegionType;  // Currently unused, reserved for future use
    name: string;
    id: string;  // For countries: "US", "SE"; for provinces: "US-0", "US-1"
    index: number;                   // 0-based within this controller
    polygonIndices: number[];
    parentRegionIndex?: number;      // if set: hide parent region when this is active
    centroid: import('@babylonjs/core/Maths/math').Vector3 | null;
    neighbourCountries?: NeighborInfo[];
}

/**
 * Raw region JSON from data files
 */
export interface RegionJSON {
    name: string;
    paths: string;
    holes?: Record<number, number[]>;   // polygon index → contained region indices
    lakes?: Record<number, number[]>;   // polygon index → lake polygon indices
    skipHole?: boolean;
    parentRegionIndex?: number;
}

// ============================================================================
// Polygon and Neighbor Types
// ============================================================================

/**
 * Region polygon for spatial lookup (used by RegionPicker)
 * Works for both countries and provinces.
 */
export interface RegionPolygon {
    id: string;  // For countries: "US"; for provinces: "US-0"
    name: string;
    regionIndex: number;
    polygonIndex: number;  // Index within the region's polygons
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
    isSmall: boolean;      // Small country (needs magnification)
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
    regions: string[];  // ISO2 codes for countries, or numeric IDs as strings for provinces
    type: 'standalone' | 'shared' | 'multipoint';
}

/**
 * 3D segment (converted for rendering)
 */
export interface Segment3D {
    points: import('@babylonjs/core/Maths/math').Vector3[];
    regions: string[];  // ISO2 codes for countries, or numeric IDs as strings for provinces
    type: 'standalone' | 'shared' | 'multipoint';
}

/**
 * Loaded segment data
 */
export interface SegmentData {
    segments: Segment3D[];
    segmentsByRegion: Map<string, Segment3D[]>;
}

// ============================================================================
// Configuration Types
// ============================================================================

// ============================================================================
// Lofi Collider Types
// ============================================================================

export interface LofiCircle {
    lat: number;
    lon: number;
    radiusDeg: number;
}

export interface LofiColliderItem {
    id: string;              // ISO2 for countries
    colliders: LofiCircle[];
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
    lofiCollidersJson?: string;
    oceanDepthMap?: string;
    causticsTexture?: string;
    pinModel?: string;
    spaceTextureMid?: string;
    spaceTextureTop?: string;
    spaceTextureBottom?: string;
    worldTexture?: string;
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
    country: RegionPolygon | null;
    latLon: LatLon;
}

/**
 * Country click event data
 */
export interface CountryClickEvent {
    country: RegionPolygon | null;
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
    getCountryPicker(): import('./region-picker').RegionPicker;
    getActivePicker(): import('./region-picker').RegionPicker;

    // Region controllers (NEW API - preferred over routing methods)
    getCountryController(): import('./region-controller').RegionController;
    getProvinceController(): import('./region-controller').RegionController;
    getActiveController(): import('./region-controller').RegionController;

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
    getCountryAtLatLon(lat: number, lon: number): RegionPolygon | null;
    getCountryByISO2(iso2: string): RegionData | undefined;
    getCountryByIndex(index: number): RegionData | undefined;
    getAllCountries(): RegionData[];
    getAltitudeAtLatLon(lat: number, lon: number): number;

    // Animation control - Expansion (small countries)
    isSmallCountry(countryIndex: number): boolean;
    hideSmallCountryMarker(countryIndex: number): void;
    showSmallCountryMarker(countryIndex: number): void;
    hideAllSmallCountryMarkers(): void;
    showAllSmallCountryMarkers(): void;

    // Country outline
    showCountryOutline(countryIndex: number): void;
    clearCountryOutline(): void;

    // Location markers
    acquireMarker(lat: number, lon: number, offsetAbove?: number): number;
    releaseMarker(markerId: number): void;
    updateMarkerPosition(markerId: number, lat: number, lon: number, offsetAbove?: number): void;
    releaseAllMarkers(): void;
    getMarkerPoolStats(): { total: number; inUse: number; available: number } | null;
    setMarkerScale(markerId: number, scale: number): void;
    getMarkerScale(markerId: number): number;
    getMarkerPosition(markerId: number): import('@babylonjs/core/Maths/math').Vector3 | null;
    hideMarker(markerId: number): void;
    showMarker(markerId: number): void;
    toggleMarkerDebugVisualization(): void;
    updateMarkerDebugRadius(hitRadius: number): void;
    toggleColliderDebugVisualization(): Promise<void>;

    // Event callbacks
    onCountryHover(callback: (event: CountryHoverEvent) => void): void;
    onCountryClick(callback: (event: CountryClickEvent) => void): void;

    // Region mode (province drill-down)
    enterRegionMode(iso2: string): Promise<void>;
    exitRegionMode(): void;
    isInRegionMode(): boolean;
    getRegionModeISO2(): string | null;
    waitForProvincesToLoad(): Promise<void>;
    getAllActiveRegions(): RegionData[];
    getActiveRegionPolygons(): RegionPolygon[];

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
    polygons: RegionPolygon[];
}
