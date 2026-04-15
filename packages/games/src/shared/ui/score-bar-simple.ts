/**
 * Simple Score Bar — shows "3/76 | 3p | 0:42" with BlueButton.png background
 *
 * Module-level state, plain functions. Same API shape as score-bar.ts.
 */

import { PANEL_WIDTH_LANDSCAPE, PANEL_WIDTH_PORTRAIT } from './score-bar'
import { getPersonalBest } from './result-overlay'
import { asset } from '../asset-path'

// ── DOM elements ──
let root: HTMLDivElement | null = null
let questionEl: HTMLSpanElement | null = null
let scoreEl: HTMLSpanElement | null = null
let timeEl: HTMLSpanElement | null = null
let pbEl: HTMLSpanElement | null = null

// ── Constants ──
const BAR_HEIGHT = 36
const BAR_TOP = 10
const BLUE_SLICE = 20
const FRAME_BORDER = 10

// ── State ──
let totalQuestions = 0
let bannerOffsetPx = 0
let personalBestMs: number | null = null

function formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function createSimpleScoreBar(turnsLeft: number, total: number, quizId?: string): void {
    disposeSimpleScoreBar()

    totalQuestions = total

    // Load personal best if quizId provided
    personalBestMs = null
    if (quizId) {
        const pb = getPersonalBest(quizId)
        if (pb) personalBestMs = pb.elapsedMs
    }

    root = document.createElement('div')
    const isPortrait = window.innerHeight > window.innerWidth
    const width = isPortrait ? PANEL_WIDTH_PORTRAIT : PANEL_WIDTH_LANDSCAPE
    root.style.cssText =
        `position:absolute;top:${BAR_TOP + bannerOffsetPx}px;left:50%;transform:translateX(-50%);` +
        `width:${width};height:${BAR_HEIGHT}px;z-index:100;` +
        `display:flex;align-items:center;justify-content:space-between;` +
        `box-sizing:border-box;` +
        `border-style:solid;border-width:${FRAME_BORDER}px;` +
        `border-image:url("${asset('BlueButton.png')}") ${BLUE_SLICE} ${BLUE_SLICE} ${BLUE_SLICE} ${BLUE_SLICE} fill stretch;` +
        `color:#fff;font-family:Arial,sans-serif;font-size:18px;font-weight:bold;` +
        `gap:0;`

    const lh = `line-height:${BAR_HEIGHT - 16}px;`

    // Left group: "1/76 |"
    const leftGroup = document.createElement('span')
    leftGroup.style.cssText = lh
    questionEl = document.createElement('span')
    questionEl.textContent = `1/${total}`
    const divider1 = document.createElement('span')
    divider1.style.cssText = `margin-left:10px;opacity:0.5;`
    divider1.textContent = '|'
    leftGroup.appendChild(questionEl)
    leftGroup.appendChild(divider1)

    // Center: "0p"
    scoreEl = document.createElement('span')
    scoreEl.style.cssText = lh
    scoreEl.textContent = '0p'

    // Right group: "PB 1:23 | 0:00"
    const rightGroup = document.createElement('span')
    rightGroup.style.cssText = lh

    // Personal best display (only if we have one)
    if (personalBestMs !== null) {
        pbEl = document.createElement('span')
        pbEl.style.cssText = `opacity:0.6;font-size:14px;`
        pbEl.textContent = `PB ${formatTime(personalBestMs)}`
        rightGroup.appendChild(pbEl)
    }

    const divider2 = document.createElement('span')
    divider2.style.cssText = `margin-left:10px;margin-right:10px;opacity:0.5;`
    divider2.textContent = '|'
    timeEl = document.createElement('span')
    timeEl.textContent = '0:00'
    rightGroup.appendChild(divider2)
    rightGroup.appendChild(timeEl)

    root.appendChild(leftGroup)
    root.appendChild(scoreEl)
    root.appendChild(rightGroup)

    document.body.appendChild(root)
}

export function updateSimpleScoreBar(score: number, turnsLeft: number, total: number, elapsedMs: number): void {
    if (!root) return

    const answered = total - turnsLeft
    const currentQuestion = Math.min(answered + 1, total)

    if (questionEl) questionEl.textContent = `${currentQuestion}/${total}`
    if (scoreEl) scoreEl.textContent = `${score}p`
    if (timeEl) timeEl.textContent = formatTime(elapsedMs)
}

export function disposeSimpleScoreBar(): void {
    if (root) {
        root.remove()
        root = null
    }
    questionEl = scoreEl = timeEl = pbEl = null
    totalQuestions = 0
    personalBestMs = null
}

/** Set banner offset (call when Android app banner visibility changes) */
export function setSimpleScoreBarBannerOffset(offsetPx: number): void {
    bannerOffsetPx = offsetPx
    if (root) {
        root.style.top = `${BAR_TOP + bannerOffsetPx}px`
    }
}
