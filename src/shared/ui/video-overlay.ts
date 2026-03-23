/**
 * Video Overlay — YouTube iframe panel for video questions
 *
 * Module-level state, plain functions (matches perf-overlay.ts pattern).
 * Simple iframe approach — no YouTube IFrame API needed.
 *
 * Panel is centered on screen (same position as the question card) with the
 * prompt text shown below the video inside the same frame.
 * Constrained to max 25% of viewport height.
 */

import { SCORE_BAR_BOTTOM } from './score-bar'

let container: HTMLDivElement | null = null
let visible = false

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

    // Container — centered horizontally, top-aligned
    container = document.createElement('div')
    container.style.cssText =
        `position:fixed;top:${SCORE_BAR_BOTTOM}px;left:50%;transform:translateX(-50%);z-index:500;` +
        'display:flex;flex-direction:column;' +
        'border-radius:8px;overflow:hidden;' +
        'box-shadow:0 4px 24px rgba(0,0,0,0.5);' +
        'background:#111;pointer-events:auto;'

    // Iframe wrapper — fixed height, aspect ratio determines width
    const iframeWrap = document.createElement('div')
    iframeWrap.style.cssText =
        'height:25vh;aspect-ratio:16/9;overflow:hidden;'

    const iframe = document.createElement('iframe')
    iframe.src = embedUrl
    iframe.allow = 'autoplay; encrypted-media'
    iframe.style.cssText = 'width:100%;height:100%;border:none;'

    iframeWrap.appendChild(iframe)
    container.appendChild(iframeWrap)

    // Prompt text
    const promptEl = document.createElement('div')
    promptEl.textContent = prompt
    promptEl.style.cssText =
        'padding:8px 16px;color:#fff;font-family:Arial,sans-serif;font-size:16px;font-weight:600;' +
        'text-align:center;flex-shrink:0;'
    container.appendChild(promptEl)

    document.body.appendChild(container)
}

/**
 * Remove the video panel from the DOM.
 */
export function hideVideoOverlay(): void {
    if (container) {
        container.remove()
        container = null
    }
    visible = false
}

/**
 * Whether the video overlay is currently visible.
 */
export function isVideoVisible(): boolean {
    return visible
}
