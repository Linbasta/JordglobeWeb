#!/usr/bin/env npx tsx
/**
 * Generate hierarchical menu structure for medals.json
 *
 * Parses medal names to build a tree structure for the UI.
 */

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

type Medal = {
    id: number
    name: string
    type: 'countries' | 'locations' | 'capitals' | 'provinces' | 'flags'
    questionIds: (string | number)[]
    countryISO2?: string
}

type MenuNode =
    | { name: string; medalId: number }
    | { name: string; children: MenuNode[] }

type MedalsData = {
    medals: Medal[]
    menu?: MenuNode[]
}

// ── Category patterns ──

const WORLD_PATTERNS = [
    /^The World/i
]

const CONTINENT_REGIONS: Record<string, RegExp[]> = {
    'Africa': [
        /^Africa(?:\s+\d+)?\s+(Countries|Capitals|Flags)/i,
        /^(Northern|Eastern|Middle|Southern|Western)\s+Africa/i
    ],
    'Asia': [
        /^Asia(?:\s+\d+)?\s+(Countries|Capitals|Flags)/i,
        /^(Central|Eastern|Southeastern|Southern|Western)\s+Asia/i
    ],
    'Europe': [
        /^Europe(?:\s+\d+)?\s+(Countries|Capitals|Flags|Sights)/i,
        /^(Northern|Eastern|Southern|Western)\s+Europe/i
    ],
    'Americas': [
        /^(North|Central|South)\s+America/i,
        /^Carribean/i  // Note: typo in data
    ],
    'Oceania': [
        /^Oceania(?:\s+\d+)?\s+(Countries|Capitals|Flags)/i,
        /^(Melanesia|Micronesia|Polynesia)/i
    ]
}

const PROVINCE_PATTERN = /^([^:]+):\s+(.+)$/
const DEPENDENT_PATTERN = /dependent territories/i

// Additional regional patterns (medals that should go under Provinces & States)
const REGIONAL_PATTERNS: { country: string; pattern: RegExp }[] = [
    { country: 'China', pattern: /^(China 5 Provinces|North China|Northeast China|East China|South Central China|Southwest China|Northwestern China)\s*(Provinces)?/i },
    { country: 'United Kingdom', pattern: /^(North East England|North West England|East of England|South East England|South West England)\s*(Counties)?/i },
    { country: 'Italy', pattern: /^(Northern|Central|South)\s+Italy\s+Regions/i },
    { country: 'Mexico', pattern: /^(Northern|Centerwest|Centersouth|South)\s+States?\s+Mexico/i },
    { country: 'Sweden', pattern: /^(Sweden 5 counties|Norrland|Svealand|Götaland)/i },
    { country: 'Germany', pattern: /^(East|West)\s+Germany/i },
    { country: 'Poland', pattern: /^(East|West)\s+Poland/i },
]

// ── Helpers ──

function matchesAny(name: string, patterns: RegExp[]): boolean {
    return patterns.some(p => p.test(name))
}

function getContinent(name: string): string | null {
    for (const [continent, patterns] of Object.entries(CONTINENT_REGIONS)) {
        if (matchesAny(name, patterns)) return continent
    }
    return null
}

function getSubregion(name: string): string | null {
    // Extract subregion like "Northern Africa" from "Northern Africa Countries"
    const subregionMatch = name.match(/^(Northern|Eastern|Middle|Southern|Western|Central|Southeastern)\s+(Africa|Asia|Europe)/i)
    if (subregionMatch) {
        return `${subregionMatch[1]} ${subregionMatch[2]}`
    }

    // Americas subregions
    const americasMatch = name.match(/^(North|Central|South)\s+America/i)
    if (americasMatch) {
        return `${americasMatch[1]} America`
    }

    if (/^Carribean/i.test(name)) return 'Caribbean'

    // Oceania subregions
    const oceaniaMatch = name.match(/^(Melanesia|Micronesia|Polynesia)/i)
    if (oceaniaMatch) {
        return oceaniaMatch[1]
    }

    return null
}

function isAllContinentMedal(name: string): boolean {
    // "Africa Countries", "Asia 5 Flags", etc. (not subregion specific)
    return /^(Africa|Asia|Europe|Oceania)(?:\s+\d+)?\s+(Countries|Capitals|Flags|Sights)/i.test(name)
}

// ── Main ──

function generateMenu(medals: Medal[]): MenuNode[] {
    const menu: MenuNode[] = []
    const used = new Set<number>()

    // 1. The World
    const worldMedals = medals.filter(m => matchesAny(m.name, WORLD_PATTERNS))
    if (worldMedals.length > 0) {
        menu.push({
            name: 'The World',
            children: worldMedals.map(m => {
                used.add(m.id)
                // Simplify name: "The World Countries" -> "Countries"
                const simpleName = m.name.replace(/^The World\s*/i, '')
                return { name: simpleName || m.name, medalId: m.id }
            })
        })
    }

    // 2. Continents with subregions
    for (const continent of ['Africa', 'Asia', 'Europe', 'Americas', 'Oceania']) {
        const continentMedals = medals.filter(m =>
            !used.has(m.id) && getContinent(m.name) === continent
        )
        if (continentMedals.length === 0) continue

        const continentNode: MenuNode = { name: continent, children: [] }

        // Group by subregion
        const subregions = new Map<string, Medal[]>()
        const allContinent: Medal[] = []

        for (const medal of continentMedals) {
            const subregion = getSubregion(medal.name)
            if (subregion) {
                if (!subregions.has(subregion)) subregions.set(subregion, [])
                subregions.get(subregion)!.push(medal)
            } else if (isAllContinentMedal(medal.name)) {
                allContinent.push(medal)
            }
        }

        // Add "All [Continent]" medals first
        if (allContinent.length > 0) {
            continentNode.children.push({
                name: `All ${continent}`,
                children: allContinent.map(m => {
                    used.add(m.id)
                    // Simplify: "Africa Countries" -> "Countries"
                    const simpleName = m.name.replace(new RegExp(`^${continent}\\s*(\\d+)?\\s*`, 'i'), '')
                    return { name: simpleName || m.name, medalId: m.id }
                })
            })
        }

        // Add subregions
        for (const [subregion, subMedals] of subregions) {
            continentNode.children.push({
                name: subregion,
                children: subMedals.map(m => {
                    used.add(m.id)
                    // Simplify: "Northern Africa Countries" -> "Countries"
                    const simpleName = m.name.replace(new RegExp(`^${subregion}\\s*`, 'i'), '')
                    return { name: simpleName || m.name, medalId: m.id }
                })
            })
        }

        if (continentNode.children.length > 0) {
            menu.push(continentNode)
        }
    }

    // 3. Provinces & States (country: province format + regional patterns)
    const provinceMedals = medals.filter(m =>
        !used.has(m.id) && (
            PROVINCE_PATTERN.test(m.name) ||
            REGIONAL_PATTERNS.some(rp => rp.pattern.test(m.name))
        )
    )
    if (provinceMedals.length > 0) {
        // Group by country
        const byCountry = new Map<string, Medal[]>()
        for (const medal of provinceMedals) {
            let country: string | null = null

            // Check standard "Country: Region" format
            const match = medal.name.match(PROVINCE_PATTERN)
            if (match) {
                country = match[1]
            } else {
                // Check regional patterns
                for (const rp of REGIONAL_PATTERNS) {
                    if (rp.pattern.test(medal.name)) {
                        country = rp.country
                        break
                    }
                }
            }

            if (country) {
                if (!byCountry.has(country)) byCountry.set(country, [])
                byCountry.get(country)!.push(medal)
            }
        }

        const provinceNode: MenuNode = { name: 'Provinces & States', children: [] }

        // Sort countries alphabetically
        const sortedCountries = [...byCountry.keys()].sort()
        for (const country of sortedCountries) {
            const countryMedals = byCountry.get(country)!
            provinceNode.children.push({
                name: country,
                children: countryMedals.map(m => {
                    used.add(m.id)
                    // Simplify: "Brazil: States" -> "States", keep regional names as-is
                    const colonMatch = m.name.match(PROVINCE_PATTERN)
                    const simpleName = colonMatch ? colonMatch[2] : m.name
                    return { name: simpleName, medalId: m.id }
                })
            })
        }

        menu.push(provinceNode)
    }

    // 4. Dependent Territories
    const dependentMedals = medals.filter(m =>
        !used.has(m.id) && DEPENDENT_PATTERN.test(m.name)
    )
    if (dependentMedals.length > 0) {
        menu.push({
            name: 'Dependent Territories',
            children: dependentMedals.map(m => {
                used.add(m.id)
                return { name: m.name, medalId: m.id }
            })
        })
    }

    // 5. Uncategorized (anything left)
    const uncategorized = medals.filter(m => !used.has(m.id))
    if (uncategorized.length > 0) {
        console.log('Uncategorized medals:')
        for (const m of uncategorized) {
            console.log(`  - ${m.name}`)
        }
        menu.push({
            name: 'Other',
            children: uncategorized.map(m => ({ name: m.name, medalId: m.id }))
        })
    }

    return menu
}

// ── Run ──

const medalsPath = join(process.cwd(), 'public/medals.json')
const data: MedalsData = JSON.parse(readFileSync(medalsPath, 'utf-8'))

console.log(`Loaded ${data.medals.length} medals`)

const menu = generateMenu(data.medals)
data.menu = menu

writeFileSync(medalsPath, JSON.stringify(data, null, 2))

console.log(`Generated menu with ${menu.length} top-level categories:`)
for (const node of menu) {
    if ('children' in node) {
        console.log(`  - ${node.name} (${node.children.length} items)`)
    }
}
console.log('\nUpdated public/medals.json')
