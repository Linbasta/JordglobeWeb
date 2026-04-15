#!/usr/bin/env -S npx tsx
/**
 * Convert Province Medals from Legacy Format
 *
 * Reads legacy medal_definitions.json and locations_en.json,
 * maps province GUIDs to numeric IDs, and outputs province medals
 * in the new format compatible with our quiz system.
 */

import * as fs from 'fs';
import * as path from 'path';

// Types
interface LegacyMedal {
    QuestionPackId: string;
    Name: string;
    BossType: string;
    IsOneOff: boolean;
    ShowProvinces: boolean;
    RegionTooltip: boolean;
    CustomZoomMin: number;
    EnabledCountryIso2s: string[] | null;
    QuestionIds: string[];
    FrameRegionIds: string[] | null;
}

interface LegacyLocation {
    id: string;
    nameEn: string;
    locationType: string;
    countryIso2s: string[];
    paths: string;
}

interface Province {
    id: number;
    name: string;
    paths: string;
}

interface ProvinceFile {
    country: string;
    provinces: Province[];
}

interface NewMedal {
    id: number;
    name: string;
    type: string;
    countryISO2: string;
    questionIds: number[];
}

// Load data files
function loadJSON<T>(filePath: string): T {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
}

// Build mapping: GUID → { countryISO2, numericID, name }
function buildProvinceMapping(): Map<string, { countryISO2: string; numericID: number; name: string }> {
    const mapping = new Map();

    // Load legacy locations (array indexed by number)
    const legacyLocations: LegacyLocation[] = loadJSON('data/legacy/locations_en.json');

    // Get all countries with province files
    const provinceDir = 'public/provinces';
    const provinceFiles = fs.readdirSync(provinceDir)
        .filter(f => f.endsWith('.json'))
        .filter(f => !f.endsWith('-raw.json')) // Skip raw data files
        .filter(f => f !== 'index.json');      // Skip index file

    for (const file of provinceFiles) {
        const countryISO2 = path.basename(file, '.json');
        const provinceData: ProvinceFile = loadJSON(path.join(provinceDir, file));

        // Verify it has the expected structure
        if (!provinceData.provinces || !Array.isArray(provinceData.provinces)) {
            console.log(`\n=== Skipping ${countryISO2} (invalid structure) ===`);
            continue;
        }

        console.log(`\n=== Processing ${countryISO2} provinces ===`);

        // For each province in our data, find matching legacy location
        for (const province of provinceData.provinces) {
            // Find legacy location with matching name and country
            const legacyLocation = legacyLocations.find(loc =>
                loc.locationType === 'Province' &&
                loc.countryIso2s?.includes(countryISO2) &&
                loc.nameEn === province.name
            );

            if (legacyLocation) {
                mapping.set(legacyLocation.id, {
                    countryISO2,
                    numericID: province.id,
                    name: province.name
                });
                console.log(`  ✓ ${province.name} (ID ${province.id}) → ${legacyLocation.id.substring(0, 8)}...`);
            } else {
                console.log(`  ✗ ${province.name} (ID ${province.id}) - NO MATCH in legacy data`);
            }
        }
    }

    return mapping;
}

// Convert legacy province medals to new format
function convertProvinceMedals(): NewMedal[] {
    console.log('\n=== Building Province GUID Mapping ===');
    const provinceMapping = buildProvinceMapping();

    console.log(`\n=== Total mappings: ${provinceMapping.size} ===`);

    // Load legacy medals
    const legacyData = loadJSON<{ Medals: LegacyMedal[] }>('data/legacy/medal_definitions.json');
    const provinceMedals = legacyData.Medals.filter(m => m.BossType === 'Provinces');

    console.log(`\n=== Found ${provinceMedals.size} province medals ===\n`);

    const newMedals: NewMedal[] = [];
    let medalId = 1000; // Start IDs at 1000 to avoid conflicts with existing medals

    for (const legacyMedal of provinceMedals) {
        // Map QuestionIds (GUIDs) to numeric province IDs
        const questionIds: number[] = [];
        const countryISO2Set = new Set<string>();

        for (const guid of legacyMedal.QuestionIds) {
            const mapped = provinceMapping.get(guid);
            if (mapped) {
                questionIds.push(mapped.numericID);
                countryISO2Set.add(mapped.countryISO2);
            } else {
                console.warn(`  ⚠ Medal "${legacyMedal.Name}": Could not map GUID ${guid.substring(0, 8)}...`);
            }
        }

        // Determine country (should be single country per medal)
        if (countryISO2Set.size === 0) {
            console.warn(`  ✗ Skipping "${legacyMedal.Name}": No valid provinces mapped`);
            continue;
        }

        if (countryISO2Set.size > 1) {
            console.warn(`  ⚠ Medal "${legacyMedal.Name}": Multiple countries detected: ${Array.from(countryISO2Set).join(', ')}`);
        }

        const countryISO2 = Array.from(countryISO2Set)[0];

        // Create new medal
        newMedals.push({
            id: medalId++,
            name: legacyMedal.Name,
            type: 'provinces',
            countryISO2,
            questionIds: questionIds.sort((a, b) => a - b) // Sort numerically
        });

        console.log(`  ✓ ${legacyMedal.Name} (${countryISO2}): ${questionIds.length} provinces`);
    }

    console.log(`\n=== Converted ${newMedals.length} province medals ===`);

    return newMedals;
}

// Main
try {
    const provinceMedals = convertProvinceMedals();

    // Write output
    const outputPath = 'data/province-medals.json';
    fs.writeFileSync(outputPath, JSON.stringify(provinceMedals, null, 2));

    console.log(`\n✅ Province medals written to: ${outputPath}`);
    console.log(`   Total: ${provinceMedals.length} medals`);

    // Show summary by country
    const byCountry = new Map<string, number>();
    for (const medal of provinceMedals) {
        byCountry.set(medal.countryISO2, (byCountry.get(medal.countryISO2) || 0) + 1);
    }

    console.log('\n=== Summary by Country ===');
    for (const [country, count] of Array.from(byCountry.entries()).sort((a, b) => b[1] - a[1])) {
        console.log(`  ${country}: ${count} medals`);
    }

} catch (error) {
    console.error('Error:', error);
    process.exit(1);
}
