/**
 * Earth Globe Module - Geographic Math Utilities
 *
 * Functions for coordinate conversion and geographic calculations.
 */

import { Vector3, Color3 } from '@babylonjs/core/Maths/math';
import { EARTH_RADIUS } from './constants';
import type { LatLon, BoundingBox, LatLonPoint } from './types';

// ============================================================================
// Coordinate Conversion
// ============================================================================

/**
 * Convert latitude/longitude to 3D sphere position
 * @param lat Latitude in degrees (-90 to 90)
 * @param lon Longitude in degrees (-180 to 180)
 * @param altitude Altitude above the sphere surface
 * @returns Vector3 position on the sphere
 */
export function latLonToSphere(lat: number, lon: number, altitude: number = 0): Vector3 {
    const latRad = (lat * Math.PI) / 180.0;
    const lonRad = (lon * Math.PI) / 180.0;
    const radius = EARTH_RADIUS + altitude;

    const x = radius * Math.cos(latRad) * Math.cos(lonRad);
    const y = radius * Math.sin(latRad);
    const z = radius * Math.cos(latRad) * Math.sin(lonRad);

    return new Vector3(x, y, z);
}

/**
 * Convert 3D Cartesian coordinates on a sphere to lat/lon
 * Assumes sphere is centered at origin
 * @param x X coordinate
 * @param y Y coordinate (up)
 * @param z Z coordinate
 * @returns Latitude and longitude in degrees
 */
export function cartesianToLatLon(x: number, y: number, z: number): LatLon {
    const radius = Math.sqrt(x * x + y * y + z * z);

    // Latitude: angle from XZ plane
    const lat = Math.asin(y / radius) * (180 / Math.PI);

    // Longitude: angle in XZ plane from X axis
    const lon = Math.atan2(z, x) * (180 / Math.PI);

    return { lat, lon };
}

/**
 * Convert a Vector3 position to lat/lon
 * @param position Position vector on the sphere
 * @returns Latitude and longitude in degrees
 */
export function positionToLatLon(position: Vector3): LatLon {
    return cartesianToLatLon(position.x, position.y, position.z);
}

// ============================================================================
// Bounding Box Calculations
// ============================================================================

/**
 * Calculate bounding box for a polygon
 * @param points Array of lat/lon points
 * @returns Bounding box with min/max lat/lon
 */
export function calculateBoundingBox(points: LatLon[]): BoundingBox {
    let minLat = Infinity, maxLat = -Infinity;
    let minLon = Infinity, maxLon = -Infinity;

    for (const p of points) {
        minLat = Math.min(minLat, p.lat);
        maxLat = Math.max(maxLat, p.lat);
        minLon = Math.min(minLon, p.lon);
        maxLon = Math.max(maxLon, p.lon);
    }

    return { minLat, maxLat, minLon, maxLon };
}

/**
 * Check if a point is inside a bounding box
 */
export function pointInBoundingBox(point: LatLon, bbox: BoundingBox): boolean {
    return point.lat >= bbox.minLat && point.lat <= bbox.maxLat &&
           point.lon >= bbox.minLon && point.lon <= bbox.maxLon;
}

// ============================================================================
// Point-in-Polygon Tests
// ============================================================================

/**
 * Ray-casting algorithm for point-in-polygon test (lat/lon)
 * @param point The point to test
 * @param polygon Array of polygon vertices
 * @returns true if point is inside polygon
 */
export function pointInPolygon(point: LatLon, polygon: LatLon[]): boolean {
    const x = point.lon;
    const y = point.lat;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].lon;
        const yi = polygon[i].lat;
        const xj = polygon[j].lon;
        const yj = polygon[j].lat;

        if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
            inside = !inside;
        }
    }

    return inside;
}

/**
 * Point-in-polygon test for 2D coordinates (x, y)
 * @param point The point to test {x, y}
 * @param polygon Array of polygon vertices {x, y}
 * @returns true if point is inside polygon
 */
export function pointInPolygon2D(
    point: { x: number; y: number },
    polygon: { x: number; y: number }[]
): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;

        if (((yi > point.y) !== (yj > point.y)) &&
            (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
            inside = !inside;
        }
    }
    return inside;
}

// ============================================================================
// Color Utilities
// ============================================================================

/**
 * Convert HSV to RGB color
 * @param h Hue (0-1)
 * @param s Saturation (0-1)
 * @param v Value/Brightness (0-1)
 * @returns Color3 RGB values
 */
export function hsvToRgb(h: number, s: number, v: number): Color3 {
    let r: number, g: number, b: number;

    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
        default: r = 0; g = 0; b = 0; break;
    }

    return new Color3(r, g, b);
}

// ============================================================================
// Interior Point Generation
// ============================================================================

/**
 * Generate interior grid points for a polygon to improve triangulation on curved surfaces.
 * Returns points in lat/lon coordinates.
 * @param latLonPoints Outer polygon boundary
 * @param holes Array of hole polygons
 * @param gridSpacing Grid spacing in degrees
 * @returns Array of interior points
 */
export function generateInteriorPoints(
    latLonPoints: LatLonPoint[],
    holes: LatLonPoint[][] | undefined,
    gridSpacing: number = 5
): LatLonPoint[] {
    // Calculate bounding box
    let minLat = Infinity, maxLat = -Infinity;
    let minLon = Infinity, maxLon = -Infinity;
    for (const p of latLonPoints) {
        minLat = Math.min(minLat, p.lat);
        maxLat = Math.max(maxLat, p.lat);
        minLon = Math.min(minLon, p.lon);
        maxLon = Math.max(maxLon, p.lon);
    }

    // Convert polygon and holes to simple 2D format for point-in-polygon test
    const poly2D = latLonPoints.map(p => ({ x: p.lon, y: p.lat }));
    const holes2D = holes ? holes.map(h => h.map(p => ({ x: p.lon, y: p.lat }))) : [];

    const interiorPoints: LatLonPoint[] = [];

    // Generate grid points
    for (let lat = minLat + gridSpacing; lat < maxLat; lat += gridSpacing) {
        for (let lon = minLon + gridSpacing; lon < maxLon; lon += gridSpacing) {
            const testPoint = { x: lon, y: lat };

            // Check if point is inside the outer polygon
            if (!pointInPolygon2D(testPoint, poly2D)) continue;

            // Check if point is inside any hole
            let inHole = false;
            for (const hole of holes2D) {
                if (pointInPolygon2D(testPoint, hole)) {
                    inHole = true;
                    break;
                }
            }
            if (inHole) continue;

            interiorPoints.push({ lat, lon });
        }
    }

    return interiorPoints;
}

// ============================================================================
// Border Point Comparison
// ============================================================================

/**
 * Check if two polygons share any border points
 * @param points1 First polygon's border points
 * @param points2 Second polygon's border points
 * @param epsilon Tolerance for floating point comparison
 * @returns true if polygons share at least one border point
 */
export function sharesBorderPoint(
    points1: LatLonPoint[],
    points2: LatLonPoint[],
    epsilon: number = 0.0001
): boolean {
    for (const p1 of points1) {
        for (const p2 of points2) {
            const latDiff = Math.abs(p1.lat - p2.lat);
            const lonDiff = Math.abs(p1.lon - p2.lon);

            if (latDiff < epsilon && lonDiff < epsilon) {
                return true;
            }
        }
    }
    return false;
}
