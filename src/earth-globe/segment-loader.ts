/**
 * Earth Globe Module - Segment Loader
 *
 * Loads segments.json and converts 2D lat/lon coordinates to 3D sphere positions.
 */

import { Vector3 } from '@babylonjs/core/Maths/math';
import { EARTH_RADIUS, DEFAULT_ASSETS } from './constants';
import type { Point2D, Segment2D, Segment3D, SegmentData } from './types';

/**
 * Convert lat/lon to 3D sphere position
 */
function latLonToSphere(lat: number, lon: number, altitude: number = 0): Vector3 {
    const latRad = (lat * Math.PI) / 180.0;
    const lonRad = (lon * Math.PI) / 180.0;
    const radius = EARTH_RADIUS + altitude;

    const x = radius * Math.cos(latRad) * Math.cos(lonRad);
    const y = radius * Math.sin(latRad);
    const z = radius * Math.cos(latRad) * Math.sin(lonRad);

    return new Vector3(x, y, z);
}

/**
 * Convert a 2D segment to 3D
 */
function segment2DTo3D(segment2D: Segment2D, altitude: number): Segment3D {
    const points3D = segment2D.points.map(point =>
        latLonToSphere(point.lat, point.lon, altitude)
    );

    return {
        points: points3D,
        countries: segment2D.countries,
        type: segment2D.type
    };
}

/**
 * Load and convert segments from JSON file
 * @param url Path to segments.json file
 * @returns Promise with segment data
 */
export async function loadSegments(url: string = DEFAULT_ASSETS.segmentsJson): Promise<SegmentData> {
    console.log(`Loading segments from ${url}...`);
    const startTime = performance.now();

    // Fetch the JSON file
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }

    const segments2D: Segment2D[] = await response.json();
    console.log(`  Loaded ${segments2D.length} segments`);

    // Convert to 3D at altitude 0 (same as country surface base, so they animate together)
    const segments3D = segments2D.map(segment => segment2DTo3D(segment, 0));

    // Build country index
    const segmentsByCountry = new Map<string, Segment3D[]>();
    for (const segment of segments3D) {
        for (const country of segment.countries) {
            if (!segmentsByCountry.has(country)) {
                segmentsByCountry.set(country, []);
            }
            segmentsByCountry.get(country)!.push(segment);
        }
    }

    const endTime = performance.now();
    console.log(`  Conversion took ${(endTime - startTime).toFixed(2)}ms`);
    console.log(`  Indexed ${segmentsByCountry.size} countries`);

    return {
        segments: segments3D,
        segmentsByCountry
    };
}

/**
 * Get segments for a specific country
 * @param data Loaded segment data
 * @param iso2 Country ISO2 code
 * @returns Array of segments for this country
 */
export function getCountrySegments(data: SegmentData, iso2: string): Segment3D[] {
    return data.segmentsByCountry.get(iso2) || [];
}

/**
 * Get only shared segments (exclude standalone coastlines)
 * @param data Loaded segment data
 * @returns Array of shared and multipoint segments
 */
export function getSharedSegments(data: SegmentData): Segment3D[] {
    return data.segments.filter(s => s.type === 'shared' || s.type === 'multipoint');
}

/**
 * Get segments between two specific countries
 * @param data Loaded segment data
 * @param iso2A First country ISO2 code
 * @param iso2B Second country ISO2 code
 * @returns Array of segments shared by both countries
 */
export function getSegmentsBetween(data: SegmentData, iso2A: string, iso2B: string): Segment3D[] {
    const segmentsA = data.segmentsByCountry.get(iso2A);
    if (!segmentsA) return [];

    return segmentsA.filter(segment =>
        segment.countries.includes(iso2B)
    );
}

/**
 * Get statistics about loaded segments
 * @param data Loaded segment data
 * @returns Statistics object
 */
export function getSegmentStats(data: SegmentData) {
    const totalPoints = data.segments.reduce((sum, s) => sum + s.points.length, 0);
    const sharedCount = data.segments.filter(s => s.type === 'shared').length;
    const multiPointCount = data.segments.filter(s => s.type === 'multipoint').length;
    const standaloneCount = data.segments.filter(s => s.type === 'standalone').length;

    return {
        totalSegments: data.segments.length,
        totalPoints,
        avgPointsPerSegment: totalPoints / data.segments.length,
        sharedSegments: sharedCount,
        multiPointSegments: multiPointCount,
        standaloneSegments: standaloneCount,
        countriesWithSegments: data.segmentsByCountry.size
    };
}
