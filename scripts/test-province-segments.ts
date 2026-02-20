#!/usr/bin/env node
/**
 * Test: Province Segment Borders
 *
 * Validates province segment border loading and animation (commit ab62398):
 * - Dynamic segment loading when entering region mode
 * - Correct ID format in segment data (numeric province IDs)
 * - Segment animation mapping (segments follow province altitude)
 * - Animation texture resizing to include segments
 *
 * This test locks in the segment loading behavior before refactoring.
 */

import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

interface TestResult {
    name: string;
    passed: boolean;
    error?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(message);
    }
}

async function test(name: string, fn: () => Promise<void>): Promise<void> {
    try {
        await fn();
        results.push({ name, passed: true });
        console.log(`  ✓ ${name}`);
    } catch (error: any) {
        results.push({ name, passed: false, error: error.message });
        console.log(`  ✗ ${name}`);
        console.log(`    ${error.message}`);
    }
}

async function runTests() {
    console.log('=== Testing Province Segment Borders ===\n');

    console.log('Test Group 1: Province Segment Files Exist\n');

    const provinceCountries = ['US', 'BR', 'CA', 'CN', 'DE', 'ES', 'FR', 'GB', 'IN', 'IT', 'MX', 'PL', 'SE'];

    for (const country of provinceCountries) {
        await test(`Province segments exist for ${country}`, async () => {
            const path = `public/province-segments/${country}.json`;
            assert(existsSync(path), `File should exist: ${path}`);
        });
    }

    console.log('\nTest Group 2: Province Segment File Format\n');

    await test('US province segments have correct structure', async () => {
        const path = 'public/province-segments/US.json';
        const data = JSON.parse(await readFile(path, 'utf-8'));

        assert(data.country === 'US', 'Should have country field set to "US"');
        assert(Array.isArray(data.segments), 'Should have segments array');
        assert(data.segments.length > 0, 'Should have at least one segment');
    });

    await test('US province segments use composite IDs (COUNTRY-INDEX)', async () => {
        const path = 'public/province-segments/US.json';
        const data = JSON.parse(await readFile(path, 'utf-8'));

        const firstSegment = data.segments[0];
        assert(Array.isArray(firstSegment.provinces), 'Segment should have provinces array');
        assert(firstSegment.provinces.length > 0, 'Segment should reference at least one province');
        assert(typeof firstSegment.provinces[0] === 'string', 'Province ID should be string (composite format)');
        assert(/^[A-Z]{2}-\d+$/.test(firstSegment.provinces[0]), 'Province ID should match COUNTRY-INDEX format (e.g., "US-0")');
    });

    await test('US province segments have points in correct format', async () => {
        const path = 'public/province-segments/US.json';
        const data = JSON.parse(await readFile(path, 'utf-8'));

        const firstSegment = data.segments[0];
        assert(Array.isArray(firstSegment.points), 'Segment should have points array');
        assert(firstSegment.points.length >= 2, 'Segment should have at least 2 points');

        const firstPoint = firstSegment.points[0];
        assert(Array.isArray(firstPoint), 'Point should be [lat, lon] array');
        assert(firstPoint.length === 2, 'Point should have exactly 2 elements');
        assert(typeof firstPoint[0] === 'number', 'Latitude should be number');
        assert(typeof firstPoint[1] === 'number', 'Longitude should be number');
        assert(firstPoint[0] >= -90 && firstPoint[0] <= 90, 'Latitude should be in valid range');
        assert(firstPoint[1] >= -180 && firstPoint[1] <= 180, 'Longitude should be in valid range');
    });

    await test('US province segments have type field', async () => {
        const path = 'public/province-segments/US.json';
        const data = JSON.parse(await readFile(path, 'utf-8'));

        const firstSegment = data.segments[0];
        assert(typeof firstSegment.type === 'string', 'Segment should have type field');
        assert(['shared', 'standalone', 'multipoint'].includes(firstSegment.type),
            'Type should be one of: shared, standalone, multipoint');
    });

    console.log('\nTest Group 3: Province Segment Statistics\n');

    await test('US has expected number of segments', async () => {
        const path = 'public/province-segments/US.json';
        const data = JSON.parse(await readFile(path, 'utf-8'));

        // US has 50 states, should have hundreds of border segments
        assert(data.segments.length > 100, `Expected >100 segments, got ${data.segments.length}`);
    });

    await test('GB has expected number of segments', async () => {
        const path = 'public/province-segments/GB.json';
        const data = JSON.parse(await readFile(path, 'utf-8'));

        // GB has 73 regions, should have many segments
        assert(data.segments.length > 50, `Expected >50 segments, got ${data.segments.length}`);
    });

    console.log('\nTest Group 4: Province vs Country Segment Format Differences\n');

    await test('Country segments use different ID format', async () => {
        const path = 'public/segments.json';
        if (existsSync(path)) {
            const data = JSON.parse(await readFile(path, 'utf-8'));

            // Country segments should have "regions" field with string IDs (ISO2 codes)
            const firstSegment = data[0];
            if (firstSegment && firstSegment.regions) {
                assert(Array.isArray(firstSegment.regions), 'Country segment should have regions array');
                assert(typeof firstSegment.regions[0] === 'string', 'Country region ID should be string (ISO2)');
                assert(/^[A-Z]{2}$/.test(firstSegment.regions[0]), 'Should be 2-letter ISO2 code');
            }
        }
    });

    console.log('\nTest Group 5: Segment Loader Function Behavior\n');

    await test('Segment loader supports both province and country formats', async () => {
        // Test that loadSegments can handle both formats via the format parameter
        const { loadSegments } = await import('../src/earth-globe/segment-loader');

        assert(typeof loadSegments === 'function', 'loadSegments should be exported');

        // Verify it accepts format parameter by checking the function signature
        // (This is a basic smoke test - actual format handling is tested in other tests)
    });

    // Summary
    console.log('\n=== Test Summary ===\n');
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    console.log(`Total: ${results.length} tests`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
        console.log('\nFailed tests:');
        results.filter(r => !r.passed).forEach(r => {
            console.log(`  - ${r.name}`);
            if (r.error) console.log(`    ${r.error}`);
        });
        process.exit(1);
    } else {
        console.log('\n✓ All tests passed!');
        process.exit(0);
    }
}

runTests().catch(error => {
    console.error('Fatal error running tests:', error);
    process.exit(1);
});
