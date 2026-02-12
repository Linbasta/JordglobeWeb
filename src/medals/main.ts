/**
 * Medals browser — hierarchical menu + search, click to start quiz.
 */

import type { MedalsData, Medal, MenuNode, LocationsData } from './types'
import type { Question } from '../shared/quiz/quiz-types'

// --- Module state ---

let medalsData: MedalsData
let locationsData: LocationsData
let medalsById: Map<number, Medal>
let searchQuery = ''

// DOM refs
let rootEl: HTMLElement
let searchInput: HTMLInputElement
let menuContainer: HTMLElement

// --- Init ---

async function init() {
    rootEl = document.getElementById('medals-root')!
    const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement

    // Fetch data
    const [medalsRes, locationsRes] = await Promise.all([
        fetch('/medals.json'),
        fetch('/locations.json'),
    ])
    medalsData = await medalsRes.json()
    locationsData = await locationsRes.json()

    // Build lookup
    medalsById = new Map()
    for (const m of medalsData.medals) {
        medalsById.set(m.id, m)
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

    renderMenu()
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
            : `${count} sights`

    el.appendChild(name)
    el.appendChild(badge)
    return el
}

// --- Start quiz ---

async function startMedal(medalId: number) {
    const medal = medalsById.get(medalId)
    if (!medal) return

    const questions: Question[] = []

    if (medal.type === 'countries') {
        for (const iso2 of medal.questionIds) {
            questions.push({
                present: 'text',
                answer: 'country',
                countryISO2: iso2,
                prompt: '',
            })
        }
    } else if (medal.type === 'locations' || medal.type === 'capitals') {
        for (const locId of medal.questionIds) {
            const loc = locationsData[locId]
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
            // Reload to return to menu (simplest, avoids teardown complexity)
            window.location.reload()
        },
    })
}

// --- Boot ---

init()
