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
        regions: segment2D.regions,
        type: segment2D.type
    };
}

/**
 * Load and convert segments from JSON file
 * Supports both country and province segment formats
 * @param url Path to segments file
 * @param format Format of the segments file: 'country' (default) or 'province'
 * @returns Promise with segment data
 */
export async function loadSegments(
    url: string = DEFAULT_ASSETS.segmentsJson,
    format: 'country' | 'province' = 'country'
): Promise<SegmentData> {
    console.log(`Loading ${format} segments from ${url}...`);
    const startTime = performance.now();

    // Fetch the JSON file
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }

    const rawData = await response.json();
    let segments2D: Segment2D[];

    if (format === 'province') {
        // Province format: { country: "US", segments: [...] }
        // Points are arrays: [lat, lon]
        // Region IDs are in "provinces" field as numbers
        const provinceData = rawData as { country: string; segments: any[] };
        segments2D = provinceData.segments.map(seg => ({
            points: seg.points.map((p: number[]) => ({ lat: p[0], lon: p[1] })),
            regions: seg.provinces.map((id: number) => id.toString()),
            type: seg.type
        }));
        console.log(`  Loaded ${segments2D.length} province segments for ${provinceData.country}`);
    } else {
        // Country format: [...segments...]
        // Points are already objects: { lat, lon }
        // Region IDs are in "regions" or legacy "countries" field as strings
        const countrySegments = rawData as any[];
        segments2D = countrySegments.map(seg => ({
            points: seg.points,
            regions: seg.regions || seg.countries,  // Support both field names
            type: seg.type
        }));
        console.log(`  Loaded ${segments2D.length} segments`);
    }

    // Convert to 3D at altitude 0 (same as region surface base, so they animate together)
    const segments3D = segments2D.map(segment => segment2DTo3D(segment, 0));

    // Build region index
    const segmentsByRegion = new Map<string, Segment3D[]>();
    for (const segment of segments3D) {
        for (const regionId of segment.regions) {
            if (!segmentsByRegion.has(regionId)) {
                segmentsByRegion.set(regionId, []);
            }
            segmentsByRegion.get(regionId)!.push(segment);
        }
    }

    const endTime = performance.now();
    console.log(`  Conversion took ${(endTime - startTime).toFixed(2)}ms`);
    console.log(`  Indexed ${segmentsByRegion.size} regions`);

    return {
        segments: segments3D,
        segmentsByRegion
    };
}

/**
 * Get segments for a specific region
 * @param data Loaded segment data
 * @param regionId Region identifier (ISO2 for countries, numeric string for provinces)
 * @returns Array of segments for this region
 */
export function getRegionSegments(data: SegmentData, regionId: string): Segment3D[] {
    return data.segmentsByRegion.get(regionId) || [];
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
 * Get segments between two specific regions
 * @param data Loaded segment data
 * @param regionIdA First region identifier
 * @param regionIdB Second region identifier
 * @returns Array of segments shared by both regions
 */
export function getSegmentsBetween(data: SegmentData, regionIdA: string, regionIdB: string): Segment3D[] {
    const segmentsA = data.segmentsByRegion.get(regionIdA);
    if (!segmentsA) return [];

    return segmentsA.filter(segment =>
        segment.regions.includes(regionIdB)
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
        regionsWithSegments: data.segmentsByRegion.size
    };
}

