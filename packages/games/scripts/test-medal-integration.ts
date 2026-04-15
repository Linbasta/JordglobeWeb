#!/usr/bin/env node
/**
 * Test: Medal System Integration
 *
 * Validates the province medal system integration (commit 340dcfc):
 * - Province medals exist in medals.json
 * - Province IDs match between medals and province data
 * - Medal menu has province medal entries
 * - Medal countries have province segments
 *
 * This test locks in the medal integration before refactoring.
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
    console.log('=== Testing Medal System Integration ===\n');

    console.log('Test Group 1: Province Medals in medals.json\n');

    await test('medals.json exists', async () => {
        const path = 'public/medals.json';
        assert(existsSync(path), 'medals.json should exist');
    });

    let medalsData: any;
    let menuData: any;
    await test('medals.json is valid JSON', async () => {
        const path = 'public/medals.json';
        const content = await readFile(path, 'utf-8');
        const parsed = JSON.parse(content);
        assert(typeof parsed === 'object', 'medals.json should be an object');
        assert(Array.isArray(parsed.medals), 'medals.json should have medals array');
        medalsData = parsed.medals;
        menuData = parsed.menu;
    });

    await test('medals.json has province medals', async () => {
        const provinceMedals = medalsData.filter((m: any) => m.type === 'provinces');
        assert(provinceMedals.length > 0, 'Should have at least one province medal');
        console.log(`    Found ${provinceMedals.length} province medals`);
    });

    await test('Province medals have expected structure', async () => {
        const provinceMedals = medalsData.filter((m: any) => m.type === 'provinces');

        const firstProvinceMedal = provinceMedals[0];
        assert(typeof firstProvinceMedal.id === 'number', 'Province medal should have numeric id');
        assert(typeof firstProvinceMedal.name === 'string', 'Province medal should have name');
        assert(firstProvinceMedal.type === 'provinces', 'Province medal should have type="provinces"');
        assert(typeof firstProvinceMedal.countryISO2 === 'string', 'Province medal should have countryISO2');
        assert(Array.isArray(firstProvinceMedal.questionIds), 'Province medal should have questionIds array');
    });

    await test('Province medal questionIds are numeric', async () => {
        const provinceMedals = medalsData.filter((m: any) => m.type === 'provinces');

        const firstProvinceMedal = provinceMedals[0];
        assert(firstProvinceMedal.questionIds.length > 0, 'Should have at least one question ID');
        assert(typeof firstProvinceMedal.questionIds[0] === 'number', 'Question ID should be numeric (province index)');
        assert(firstProvinceMedal.questionIds[0] >= 0, 'Province index should be non-negative');
    });

    console.log('\nTest Group 2: Province Medal Distribution\n');

    await test('Province medals cover expected countries', async () => {
        const provinceMedals = medalsData.filter((m: any) => m.type === 'provinces');

        // Extract unique countries from province medals
        const countries = new Set<string>();
        for (const medal of provinceMedals) {
            if (medal.countryISO2) {
                countries.add(medal.countryISO2);
            }
        }

        const expectedCountries = ['US', 'GB', 'CN', 'IN', 'MX', 'IT', 'BR', 'SE', 'DE', 'PL', 'FR', 'ES', 'CA'];
        for (const country of expectedCountries) {
            assert(countries.has(country), `Should have province medals for ${country}`);
        }

        console.log(`    Found province medals for ${countries.size} countries`);
    });

    await test('Medal IDs are in expected range', async () => {
        // Province medals were added as IDs 72-139 (68 medals)
        const provinceMedals = medalsData.filter((m: any) => m.type === 'provinces');

        const provinceIds = provinceMedals.map((m: any) => m.id);
        const minId = Math.min(...provinceIds);
        const maxId = Math.max(...provinceIds);

        console.log(`    Province medal IDs range: ${minId}-${maxId}`);
        assert(minId >= 72, 'Province medal IDs should start at 72 or higher');
    });

    console.log('\nTest Group 3: Province Data Files Match Medals\n');

    await test('All medal countries have province data files', async () => {
        const provinceMedals = medalsData.filter((m: any) => m.type === 'provinces');

        const countries = new Set<string>();
        for (const medal of provinceMedals) {
            if (medal.countryISO2) {
                countries.add(medal.countryISO2);
            }
        }

        for (const country of countries) {
            const provincePath = `public/provinces/${country}.json`;
            assert(existsSync(provincePath), `Province data should exist: ${provincePath}`);
        }
    });

    await test('All medal countries have province segment files', async () => {
        const provinceMedals = medalsData.filter((m: any) => m.type === 'provinces');

        const countries = new Set<string>();
        for (const medal of provinceMedals) {
            if (medal.countryISO2) {
                countries.add(medal.countryISO2);
            }
        }

        for (const country of countries) {
            const segmentPath = `public/province-segments/${country}.json`;
            assert(existsSync(segmentPath), `Province segments should exist: ${segmentPath}`);
        }
    });

    console.log('\nTest Group 4: Province ID Validity\n');

    await test('Province IDs in medals match province data', async () => {
        // Test a few samples to verify ID matching
        const sampleCountries = ['US', 'GB', 'CN'];

        for (const country of sampleCountries) {
            const provincePath = `public/provinces/${country}.json`;
            if (!existsSync(provincePath)) continue;

            const provinceFileData = JSON.parse(await readFile(provincePath, 'utf-8'));
            const provinceData = provinceFileData.provinces || provinceFileData;
            const provinceCount = Array.isArray(provinceData) ? provinceData.length : 0;

            // Find medals for this country
            const countryMedals = medalsData.filter((m: any) =>
                m.type === 'provinces' && m.countryISO2 === country
            );

            if (countryMedals.length === 0) continue;

            // Check that all province IDs in medals are valid
            for (const medal of countryMedals) {
                for (const questionId of medal.questionIds) {
                    assert(
                        questionId >= 0 && questionId < provinceCount,
                        `${country} medal has invalid province ID ${questionId} (max: ${provinceCount - 1})`
                    );
                }
            }
        }
    });

    console.log('\nTest Group 5: Medal Menu Integration\n');

    await test('Medal menu is embedded in medals.json', async () => {
        assert(menuData !== undefined, 'Menu data should be loaded from medals.json');
        assert(Array.isArray(menuData), 'Menu should be an array');
    });

    await test('Medal menu structure is valid and includes province medals', async () => {
        let foundMedalEntries = false;
        let foundProvinceMedals = false;

        function searchMenu(items: any[]): void {
            for (const item of items) {
                if (item.medalId !== undefined) {
                    foundMedalEntries = true;
                    // Check if this is a province medal
                    const medal = medalsData.find((m: any) => m.id === item.medalId);
                    if (medal && medal.type === 'provinces') {
                        foundProvinceMedals = true;
                    }
                }
                if (item.children) {
                    searchMenu(item.children);
                }
            }
        }

        searchMenu(menuData);
        assert(foundMedalEntries, 'Medal menu should have at least one medal entry');
        assert(foundProvinceMedals, 'Medal menu should include province medals');
        console.log('    Province medals are properly integrated in menu!');
    });

    console.log('\nTest Group 6: Quiz Type Definition\n');

    await test('Province question type is defined in quiz-types.ts', async () => {
        const { readFile } = await import('fs/promises');
        const source = await readFile('src/shared/quiz/quiz-types.ts', 'utf-8');

        assert(source.includes('provinceId'), 'Should have provinceId field in question type');
        assert(source.includes('countryISO2'), 'Should have countryISO2 field for province questions');
        assert(source.includes("answer: 'province'") || source.includes('answer: "province"'),
            'Should have province answer type');
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
