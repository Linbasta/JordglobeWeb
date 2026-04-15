#!/usr/bin/env node
/**
 * Generate border segments for US provinces
 *
 * Finds shared border segments between adjacent US states.
 * Output: public/province-segments/US.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EPSILON = 0.002; // Same tolerance as country segments
const MIN_SEGMENT_LENGTH = 2;

interface Point2D {
    lat: number;
    lon: number;
}

interface Province2D {
    id: number;
    name: string;
    paths: Point2D[][];
}

interface Segment2D {
    points: Point2D[];
    provinces: number[]; // Province IDs instead of ISO2 codes
    type: 'standalone' | 'shared' | 'multipoint';
}

interface MatchedSubsequence2D {
    points: Point2D[];
    provinceA: number;
    provinceB: number;
    startA: number;
    startB: number;
    pathIndexA: number;
    pathIndexB: number;
    reversed: boolean;
}

function pointsEqual(a: Point2D, b: Point2D): boolean {
    return Math.abs(a.lat - b.lat) < EPSILON &&
           Math.abs(a.lon - b.lon) < EPSILON;
}

function getPointWrapped(path: Point2D[], index: number): Point2D {
    const wrappedIndex = ((index % path.length) + path.length) % path.length;
    return path[wrappedIndex];
}

function loadProvinces2D(filePath: string): Province2D[] {
    const rawData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const provinces: Province2D[] = [];

    for (const province of rawData.provinces) {
        const pathsData = JSON.parse(province.paths);
        const paths: Point2D[][] = [];

        for (const rawPath of pathsData) {
            const points: Point2D[] = rawPath.map((coords: number[]) => ({
                lat: coords[0],
                lon: coords[1]
            }));
            paths.push(points);
        }

        provinces.push({
            id: province.id,
            name: province.name,
            paths
        });
    }

    return provinces;
}

function findMatchingSubsequences2D(
    pathA: Point2D[],
    pathB: Point2D[],
    provinceA: number,
    provinceB: number,
    pathIndexA: number,
    pathIndexB: number
): MatchedSubsequence2D[] {
    const matches: MatchedSubsequence2D[] = [];
    const usedRanges = new Set<string>();

    for (let startA = 0; startA < pathA.length; startA++) {
        let bestMatch: MatchedSubsequence2D | null = null;
        let bestLength = 0;

        // Try forward direction
        for (let startB = 0; startB < pathB.length; startB++) {
            let length = 0;
            const maxLength = Math.min(pathA.length, pathB.length);
            while (
                length < maxLength &&
                pointsEqual(
                    getPointWrapped(pathA, startA + length),
                    getPointWrapped(pathB, startB + length)
                )
            ) {
                length++;
            }

            if (length >= MIN_SEGMENT_LENGTH && length > bestLength) {
                bestLength = length;
                bestMatch = {
                    points: [],
                    provinceA,
                    provinceB,
                    startA,
                    startB,
                    pathIndexA,
                    pathIndexB,
                    reversed: false
                };
            }
        }

        // Try reversed direction
        for (let startB = 0; startB < pathB.length; startB++) {
            let length = 0;
            const maxLength = Math.min(pathA.length, pathB.length);
            while (
                length < maxLength &&
                pointsEqual(
                    getPointWrapped(pathA, startA + length),
                    getPointWrapped(pathB, startB - length)
                )
            ) {
                length++;
            }

            if (length >= MIN_SEGMENT_LENGTH && length > bestLength) {
                bestLength = length;
                bestMatch = {
                    points: [],
                    provinceA,
                    provinceB,
                    startA,
                    startB,
                    pathIndexA,
                    pathIndexB,
                    reversed: true
                };
            }
        }

        if (bestMatch && bestLength >= MIN_SEGMENT_LENGTH) {
            const rangeKey = `${startA}-${startA + bestLength - 1}`;
            if (!usedRanges.has(rangeKey)) {
                usedRanges.add(rangeKey);
                const points: Point2D[] = [];
                for (let i = 0; i < bestLength; i++) {
                    points.push(getPointWrapped(pathA, startA + i));
                }
                bestMatch.points = points;
                matches.push(bestMatch);
            }
        }
    }

    return matches;
}

function extractSegments2D(provinces: Province2D[]): Segment2D[] {
    const segments: Segment2D[] = [];
    const processedPairs = new Set<string>();

    console.log(`\nFinding segments between ${provinces.length} provinces...`);

    for (let i = 0; i < provinces.length; i++) {
        const provinceA = provinces[i];

        for (let j = i + 1; j < provinces.length; j++) {
            const provinceB = provinces[j];
            const pairKey = `${provinceA.id}-${provinceB.id}`;

            if (processedPairs.has(pairKey)) continue;
            processedPairs.add(pairKey);

            for (let pathIdxA = 0; pathIdxA < provinceA.paths.length; pathIdxA++) {
                const pathA = provinceA.paths[pathIdxA];

                for (let pathIdxB = 0; pathIdxB < provinceB.paths.length; pathIdxB++) {
                    const pathB = provinceB.paths[pathIdxB];

                    const matches = findMatchingSubsequences2D(
                        pathA, pathB,
                        provinceA.id, provinceB.id,
                        pathIdxA, pathIdxB
                    );

                    for (const match of matches) {
                        if (match.points.length >= MIN_SEGMENT_LENGTH) {
                            segments.push({
                                points: match.points,
                                provinces: [provinceA.id, provinceB.id],
                                type: 'shared'
                            });
                        }
                    }
                }
            }
        }
    }

    console.log(`Found ${segments.length} shared border segments`);
    return segments;
}

// Main execution
const INPUT_PATH = path.join(__dirname, '..', 'public', 'provinces', 'US.json');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'province-segments');
const OUTPUT_PATH = path.join(OUTPUT_DIR, 'US.json');

console.log('=== Generating US Province Segments ===\n');
console.log('Reading:', INPUT_PATH);

const provinces = loadProvinces2D(INPUT_PATH);
console.log(`Loaded ${provinces.length} provinces`);

const segments = extractSegments2D(provinces);

// Write output
const output = {
    country: 'US',
    segments: segments.map(seg => ({
        points: seg.points.map(p => [p.lat, p.lon]),
        provinces: seg.provinces,
        type: seg.type
    }))
};

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

console.log('\nOutput written to:', OUTPUT_PATH);
console.log(`File size: ${(fs.statSync(OUTPUT_PATH).size / 1024).toFixed(2)} KB`);

// Stats
const totalPoints = segments.reduce((sum, seg) => sum + seg.points.length, 0);
console.log(`\nStatistics:`);
console.log(`  - Total segments: ${segments.length}`);
console.log(`  - Total points: ${totalPoints}`);
console.log(`  - Avg points per segment: ${(totalPoints / segments.length).toFixed(1)}`);

console.log('\n✓ Done');
