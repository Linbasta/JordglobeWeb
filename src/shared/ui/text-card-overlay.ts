/**
 * Text Card Overlay — styled card for longer text questions
 *
 * Uses BlueButton.png as background with white rectangle for text.
 * Click to hide/show animation (slides under score bar).
 */

import { SCORE_BAR_BOTTOM, SCORE_BAR_GAP } from './score-bar'

let clipWrapper: HTMLDivElement | null = null
let container: HTMLDivElement | null = null
let visible = false
let isHidden = false
let bannerOffsetPx = 0

/**
 * Show a text card centered at top of screen.
 * Globe remains visible and clickable underneath.
 *
 * @param prompt - Question text to display
 */
export function showTextCardOverlay(prompt: string): void {
    hideTextCardOverlay()
    visible = true

    // Clipping wrapper — masks content above score bar
    clipWrapper = document.createElement('div')
    const clipTop = SCORE_BAR_BOTTOM + bannerOffsetPx - SCORE_BAR_GAP
    clipWrapper.style.cssText =
        `position:fixed;top:${clipTop}px;left:0;right:0;bottom:0;` +
        'overflow:hidden;pointer-events:none;z-index:50;'

    // Container — centered horizontally, positioned inside clip wrapper
    container = document.createElement('div')
    container.style.cssText =
        'position:absolute;top:0;left:50%;transform:translateX(-50%);' +
        'pointer-events:auto;transition:top 0.3s ease-in-out;cursor:pointer;'
    container.dataset.baseTop = '0'
    isHidden = false

    // Card dimensions
    const cardWidth = Math.min(400, window.innerWidth * 0.85)
    const cardPadding = 12

    // Outer card — blue button background
    const card = document.createElement('div')
    card.style.cssText =
        `width:${cardWidth}px;position:relative;` +
        'border-style:solid;border-width:4px;' +
        'border-image:url("/BlueButton.png") 33 33 33 33 fill stretch;' +
        'box-sizing:border-box;'

    // Inner white area — no rounded corners, minimal gap
    const whiteArea = document.createElement('div')
    whiteArea.style.cssText =
        'background:#fff;' +
        `padding:${cardPadding}px;` +
        'min-height:60px;'

    // Question text
    const textEl = document.createElement('div')
    textEl.style.cssText =
        'color:#333;font-family:Arial,sans-serif;font-size:18px;' +
        'font-weight:500;text-align:center;line-height:1.4;'
    textEl.textContent = prompt

    whiteArea.appendChild(textEl)
    card.appendChild(whiteArea)
    container.appendChild(card)
    clipWrapper.appendChild(container)
    document.body.appendChild(clipWrapper)

    // Click to toggle hide/show animation
    container.addEventListener('click', () => {
        if (!container) return
        const baseTop = Number(container.dataset.baseTop)
        const cardHeight = container.offsetHeight

        if (isHidden) {
            container.style.top = `${baseTop}px`
            isHidden = false
        } else {
            const hiddenTop = baseTop - (cardHeight * 0.9)
            container.style.top = `${hiddenTop}px`
            isHidden = true
        }
    })
}

/**
 * Remove the text card from the DOM.
 */
export function hideTextCardOverlay(): void {
    if (clipWrapper) {
        clipWrapper.remove()
        clipWrapper = null
        container = null
    }
    visible = false
    isHidden = false
}

/**
 * Whether the text card is currently visible.
 */
export function isTextCardVisible(): boolean {
    return visible
}

/** Set banner offset (call when Android app banner visibility changes) */
export function setTextCardBannerOffset(offsetPx: number): void {
    bannerOffsetPx = offsetPx
    if (clipWrapper) {
        const clipTop = SCORE_BAR_BOTTOM + bannerOffsetPx - SCORE_BAR_GAP
        clipWrapper.style.top = `${clipTop}px`
    }
}
