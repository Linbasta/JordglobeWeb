#!/usr/bin/env node
/**
 * Extract US provinces from locations_en.json
 *
 * Converts UUID-based province data to integer IDs for smaller file size.
 * Output: public/provinces/US.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface LocationEntry {
    id: string;
    nameEn: string;
    countryIso2s: string[];
    locationType: string;
    paths: string;
    lat: number;
    lon: number;
}

interface ProvinceJSON {
    id: number;
    name: string;
    paths: string;
}

interface ProvinceFileJSON {
    country: string;
    provinces: ProvinceJSON[];
}

const INPUT_PATH = path.join(__dirname, '..', 'data', 'legacy', 'locations_en.json');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'provinces');
const OUTPUT_PATH = path.join(OUTPUT_DIR, 'US.json');

console.log('=== Extracting US Provinces ===\n');

// Read input
console.log('Reading:', INPUT_PATH);
const locationsData: LocationEntry[] = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf-8'));

// Filter US provinces
const usProvinces = locationsData.filter(
    loc => loc.locationType === 'Province' && loc.countryIso2s[0] === 'US'
);

console.log(`Found ${usProvinces.length} US provinces`);

// Sort alphabetically for consistency
usProvinces.sort((a, b) => a.nameEn.localeCompare(b.nameEn));

// Convert to output format with integer IDs
const provinces: ProvinceJSON[] = usProvinces.map((province, index) => ({
    id: index,
    name: province.nameEn,
    paths: province.paths
}));

const output: ProvinceFileJSON = {
    country: 'US',
    provinces
};

// Write output
fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

console.log('\nOutput written to:', OUTPUT_PATH);
console.log(`\nSummary:`);
console.log(`  - Provinces: ${provinces.length}`);
console.log(`  - File size: ${(fs.statSync(OUTPUT_PATH).size / 1024).toFixed(2)} KB`);

// Print sample
console.log('\nSample provinces:');
provinces.slice(0, 3).forEach(p => {
    const pathsPreview = p.paths.substring(0, 50) + '...';
    console.log(`  ${p.id}: ${p.name} (${pathsPreview})`);
});

console.log('\n✓ Done');
