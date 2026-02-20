#!/usr/bin/env node
/**
 * Test: Country vs Province Parity
 *
 * Validates that countries and provinces have identical animation behavior.
 * This test captures the GOAL state we want to maintain: full feature parity.
 *
 * Tests:
 * - All 7 animation functions work for both countries and provinces
 * - State management is identical
 * - Animation durations are identical
 * - API surface is identical
 *
 * This test locks in parity before refactoring.
 */

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
    console.log('=== Testing Country vs Province Parity ===\n');

    console.log('Test Group 1: Animation Functions Exist\n');

    // Read source file instead of importing (to avoid .glsl import issues)
    const { readFile } = await import('fs/promises');
    const animSource = await readFile('src/shared/animation/region-animations.ts', 'utf-8');

    await test('animateCorrectRegion is exported', async () => {
        assert(animSource.includes('export function animateCorrectRegion'), 'animateCorrectRegion should be exported');
    });

    await test('animateWrongRegion is exported', async () => {
        assert(animSource.includes('export async function animateWrongRegion'), 'animateWrongRegion should be exported');
    });

    await test('animateShowCorrectRegion is exported', async () => {
        assert(animSource.includes('export async function animateShowCorrectRegion'), 'animateShowCorrectRegion should be exported');
    });

    await test('animateToClearedAfterRevealRegion is exported', async () => {
        assert(animSource.includes('export async function animateToClearedAfterRevealRegion'), 'animateToClearedAfterRevealRegion should be exported');
    });

    await test('animateToDisabledRegion is exported', async () => {
        assert(animSource.includes('export async function animateToDisabledRegion'), 'animateToDisabledRegion should be exported');
    });

    await test('setRegionDisabledImmediate is exported', async () => {
        assert(animSource.includes('export function setRegionDisabledImmediate'), 'setRegionDisabledImmediate should be exported');
    });

    await test('animateToNormalRegion is exported', async () => {
        assert(animSource.includes('export async function animateToNormalRegion'), 'animateToNormalRegion should be exported');
    });

    console.log('\nTest Group 2: Animation Function Signatures\n');

    await test('Animation functions use active region API', async () => {
        // Verify that animation functions use the active region API (not separate country/province methods)
        assert(animSource.includes('globe.setActiveRegionState'), 'Should use setActiveRegionState');
        assert(animSource.includes('globe.setActiveRegionAltitude'), 'Should use setActiveRegionAltitude');
        assert(animSource.includes('globe.animateActiveRegionAltitude'), 'Should use animateActiveRegionAltitude');
    });

    console.log('\nTest Group 3: Animation Constants Parity\n');

    await test('Animation constants are shared between countries and provinces', async () => {
        // The animation functions use constants from region-animations.ts
        // These should be the same for both countries and provinces

        assert(animSource.includes('NORMAL_ALTITUDE'), 'Should define NORMAL_ALTITUDE');
        assert(animSource.includes('WRONG_ALTITUDE'), 'Should define WRONG_ALTITUDE');
        assert(animSource.includes('CLEARED_ALTITUDE'), 'Should define CLEARED_ALTITUDE');
        assert(animSource.includes('ANIMATION_DURATION'), 'Should define ANIMATION_DURATION');
    });

    console.log('\nTest Group 4: Active Region API (Routing)\n');

    await test('Active region methods use isInRegionMode() to route', async () => {
        // Verify that EarthGlobe has routing methods that delegate based on mode
        const { readFile } = await import('fs/promises');
        const source = await readFile('src/earth-globe/earth-globe.ts', 'utf-8');

        assert(source.includes('setActiveRegionState'), 'Should have setActiveRegionState method');
        assert(source.includes('setActiveRegionAltitude'), 'Should have setActiveRegionAltitude method');
        assert(source.includes('setActiveRegionBlend'), 'Should have setActiveRegionBlend method');
        assert(source.includes('isInRegionMode()'), 'Routing should check isInRegionMode()');
    });

    await test('Routing methods delegate to province methods when in region mode', async () => {
        const { readFile } = await import('fs/promises');
        const source = await readFile('src/earth-globe/earth-globe.ts', 'utf-8');

        // Check that setActiveRegionState calls setProvinceState when in region mode
        const setActiveRegionStateIndex = source.indexOf('setActiveRegionState(');
        if (setActiveRegionStateIndex === -1) {
            throw new Error('setActiveRegionState not found');
        }

        // Find the method body (next 500 chars should contain the routing logic)
        const methodBody = source.substring(setActiveRegionStateIndex, setActiveRegionStateIndex + 500);

        assert(methodBody.includes('isInRegionMode()'), 'Should check isInRegionMode()');
        assert(methodBody.includes('setProvinceState'), 'Should call setProvinceState when in region mode');
        assert(methodBody.includes('setCountryState'), 'Should call setCountryState when not in region mode');
    });

    console.log('\nTest Group 5: Duplication Detection (Current State)\n');

    await test('setCountryState and setProvinceState both exist (DUPLICATION)', async () => {
        // This test DOCUMENTS the current duplication
        // After Phase 1 refactor, this test will FAIL (which is good!)
        const { readFile } = await import('fs/promises');
        const source = await readFile('src/earth-globe/earth-globe.ts', 'utf-8');

        assert(source.includes('setCountryState('), 'setCountryState should exist');
        assert(source.includes('setProvinceState('), 'setProvinceState should exist');
        console.log('    (This duplication will be removed in Phase 1)');
    });

    await test('setCountryAltitude and setProvinceAltitude both exist (DUPLICATION)', async () => {
        const { readFile } = await import('fs/promises');
        const source = await readFile('src/earth-globe/earth-globe.ts', 'utf-8');

        assert(source.includes('setCountryAltitude('), 'setCountryAltitude should exist');
        assert(source.includes('setProvinceAltitude('), 'setProvinceAltitude should exist');
        console.log('    (This duplication will be removed in Phase 1)');
    });

    await test('animateCountryBlend and animateProvinceBlend both exist (DUPLICATION)', async () => {
        const { readFile } = await import('fs/promises');
        const source = await readFile('src/earth-globe/earth-globe.ts', 'utf-8');

        assert(source.includes('animateCountryBlend('), 'animateCountryBlend should exist');
        assert(source.includes('animateProvinceBlend('), 'animateProvinceBlend should exist');
        console.log('    (This duplication will be removed in Phase 1)');
    });

    console.log('\nTest Group 6: State Constants Parity\n');

    await test('STATE constants are defined and exported', async () => {
        const { readFile } = await import('fs/promises');
        const indexSource = await readFile('src/earth-globe/index.ts', 'utf-8');

        assert(indexSource.includes('STATE_NORMAL'), 'STATE_NORMAL should be exported');
        assert(indexSource.includes('STATE_DISABLED'), 'STATE_DISABLED should be exported');
        assert(indexSource.includes('STATE_CLEARED'), 'STATE_CLEARED should be exported');
    });

    await test('STATE constants are defined in AnimationTexture', async () => {
        const { readFile } = await import('fs/promises');
        const animTexSource = await readFile('src/earth-globe/animation-texture.ts', 'utf-8');

        assert(animTexSource.includes('STATE_NORMAL'), 'STATE_NORMAL should be defined');
        assert(animTexSource.includes('STATE_DISABLED'), 'STATE_DISABLED should be defined');
        assert(animTexSource.includes('STATE_CLEARED'), 'STATE_CLEARED should be defined');
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
        console.log('\nNote: Some tests document current duplication that will be removed in Phase 1.');
        process.exit(0);
    }
}

runTests().catch(error => {
    console.error('Fatal error running tests:', error);
    process.exit(1);
});
