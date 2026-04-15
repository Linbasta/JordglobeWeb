#!/usr/bin/env -S npx tsx
/**
 * Add province medals to the menu structure in medals.json
 *
 * Creates country-level submenus and adds province medals under each country.
 * Follows the structure from legacy medal_definitions.json
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

// Country to continent mapping
const COUNTRY_TO_CONTINENT: Record<string, string> = {
    'US': 'NORTH AMERICA',
    'CA': 'NORTH AMERICA',
    'MX': 'NORTH AMERICA',
    'BR': 'SOUTH AMERICA',
    'GB': 'EUROPE',
    'FR': 'EUROPE',
    'DE': 'EUROPE',
    'ES': 'EUROPE',
    'IT': 'EUROPE',
    'PL': 'EUROPE',
    'SE': 'EUROPE',
    'CN': 'ASIA',
    'IN': 'ASIA'
};

// Country display names (for submenu headers)
const COUNTRY_MENU_NAMES: Record<string, string> = {
    'US': 'USA',
    'CA': 'CANADA',
    'MX': 'MEXICO',
    'BR': 'BRAZIL',
    'GB': 'UNITED KINGDOM',
    'FR': 'FRANCE',
    'DE': 'GERMANY',
    'ES': 'SPAIN',
    'IT': 'ITALY',
    'PL': 'POLAND',
    'SE': 'SWEDEN',
    'CN': 'CHINA',
    'IN': 'INDIA'
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
console.log(`Countries with province medals: ${provinceMedalsByCountry.size}\n`);

// Find or create continent menu
function findOrCreateContinent(continentName: string): MenuItem {
    let continent = medalsData.menu.find(m => m.name === continentName);
    if (!continent) {
        continent = {
            name: continentName,
            children: []
        };
        medalsData.menu.push(continent);
    }
    if (!continent.children) {
        continent.children = [];
    }
    return continent;
}

// Add province medals for each country
let addedCount = 0;
for (const [countryISO2, medals] of Array.from(provinceMedalsByCountry.entries()).sort()) {
    const continentName = COUNTRY_TO_CONTINENT[countryISO2];
    const countryMenuName = COUNTRY_MENU_NAMES[countryISO2];

    if (!continentName || !countryMenuName) {
        console.log(`  ⚠ No mapping for ${countryISO2}`);
        continue;
    }

    // Find or create continent
    const continent = findOrCreateContinent(continentName);

    // Find or create country submenu
    let countryMenu = continent.children!.find(c => c.name === countryMenuName);
    if (!countryMenu) {
        countryMenu = {
            name: countryMenuName,
            children: []
        };
        continent.children!.push(countryMenu);
    }
    if (!countryMenu.children) {
        countryMenu.children = [];
    }

    // Add province medals
    for (const medal of medals) {
        // Don't duplicate
        if (!countryMenu.children.find(c => c.medalId === medal.id)) {
            countryMenu.children.push({
                name: medal.name,
                medalId: medal.id
            });
        }
    }

    console.log(`  ✓ ${countryISO2}: Added ${medals.length} medals to ${continentName} > ${countryMenuName}`);
    addedCount += medals.length;
}

// Write updated menu
fs.writeFileSync(medalsPath, JSON.stringify(medalsData, null, 2));

console.log(`\n✅ Added ${addedCount} province medals to menu`);
console.log(`✓ Done`);
