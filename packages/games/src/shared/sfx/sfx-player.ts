import { asset } from '../asset-path'

const CORRECT_SFX_COUNT = 7
const MAX_CONCURRENT = 3

let ctx: AudioContext | null = null
const correctBuffers: (AudioBuffer | null)[] = new Array(CORRECT_SFX_COUNT).fill(null)
let incorrectBuffer: AudioBuffer | null = null

let cursor = 0
let activeCount = 0

function getCtx(): AudioContext {
    if (!ctx) {
        const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        ctx = new AC()
    }
    return ctx
}

async function loadBuffer(url: string): Promise<AudioBuffer> {
    const res = await fetch(url)
    const arr = await res.arrayBuffer()
    return getCtx().decodeAudioData(arr)
}

async function preloadAll() {
    await Promise.all([
        ...Array.from({ length: CORRECT_SFX_COUNT }, (_, i) =>
            loadBuffer(asset(`sfx/correct_${i + 1}.ogg`)).then(b => { correctBuffers[i] = b })
        ),
        loadBuffer(asset('sfx/incorrect.ogg')).then(b => { incorrectBuffer = b }),
    ])
}

function primeOnFirstGesture() {
    const onGesture = () => {
        window.removeEventListener('pointerdown', onGesture, true)
        window.removeEventListener('keydown', onGesture, true)
        window.removeEventListener('touchstart', onGesture, true)
        const c = getCtx()
        const prime = () => {
            const silent = c.createBuffer(1, 1, 22050)
            const src = c.createBufferSource()
            src.buffer = silent
            src.connect(c.destination)
            src.start(0)
        }
        if (c.state === 'suspended') c.resume().then(prime).catch(() => {})
        else prime()
    }
    window.addEventListener('pointerdown', onGesture, true)
    window.addEventListener('keydown', onGesture, true)
    window.addEventListener('touchstart', onGesture, true)
}

primeOnFirstGesture()
preloadAll().catch(() => {})

function playBuffer(buffer: AudioBuffer | null) {
    if (!buffer) return
    if (activeCount >= MAX_CONCURRENT) return
    const c = getCtx()
    if (c.state === 'suspended') c.resume().catch(() => {})
    const src = c.createBufferSource()
    src.buffer = buffer
    src.connect(c.destination)
    activeCount++
    src.onended = () => { activeCount = Math.max(0, activeCount - 1) }
    src.start(0)
}

export function playCorrectSfx() {
    if (activeCount >= MAX_CONCURRENT) return
    playBuffer(correctBuffers[cursor])
    cursor = (cursor + 1) % CORRECT_SFX_COUNT
}

export function playIncorrectSfx() {
    playBuffer(incorrectBuffer)
}
