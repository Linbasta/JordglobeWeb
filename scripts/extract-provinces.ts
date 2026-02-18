#!/usr/bin/env node
/**
 * Extract provinces for a given country from locations_en.json
 *
 * Usage: tsx scripts/extract-provinces.ts --country=US
 *
 * Converts UUID-based province data to integer IDs for smaller file size.
 * Output: public/provinces/{ISO2}-raw.json
 *
 * Generic replacement for extract-us-provinces.ts
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

// Parse --country=XX argument
const countryArg = process.argv.find(a => a.startsWith('--country='));
if (!countryArg) {
    console.error('Usage: tsx scripts/extract-provinces.ts --country=XX');
    console.error('Example: tsx scripts/extract-provinces.ts --country=US');
    process.exit(1);
}
const COUNTRY = countryArg.split('=')[1].toUpperCase();

const INPUT_PATH = path.join(__dirname, '..', 'data', 'legacy', 'locations_en.json');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'provinces');
const OUTPUT_PATH = path.join(OUTPUT_DIR, `${COUNTRY}-raw.json`);

console.log(`=== Extracting ${COUNTRY} Provinces ===\n`);

// Read input
console.log('Reading:', INPUT_PATH);
const locationsData: LocationEntry[] = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf-8'));

// Filter provinces for the given country
const provinces = locationsData.filter(
    loc => loc.locationType === 'Province' && loc.countryIso2s[0] === COUNTRY
);

if (provinces.length === 0) {
    console.error(`No provinces found for country "${COUNTRY}". Check the ISO2 code.`);
    process.exit(1);
}

console.log(`Found ${provinces.length} provinces for ${COUNTRY}`);

// Sort alphabetically for consistency
provinces.sort((a, b) => a.nameEn.localeCompare(b.nameEn));

// Convert to output format with sequential integer IDs
const output: ProvinceFileJSON = {
    country: COUNTRY,
    provinces: provinces.map((province, index) => ({
        id: index,
        name: province.nameEn,
        paths: province.paths,
    })),
};

// Write output
fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

console.log('\nOutput written to:', OUTPUT_PATH);
console.log(`\nSummary:`);
console.log(`  Provinces : ${output.provinces.length}`);
console.log(`  File size : ${(fs.statSync(OUTPUT_PATH).size / 1024).toFixed(2)} KB`);

console.log('\nSample provinces:');
output.provinces.slice(0, 3).forEach(p => {
    const preview = p.paths.substring(0, 50) + '…';
    console.log(`  ${p.id}: ${p.name} (${preview})`);
});

console.log('\n✓ Done — run enrich-provinces to add holes/lakes');
