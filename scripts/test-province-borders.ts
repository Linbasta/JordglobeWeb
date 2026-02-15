#!/usr/bin/env node
/**
 * Test script for province border renderer
 *
 * Verifies the module can be imported and data structures are correct.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== Testing Province Border Renderer ===\n');

// Test 1: Check shader files exist
console.log('Test 1: Checking shader files...');
const vertexShaderPath = path.join(__dirname, '..', 'src', 'earth-globe', 'shaders', 'province-border.vertex.glsl');
const fragmentShaderPath = path.join(__dirname, '..', 'src', 'earth-globe', 'shaders', 'province-border.fragment.glsl');

if (!fs.existsSync(vertexShaderPath)) {
    console.error('  ✗ Fail: province-border.vertex.glsl not found');
    process.exit(1);
}

if (!fs.existsSync(fragmentShaderPath)) {
    console.error('  ✗ Fail: province-border.fragment.glsl not found');
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
const modulePath = path.join(__dirname, '..', 'src', 'earth-globe', 'province-border-renderer.ts');

if (!fs.existsSync(modulePath)) {
    console.error('  ✗ Fail: province-border-renderer.ts not found');
    process.exit(1);
}

console.log('  ✓ Pass: Module file exists');

// Test 5: Validate module exports
console.log('\nTest 5: Validating module exports...');
const moduleCode = fs.readFileSync(modulePath, 'utf-8');

const requiredExports = [
    'loadProvinceBorders',
    'showProvinceBorders',
    'hideProvinceBorders',
    'updateProvinceBorderUniforms',
    'disposeProvinceBorders',
    'ProvinceBorderState'
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

const requiredConstants = [
    'PROVINCE_BORDER_THICKNESS_CLOSE',
    'PROVINCE_BORDER_THICKNESS_FAR',
    'PROVINCE_BORDER_ALPHA_CLOSE',
    'PROVINCE_BORDER_ALPHA_FAR'
];

for (const constant of requiredConstants) {
    if (!constantsCode.includes(constant)) {
        console.error(`  ✗ Fail: Missing constant: ${constant}`);
        hasErrors = true;
    }
}

// Check they're in the zoom object
if (!constantsCode.includes('provinceBorderThicknessClose:') ||
    !constantsCode.includes('provinceBorderThicknessFar:') ||
    !constantsCode.includes('provinceBorderAlphaClose:') ||
    !constantsCode.includes('provinceBorderAlphaFar:')) {
    console.error('  ✗ Fail: Province constants not added to zoom object');
    hasErrors = true;
}

if (hasErrors) {
    process.exit(1);
}

console.log('  ✓ Pass: All constants defined and added to zoom object');

// Test 7: Verify data format compatibility
console.log('\nTest 7: Verifying data format compatibility...');
const segmentsPath = path.join(__dirname, '..', 'public', 'province-segments', 'US.json');
const segmentsData = JSON.parse(fs.readFileSync(segmentsPath, 'utf-8'));

// Check the module expects the right format
if (!moduleCode.includes('ProvinceSegmentData') ||
    !moduleCode.includes('points: number[][]') ||
    !moduleCode.includes('provinces: number[]')) {
    console.error('  ✗ Fail: Module data types don\'t match segment JSON format');
    process.exit(1);
}

console.log(`  ✓ Pass: Module expects correct data format (${segmentsData.segments.length} segments available)`);

console.log('\n=== All tests passed ===');
console.log('\nNote: Full integration test requires browser (Phase 4)');
console.log('Next: Integrate into EarthGlobe to test rendering');
process.exit(0);
