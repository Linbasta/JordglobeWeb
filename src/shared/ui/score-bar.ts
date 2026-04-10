/**
 * Score Bar — animated progress bar at top center
 *
 * Module-level state, plain functions. Inspired by Unity ScoreBar.
 */

// ── DOM elements ──
let root: HTMLDivElement | null = null
let barBG: HTMLDivElement | null = null
let barInner: HTMLDivElement | null = null
let barFill: HTMLDivElement | null = null
let turnsBadge: HTMLDivElement | null = null
let checkmarkEl: HTMLDivElement | null = null
let glowEl: HTMLDivElement | null = null

// ── State ──
let prevPercent = 0
let curPercent = 0
let animStartPercent = 0
let animEndPercent = 0
let animStartTime = 0
let animDuration = 0
let animating = false
let animFrameId = 0

let percentRequirement = -1
let winShown = false

// Banner offset (when Android app banner is visible)
let bannerOffsetPx = 0

// ── Particles ──
const PARTICLE_COUNT = 8
const PARTICLE_LIFETIME_MS = 400
const PARTICLE_SIZE = 5

interface Particle {
    el: HTMLDivElement
    birthTime: number
    startY: number    // initial Y position (spread across bar height)
    driftY: number    // random vertical drift direction
    offsetX: number   // random horizontal scatter
}

let particles: Particle[] = []
let barContainer: HTMLDivElement | null = null

// ── Audio ──
let audioCtx: AudioContext | null = null

// ── Constants ──
const BAR_WIDTH_PORTRAIT = 95  // vw — nearly full width in portrait
const BAR_WIDTH_LANDSCAPE = 50 // vw — max half in landscape
const BAR_HEIGHT = 36
const BAR_TOP = 10
const FILL_ANIM_MS = 200
const WIN_POP_MS = 300
const FILL_COLOR = '#ffffff'
const FILL_WIN_COLOR = '#4caf50'
const INNER_COLOR = '#0C003C'
const BLUE_SLICE = 20
const FRAME_BORDER = 10
const INNER_INSET_TOP = 3
const INNER_INSET_BOTTOM = 6
const INNER_INSET_LR = 4
const FILL_INSET = 1
const FILL_RADIUS = 3
export const SCORE_BAR_GAP = 8  // Gap below score bar for other UI elements
export const SCORE_BAR_BOTTOM = BAR_TOP + BAR_HEIGHT + SCORE_BAR_GAP

/** Get current score bar bottom position including banner offset */
export function getScoreBarBottom(): number {
    return BAR_TOP + bannerOffsetPx + BAR_HEIGHT + SCORE_BAR_GAP
}

// Shared panel sizing — used by score bar, video overlay, etc.
export const PANEL_HEIGHT_VH = 25
export const PANEL_ASPECT = '16/9'
export const PANEL_WIDTH_LANDSCAPE = `calc(${PANEL_HEIGHT_VH}vh * 16 / 9)`
export const PANEL_WIDTH_PORTRAIT = '95vw'

const GLOW_KEYFRAMES = `
@keyframes scoreBarGlow {
    0% { box-shadow: 0 0 8px 2px rgba(76, 175, 80, 0.4); }
    50% { box-shadow: 0 0 20px 6px rgba(76, 175, 80, 0.7); }
    100% { box-shadow: 0 0 8px 2px rgba(76, 175, 80, 0.4); }
}
`

export function createScoreBar(turnsLeft: number, total: number): void {
    disposeScoreBar()
    injectKeyframes()

    root = document.createElement('div')
    root.style.cssText =
        `position:absolute;top:${BAR_TOP + bannerOffsetPx}px;left:50%;transform:translateX(-50%);` +
        `width:${window.innerHeight > window.innerWidth ? BAR_WIDTH_PORTRAIT : BAR_WIDTH_LANDSCAPE}vw;height:${BAR_HEIGHT}px;z-index:100;` +
        `display:flex;align-items:center;gap:3px;`

    // Bar container (middle, grows)
    barContainer = document.createElement('div')
    barContainer.style.cssText =
        `flex:1;height:${BAR_HEIGHT}px;position:relative;overflow:visible;`

    // Background — 9-slice BlueButton.png
    barBG = document.createElement('div')
    barBG.style.cssText =
        `position:absolute;inset:0;` +
        `border-style:solid;border-width:${FRAME_BORDER}px;` +
        `border-image:url("/BlueButton.png") ${BLUE_SLICE} ${BLUE_SLICE} ${BLUE_SLICE} ${BLUE_SLICE} fill stretch;`

    // Dark inner area — shifted up to sit above the button's faked depth
    barInner = document.createElement('div')
    barInner.style.cssText =
        `position:absolute;` +
        `top:${INNER_INSET_TOP}px;bottom:${INNER_INSET_BOTTOM}px;` +
        `left:${INNER_INSET_LR}px;right:${INNER_INSET_LR}px;` +
        `background:${INNER_COLOR};border-radius:4px;`

    // Glow (behind fill, hidden until win)
    glowEl = document.createElement('div')
    glowEl.style.cssText =
        `position:absolute;inset:-4px;border-radius:4px;` +
        `display:none;`

    // Fill — white bar inside the dark inner
    barFill = document.createElement('div')
    barFill.style.cssText =
        `position:absolute;` +
        `top:${INNER_INSET_TOP + FILL_INSET}px;` +
        `bottom:${INNER_INSET_BOTTOM + FILL_INSET}px;` +
        `left:${INNER_INSET_LR + FILL_INSET}px;` +
        `width:0;` +
        `background:${FILL_COLOR};border-radius:${FILL_RADIUS}px;transition:none;`

    // Checkmark (hidden by default)
    checkmarkEl = document.createElement('div')
    checkmarkEl.style.cssText =
        `position:absolute;top:50%;transform:translate(-50%,-50%);` +
        `width:24px;height:24px;display:none;opacity:0.4;` +
        `font-size:20px;line-height:24px;text-align:center;color:#fff;`
    checkmarkEl.textContent = '\u2605' // star

    barContainer.appendChild(barBG)
    barContainer.appendChild(barInner)
    barContainer.appendChild(glowEl)
    barContainer.appendChild(barFill)
    barContainer.appendChild(checkmarkEl)
    root.appendChild(barContainer)

    // Turns badge (right) — 9-slice BlueButton.png
    turnsBadge = document.createElement('div')
    turnsBadge.style.cssText =
        `color:#fff;font-family:Arial,sans-serif;font-size:18px;` +
        `font-weight:bold;flex-shrink:0;min-width:50px;text-align:center;` +
        `box-sizing:border-box;height:${BAR_HEIGHT}px;line-height:${BAR_HEIGHT - 16}px;` +
        `border-style:solid;border-width:8px;` +
        `border-image:url("/BlueButton.png") ${BLUE_SLICE} ${BLUE_SLICE} ${BLUE_SLICE} ${BLUE_SLICE} fill stretch;`
    turnsBadge.textContent = `${turnsLeft}`
    root.appendChild(turnsBadge)

    document.body.appendChild(root)

    // Reset state
    prevPercent = 0
    curPercent = 0
    animating = false
    percentRequirement = -1
    winShown = false
}

export function resetScoreBar(turnsLeft: number, total: number, requirement?: number): void {
    prevPercent = 0
    curPercent = 0
    animating = false
    winShown = false

    if (barFill) barFill.style.width = '0'
    if (barFill) barFill.style.background = FILL_COLOR
    if (turnsBadge) turnsBadge.textContent = `${turnsLeft}`

    if (requirement != null && requirement > 0) {
        percentRequirement = requirement / 100
        placeCheckmark(percentRequirement)
    } else {
        percentRequirement = -1
        if (checkmarkEl) checkmarkEl.style.display = 'none'
    }

    if (glowEl) {
        glowEl.style.display = 'none'
        glowEl.style.animation = 'none'
    }
}

export function updateScoreBar(score: number, turnsLeft: number, total: number): void {
    if (!root) return

    const newPercent = total > 0 ? score / total : 0

    if (turnsBadge) turnsBadge.textContent = `${turnsLeft}`

    if (newPercent !== curPercent) {
        prevPercent = curPercent
        curPercent = newPercent
        startFillAnimation(prevPercent, curPercent)

        if (curPercent > prevPercent) {
            playScoreTone(curPercent)
        }
    }
}

export function disposeScoreBar(): void {
    if (animFrameId) {
        cancelAnimationFrame(animFrameId)
        animFrameId = 0
    }
    if (root) {
        root.remove()
        root = null
    }
    barBG = barInner = barFill = turnsBadge = checkmarkEl = glowEl = barContainer = null
    clearParticles()
    prevPercent = curPercent = 0
    animating = false
    percentRequirement = -1
    winShown = false
    removeKeyframes()
}

/** Set banner offset (call when Android app banner visibility changes) */
export function setScoreBarBannerOffset(offsetPx: number): void {
    bannerOffsetPx = offsetPx
    if (root) {
        root.style.top = `${BAR_TOP + bannerOffsetPx}px`
    }
}

// ── Fill Animation ──

function startFillAnimation(from: number, to: number): void {
    animStartPercent = from
    animEndPercent = to
    animStartTime = performance.now()
    animDuration = FILL_ANIM_MS

    // Spawn particles when score increases, at the current fill tip position
    if (to > from) {
        const initialTipX = getTipX(from)
        spawnParticles(initialTipX)
    }

    if (!animating) {
        animating = true
        animFrameId = requestAnimationFrame(tickFillAnimation)
    }
}

function tickFillAnimation(now: number): void {
    const elapsed = now - animStartTime
    const t = Math.min(elapsed / animDuration, 1)
    const pct = animStartPercent + (animEndPercent - animStartPercent) * t

    const tipX = setFillWidth(pct)
    tickParticles(now, tipX)

    // Check win threshold during animation
    if (percentRequirement > 0 && !winShown && pct >= percentRequirement) {
        triggerWin()
    }

    const fillDone = t >= 1
    if (fillDone || particles.length > 0) {
        animFrameId = requestAnimationFrame(tickFillAnimation)
    }
    if (fillDone && particles.length === 0) {
        animating = false
        animFrameId = 0
    }
}

function getTipX(pct: number): number {
    if (!barContainer) return 0
    const totalInset = INNER_INSET_LR + FILL_INSET
    const maxWidth = barContainer.clientWidth - totalInset * 2
    const w = Math.max(0, pct * maxWidth)
    return totalInset + w  // tip X relative to barContainer
}

function setFillWidth(pct: number): number {
    if (!barFill || !barContainer) return 0
    const tipX = getTipX(pct)
    const totalInset = INNER_INSET_LR + FILL_INSET
    barFill.style.width = `${tipX - totalInset}px`
    return tipX
}

// ── Checkmark ──

function placeCheckmark(pctDecimal: number): void {
    if (!checkmarkEl || !barBG) return
    checkmarkEl.style.display = 'block'
    checkmarkEl.style.opacity = '0.4'
    checkmarkEl.style.transform = 'translate(-50%,-50%)'
    // Position will be set after layout
    requestAnimationFrame(() => {
        if (!checkmarkEl || !barBG) return
        const barW = barBG.clientWidth
        checkmarkEl.style.left = `${pctDecimal * barW}px`
    })
}

// ── Win State ──

function triggerWin(): void {
    winShown = true

    // Change fill to green
    if (barFill) barFill.style.background = FILL_WIN_COLOR

    // Checkmark pop animation
    if (checkmarkEl) {
        checkmarkEl.style.opacity = '1'
        checkmarkEl.style.transform = 'translate(-50%,-50%) scale(2)'
        checkmarkEl.style.transition = `transform ${WIN_POP_MS}ms ease-out, opacity ${WIN_POP_MS}ms ease-out`
        requestAnimationFrame(() => {
            if (checkmarkEl) {
                checkmarkEl.style.transform = 'translate(-50%,-50%) scale(1)'
            }
        })
    }

    // Glow pulse
    if (glowEl) {
        glowEl.style.display = 'block'
        glowEl.style.animation = `scoreBarGlow 1.5s ease-in-out infinite`
    }

    playWinTone()
}

// ── Audio ──

function getAudioCtx(): AudioContext {
    if (!audioCtx) audioCtx = new AudioContext()
    return audioCtx
}

function playScoreTone(percent: number): void {
    try {
        const ctx = getAudioCtx()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)

        // Rising pitch: 400Hz at 0% → 800Hz at 100%
        osc.frequency.value = 400 + 400 * percent
        osc.type = 'sine'
        gain.gain.setValueAtTime(0.08, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)

        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.1)
    } catch { /* audio not available */ }
}

function playWinTone(): void {
    try {
        const ctx = getAudioCtx()
        const now = ctx.currentTime

        // Three-note ascending chord
        const notes = [523.25, 659.25, 783.99] // C5, E5, G5
        for (let i = 0; i < notes.length; i++) {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.frequency.value = notes[i]
            osc.type = 'sine'
            const t = now + i * 0.08
            gain.gain.setValueAtTime(0, t)
            gain.gain.linearRampToValueAtTime(0.1, t + 0.02)
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3)
            osc.start(t)
            osc.stop(t + 0.3)
        }
    } catch { /* audio not available */ }
}

// ── Particles ──

function spawnParticles(initialTipX: number): void {
    if (!barContainer) return
    const now = performance.now()
    const topEdge = INNER_INSET_TOP + FILL_INSET
    const bottomEdge = BAR_HEIGHT - INNER_INSET_BOTTOM - FILL_INSET

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        // Random Y spread across the full bar height
        const startY = topEdge + Math.random() * (bottomEdge - topEdge)
        const el = document.createElement('div')
        el.style.cssText =
            `position:absolute;width:${PARTICLE_SIZE}px;height:${PARTICLE_SIZE}px;` +
            `border-radius:50%;background:#fff;pointer-events:none;` +
            `left:${initialTipX}px;top:${startY}px;opacity:1;z-index:110;`
        barContainer.appendChild(el)
        particles.push({
            el,
            birthTime: now,
            startY,
            driftY: (Math.random() - 0.5) * 30,  // drift up or down ±15px
            offsetX: (Math.random() - 0.5) * 12,  // scatter ±6px
        })
    }
}

function tickParticles(now: number, tipX: number): void {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        const age = now - p.birthTime
        const t = age / PARTICLE_LIFETIME_MS

        if (t >= 1) {
            p.el.remove()
            particles.splice(i, 1)
            continue
        }

        // Follow the tip X, drift outward from spawn position
        p.el.style.left = `${tipX + p.offsetX * t}px`
        p.el.style.top = `${p.startY + p.driftY * t}px`
        p.el.style.opacity = `${1 - t}`
        const scale = 1 - t * 0.5
        p.el.style.transform = `translate(-50%, -50%) scale(${scale})`
    }
}

function clearParticles(): void {
    for (const p of particles) p.el.remove()
    particles = []
}

// ── Keyframes ──

let styleEl: HTMLStyleElement | null = null

function injectKeyframes(): void {
    if (styleEl) return
    styleEl = document.createElement('style')
    styleEl.textContent = GLOW_KEYFRAMES
    document.head.appendChild(styleEl)
}

function removeKeyframes(): void {
    if (styleEl) {
        styleEl.remove()
        styleEl = null
    }
}
