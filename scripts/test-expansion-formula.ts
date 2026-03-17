#!/usr/bin/env node
/**
 * Test script for surface area calculation and expansion formula
 *
 * This script loads a few countries, calculates their surface areas,
 * and prints the expansion factors with different tuning parameters.
 */

import { calculateExpansionFactor, getDefaultTuning } from '../src/earth-globe/expansion-formula';

// Test countries (from smallest to largest)
const testCountries = [
    { name: 'Monaco', iso2: 'MC', expectedArea: 0.002, expectedExpansion: '1000x-5000x' },
    { name: 'Vatican City', iso2: 'VA', expectedArea: 0.002, expectedExpansion: '1000x-5000x' },
    { name: 'San Marino', iso2: 'SM', expectedArea: 0.003, expectedExpansion: '1000x-5000x' },
    { name: 'Luxembourg', iso2: 'LU', expectedArea: 0.02, expectedExpansion: '100x-500x' },
    { name: 'Malta', iso2: 'MT', expectedArea: 0.005, expectedExpansion: '500x-1000x' },
];

console.log('=== Expansion Formula Test ===\n');

// Test with default tuning
console.log('Default Tuning:');
const defaultTuning = getDefaultTuning();
console.log(`  scaledConstant: ${defaultTuning.scaledConstant}`);
console.log(`  exponent: ${defaultTuning.exponent}\n`);

console.log('Expected Expansion Factors (based on approximate areas):\n');

for (const country of testCountries) {
    const expansion = calculateExpansionFactor(country.expectedArea, defaultTuning);
    console.log(`${country.name} (${country.iso2}):`);
    console.log(`  Expected area: ~${country.expectedArea} world units²`);
    console.log(`  Expected expansion: ${country.expectedExpansion}`);
    console.log(`  Calculated expansion: ${expansion.toFixed(1)}x`);
    console.log();
}

// Test with different tuning parameters
console.log('=== Testing Different Tuning Parameters ===\n');

const testTunings = [
    { scaledConstant: 50.0, exponent: 0.3, name: 'Lower constant (less expansion)' },
    { scaledConstant: 100.0, exponent: 0.3, name: 'Higher constant (more expansion)' },
    { scaledConstant: 70.0, exponent: 0.2, name: 'Lower exponent (less size sensitivity)' },
    { scaledConstant: 70.0, exponent: 0.4, name: 'Higher exponent (more size sensitivity)' },
];

const testArea = 0.002; // Monaco-sized country

for (const tuning of testTunings) {
    const expansion = calculateExpansionFactor(testArea, tuning);
    console.log(`${tuning.name}:`);
    console.log(`  scaledConstant=${tuning.scaledConstant}, exponent=${tuning.exponent}`);
    console.log(`  Monaco (0.002 area) → ${expansion.toFixed(1)}x`);
    console.log();
}

// Test edge cases
console.log('=== Edge Cases ===\n');

console.log('Zero area → should return 1.0x (no expansion):');
console.log(`  Result: ${calculateExpansionFactor(0, defaultTuning).toFixed(1)}x\n`);

console.log('Negative area → should return 1.0x (no expansion):');
console.log(`  Result: ${calculateExpansionFactor(-1, defaultTuning).toFixed(1)}x\n`);

console.log('Very large area (normal country) → should return 1.0x (no expansion):');
const largeArea = 10.0; // Large country
const largeExpansion = calculateExpansionFactor(largeArea, defaultTuning);
console.log(`  Area: ${largeArea}, Result: ${largeExpansion.toFixed(1)}x\n`);

console.log('=== Test Complete ===');
console.log('\nNote: Actual surface areas will be calculated from mesh data');
console.log('      when the globe loads. These are approximate values.');
console.log('\nTo tune in browser:');
console.log('  window.EXPANSION_TUNING.scaledConstant = 100');
console.log('  window.EXPANSION_TUNING.exponent = 0.4');
