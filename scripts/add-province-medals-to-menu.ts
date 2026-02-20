#!/usr/bin/env -S npx tsx
/**
 * Add province medals to the menu structure in medals.json
 *
 * For each country with province medals, adds them as a submenu
 * under the country's existing entry in the menu tree.
 */

import * as fs from 'fs';

interface MenuItem {
    name: string;
    medalId?: number;
    children?: MenuItem[];
}

interface Medal {
    id: number;
    name: string;
    type: string;
    countryISO2?: string;
    questionIds: (string | number)[];
}

interface MedalsFile {
    medals: Medal[];
    menu: MenuItem[];
}

// Country name mapping
const COUNTRY_NAMES: Record<string, string> = {
    'US': 'United States of America',
    'CN': 'China',
    'IN': 'India',
    'GB': 'United Kingdom',
    'DE': 'Germany',
    'FR': 'France',
    'ES': 'Spain',
    'IT': 'Italy',
    'BR': 'Brazil',
    'MX': 'Mexico',
    'CA': 'Canada',
    'PL': 'Poland',
    'SE': 'Sweden'
};

// Read medals file
const medalsPath = 'public/medals.json';
const medalsData: MedalsFile = JSON.parse(fs.readFileSync(medalsPath, 'utf-8'));

// Group province medals by country
const provinceMedalsByCountry = new Map<string, Medal[]>();
for (const medal of medalsData.medals) {
    if (medal.type === 'provinces' && medal.countryISO2) {
        if (!provinceMedalsByCountry.has(medal.countryISO2)) {
            provinceMedalsByCountry.set(medal.countryISO2, []);
        }
        provinceMedalsByCountry.get(medal.countryISO2)!.push(medal);
    }
}

console.log(`=== Adding Province Medals to Menu ===\n`);
console.log(`Countries with province medals: ${provinceMedalsByCountry.size}`);

// Recursively search and add province medals to menu
function addProvinceMedalsToMenu(menuItem: MenuItem, countryISO2: string, countryName: string, medals: Medal[]): boolean {
    // Check if this is the country node
    if (menuItem.name === countryName || menuItem.name.includes(countryName)) {
        // Add submenu if it doesn't exist
        if (!menuItem.children) {
            menuItem.children = [];
        }

        // Add province medals as children
        for (const medal of medals) {
            // Don't duplicate
            if (!menuItem.children.find(c => c.medalId === medal.id)) {
                menuItem.children.push({
                    name: medal.name,
                    medalId: medal.id
                });
            }
        }

        console.log(`  ✓ Added ${medals.length} medals to "${countryName}"`);
        return true;
    }

    // Recursively search children
    if (menuItem.children) {
        for (const child of menuItem.children) {
            if (addProvinceMedalsToMenu(child, countryISO2, countryName, medals)) {
                return true;
            }
        }
    }

    return false;
}

// Add province medals for each country
let addedCount = 0;
for (const [countryISO2, medals] of provinceMedalsByCountry.entries()) {
    const countryName = COUNTRY_NAMES[countryISO2];
    if (!countryName) {
        console.log(`  ⚠ No country name mapping for ${countryISO2}`);
        continue;
    }

    let found = false;
    for (const topLevel of medalsData.menu) {
        if (addProvinceMedalsToMenu(topLevel, countryISO2, countryName, medals)) {
            found = true;
            addedCount += medals.length;
            break;
        }
    }

    if (!found) {
        console.log(`  ✗ Could not find menu entry for "${countryName}" (${countryISO2})`);
    }
}

// Write updated menu
fs.writeFileSync(medalsPath, JSON.stringify(medalsData, null, 2));

console.log(`\n✅ Added ${addedCount} province medals to menu`);
console.log(`✓ Done`);
