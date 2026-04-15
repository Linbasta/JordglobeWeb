#!/usr/bin/env node
/**
 * Test script for US provinces data
 *
 * Verifies province and segment data is correctly formatted.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROVINCES_PATH = path.join(__dirname, '..', 'public', 'provinces', 'US.json');
const SEGMENTS_PATH = path.join(__dirname, '..', 'public', 'province-segments', 'US.json');

console.log('=== Testing US Provinces ===\n');

// Test 1: Load and validate province data
console.log('Test 1: Loading province data...');
const provinceData = JSON.parse(fs.readFileSync(PROVINCES_PATH, 'utf-8'));

if (provinceData.country !== 'US') {
    console.error('  ✗ Fail: country should be "US"');
    process.exit(1);
}

if (!Array.isArray(provinceData.provinces)) {
    console.error('  ✗ Fail: provinces should be an array');
    process.exit(1);
}

if (provinceData.provinces.length !== 50) {
    console.error(`  ✗ Fail: Expected 50 provinces, got ${provinceData.provinces.length}`);
    process.exit(1);
}

console.log(`  ✓ Pass: Loaded ${provinceData.provinces.length} provinces`);

// Test 2: Validate province structure
console.log('\nTest 2: Validating province structure...');
let hasErrors = false;

for (const province of provinceData.provinces) {
    if (typeof province.id !== 'number') {
        console.error(`  ✗ Fail: Province ${province.name} has non-integer ID: ${province.id}`);
        hasErrors = true;
    }

    if (typeof province.name !== 'string' || province.name.length === 0) {
        console.error(`  ✗ Fail: Province ID ${province.id} has invalid name`);
        hasErrors = true;
    }

    if (typeof province.paths !== 'string') {
        console.error(`  ✗ Fail: Province ${province.name} paths is not a string`);
        hasErrors = true;
    }

    // Parse paths to verify format
    try {
        const paths = JSON.parse(province.paths);
        if (!Array.isArray(paths)) {
            console.error(`  ✗ Fail: Province ${province.name} paths is not an array`);
            hasErrors = true;
        }
    } catch (e) {
        console.error(`  ✗ Fail: Province ${province.name} paths is not valid JSON`);
        hasErrors = true;
    }
}

if (hasErrors) {
    process.exit(1);
}

console.log('  ✓ Pass: All provinces have valid structure');

// Test 3: Check for multi-polygon provinces
console.log('\nTest 3: Checking for multi-polygon provinces...');
const multiPolygonProvinces = provinceData.provinces.filter((p: any) => {
    const paths = JSON.parse(p.paths);
    return paths.length > 1;
});

console.log(`  Found ${multiPolygonProvinces.length} multi-polygon provinces:`);
multiPolygonProvinces.forEach((p: any) => {
    const paths = JSON.parse(p.paths);
    console.log(`    - ${p.name}: ${paths.length} polygons`);
});

// Test 4: Load and validate segment data
console.log('\nTest 4: Loading segment data...');
const segmentData = JSON.parse(fs.readFileSync(SEGMENTS_PATH, 'utf-8'));

if (segmentData.country !== 'US') {
    console.error('  ✗ Fail: country should be "US"');
    process.exit(1);
}

if (!Array.isArray(segmentData.segments)) {
    console.error('  ✗ Fail: segments should be an array');
    process.exit(1);
}

console.log(`  ✓ Pass: Loaded ${segmentData.segments.length} segments`);

// Test 5: Validate segment structure
console.log('\nTest 5: Validating segment structure...');
hasErrors = false;

for (const segment of segmentData.segments) {
    if (!Array.isArray(segment.points) || segment.points.length < 2) {
        console.error(`  ✗ Fail: Segment has invalid points array (length: ${segment.points?.length})`);
        hasErrors = true;
    }

    if (!Array.isArray(segment.provinces) || segment.provinces.length !== 2) {
        console.error(`  ✗ Fail: Segment has invalid provinces array (length: ${segment.provinces?.length})`);
        hasErrors = true;
    }

    // Validate province IDs are in range
    for (const provinceId of segment.provinces) {
        if (typeof provinceId !== 'number' || provinceId < 0 || provinceId >= 50) {
            console.error(`  ✗ Fail: Invalid province ID: ${provinceId}`);
            hasErrors = true;
        }
    }
}

if (hasErrors) {
    process.exit(1);
}

console.log('  ✓ Pass: All segments have valid structure');

// Test 6: Print statistics
console.log('\nTest 6: Statistics');

const totalPoints = segmentData.segments.reduce((sum: number, seg: any) => sum + seg.points.length, 0);
const avgPointsPerSegment = (totalPoints / segmentData.segments.length).toFixed(1);

console.log(`  - Total provinces: ${provinceData.provinces.length}`);
console.log(`  - Total segments: ${segmentData.segments.length}`);
console.log(`  - Total segment points: ${totalPoints}`);
console.log(`  - Average points per segment: ${avgPointsPerSegment}`);

// Sample provinces
console.log('\n  Sample provinces:');
provinceData.provinces.slice(0, 5).forEach((p: any) => {
    const paths = JSON.parse(p.paths);
    const totalPoints = paths.reduce((sum: number, path: any[]) => sum + path.length, 0);
    console.log(`    ${p.id}: ${p.name} (${paths.length} polygon${paths.length > 1 ? 's' : ''}, ${totalPoints} points)`);
});

console.log('\n=== All tests passed ===');
process.exit(0);
