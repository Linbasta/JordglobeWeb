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

/** Number of sphere segments for smooth water rendering */
export const SPHERE_SEGMENTS = 64;

// ============================================================================
// Country Rendering
// ============================================================================

/** Maximum number of country polygons supported */
export const MAX_COUNTRIES = 5000;

/** Maximum countries supported in animation texture */
export const MAX_ANIMATION_COUNTRIES = 256;

/** Height of country surfaces above the globe */
export const COUNTRY_ALTITUDE = 0.08;

/** Depth of extruded border walls */
export const EXTRUDED_BORDER_DEPTH = 0.05;

/** Grid spacing in degrees for interior triangulation points */
export const TRIANGULATION_GRID_SPACING = 5;

// ============================================================================
// Animation
// ============================================================================

/** Maximum amplitude for country altitude animation */
export const ANIMATION_AMPLITUDE = 0.2;

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

/** Color for country selection outline */
export const OUTLINE_COLOR = new Color3(0.0, 0.0, 0.0);

// ============================================================================
// Colors
// ============================================================================

/** Default HSV saturation for country colors */
export const COUNTRY_HSV_SATURATION = 0.7;

/** Default HSV value (brightness) for country colors */
export const COUNTRY_HSV_VALUE = 0.9;

/** White border color */
export const BORDER_COLOR_WHITE = new Color3(1, 1, 1);

/** Gray border color for extruded borders */
export const BORDER_COLOR_GRAY = new Color3(0.9, 0.9, 0.9);

// ============================================================================
// Camera Defaults
// ============================================================================

/** Minimum camera distance from globe center */
export const CAMERA_LOWER_RADIUS = 3;

/** Maximum camera distance from globe center */
export const CAMERA_UPPER_RADIUS = 20;

/** Default camera distance from globe center */
export const CAMERA_DEFAULT_RADIUS = 10;

/** Camera wheel scroll precision */
export const CAMERA_WHEEL_PRECISION = 50;

/** Camera near clipping plane */
export const CAMERA_MIN_Z = 0.01;

/** Camera angular sensitivity (higher = slower rotation) */
export const CAMERA_ANGULAR_SENSITIVITY = 4000;

/** Camera panning sensitivity */
export const CAMERA_PANNING_SENSITIVITY = 4000;

// ============================================================================
// Spatial Index
// ============================================================================

/** Grid cell size in degrees for country picker */
export const PICKER_CELL_SIZE = 10;

// ============================================================================
// Default Asset Paths
// ============================================================================

export const DEFAULT_ASSETS = {
    countriesJson: '/countries-enriched.json',
    segmentsJson: '/segments.json',
    oceanDepthMap: '/OceanDepthMap.png',
    causticsTexture: '/SwsCaustics.png',
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
