/**
 * Earth Globe Module
 *
 * A self-contained, reusable 3D Earth globe rendering module built on Babylon.js.
 * This module handles all globe rendering with zero gameplay logic.
 *
 * @example
 * ```typescript
 * import { EarthGlobe } from './earth-globe';
 *
 * const globe = new EarthGlobe({
 *   canvasId: 'renderCanvas',
 *   onReady: (g) => {
 *     // Query countries
 *     const country = g.getCountryAtLatLon(-6.0, 35.0);
 *
 *     // Animate countries
 *     g.animateCountryAltitude(country.countryIndex, 0.8, 300);
 *
 *     // Listen to events
 *     g.onCountryHover((event) => { ... });
 *   }
 * });
 *
 * // Access scene for custom overlays
 * const scene = globe.getScene();
 * ```
 */

// Main class
export { EarthGlobe, STATE_NORMAL, STATE_DISABLED, STATE_CLEARED } from './earth-globe';

// Types
export type {
    // Geographic types
    LatLon,
    LatLonPoint,
    BoundingBox,

    // Region types (generic)
    RegionType,
    RegionPolygon,
    RegionData,
    RegionJSON,

    // Country types (specific)
    RegionPolygon,
    RegionData,
    PolygonData,
    NeighborInfo,
    CountryJSON,

    // Segment types
    Point2D,
    Segment2D,
    Segment3D,
    SegmentData,

    // Configuration types
    AssetPaths,
    EarthGlobeOptions,

    // Event types
    CountryHoverEvent,
    CountryClickEvent,

    // API interface
    EarthGlobeAPI,

    // Rendering types
    TriangulationResult,
    GridCell,
} from './types';

// Constants (for consumers who need to reference them)
export {
    EARTH_RADIUS,
    kmToWorld,
    REGION_ALTITUDE,
    ANIMATION_AMPLITUDE,
    MAX_COUNTRIES,
    MAX_ANIMATION_COUNTRIES,
    CAMERA_LOWER_RADIUS,
    CAMERA_UPPER_RADIUS,
    OUTLINE_TUBE_RADIUS,
    OUTLINE_COLOR,
    ZOOM_THRESHOLD,
    ZOOM_PIN_SCALE_CLOSE,
    ZOOM_PIN_SCALE_FAR,
    ZOOM_BORDER_THICKNESS_CLOSE,
    ZOOM_BORDER_THICKNESS_FAR,
    ZOOM_MARKER_SCALE_CLOSE,
    ZOOM_MARKER_SCALE_FAR,
    ZOOM_MARKER_HIT_RADIUS_CLOSE,
    ZOOM_MARKER_HIT_RADIUS_FAR,
    ZOOM_COLLIDER_SCALE_CLOSE,
    ZOOM_COLLIDER_SCALE_FAR,
    zoom,
} from './constants';

// Utilities
export {
    // Coordinate conversion
    latLonToSphere,
    cartesianToLatLon,
    positionToLatLon,

    // Bounding box
    calculateBoundingBox,
    pointInBoundingBox,

    // Point-in-polygon
    pointInPolygon,
    pointInPolygon2D,

    // Color
    hsvToRgb,

    // Interior points
    generateInteriorPoints,

    // Border comparison
    sharesBorderPoint,
} from './geo-math';

// Region Picker (formerly CountryPicker)
export { RegionPicker } from './region-picker';
// Backward-compat alias
export { RegionPicker as CountryPicker } from './region-picker';

// Segment Loader
export {
    loadSegments,
    getRegionSegments,
    getSharedSegments,
    getSegmentsBetween,
    getSegmentStats,
} from './segment-loader';

// Triangulation
export { cdt2d, filterTriangles, pointInPolygon as triangulationPointInPolygon } from './triangulation';

// Region Controller
export { RegionController } from './region-controller';

// Individual renderers (for advanced customization)
export { GlobeSphere } from './globe-sphere';
export { RegionRenderer } from './region-renderer';
export { RegionRenderer as CountryRenderer } from './region-renderer';  // backward-compat
export { BorderRenderer } from './border-renderer';
export { OutlineRenderer } from './outline-renderer';
export { Skybox } from './skybox';
export { AnimationTexture } from './animation-texture';
export { RegionAnimator } from './region-animator';
export { RegionAnimator as CountryAnimator } from './region-animator';  // backward-compat
export { ShaderFactory } from './shader-factory';

// Location markers
export { LocationMarkerPool } from './location-marker-pool';
export type { LocationMarkerPoolOptions } from './location-marker-pool';
