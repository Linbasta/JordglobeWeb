#!/usr/bin/env -S npx tsx
/**
 * Integrate province medals into public/medals.json
 *
 * Reads data/province-medals.json and appends to public/medals.json
 * with renumbered IDs starting from the next available ID.
 */

import * as fs from 'fs';

interface Medal {
    id: number;
    name: string;
    type: string;
    countryISO2?: string;
    questionIds: (string | number)[];
}

interface MedalsFile {
    medals: Medal[];
}

// Read existing medals
const medalsPath = 'public/medals.json';
const medalsData: MedalsFile = JSON.parse(fs.readFileSync(medalsPath, 'utf-8'));

// Read province medals
const provinceMedalsPath = 'data/province-medals.json';
const provinceMedals: Medal[] = JSON.parse(fs.readFileSync(provinceMedalsPath, 'utf-8'));

// Find next available ID
const maxId = Math.max(...medalsData.medals.map(m => m.id));
const nextId = maxId + 1;

console.log(`=== Integrating Province Medals ===\n`);
console.log(`Existing medals: ${medalsData.medals.length} (max ID: ${maxId})`);
console.log(`Province medals: ${provinceMedals.length}`);
console.log(`Renumbering starting from ID: ${nextId}\n`);

// Renumber province medals and append
const renumberedMedals = provinceMedals.map((medal, index) => ({
    ...medal,
    id: nextId + index
}));

// Append to existing medals
medalsData.medals.push(...renumberedMedals);

// Write back
fs.writeFileSync(medalsPath, JSON.stringify(medalsData, null, 2));

console.log(`✅ Integrated ${renumberedMedals.length} province medals`);
console.log(`   Total medals now: ${medalsData.medals.length}`);
console.log(`   ID range: 0-${Math.max(...medalsData.medals.map(m => m.id))}`);
console.log(`\nProvince medals by country:`);

// Count by country
const byCountry = new Map<string, number>();
for (const medal of renumberedMedals) {
    if (medal.countryISO2) {
        byCountry.set(medal.countryISO2, (byCountry.get(medal.countryISO2) || 0) + 1);
    }
}

for (const [country, count] of Array.from(byCountry.entries()).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${country}: ${count} medals`);
}

console.log(`\n✓ Done`);
