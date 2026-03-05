#!/usr/bin/env node
/**
 * Convert legacy flag medals into the new medals.json format.
 * Reads from data/legacy/medal_definitions.json, appends to public/medals.json.
 */

import { readFileSync, writeFileSync } from 'fs'

const legacy = JSON.parse(readFileSync('data/legacy/medal_definitions.json', 'utf-8'))
const medalsData = JSON.parse(readFileSync('public/medals.json', 'utf-8'))

// Find next available medal ID
let nextId = 0
for (const m of medalsData.medals) {
    if (m.id >= nextId) nextId = m.id + 1
}

console.log(`Starting flag medal IDs from ${nextId}\n`)

// Extract all flag medals from legacy
const flagMedals = legacy.Medals.filter((m: any) => m.BossType === 'Flags')
console.log(`Found ${flagMedals.length} flag medals in legacy data\n`)

// Convert and track for menu building
const converted: { id: number; name: string; questionIds: string[]; legacyId: string }[] = []

for (const fm of flagMedals) {
    const medal = {
        id: nextId,
        name: fm.Name,
        type: 'flags',
        questionIds: fm.EnabledCountryIso2s as string[],
    }
    medalsData.medals.push(medal)
    converted.push({ id: nextId, name: fm.Name, questionIds: fm.EnabledCountryIso2s, legacyId: fm.QuestionPackId })
    console.log(`  [${nextId}] ${fm.Name} (${fm.EnabledCountryIso2s.length} flags)`)
    nextId++
}

// Build flag menu entries grouped by continent
// Using the same grouping as the legacy data

const flagMenu: any[] = []

function findByLegacyId(packId: string) {
    return converted.find(c => c.legacyId === packId)
}

function menuLeaf(packId: string, nameOverride?: string) {
    const c = findByLegacyId(packId)
    if (!c) {
        console.warn(`WARNING: Could not find legacy pack ID: ${packId}`)
        return null
    }
    return { name: nameOverride ?? c.name, medalId: c.id }
}

// Africa Flags
const africaFlags: any[] = []
africaFlags.push(menuLeaf('10', 'Africa Flags'))
africaFlags.push(menuLeaf('africa-5-flags', 'Africa 5 Flags'))
africaFlags.push(menuLeaf('north-africa-flags', 'Northern Africa Flags'))
africaFlags.push(menuLeaf('east-africa-flags', 'Eastern Africa Flags'))
africaFlags.push(menuLeaf('central-africa-flags', 'Middle Africa Flags'))
africaFlags.push(menuLeaf('south-africa-flags', 'Southern Africa Flags'))
africaFlags.push(menuLeaf('west-africa-flags', 'Western Africa Flags'))
flagMenu.push({ name: 'AFRICA FLAGS', children: africaFlags.filter(Boolean) })

// Asia Flags
const asiaFlags: any[] = []
asiaFlags.push(menuLeaf('9', 'Asia Flags'))
asiaFlags.push(menuLeaf('asia-5-flags', 'Asia 5 Flags'))
asiaFlags.push(menuLeaf('central-asia-flags', 'Central Asia Flags'))
asiaFlags.push(menuLeaf('east-asia-flags', 'Eastern Asia Flags'))
asiaFlags.push(menuLeaf('southeast-asia-flags', 'Southeastern Asia Flags'))
asiaFlags.push(menuLeaf('south-asia-flags', 'Southern Asia Flags'))
asiaFlags.push(menuLeaf('west-asia-flags', 'Western Asia Flags'))
flagMenu.push({ name: 'ASIA FLAGS', children: asiaFlags.filter(Boolean) })

// Europe Flags
const europeFlags: any[] = []
europeFlags.push(menuLeaf('6', 'Europe Flags'))
europeFlags.push(menuLeaf('europe-5-flags', 'Europe 5 Flags'))
europeFlags.push(menuLeaf('east-europe-flags', 'Eastern Europe Flags'))
europeFlags.push(menuLeaf('north-europe-flags', 'Northern Europe Flags'))
europeFlags.push(menuLeaf('south-europe-flags', 'Southern Europe Flags'))
europeFlags.push(menuLeaf('west-europe-flags', 'Western Europe Flags'))
flagMenu.push({ name: 'EUROPE FLAGS', children: europeFlags.filter(Boolean) })

// North America Flags
const naFlags: any[] = []
naFlags.push(menuLeaf('8', 'North America Flags'))
naFlags.push(menuLeaf('north-america-5-flags', 'North America 5 Flags'))
naFlags.push(menuLeaf('central-america-flags', 'Central America Flags'))
naFlags.push(menuLeaf('caribbean-flags', 'Caribbean Flags'))
flagMenu.push({ name: 'NORTH AMERICA FLAGS', children: naFlags.filter(Boolean) })

// South America Flags
const saFlags: any[] = []
saFlags.push(menuLeaf('7', 'South America Flags'))
saFlags.push(menuLeaf('south-america-5-flags', 'South America 5 Flags'))
flagMenu.push({ name: 'SOUTH AMERICA FLAGS', children: saFlags.filter(Boolean) })

// Oceania Flags
const oceaniaFlags: any[] = []
oceaniaFlags.push(menuLeaf('11', 'Oceania Flags'))
oceaniaFlags.push(menuLeaf('oceania-5-flags', 'Oceania 5 Flags'))
oceaniaFlags.push(menuLeaf('melanesia-flags', 'Melanesia Flags'))
oceaniaFlags.push(menuLeaf('micronesia-flags', 'Micronesia Flags'))
oceaniaFlags.push(menuLeaf('polynesia-flags', 'Polynesia Flags'))
flagMenu.push({ name: 'OCEANIA FLAGS', children: oceaniaFlags.filter(Boolean) })

// World Flags
const worldFlags: any[] = []
worldFlags.push(menuLeaf('world-flags', 'The World Flags'))
worldFlags.push(menuLeaf('world-10-flags', 'The World 10 Flags'))
worldFlags.push(menuLeaf('dependent-territories-flags', 'Dependent Territories Flags'))
worldFlags.push(menuLeaf('dependent-territories-atlantic-flags', 'Atlantic Dependent Territories Flags'))
worldFlags.push(menuLeaf('dependent-territories-caribbean-flags', 'Caribbean Dependent Territories Flags'))
worldFlags.push(menuLeaf('dependent-territories-pacific-flags', 'Pacific Dependent Territories Flags'))
worldFlags.push(menuLeaf('dependent-territories-indian-flags', 'Indian Ocean Dependent Territories Flags'))
flagMenu.push({ name: 'WORLD FLAGS', children: worldFlags.filter(Boolean) })

// Add flag menu as top-level entries in the menu (if menu exists)
if (medalsData.menu) {
    for (const entry of flagMenu) {
        medalsData.menu.push(entry)
    }
} else {
    console.log('\nNo "menu" key in medals.json — skipping menu entries')
}

writeFileSync('public/medals.json', JSON.stringify(medalsData, null, 2))

console.log(`\nDone! Added ${converted.length} flag medals (IDs ${converted[0].id}–${converted[converted.length - 1].id})`)
console.log(`Added ${flagMenu.length} flag menu sections`)
