/**
 * Earth Globe Module - Constants
 *
 * Configuration constants for the earth-globe rendering module.
 */

import { Color3 } from '@babylonjs/core/Maths/math';

// ============================================================================
// Globe Geometry
// ============================================================================

/** Radius of the earth sphere in world units */
export const EARTH_RADIUS = 2.0;

/** Real Earth radius in km */
const EARTH_RADIUS_KM = 6_371;

/** Convert km to world units (EARTH_RADIUS world units = EARTH_RADIUS_KM km) */
export function kmToWorld(km: number): number {
    return km * (EARTH_RADIUS / EARTH_RADIUS_KM);
}

/** Number of sphere segments for smooth water rendering */
export const SPHERE_SEGMENTS = 64;

// ============================================================================
// Country Rendering
// ============================================================================

/** Maximum number of country polygons supported */
export const MAX_COUNTRIES = 5000;

/** Maximum countries supported in animation texture */
export const MAX_ANIMATION_COUNTRIES = 256;

/** Height of region surfaces above the globe (artistic, not geographically accurate) */
export const REGION_ALTITUDE = kmToWorld(75); // ~0.041 world units

/** Depth of extruded border walls */
export const EXTRUDED_BORDER_DEPTH = kmToWorld(160); // ~0.050 world units

/** Grid spacing in degrees for interior triangulation points */
export const TRIANGULATION_GRID_SPACING = 5;

// ============================================================================
// Animation
// ============================================================================

/** How many times the resting altitude regions can pop above their base during animation */
const ANIMATION_AMPLITUDE_MULTIPLIER = 5;

/** Maximum amplitude for region altitude animation — derived from REGION_ALTITUDE */
export const ANIMATION_AMPLITUDE = REGION_ALTITUDE * ANIMATION_AMPLITUDE_MULTIPLIER;

// ============================================================================
// Altitude Values (Normalized 0-1 for animation texture)
// ============================================================================

/**
 * Normalized altitude values for region animations.
 * All values are expressed as multiples of ALTITUDE_NORMAL to maintain proportional relationships.
 */
export const ALTITUDE_NORMAL = REGION_ALTITUDE / ANIMATION_AMPLITUDE;         // 0.2 - base resting altitude
export const ALTITUDE_CLEARED = ALTITUDE_NORMAL * 0.5;                        // 0.1 - sunk/grayed out state
export const ALTITUDE_WRONG_POP = ALTITUDE_NORMAL * 2.5;                      // 0.5 - brief pop for wrong answer
export const ALTITUDE_SHOW_CORRECT = ALTITUDE_NORMAL * 2.75;                  // 0.55 - elevated correct answer reveal
export const ALTITUDE_HOVER = ALTITUDE_NORMAL * 2.5;                          // 0.5 - hover selection elevation
export const ALTITUDE_HOVER_ISLANDS = ALTITUDE_NORMAL * 10;                 // 2.0 - higher elevation for island nations

/** Scale factor for storing altitude in texture (allows values > 1.0) */
export const ALTITUDE_TEXTURE_SCALE = 6.0;

/** Scale factor for storing expansion in texture (must match shader decode multiplier) */
export const EXPANSION_TEXTURE_SCALE = 10.0;

/** Width of the animation texture (must be power of 2) */
export const ANIMATION_TEXTURE_WIDTH = 1024;

// ============================================================================
// Border Rendering
// ============================================================================

/** Radius of tube borders */
export const TUBE_RADIUS = 0.002;

/** Tessellation (number of sides) for tube borders */
export const TUBE_TESSELLATION = 8;

/** Radius of outline tubes (thicker than segment borders) */
export const OUTLINE_TUBE_RADIUS = 0.004;

export const SMALL_OUTLINE_TUBE_RADIUS = 0.0005 / 4;

/** Color for country selection outline */
export const OUTLINE_COLOR = new Color3(0.0, 0.0, 0.0);

// ============================================================================
// Islands Frame
// ============================================================================

/** Dash length for islands frame dashed border (UV units) */
export const ISLANDS_DASH_LENGTH = 0.015;

/** Gap length for islands frame dashed border (UV units) */
export const ISLANDS_GAP_LENGTH = 0.015;

/** Alpha (transparency) for default islands frame */
export const ISLANDS_ALPHA_DEFAULT = 0.3;

/** Alpha (transparency) for hovered islands frame */
export const ISLANDS_ALPHA_HOVER = 1.0;

// ============================================================================
// Colors
// ============================================================================

/** Default HSV saturation for country colors */
export const COUNTRY_HSV_SATURATION = 0.7;

/** Default HSV value (brightness) for country colors */
export const COUNTRY_HSV_VALUE = 0.9;

/** White border color */
export const BORDER_COLOR_WHITE = new Color3(1, 1, 1);

/** Black border color for segment borders */
export const BORDER_COLOR_BLACK = new Color3(0, 0, 0);

/** Warm brown/copper border color for extruded borders - rgb(201, 126, 76) */
export const BORDER_COLOR_GRAY = new Color3(0.788, 0.494, 0.298);

// ============================================================================
// Camera Defaults
// ============================================================================

/** Minimum camera distance from globe center */
export const CAMERA_LOWER_RADIUS = 3;

/** Minimum camera distance auto-framing will zoom to (prevents excessive zoom-in) */
export const AUTO_FRAME_MIN_RADIUS = 4.5;

/** Maximum camera distance from globe center */
export const CAMERA_UPPER_RADIUS = 20;

/** Default camera distance from globe center */
export const CAMERA_DEFAULT_RADIUS = 10;

/** Camera wheel scroll precision */
export const CAMERA_WHEEL_PRECISION = 50;

/** Camera pinch-zoom delta percentage (zooms by this fraction of current radius per pinch unit) */
export const CAMERA_PINCH_DELTA_PERCENTAGE = 0.0008;

/** Camera near clipping plane */
export const CAMERA_MIN_Z = 0.01;

/** Orbit sensitivity: s = ORBIT_SCALE / (radius - ORBIT_SHIFT) + ORBIT_BASE */
export const ORBIT_SCALE = 3600;
export const ORBIT_SHIFT = 2;
export const ORBIT_BASE = 800;

/** Mobile orbit multiplier (lower = faster to compensate for small screens) */
export const MOBILE_ORBIT_MULTIPLIER = 1.0;

// ============================================================================
// Small Countries
// ============================================================================

/** Camera distance squared above which small country markers are visible */
export const SMALL_MARKER_VISIBILITY_DISTANCE_SQ = 64;

// ============================================================================
// Spatial Index
// ============================================================================

/** Grid cell size in degrees for country picker */
export const PICKER_CELL_SIZE = 10;

// ============================================================================
// Default Asset Paths
// ============================================================================

export const DEFAULT_ASSETS = {
    countriesJson: '/countries-enriched.bin',
    segmentsJson: '/segments.json',
    lofiCollidersJson: '/lofi-colliders.json',
    oceanDepthMap: '/OceanDepthMap.png',
    spaceTextureMid: '/SpaceMidTexture.png',
    spaceTextureTop: '/SpaceTop.png',
    spaceTextureBottom: '/SpaceBottom.png',
    worldTexture: '/WorldTexture.png',
} as const;

// ============================================================================
// Skybox
// ============================================================================

/** Size of the skybox cube */
export const SKYBOX_SIZE = 1000;

// ============================================================================
// Zoom-Based Values
// ============================================================================

/** Camera distance threshold between "close" and "far" interpolation */
export const ZOOM_THRESHOLD = 10.0;

/** Pin scale: close (zoomed in) and far (zoomed out) */
export const ZOOM_PIN_SCALE_CLOSE = 10;
export const ZOOM_PIN_SCALE_FAR = 150;

/** Border thickness multiplier: close and far */
export const ZOOM_BORDER_THICKNESS_CLOSE = 0.5;
export const ZOOM_BORDER_THICKNESS_FAR = 1.0;

/** Marker scale: close and far */
export const ZOOM_MARKER_SCALE_CLOSE = 0.2;
export const ZOOM_MARKER_SCALE_FAR = 0.8;

/** Marker hit radius (for click detection): close and far */
export const ZOOM_MARKER_HIT_RADIUS_CLOSE = 0.025;
export const ZOOM_MARKER_HIT_RADIUS_FAR = 0.1;

/** Collider scale multiplier: close and far */
export const ZOOM_COLLIDER_SCALE_CLOSE = 1.0;
export const ZOOM_COLLIDER_SCALE_FAR = 2.0;

// ============================================================================
// Province Rendering
// ============================================================================

/** Province border thickness when zoomed in close */
export const PROVINCE_BORDER_THICKNESS_CLOSE = 0.0005;

/** Province border thickness when zoomed out far */
export const PROVINCE_BORDER_THICKNESS_FAR = 0.003;

/** Province border alpha when zoomed in close */
export const PROVINCE_BORDER_ALPHA_CLOSE = 1.0;

/** Province border alpha when zoomed out far */
export const PROVINCE_BORDER_ALPHA_FAR = 0.0;

// ============================================================================
// Live Zoom Values
// ============================================================================

/** Live zoom values — read every frame, tweakable via dev panel (Z key) */
export const zoom = {
    threshold: ZOOM_THRESHOLD,
    pinScaleClose: ZOOM_PIN_SCALE_CLOSE,
    pinScaleFar: ZOOM_PIN_SCALE_FAR,
    borderThicknessClose: ZOOM_BORDER_THICKNESS_CLOSE,
    borderThicknessFar: ZOOM_BORDER_THICKNESS_FAR,
    markerScaleClose: ZOOM_MARKER_SCALE_CLOSE,
    markerScaleFar: ZOOM_MARKER_SCALE_FAR,
    markerHitRadiusClose: ZOOM_MARKER_HIT_RADIUS_CLOSE,
    markerHitRadiusFar: ZOOM_MARKER_HIT_RADIUS_FAR,
    colliderScaleClose: ZOOM_COLLIDER_SCALE_CLOSE,
    colliderScaleFar: ZOOM_COLLIDER_SCALE_FAR,
    orbitOverride: null as number | null,
    provinceBorderThicknessClose: PROVINCE_BORDER_THICKNESS_CLOSE,
    provinceBorderThicknessFar: PROVINCE_BORDER_THICKNESS_FAR,
    provinceBorderAlphaClose: PROVINCE_BORDER_ALPHA_CLOSE,
    provinceBorderAlphaFar: PROVINCE_BORDER_ALPHA_FAR,
};
