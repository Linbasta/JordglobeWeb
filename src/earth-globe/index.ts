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
export { EarthGlobe, STATE_NORMAL, STATE_DISABLED, STATE_CLEARED } from './EarthGlobe';

// Types
export type {
    // Geographic types
    LatLon,
    LatLonPoint,
    BoundingBox,

    // Country types
    CountryPolygon,
    CountryData,
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
    COUNTRY_ALTITUDE,
    ANIMATION_AMPLITUDE,
    MAX_COUNTRIES,
    MAX_ANIMATION_COUNTRIES,
    CAMERA_LOWER_RADIUS,
    CAMERA_UPPER_RADIUS,
    OUTLINE_TUBE_RADIUS,
    OUTLINE_COLOR,
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
} from './GeoMath';

// Country Picker
export { CountryPicker } from './CountryPicker';

// Segment Loader
export {
    loadSegments,
    getCountrySegments,
    getSharedSegments,
    getSegmentsBetween,
    getSegmentStats,
} from './SegmentLoader';

// Triangulation
export { cdt2d, filterTriangles, pointInPolygon as triangulationPointInPolygon } from './Triangulation';

// Individual renderers (for advanced customization)
export { GlobeSphere } from './GlobeSphere';
export { CountryRenderer } from './CountryRenderer';
export { BorderRenderer } from './BorderRenderer';
export { OutlineRenderer } from './OutlineRenderer';
export { Skybox } from './Skybox';
export { AnimationTexture } from './AnimationTexture';
export { CountryAnimator } from './CountryAnimator';
export { ShaderFactory } from './ShaderFactory';
