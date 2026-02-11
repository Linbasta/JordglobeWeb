#!/usr/bin/env node
/**
 * Convert legacy medal_definitions.json + locations_en.json →
 *   public/medals.json    (medal defs + menu tree)
 *   public/locations.json  (deduplicated location data, keyed by ID)
 *
 * Filters to Countries and Locations types only.
 * Assigns sequential integer IDs to medals.
 * Both types use `questionIds` — ISO2 codes for countries, location UUIDs for locations.
 * Location data lives in a separate file so one location can appear in multiple medals.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// --- Read legacy data ---

const legacyData = JSON.parse(
    readFileSync(join(ROOT, 'data/legacy/medal_definitions.json'), 'utf-8')
);

const locationsData: Array<{
    id: string;
    nameEn: string;
    lat: number;
    lon: number;
}> = JSON.parse(
    readFileSync(join(ROOT, 'data/legacy/locations_en.json'), 'utf-8')
);

// Build location lookup by id
const locationById = new Map<string, { nameEn: string; lat: number; lon: number }>();
for (const loc of locationsData) {
    locationById.set(loc.id, { nameEn: loc.nameEn, lat: loc.lat, lon: loc.lon });
}

// --- Filter medals ---

type LegacyMedal = {
    QuestionPackId: string;
    Name: string;
    BossType: string;
    EnabledCountryIso2s: string[] | null;
    QuestionIds: string[];
};

const KEEP_TYPES = new Set(['Countries', 'Locations']);

const legacyMedals: LegacyMedal[] = legacyData.Medals.filter(
    (m: LegacyMedal) => KEEP_TYPES.has(m.BossType)
);

// --- Assign sequential IDs, collect referenced locations ---

const oldToNew = new Map<string, number>();
const referencedLocations = new Map<string, { name: string; lat: number; lng: number }>();

type OutputMedal = {
    id: number;
    name: string;
    type: 'countries' | 'locations';
    questionIds: string[];
};

const medals: OutputMedal[] = [];

for (let i = 0; i < legacyMedals.length; i++) {
    const m = legacyMedals[i];
    oldToNew.set(m.QuestionPackId, i);

    if (m.BossType === 'Countries') {
        medals.push({
            id: i,
            name: m.Name,
            type: 'countries',
            questionIds: m.EnabledCountryIso2s ?? [],
        });
    } else if (m.BossType === 'Locations') {
        const questionIds: string[] = [];
        for (const qid of m.QuestionIds) {
            const loc = locationById.get(qid);
            if (!loc) {
                console.warn(`  Warning: location ${qid} not found for medal "${m.Name}"`);
                continue;
            }
            questionIds.push(qid);
            referencedLocations.set(qid, { name: loc.nameEn, lat: loc.lat, lng: loc.lon });
        }
        medals.push({
            id: i,
            name: m.Name,
            type: 'locations',
            questionIds,
        });
    }
}

// --- Recursively filter menu tree ---

type LegacyMenuNode = {
    Name: string;
    MedalId: string;
    SubMenu: LegacyMenuNode[] | null;
};

type OutputMenuNode =
    | { name: string; medalId: number }
    | { name: string; children: OutputMenuNode[] };

function filterMenu(nodes: LegacyMenuNode[]): OutputMenuNode[] {
    const result: OutputMenuNode[] = [];

    for (const node of nodes) {
        const hasValidMedal = node.MedalId && oldToNew.has(node.MedalId);
        const children = node.SubMenu && node.SubMenu.length > 0
            ? filterMenu(node.SubMenu)
            : [];

        if (hasValidMedal && children.length === 0) {
            result.push({ name: node.Name, medalId: oldToNew.get(node.MedalId)! });
        } else if (hasValidMedal && children.length > 0) {
            result.push({
                name: node.Name,
                children: [
                    { name: node.Name, medalId: oldToNew.get(node.MedalId)! },
                    ...children,
                ],
            });
        } else if (children.length > 0) {
            result.push({ name: node.Name, children });
        }
    }

    return result;
}

const menu = filterMenu(legacyData.Menu);

// --- Write medals.json ---

const medalsOutput = { medals, menu };
const medalsPath = join(ROOT, 'public/medals.json');
writeFileSync(medalsPath, JSON.stringify(medalsOutput, null, 2), 'utf-8');

// --- Write locations.json (keyed by ID) ---

const locationsOutput: Record<string, { name: string; lat: number; lng: number }> = {};
for (const [id, loc] of referencedLocations) {
    locationsOutput[id] = loc;
}
const locationsPath = join(ROOT, 'public/locations.json');
writeFileSync(locationsPath, JSON.stringify(locationsOutput, null, 2), 'utf-8');

// --- Summary ---

const countriesMedals = medals.filter(m => m.type === 'countries');
const locationsMedals = medals.filter(m => m.type === 'locations');

console.log('=== Medal Conversion Summary ===');
console.log(`  Countries medals:    ${countriesMedals.length}`);
console.log(`  Locations medals:    ${locationsMedals.length}`);
console.log(`  Total medals:        ${medals.length}`);
console.log(`  Unique locations:    ${referencedLocations.size}`);
console.log(`  Menu root items:     ${menu.length}`);
console.log(`  Written: ${medalsPath}`);
console.log(`  Written: ${locationsPath}`);
