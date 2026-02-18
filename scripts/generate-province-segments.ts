#!/usr/bin/env node
/**
 * Generate border segments for provinces of a given country
 *
 * Usage: tsx scripts/generate-province-segments.ts --country=US
 *
 * Finds shared border segments between adjacent provinces.
 * Input:  public/provinces/{ISO2}.json  (enriched province file)
 * Output: public/province-segments/{ISO2}.json
 *
 * Generic replacement for generate-us-segments.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EPSILON = 0.002;       // Same tolerance as country segments (~200m)
const MIN_SEGMENT_LENGTH = 2;

// Parse --country=XX argument
const countryArg = process.argv.find(a => a.startsWith('--country='));
if (!countryArg) {
    console.error('Usage: tsx scripts/generate-province-segments.ts --country=XX');
    process.exit(1);
}
const COUNTRY = countryArg.split('=')[1].toUpperCase();

// ============================================================================
// Types
// ============================================================================

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
    provinces: number[];
    type: 'shared' | 'multipoint';
}

interface MatchedSubsequence {
    points: Point2D[];
    provinceA: number;
    provinceB: number;
    startA: number;
    startB: number;
    reversed: boolean;
}

// ============================================================================
// Geometry helpers
// ============================================================================

function pointsEqual(a: Point2D, b: Point2D): boolean {
    return Math.abs(a.lat - b.lat) < EPSILON &&
           Math.abs(a.lon - b.lon) < EPSILON;
}

function getWrapped(path: Point2D[], index: number): Point2D {
    return path[((index % path.length) + path.length) % path.length];
}

// ============================================================================
// Data loading
// ============================================================================

function loadProvinces(filePath: string): Province2D[] {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const provinces: Province2D[] = [];

    for (const province of raw.provinces) {
        const pathsData = JSON.parse(province.paths);
        const paths: Point2D[][] = pathsData.map((rawPath: number[][]) =>
            rawPath.map(coords => ({ lat: coords[0], lon: coords[1] }))
        );
        provinces.push({ id: province.id, name: province.name, paths });
    }

    return provinces;
}

// ============================================================================
// Segment extraction
// ============================================================================

function findMatchingSubsequences(
    pathA: Point2D[], pathB: Point2D[],
    idA: number, idB: number
): MatchedSubsequence[] {
    const matches: MatchedSubsequence[] = [];
    const usedRanges = new Set<string>();

    for (let startA = 0; startA < pathA.length; startA++) {
        let bestMatch: MatchedSubsequence | null = null;
        let bestLength = 0;
        const maxLength = Math.min(pathA.length, pathB.length);

        // Forward direction
        for (let startB = 0; startB < pathB.length; startB++) {
            let len = 0;
            while (len < maxLength &&
                   pointsEqual(getWrapped(pathA, startA + len), getWrapped(pathB, startB + len))) {
                len++;
            }
            if (len >= MIN_SEGMENT_LENGTH && len > bestLength) {
                bestLength = len;
                bestMatch = { points: [], provinceA: idA, provinceB: idB, startA, startB, reversed: false };
            }
        }

        // Reversed direction
        for (let startB = 0; startB < pathB.length; startB++) {
            let len = 0;
            while (len < maxLength &&
                   pointsEqual(getWrapped(pathA, startA + len), getWrapped(pathB, startB - len))) {
                len++;
            }
            if (len >= MIN_SEGMENT_LENGTH && len > bestLength) {
                bestLength = len;
                bestMatch = { points: [], provinceA: idA, provinceB: idB, startA, startB, reversed: true };
            }
        }

        if (bestMatch && bestLength >= MIN_SEGMENT_LENGTH) {
            const rangeKey = `${startA}-${startA + bestLength - 1}`;
            if (!usedRanges.has(rangeKey)) {
                usedRanges.add(rangeKey);
                const points: Point2D[] = [];
                for (let i = 0; i < bestLength; i++) {
                    points.push(getWrapped(pathA, startA + i));
                }
                bestMatch.points = points;
                matches.push(bestMatch);
            }
        }
    }

    return matches;
}

function extractSegments(provinces: Province2D[]): Segment2D[] {
    const segments: Segment2D[] = [];
    const processedPairs = new Set<string>();

    console.log(`Finding segments between ${provinces.length} provinces...`);

    for (let i = 0; i < provinces.length; i++) {
        const a = provinces[i];
        for (let j = i + 1; j < provinces.length; j++) {
            const b = provinces[j];
            const pairKey = `${a.id}-${b.id}`;
            if (processedPairs.has(pairKey)) continue;
            processedPairs.add(pairKey);

            for (const pathA of a.paths) {
                for (const pathB of b.paths) {
                    const matches = findMatchingSubsequences(pathA, pathB, a.id, b.id);
                    for (const match of matches) {
                        if (match.points.length >= MIN_SEGMENT_LENGTH) {
                            segments.push({
                                points: match.points,
                                provinces: [a.id, b.id],
                                type: 'shared',
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

// ============================================================================
// Main
// ============================================================================

const INPUT_PATH = path.join(__dirname, '..', 'public', 'provinces', `${COUNTRY}.json`);
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'province-segments');
const OUTPUT_PATH = path.join(OUTPUT_DIR, `${COUNTRY}.json`);

console.log(`=== Generating ${COUNTRY} Province Segments ===\n`);
console.log('Reading:', INPUT_PATH);

if (!fs.existsSync(INPUT_PATH)) {
    console.error(`Input file not found: ${INPUT_PATH}`);
    console.error(`Run: tsx scripts/extract-provinces.ts --country=${COUNTRY}`);
    process.exit(1);
}

const provinces = loadProvinces(INPUT_PATH);
console.log(`Loaded ${provinces.length} provinces`);

const segments = extractSegments(provinces);

const output = {
    country: COUNTRY,
    segments: segments.map(seg => ({
        points: seg.points.map(p => [p.lat, p.lon]),
        provinces: seg.provinces,
        type: seg.type,
    })),
};

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

console.log('\nOutput written to:', OUTPUT_PATH);
console.log(`File size: ${(fs.statSync(OUTPUT_PATH).size / 1024).toFixed(2)} KB`);

const totalPoints = segments.reduce((sum, s) => sum + s.points.length, 0);
console.log(`\nStatistics:`);
console.log(`  Total segments : ${segments.length}`);
console.log(`  Total points   : ${totalPoints}`);
if (segments.length > 0) {
    console.log(`  Avg pts/segment: ${(totalPoints / segments.length).toFixed(1)}`);
}

console.log('\n✓ Done');
