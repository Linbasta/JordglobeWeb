#!/usr/bin/env node
/**
 * Generate public/provinces/index.json
 *
 * Scans public/provinces/ for all enriched province files (*.json, excluding *-raw.json
 * and index.json itself), extracts the ISO2 country code from each filename,
 * and writes the sorted list to public/provinces/index.json.
 *
 * Run this after adding any new country's province data.
 * Usage: tsx scripts/generate-province-index.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROVINCES_DIR = path.join(__dirname, '..', 'public', 'provinces');
const OUTPUT_PATH = path.join(PROVINCES_DIR, 'index.json');

console.log('=== Generating Province Index ===\n');
console.log('Scanning:', PROVINCES_DIR);

if (!fs.existsSync(PROVINCES_DIR)) {
    console.error('Directory not found:', PROVINCES_DIR);
    process.exit(1);
}

const files = fs.readdirSync(PROVINCES_DIR);
const iso2Codes: string[] = [];

for (const file of files) {
    // Skip: index.json, *-raw.json, non-.json files
    if (!file.endsWith('.json')) continue;
    if (file === 'index.json') continue;
    if (file.endsWith('-raw.json')) continue;

    const iso2 = file.replace('.json', '').toUpperCase();
    iso2Codes.push(iso2);
    console.log(`  Found: ${iso2} (${file})`);
}

iso2Codes.sort();

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(iso2Codes, null, 2));

console.log(`\nWrote ${iso2Codes.length} entr${iso2Codes.length === 1 ? 'y' : 'ies'} to: ${OUTPUT_PATH}`);
console.log('Contents:', iso2Codes);
console.log('\n✓ Done');
