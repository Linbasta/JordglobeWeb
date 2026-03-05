/**
 * Medals browser — hierarchical menu + search, click to start quiz.
 */

import type { MedalsData, Medal, MenuNode, LocationsData } from './types'
import type { Question } from '../shared/quiz/quiz-types'

// --- Module state ---

let medalsData: MedalsData
let locationsData: LocationsData
let medalsById: Map<number, Medal>
let countryNames: Map<string, string>  // ISO2 → country name
let searchQuery = ''

// DOM refs
let rootEl: HTMLElement
let searchInput: HTMLInputElement
let menuContainer: HTMLElement

// --- Slug utilities ---

/**
 * Generate URL-safe slug from medal: "0-africa-countries"
 */
function generateMedalSlug(medal: Medal): string {
    const nameSlug = medal.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
        .replace(/^-+|-+$/g, '')       // Remove leading/trailing hyphens
    return `${medal.id}-${nameSlug}`
}

/**
 * Extract medal ID from hash: "#0-africa-countries" → 0
 */
function parseMedalSlug(hash: string): number | null {
    const match = hash.match(/^#(\d+)/)
    return match ? parseInt(match[1], 10) : null
}

// --- Init ---

async function init() {
    rootEl = document.getElementById('medals-root')!
    const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement

    // Fetch data
    const [medalsRes, locationsRes, countriesRes] = await Promise.all([
        fetch('/medals.json'),
        fetch('/locations.json'),
        fetch('/countries-enriched.json'),
    ])
    medalsData = await medalsRes.json()
    locationsData = await locationsRes.json()
    const countriesData: { iso2: string; name: string }[] = await countriesRes.json()

    // Build lookups
    medalsById = new Map()
    for (const m of medalsData.medals) {
        medalsById.set(m.id, m)
    }

    countryNames = new Map()
    for (const c of countriesData) {
        countryNames.set(c.iso2, c.name)
    }

    // Build UI
    rootEl.innerHTML = ''

    // Search bar
    const searchBar = document.createElement('div')
    searchBar.className = 'search-bar'
    searchInput = document.createElement('input')
    searchInput.type = 'text'
    searchInput.placeholder = 'Search medals...'
    searchInput.addEventListener('input', onSearchInput)
    searchBar.appendChild(searchInput)
    rootEl.appendChild(searchBar)

    // Menu container
    menuContainer = document.createElement('div')
    menuContainer.className = 'menu-container'
    rootEl.appendChild(menuContainer)

    // Check for hash-based medal link
    const medalId = parseMedalSlug(window.location.hash)
    if (medalId !== null && medalsById.has(medalId)) {
        // Auto-start medal from hash
        await startMedal(medalId)
        return
    }

    renderMenu()

    // Listen for hash changes (browser back/forward)
    window.addEventListener('hashchange', onHashChange)
}

async function onHashChange() {
    const medalId = parseMedalSlug(window.location.hash)
    if (medalId !== null && medalsById.has(medalId)) {
        await startMedal(medalId)
    } else {
        // No valid hash - return to menu
        location.reload()
    }
}

// --- Search ---

function onSearchInput() {
    searchQuery = searchInput.value.trim().toLowerCase()
    renderMenu()
}

// --- Rendering ---

function renderMenu() {
    menuContainer.innerHTML = ''

    if (searchQuery) {
        renderSearchResults()
    } else {
        renderTree(medalsData.menu, menuContainer, 0)
    }
}

function renderSearchResults() {
    const matches = medalsData.medals.filter(m =>
        m.name.toLowerCase().includes(searchQuery)
    )

    if (matches.length === 0) {
        const empty = document.createElement('div')
        empty.className = 'empty-message'
        empty.textContent = 'No medals found'
        menuContainer.appendChild(empty)
        return
    }

    for (const medal of matches) {
        menuContainer.appendChild(createMedalLeaf(medal))
    }
}

function renderTree(nodes: MenuNode[], parent: HTMLElement, depth: number) {
    for (const node of nodes) {
        if ('medalId' in node) {
            // Leaf
            const medal = medalsById.get(node.medalId)
            if (!medal) continue
            parent.appendChild(createMedalLeaf(medal))
        } else {
            // Folder
            const folder = document.createElement('div')
            folder.className = 'menu-folder'

            const header = document.createElement('div')
            header.className = `menu-header depth-${Math.min(depth, 2)}`
            header.textContent = node.name

            const children = document.createElement('div')
            children.className = 'menu-children'

            // Top-level folders start collapsed
            if (depth === 0) {
                children.style.display = 'none'
                header.classList.add('collapsed')
            }

            header.addEventListener('click', () => {
                const isHidden = children.style.display === 'none'
                children.style.display = isHidden ? '' : 'none'
                header.classList.toggle('collapsed', !isHidden)
            })

            renderTree(node.children, children, depth + 1)

            folder.appendChild(header)
            folder.appendChild(children)
            parent.appendChild(folder)
        }
    }
}

function createMedalLeaf(medal: Medal): HTMLElement {
    const el = document.createElement('div')
    el.className = 'medal-leaf'
    el.addEventListener('click', () => startMedal(medal.id))

    const name = document.createElement('span')
    name.className = 'medal-name'
    name.textContent = medal.name

    const badge = document.createElement('span')
    badge.className = 'medal-badge'
    const count = medal.questionIds.length
    badge.textContent = medal.type === 'countries'
        ? `${count} countries`
        : medal.type === 'capitals'
            ? `${count} capitals`
            : medal.type === 'provinces'
                ? `${count} provinces`
                : `${count} sights`

    el.appendChild(name)
    el.appendChild(badge)
    return el
}

// --- Start quiz ---

async function startMedal(medalId: number) {
    const medal = medalsById.get(medalId)
    if (!medal) return

    // Update URL hash for shareable link (without triggering hashchange)
    const slug = generateMedalSlug(medal)
    if (window.location.hash !== `#${slug}`) {
        window.location.hash = slug
    }

    const questions: Question[] = []

    if (medal.type === 'countries') {
        for (const iso2 of medal.questionIds) {
            const name = countryNames.get(iso2 as string)
            if (!name) {
                console.warn(`Country ISO2 ${iso2} not found in countries data`)
                continue
            }
            questions.push({
                present: 'text',
                answer: 'country',
                countryISO2: iso2 as string,
                prompt: name,
            })
        }
    } else if (medal.type === 'provinces') {
        // Load province data for the country
        if (!medal.countryISO2) {
            console.error('Province medal missing countryISO2:', medal)
            return
        }

        const provinceRes = await fetch(`/provinces/${medal.countryISO2}.json`)
        const provinceData: { country: string; provinces: { id: number; name: string }[] } = await provinceRes.json()

        // Create map of province ID → name
        const provinceNames = new Map<number, string>()
        for (const p of provinceData.provinces) {
            provinceNames.set(p.id, p.name)
        }

        // Create province questions
        for (const provinceId of medal.questionIds) {
            const name = provinceNames.get(provinceId as number)
            if (!name) {
                console.warn(`Province ID ${provinceId} not found in ${medal.countryISO2}`)
                continue
            }
            questions.push({
                present: 'text',
                answer: 'province',
                provinceId: provinceId as number,
                countryISO2: medal.countryISO2,
                prompt: name,
            })
        }
    } else if (medal.type === 'locations' || medal.type === 'capitals') {
        for (const locId of medal.questionIds) {
            const loc = locationsData[locId as string]
            if (!loc) continue
            questions.push({
                present: 'text',
                answer: 'location-alternatives',
                lat: loc.lat,
                lng: loc.lng,
                prompt: loc.name,
            })
        }
    }

    // Show canvas and hide menu BEFORE startQuizGame — Babylon needs
    // a visible canvas to read dimensions when creating the engine.
    rootEl.style.display = 'none'
    document.body.style.overflow = 'hidden'
    const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement
    canvas.style.display = 'block'
    const { startQuizGame } = await import('../solo/start-quiz-game')

    await startQuizGame({
        title: medal.name,
        questions,
        onGameComplete: (_score, _total) => {
            // Clear hash and reload to return to menu
            window.location.hash = ''
            window.location.reload()
        },
    })
}

// --- Boot ---

init()
