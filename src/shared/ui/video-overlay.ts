/**
 * Video Overlay — YouTube iframe panel for video questions
 *
 * Module-level state, plain functions (matches perf-overlay.ts pattern).
 * Simple iframe approach — no YouTube IFrame API needed.
 *
 * Panel is centered on screen (same position as the question card) with the
 * prompt text shown below the video inside the same frame.
 * Constrained to max 25% of viewport height.
 * Click to hide/show animation (slides under score bar).
 */

import { SCORE_BAR_BOTTOM, SCORE_BAR_GAP } from './score-bar'

let clipWrapper: HTMLDivElement | null = null
let container: HTMLDivElement | null = null
let visible = false
let isHidden = false

/**
 * Show a YouTube video panel centered on screen.
 * Globe remains visible and rotatable underneath.
 *
 * @param youtubeId - YouTube video ID
 * @param prompt - Question text shown below the video
 * @param startTime - Start time in seconds (optional)
 * @param endTime - End time in seconds (optional)
 */
export function showVideoOverlay(
    youtubeId: string,
    prompt: string,
    startTime?: number,
    endTime?: number
): void {
    // Remove any existing overlay first
    hideVideoOverlay()

    visible = true

    // Build embed URL
    // loop+playlist prevents the end-screen with related videos
    // modestbranding hides the YT logo, iv_load_policy=3 hides annotations
    let embedUrl = `https://www.youtube.com/embed/${youtubeId}` +
        `?autoplay=1&controls=0&rel=0&modestbranding=1&iv_load_policy=3` +
        `&loop=1&playlist=${youtubeId}`
    if (startTime !== undefined) embedUrl += `&start=${Math.floor(startTime)}`
    if (endTime !== undefined) embedUrl += `&end=${Math.floor(endTime)}`

    // Clipping wrapper — masks content above score bar
    clipWrapper = document.createElement('div')
    const clipTop = SCORE_BAR_BOTTOM - SCORE_BAR_GAP
    clipWrapper.style.cssText =
        `position:fixed;top:${clipTop}px;left:0;right:0;bottom:0;` +
        'overflow:hidden;pointer-events:none;z-index:50;'

    // Container — centered horizontally, positioned inside clip wrapper
    container = document.createElement('div')
    container.style.cssText =
        'position:absolute;top:0;left:50%;transform:translateX(-50%);' +
        'display:flex;flex-direction:column;' +
        'border-radius:8px;overflow:hidden;' +
        'box-shadow:0 4px 24px rgba(0,0,0,0.5);' +
        'background:#111;pointer-events:auto;' +
        'transition:top 0.3s ease-in-out;'
    container.dataset.baseTop = '0'
    isHidden = false

    // Iframe wrapper — fixed height, aspect ratio determines width
    const iframeWrap = document.createElement('div')
    iframeWrap.style.cssText =
        'position:relative;height:25vh;aspect-ratio:16/9;overflow:hidden;'

    const iframe = document.createElement('iframe')
    iframe.src = embedUrl
    iframe.allow = 'autoplay; encrypted-media'
    iframe.style.cssText = 'width:100%;height:100%;border:none;'

    iframeWrap.appendChild(iframe)

    // Opaque gradient over the top of the iframe to hide the YouTube title
    const titleCover = document.createElement('div')
    titleCover.style.cssText =
        'position:absolute;top:0;left:0;right:0;height:60px;' +
        'background:linear-gradient(to bottom, rgba(0,0,0,0.9), transparent);' +
        'pointer-events:none;z-index:1;'
    iframeWrap.appendChild(titleCover)

    container.appendChild(iframeWrap)

    // Prompt bar with text and toggle button
    const promptBar = document.createElement('div')
    promptBar.style.cssText =
        'display:flex;align-items:center;padding:12px 16px;gap:8px;cursor:pointer;min-height:40px;'

    const promptEl = document.createElement('div')
    promptEl.textContent = prompt
    promptEl.style.cssText =
        'flex:1;color:#fff;font-family:Arial,sans-serif;font-size:16px;font-weight:600;' +
        'text-align:center;'

    const toggleBtn = document.createElement('div')
    toggleBtn.style.cssText =
        'width:24px;height:24px;display:flex;align-items:center;justify-content:center;' +
        'color:#fff;font-size:16px;opacity:0.7;'
    toggleBtn.textContent = '▼'

    promptBar.appendChild(promptEl)
    promptBar.appendChild(toggleBtn)
    container.appendChild(promptBar)

    clipWrapper.appendChild(container)
    document.body.appendChild(clipWrapper)

    // Toggle hide/show animation
    const toggleHide = () => {
        if (!container) return
        const baseTop = Number(container.dataset.baseTop)
        const cardHeight = container.offsetHeight

        if (isHidden) {
            container.style.top = `${baseTop}px`
            toggleBtn.textContent = '▼'
            isHidden = false
        } else {
            const hiddenTop = baseTop - (cardHeight * 0.9)
            container.style.top = `${hiddenTop}px`
            toggleBtn.textContent = '▲'
            isHidden = true
        }
    }

    // Click on prompt bar to toggle
    promptBar.addEventListener('click', toggleHide)
}

/**
 * Remove the video panel from the DOM.
 */
export function hideVideoOverlay(): void {
    if (clipWrapper) {
        clipWrapper.remove()
        clipWrapper = null
        container = null
    }
    visible = false
    isHidden = false
}

/**
 * Whether the video overlay is currently visible.
 */
export function isVideoVisible(): boolean {
    return visible
}
