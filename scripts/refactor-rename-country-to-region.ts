#!/usr/bin/env tsx
/**
 * Automated refactor: CountryData → RegionData
 *
 * Uses ts-morph to perform type-safe renaming across the entire codebase.
 */

import { Project } from 'ts-morph';

async function main() {
    console.log('Starting automated refactor: CountryData → RegionData\n');

    const project = new Project({
        tsConfigFilePath: './tsconfig.json',
    });

    // Get the types file where interfaces are defined
    const typesFile = project.getSourceFile('src/earth-globe/types.ts');
    if (!typesFile) {
        console.error('Error: Could not find src/earth-globe/types.ts');
        process.exit(1);
    }

    console.log('Step 1: Renaming CountryData interface → RegionData');
    const countryDataInterface = typesFile.getInterface('CountryData');
    if (countryDataInterface) {
        countryDataInterface.rename('RegionData_OLD');  // Temporary name to avoid conflicts
        console.log('  ✓ Renamed CountryData → RegionData_OLD (temporary)');
    } else {
        console.log('  ⚠ CountryData interface not found (may already be renamed)');
    }

    console.log('\nStep 2: Renaming CountryPolygon interface → RegionPolygon');
    const countryPolygonInterface = typesFile.getInterface('CountryPolygon');
    if (countryPolygonInterface) {
        countryPolygonInterface.rename('RegionPolygon_OLD');  // Temporary name
        console.log('  ✓ Renamed CountryPolygon → RegionPolygon_OLD (temporary)');

        // Also need to rename the 'countryIndex' property to 'regionIndex'
        const countryIndexProp = countryPolygonInterface.getProperty('countryIndex');
        if (countryIndexProp) {
            countryIndexProp.rename('regionIndex');
            console.log('  ✓ Renamed property countryIndex → regionIndex');
        }
    } else {
        console.log('  ⚠ CountryPolygon interface not found (may already be renamed)');
    }

    console.log('\nStep 3: Saving intermediate state...');
    await project.save();

    console.log('\nStep 4: Removing _OLD suffix (final rename)');
    // Now rename from temporary names to final names
    const regionDataOld = typesFile.getInterface('RegionData_OLD');
    if (regionDataOld) {
        regionDataOld.rename('RegionData');
        console.log('  ✓ RegionData_OLD → RegionData');
    }

    const regionPolygonOld = typesFile.getInterface('RegionPolygon_OLD');
    if (regionPolygonOld) {
        regionPolygonOld.rename('RegionPolygon');
        console.log('  ✓ RegionPolygon_OLD → RegionPolygon');
    }

    console.log('\nStep 5: Saving final changes across all files...');
    await project.save();

    console.log('\n✅ Refactor complete!');
    console.log('\nUpdated files:');
    const changedFiles = project.getSourceFiles().filter(sf => {
        const text = sf.getFullText();
        return text.includes('RegionData') || text.includes('RegionPolygon') || text.includes('regionIndex');
    });
    changedFiles.forEach(sf => {
        console.log(`  - ${sf.getFilePath()}`);
    });

    console.log('\n📋 Next steps:');
    console.log('  1. Test the quizzes:');
    console.log('     - http://localhost:4817/us-states-quiz.html');
    console.log('     - http://localhost:4817/country-quiz.html');
    console.log('  2. Check for any compilation errors');
    console.log('  3. Verify animations work correctly');
}

main().catch(error => {
    console.error('Error during refactor:', error);
    process.exit(1);
});
