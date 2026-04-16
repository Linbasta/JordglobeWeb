#!/usr/bin/env tsx
/**
 * Automated refactor: iso2 → id
 *
 * Renames the 'iso2' property to 'id' in RegionData and RegionPolygon interfaces.
 * This makes the field name more accurate - it's a generic region identifier,
 * not always an ISO2 code (provinces use composite IDs like "US-0").
 */

import { Project } from 'ts-morph';

async function main() {
    console.log('Starting automated refactor: iso2 → id\n');

    const project = new Project({
        tsConfigFilePath: './tsconfig.json',
    });

    // Get the types file where interfaces are defined
    const typesFile = project.getSourceFile('src/earth-globe/types.ts');
    if (!typesFile) {
        console.error('Error: Could not find src/earth-globe/types.ts');
        process.exit(1);
    }

    console.log('Step 1: Renaming iso2 property → id in RegionData');
    const regionDataInterface = typesFile.getInterface('RegionData');
    if (regionDataInterface) {
        const iso2Prop = regionDataInterface.getProperty('iso2');
        if (iso2Prop) {
            iso2Prop.rename('id');
            console.log('  ✓ Renamed RegionData.iso2 → id');
        } else {
            console.log('  ⚠ RegionData.iso2 property not found (may already be renamed)');
        }
    } else {
        console.log('  ⚠ RegionData interface not found');
    }

    console.log('\nStep 2: Renaming iso2 property → id in RegionPolygon');
    const regionPolygonInterfaces = typesFile.getInterfaces().filter(i => i.getName() === 'RegionPolygon');

    if (regionPolygonInterfaces.length === 0) {
        console.log('  ⚠ No RegionPolygon interfaces found');
    } else {
        console.log(`  Found ${regionPolygonInterfaces.length} RegionPolygon definition(s)`);

        for (let i = 0; i < regionPolygonInterfaces.length; i++) {
            const iface = regionPolygonInterfaces[i];
            const iso2Prop = iface.getProperty('iso2');
            if (iso2Prop) {
                iso2Prop.rename('id');
                console.log(`  ✓ Renamed RegionPolygon[${i}].iso2 → id`);
            } else {
                console.log(`  ⚠ RegionPolygon[${i}] has no iso2 property`);
            }
        }
    }

    console.log('\nStep 3: Saving changes across all files...');
    await project.save();

    console.log('\n✅ Refactor complete!');
    console.log('\nUpdated files:');
    const changedFiles = project.getSourceFiles().filter(sf => {
        const text = sf.getFullText();
        return text.includes('.id') || text.includes('id:') || text.includes('id =') || text.includes('id?');
    });

    // Show just the count and a few examples
    console.log(`  ${changedFiles.length} files updated`);
    changedFiles.slice(0, 10).forEach(sf => {
        const relativePath = sf.getFilePath().replace(/^.*\/games\//, '');
        console.log(`  - ${relativePath}`);
    });
    if (changedFiles.length > 10) {
        console.log(`  ... and ${changedFiles.length - 10} more`);
    }

    console.log('\n📋 Next steps:');
    console.log('  1. Fix duplicate RegionPolygon definition in types.ts (if any)');
    console.log('  2. Test the quizzes:');
    console.log('     - http://localhost:4817/us-states-quiz.html');
    console.log('     - http://localhost:4817/country-quiz.html');
    console.log('  3. Check for any compilation errors');
    console.log('  4. Verify all lookups work correctly');
}

main().catch(error => {
    console.error('Error during refactor:', error);
    process.exit(1);
});
