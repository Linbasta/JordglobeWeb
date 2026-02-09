/**
 * Test page for marker particle burst effect.
 * Places markers on a few cities, lets you fire bursts with tunable sliders.
 */

import { EarthGlobe } from '../earth-globe'
import { loadConfig } from '../shared/config/global-config'
import { burstAtPosition } from '../shared/effects/marker-particles'
import type { BurstOptions } from '../shared/effects/marker-particles'

await loadConfig()

const globe = new EarthGlobe({ canvasId: 'renderCanvas' })
;(window as any).earthGlobe = globe

const capitals = [
    { name: 'Stockholm', lat: 59.3293, lon: 18.0686 },
    { name: 'Paris',     lat: 48.8566, lon: 2.3522 },
    { name: 'Tokyo',     lat: 35.6762, lon: 139.6503 },
    { name: 'Cairo',     lat: 30.0444, lon: 31.2357 },
    { name: 'New York',  lat: 40.7128, lon: -74.0060 },
]

const markerIds: number[] = []

// Wait for globe init
setTimeout(() => {
    for (const c of capitals) {
        const id = globe.acquireMarker(c.lat, c.lon)
        if (id !== -1) markerIds.push(id)
    }
    console.log(`Placed ${markerIds.length} markers`)
}, 2000)

// ── Slider wiring ──────────────────────────────────────────

const SLIDER_IDS = [
    'count', 'lifetimeMin', 'lifetimeMax', 'emitDurationMs',
    'minEmitPower', 'maxEmitPower', 'spread',
    'sizeMin', 'sizeMax', 'sizePeak', 'gravity',
] as const

function readSliders(): BurstOptions {
    const opts: Record<string, number> = {}
    for (const id of SLIDER_IDS) {
        const el = document.getElementById(id) as HTMLInputElement
        opts[id] = parseFloat(el.value)
    }
    return opts as unknown as BurstOptions
}

// Update value labels on every input
for (const id of SLIDER_IDS) {
    const slider = document.getElementById(id) as HTMLInputElement
    const label = document.getElementById(id + 'Val') as HTMLSpanElement
    const update = () => { label.textContent = slider.value }
    slider.addEventListener('input', update)
    update()
}

// ── Burst actions ──────────────────────────────────────────

function burstAtMarker(markerIndex: number) {
    if (markerIndex >= markerIds.length) return
    const pos = globe.getMarkerPosition(markerIds[markerIndex])
    if (!pos) return
    burstAtPosition(globe.getScene(), pos, readSliders())
}

function burstAll() {
    for (let i = 0; i < markerIds.length; i++) {
        burstAtMarker(i)
    }
}

document.getElementById('burstBtn')!.addEventListener('click', () => burstAtMarker(0))
document.getElementById('burstAllBtn')!.addEventListener('click', burstAll)

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault()
        burstAtMarker(0)
    }
})

// ── Copy settings ──────────────────────────────────────────

document.getElementById('copyBtn')!.addEventListener('click', () => {
    const opts = readSliders()
    const lines = Object.entries(opts)
        .map(([k, v]) => `    ${k}: ${v},`)
        .join('\n')
    const text = `const DEFAULTS: Required<BurstOptions> = {\n${lines}\n}`
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('copyBtn')!
        btn.textContent = 'Copied!'
        setTimeout(() => { btn.textContent = 'Copy Settings to Clipboard' }, 1500)
    })
})
