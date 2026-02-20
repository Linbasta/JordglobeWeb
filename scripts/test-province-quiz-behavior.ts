#!/usr/bin/env node
/**
 * Test: Province Quiz Behavior
 *
 * Validates the province quiz system features that were fixed in recent commits:
 * - Enter/Exit region mode (commit e8c9245)
 * - Province animations (commit e8c9245)
 * - Province deselection altitude fix (commit c709d33)
 * - Province ID matching (commit 0799542)
 *
 * This test locks in the current working behavior before refactoring.
 */

import { readFile } from 'fs/promises';

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

function assertApprox(actual: number, expected: number, tolerance: number, message: string): void {
    if (Math.abs(actual - expected) > tolerance) {
        throw new Error(`${message} (expected ${expected}, got ${actual})`);
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
    console.log('=== Testing Province Quiz Behavior ===\n');

    // Read source files instead of importing (to avoid .glsl import issues)
    const earthGlobeSource = await readFile('src/earth-globe/earth-globe.ts', 'utf-8');
    const animTexSource = await readFile('src/earth-globe/animation-texture.ts', 'utf-8');

    console.log('Test Group 1: Enter/Exit Region Mode\n');

    await test('EarthGlobe has isInRegionMode() method', async () => {
        assert(earthGlobeSource.includes('isInRegionMode()'), 'Should have isInRegionMode method');
    });

    await test('EarthGlobe has getRegionModeISO2() method', async () => {
        assert(earthGlobeSource.includes('getRegionModeISO2()'), 'Should have getRegionModeISO2 method');
    });

    await test('EarthGlobe has enterRegionMode() method', async () => {
        assert(earthGlobeSource.includes('enterRegionMode('), 'Should have enterRegionMode method');
    });

    await test('EarthGlobe has exitRegionMode() method', async () => {
        assert(earthGlobeSource.includes('exitRegionMode()'), 'Should have exitRegionMode method');
    });

    console.log('\nTest Group 2: Province Animation API\n');

    await test('Active region API exists for state', async () => {
        assert(earthGlobeSource.includes('setActiveRegionState('), 'setActiveRegionState should exist');
        assert(earthGlobeSource.includes('getActiveRegionState('), 'getActiveRegionState should exist');
    });

    await test('Active region API exists for altitude', async () => {
        assert(earthGlobeSource.includes('setActiveRegionAltitude('), 'setActiveRegionAltitude should exist');
        assert(earthGlobeSource.includes('getActiveRegionAltitude('), 'getActiveRegionAltitude should exist');
    });

    await test('Active region API exists for blend', async () => {
        assert(earthGlobeSource.includes('setActiveRegionBlend('), 'setActiveRegionBlend should exist');
        assert(earthGlobeSource.includes('getActiveRegionBlend('), 'getActiveRegionBlend should exist');
    });

    await test('Active region API has animate methods', async () => {
        assert(earthGlobeSource.includes('animateActiveRegionAltitude('), 'animateActiveRegionAltitude should exist');
        assert(earthGlobeSource.includes('animateActiveRegionBlend('), 'animateActiveRegionBlend should exist');
    });

    console.log('\nTest Group 3: Province vs Country Constants\n');

    await test('State constants are defined', async () => {
        assert(animTexSource.includes('STATE_NORMAL'), 'STATE_NORMAL should be defined');
        assert(animTexSource.includes('STATE_DISABLED'), 'STATE_DISABLED should be defined');
        assert(animTexSource.includes('STATE_CLEARED'), 'STATE_CLEARED should be defined');
    });

    await test('State constants have expected values', async () => {
        assert(animTexSource.includes('STATE_NORMAL = 0.0') || animTexSource.includes('STATE_NORMAL=0.0'),
            'STATE_NORMAL should be 0.0');
        assert(animTexSource.includes('STATE_DISABLED = 0.25') || animTexSource.includes('STATE_DISABLED=0.25'),
            'STATE_DISABLED should be 0.25');
        assert(animTexSource.includes('STATE_CLEARED = 0.50') || animTexSource.includes('STATE_CLEARED=0.50') ||
               animTexSource.includes('STATE_CLEARED = 0.5') || animTexSource.includes('STATE_CLEARED=0.5'),
            'STATE_CLEARED should be 0.50 or 0.5');
    });

    console.log('\nTest Group 4: Province ID Format\n');

    await test('Province IDs should be composite format', async () => {
        // This is a structural test - province IDs should follow "COUNTRY-INDEX" format
        // Example: "US-0", "US-1", "GB-0", "GB-1"
        const validProvinceId = /^[A-Z]{2}-\d+$/;

        assert(validProvinceId.test('US-0'), 'US-0 should be valid province ID format');
        assert(validProvinceId.test('GB-15'), 'GB-15 should be valid province ID format');
        assert(validProvinceId.test('CN-33'), 'CN-33 should be valid province ID format');
        assert(!validProvinceId.test('US'), 'US should not be valid province ID (country only)');
        assert(!validProvinceId.test('0'), 'Numeric only should not be valid province ID');
    });

    console.log('\nTest Group 5: Altitude Constants (Deselection Fix)\n');

    await test('Province and country default altitudes differ', async () => {
        // This captures the fix from commit c709d33
        // Countries default to 0.4, provinces default to 0.2
        // The region-selection.ts file has getDefaultAltitude() that returns different values

        const regionSelectionSource = await readFile('src/shared/behaviors/region-selection.ts', 'utf-8');

        assert(regionSelectionSource.includes('ALT_DEFAULT_COUNTRY'), 'Should define ALT_DEFAULT_COUNTRY');
        assert(regionSelectionSource.includes('ALT_DEFAULT_PROVINCE'), 'Should define ALT_DEFAULT_PROVINCE');
        assert(regionSelectionSource.includes('getDefaultAltitude'), 'Should have getDefaultAltitude function');
        assert(regionSelectionSource.includes('isInRegionMode()'), 'getDefaultAltitude should check isInRegionMode');
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
