#!/usr/bin/env node
/**
 * Test script for region controller data pipeline
 *
 * Verifies that:
 * - public/provinces/index.json lists at least one country
 * - Each listed country's province file is loadable
 * - Province items have the correct structure for loadFromProvinceData()
 * - ISO2 identifiers would be generated correctly
 *
 * Does NOT instantiate BabylonJS — pure data validation.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const PROVINCES_DIR = path.join(PUBLIC_DIR, 'provinces');
const INDEX_PATH = path.join(PROVINCES_DIR, 'index.json');

console.log('=== Testing Region Controller Data Pipeline ===\n');

let pass = 0;
let fail = 0;

function check(label: string, ok: boolean, detail?: string): void {
    if (ok) {
        console.log(`  ✓ ${label}`);
        pass++;
    } else {
        console.error(`  ✗ ${label}${detail ? ': ' + detail : ''}`);
        fail++;
    }
}

// ============================================================================
// Test 1: Province index exists and is valid
// ============================================================================

console.log('Test 1: Province index');

check('index.json exists', fs.existsSync(INDEX_PATH));

let provinceCodes: string[] = [];
try {
    provinceCodes = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'));
    check('index.json is an array', Array.isArray(provinceCodes));
    check('index.json has at least one entry', provinceCodes.length >= 1,
        `got ${provinceCodes.length}`);
    check('all entries are non-empty strings',
        provinceCodes.every(c => typeof c === 'string' && c.length > 0));
    console.log(`  Province codes: [${provinceCodes.join(', ')}]`);
} catch (e: any) {
    check('index.json is valid JSON', false, e.message);
}

// ============================================================================
// Test 2: Each province file is loadable and has correct structure
// ============================================================================

for (const iso2 of provinceCodes) {
    console.log(`\nTest 2: Province file for ${iso2}`);

    const filePath = path.join(PROVINCES_DIR, `${iso2}.json`);
    check(`${iso2}.json exists`, fs.existsSync(filePath));

    if (!fs.existsSync(filePath)) continue;

    let data: any;
    try {
        data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        check('file is valid JSON', true);
    } catch (e: any) {
        check('file is valid JSON', false, e.message);
        continue;
    }

    check('has "country" field', typeof data.country === 'string');
    check('"country" matches iso2', data.country === iso2,
        `got "${data.country}", expected "${iso2}"`);
    check('has "provinces" array', Array.isArray(data.provinces));

    if (!Array.isArray(data.provinces)) continue;

    check('provinces array is non-empty', data.provinces.length > 0,
        `got ${data.provinces.length}`);

    console.log(`  Province count: ${data.provinces.length}`);

    // ============================================================================
    // Test 3: Province item structure (matches loadFromProvinceData() expectations)
    // ============================================================================

    console.log(`\nTest 3: Province item structure for ${iso2}`);

    let itemErrors = 0;
    const idSet = new Set<number>();

    for (const item of data.provinces) {
        if (typeof item.id !== 'number') {
            console.error(`    ✗ Province "${item.name ?? '?'}" has non-number id: ${item.id}`);
            itemErrors++;
        }

        if (typeof item.name !== 'string' || item.name.length === 0) {
            console.error(`    ✗ Province id=${item.id} has invalid name`);
            itemErrors++;
        }

        if (typeof item.paths !== 'string') {
            console.error(`    ✗ Province "${item.name}" paths is not a string`);
            itemErrors++;
        } else {
            try {
                const paths = JSON.parse(item.paths);
                if (!Array.isArray(paths) || paths.length === 0) {
                    console.error(`    ✗ Province "${item.name}" paths is empty or not an array`);
                    itemErrors++;
                }
            } catch {
                console.error(`    ✗ Province "${item.name}" paths is invalid JSON`);
                itemErrors++;
            }
        }

        if (idSet.has(item.id)) {
            console.error(`    ✗ Duplicate province id: ${item.id}`);
            itemErrors++;
        }
        idSet.add(item.id);
    }

    check('all province items have valid structure', itemErrors === 0,
        `${itemErrors} error(s) found`);

    // ============================================================================
    // Test 4: ISO2 identifier generation
    // ============================================================================

    console.log(`\nTest 4: ISO2 identifier generation for ${iso2}`);

    const generatedIds = data.provinces.map((p: any) => `${iso2}-${p.id}`);
    check('iso2 ids are unique', new Set(generatedIds).size === generatedIds.length);

    const sample = generatedIds.slice(0, 3);
    console.log(`  Sample iso2 ids: ${sample.join(', ')}, ...`);

    // ============================================================================
    // Test 5: Cross-check with segments file if it exists
    // ============================================================================

    const segmentsPath = path.join(PUBLIC_DIR, 'province-segments', `${iso2}.json`);
    if (fs.existsSync(segmentsPath)) {
        console.log(`\nTest 5: Province segments for ${iso2}`);

        let segData: any;
        try {
            segData = JSON.parse(fs.readFileSync(segmentsPath, 'utf-8'));
            check('segments file is valid JSON', true);
        } catch (e: any) {
            check('segments file is valid JSON', false, e.message);
            continue;
        }

        check('has "segments" array', Array.isArray(segData.segments));

        if (Array.isArray(segData.segments)) {
            check('segments array is non-empty', segData.segments.length > 0,
                `got ${segData.segments.length}`);

            // Verify all province IDs in segments are in range
            const provinceIdRange = data.provinces.length;
            let segErrors = 0;
            for (const seg of segData.segments) {
                if (!Array.isArray(seg.provinces) || seg.provinces.length !== 2) {
                    segErrors++;
                    continue;
                }
                for (const pid of seg.provinces) {
                    if (typeof pid !== 'number' || pid < 0 || pid >= provinceIdRange) {
                        segErrors++;
                    }
                }
            }
            check('all segment province refs are in range', segErrors === 0,
                `${segErrors} out-of-range reference(s)`);

            console.log(`  Segment count: ${segData.segments.length}`);
        }
    } else {
        console.log(`\nTest 5: No segments file for ${iso2} (skipped)`);
    }
}

// ============================================================================
// Summary
// ============================================================================

console.log(`\n=== Results: ${pass} passed, ${fail} failed ===`);

if (fail > 0) {
    process.exit(1);
} else {
    console.log('✓ All tests passed');
    process.exit(0);
}
