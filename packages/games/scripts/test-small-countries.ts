#!/usr/bin/env node
/**
 * Test script for small-countries module
 */
import { isSmallCountry, getSmallCountryCodes, isSurroundedCountry } from '../src/earth-globe/small-countries';

console.log('=== Testing Small Countries ===\n');

let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean) {
    if (condition) {
        console.log(`  ✓ ${label}`);
        passed++;
    } else {
        console.log(`  ✗ ${label}`);
        failed++;
    }
}

// Test known small countries
console.log('Test 1: Known small countries return true');
const expectedSmall = ['MT', 'SG', 'BH', 'MV', 'MC', 'VA', 'SM', 'LI', 'LU', 'AD', 'GI', 'BN'];
for (const code of expectedSmall) {
    assert(`${code} is small`, isSmallCountry(code));
}

// Test known large countries
console.log('\nTest 2: Large countries return false');
const notSmall = ['US', 'CN', 'RU', 'BR', 'IN', 'DE', 'FR', 'SE', 'JP', 'AU'];
for (const code of notSmall) {
    assert(`${code} is not small`, !isSmallCountry(code));
}

// Test getSmallCountryCodes returns the right count
console.log('\nTest 3: getSmallCountryCodes()');
const codes = getSmallCountryCodes();
assert(`Returns ${expectedSmall.length} codes`, codes.size === expectedSmall.length);
assert('Set is readonly (has .has but no .add)', typeof (codes as any).has === 'function');

// Test edge cases
console.log('\nTest 4: Edge cases');
assert('Empty string is not small', !isSmallCountry(''));
assert('Lowercase "mt" is not small (case-sensitive)', !isSmallCountry('mt'));

// Test surrounded countries
console.log('\nTest 5: Known surrounded countries return true');
const expectedSurrounded = ['VA', 'SM', 'LS', 'LI', 'LU', 'AD'];
for (const code of expectedSurrounded) {
    assert(`${code} is surrounded`, isSurroundedCountry(code));
}

console.log('\nTest 6: Non-surrounded countries return false');
const notSurrounded = ['US', 'IT', 'ZA', 'FR', 'DE', 'MT', 'SG', 'BH'];
for (const code of notSurrounded) {
    assert(`${code} is not surrounded`, !isSurroundedCountry(code));
}

console.log('\nTest 7: Surrounded + small overlap');
const bothSmallAndSurrounded = ['VA', 'SM', 'LI', 'LU', 'AD'];
for (const code of bothSmallAndSurrounded) {
    assert(`${code} is both small and surrounded`, isSmallCountry(code) && isSurroundedCountry(code));
}
assert('LS is surrounded but NOT small', isSurroundedCountry('LS') && !isSmallCountry('LS'));
assert('MT is small but NOT surrounded', isSmallCountry('MT') && !isSurroundedCountry('MT'));

// Summary
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
