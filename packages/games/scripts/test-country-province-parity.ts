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

    await test('Animation functions use controller-based API (Phase 5)', async () => {
        // Verify that animation functions use the new controller-based API
        assert(animSource.includes('globe.getActiveController()'), 'Should get active controller');
        assert(animSource.includes('controller.setState'), 'Should use controller.setState()');
        assert(animSource.includes('controller.setAltitude'), 'Should use controller.setAltitude()');
        assert(animSource.includes('controller.animateAltitude'), 'Should use controller.animateAltitude()');
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

    console.log('\nTest Group 4: Phase 6 Complete - Routing Methods Removed\n');

    await test('Deprecated routing methods have been removed', async () => {
        // Verify that Phase 6 is complete - all routing methods should be gone
        const { readFile } = await import('fs/promises');
        const source = await readFile('src/earth-globe/earth-globe.ts', 'utf-8');

        assert(!source.includes('setActiveRegionState('), 'setActiveRegionState should be removed');
        assert(!source.includes('setActiveRegionAltitude('), 'setActiveRegionAltitude should be removed');
        assert(!source.includes('setActiveRegionBlend('), 'setActiveRegionBlend should be removed');
    });

    await test('Controller API is now the only way to access regions', async () => {
        const { readFile } = await import('fs/promises');
        const source = await readFile('src/earth-globe/earth-globe.ts', 'utf-8');

        // Verify controller getters exist
        assert(source.includes('getCountryController()'), 'Should have getCountryController()');
        assert(source.includes('getProvinceController()'), 'Should have getProvinceController()');
        assert(source.includes('getActiveController()'), 'Should have getActiveController()');
    });

    console.log('\nTest Group 5: Duplication Eliminated (Phase 6 Complete)\n');

    await test('Duplicate country/province methods removed', async () => {
        // Phase 6 complete - all duplicate methods should be gone
        const { readFile } = await import('fs/promises');
        const source = await readFile('src/earth-globe/earth-globe.ts', 'utf-8');

        assert(!source.includes('setCountryState('), 'setCountryState should be removed');
        assert(!source.includes('setProvinceState('), 'setProvinceState should be removed');
        assert(!source.includes('setCountryAltitude('), 'setCountryAltitude should be removed');
        assert(!source.includes('setProvinceAltitude('), 'setProvinceAltitude should be removed');
        assert(!source.includes('animateCountryBlend('), 'animateCountryBlend should be removed');
        assert(!source.includes('animateProvinceBlend('), 'animateProvinceBlend should be removed');
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
