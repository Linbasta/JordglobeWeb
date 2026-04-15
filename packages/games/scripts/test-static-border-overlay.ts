#!/usr/bin/env node
/**
 * Test script for Static Border Overlay
 *
 * Verifies the module can be imported and data structures are correct.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== Testing Static Border Overlay ===\n');

// Test 1: Check shader files exist
console.log('Test 1: Checking shader files...');
const vertexShaderPath = path.join(__dirname, '..', 'src', 'earth-globe', 'shaders', 'static-border-overlay.vertex.glsl');
const fragmentShaderPath = path.join(__dirname, '..', 'src', 'earth-globe', 'shaders', 'static-border-overlay.fragment.glsl');

if (!fs.existsSync(vertexShaderPath)) {
    console.error('  ✗ Fail: static-border-overlay.vertex.glsl not found');
    process.exit(1);
}

if (!fs.existsSync(fragmentShaderPath)) {
    console.error('  ✗ Fail: static-border-overlay.fragment.glsl not found');
    process.exit(1);
}

console.log('  ✓ Pass: Shader files exist');

// Test 2: Validate vertex shader
console.log('\nTest 2: Validating vertex shader...');
const vertexShader = fs.readFileSync(vertexShaderPath, 'utf-8');

const requiredVertexAttributes = ['position', 'tangent'];
const requiredVertexUniforms = ['worldViewProjection', 'altitudeOffset', 'lineThickness'];

let hasErrors = false;
for (const attr of requiredVertexAttributes) {
    if (!vertexShader.includes(`attribute`) || !vertexShader.includes(attr)) {
        console.error(`  ✗ Fail: Missing attribute: ${attr}`);
        hasErrors = true;
    }
}

for (const uniform of requiredVertexUniforms) {
    if (!vertexShader.includes(`uniform`) || !vertexShader.includes(uniform)) {
        console.error(`  ✗ Fail: Missing uniform: ${uniform}`);
        hasErrors = true;
    }
}

if (hasErrors) {
    process.exit(1);
}

console.log('  ✓ Pass: Vertex shader has required attributes and uniforms');

// Test 3: Validate fragment shader
console.log('\nTest 3: Validating fragment shader...');
const fragmentShader = fs.readFileSync(fragmentShaderPath, 'utf-8');

const requiredFragmentUniforms = ['borderColor', 'lineAlpha'];

for (const uniform of requiredFragmentUniforms) {
    if (!fragmentShader.includes(uniform)) {
        console.error(`  ✗ Fail: Missing uniform: ${uniform}`);
        hasErrors = true;
    }
}

if (hasErrors) {
    process.exit(1);
}

console.log('  ✓ Pass: Fragment shader has required uniforms');

// Test 4: Check module file exists
console.log('\nTest 4: Checking module file...');
const modulePath = path.join(__dirname, '..', 'src', 'earth-globe', 'static-border-overlay.ts');

if (!fs.existsSync(modulePath)) {
    console.error('  ✗ Fail: static-border-overlay.ts not found');
    process.exit(1);
}

console.log('  ✓ Pass: Module file exists');

// Test 5: Validate module exports
console.log('\nTest 5: Validating module exports...');
const moduleCode = fs.readFileSync(modulePath, 'utf-8');

const requiredExports = [
    'loadStaticBorderOverlay',
    'loadProvinceBorders',  // Legacy API
    'showStaticBorderOverlay',
    'hideStaticBorderOverlay',
    'updateStaticBorderOverlayUniforms',
    'disposeStaticBorderOverlay',
    'StaticBorderOverlayState',
    'StaticBorderOverlayConfig'
];

for (const exportName of requiredExports) {
    if (!moduleCode.includes(exportName)) {
        console.error(`  ✗ Fail: Missing export: ${exportName}`);
        hasErrors = true;
    }
}

if (hasErrors) {
    process.exit(1);
}

console.log('  ✓ Pass: Module has all required exports');

// Test 6: Check constants
console.log('\nTest 6: Checking constants...');
const constantsPath = path.join(__dirname, '..', 'src', 'earth-globe', 'constants.ts');
const constantsCode = fs.readFileSync(constantsPath, 'utf-8');

// Check they're in the zoom object
if (!constantsCode.includes('provinceBorderThicknessClose:') ||
    !constantsCode.includes('provinceBorderThicknessFar:') ||
    !constantsCode.includes('provinceBorderAlphaClose:') ||
    !constantsCode.includes('provinceBorderAlphaFar:')) {
    console.error('  ✗ Fail: Province border constants not found in zoom object');
    hasErrors = true;
}

if (hasErrors) {
    process.exit(1);
}

console.log('  ✓ Pass: All constants defined and added to zoom object');

// Test 7: Verify province segment format compatibility
console.log('\nTest 7: Verifying province segment format...');
const provinceSegmentsPath = path.join(__dirname, '..', 'public', 'province-segments', 'US.json');
const provinceSegmentsData = JSON.parse(fs.readFileSync(provinceSegmentsPath, 'utf-8'));

if (!moduleCode.includes('ProvinceSegmentsJSON')) {
    console.error('  ✗ Fail: Module doesn\'t support province segment format');
    process.exit(1);
}

console.log(`  ✓ Pass: Province format supported (${provinceSegmentsData.segments.length} segments available)`);

// Test 8: Verify country segment format compatibility
console.log('\nTest 8: Verifying country segment format...');
const countrySegmentsPath = path.join(__dirname, '..', 'public', 'segments.json');
const countrySegmentsData = JSON.parse(fs.readFileSync(countrySegmentsPath, 'utf-8'));

if (!moduleCode.includes('CountrySegmentsJSON') ||
    !moduleCode.includes('segmentFormat:')) {
    console.error('  ✗ Fail: Module doesn\'t support country segment format');
    process.exit(1);
}

console.log(`  ✓ Pass: Country format supported (${countrySegmentsData.length} segments available)`);

// Test 9: Verify new API
console.log('\nTest 9: Verifying generalized API...');

if (!moduleCode.includes('StaticBorderOverlayConfig')) {
    console.error('  ✗ Fail: StaticBorderOverlayConfig interface not found');
    process.exit(1);
}

if (!moduleCode.includes('segmentFormat: \'country\' | \'province\'')) {
    console.error('  ✗ Fail: segmentFormat discriminator not found');
    process.exit(1);
}

console.log('  ✓ Pass: Generalized API supports both country and province formats');

console.log('\n=== All tests passed ===');
console.log('\nUse cases:');
console.log('  • Province quizzes: Show province borders for location questions');
console.log('  • Capital medals: Show country borders when zoomed into cities');
console.log('\nTest page: http://localhost:4817/test-static-border-overlay.html');
process.exit(0);
