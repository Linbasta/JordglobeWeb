/**
 * Image Overlay — framed image panel for image questions
 *
 * Module-level state, plain functions (matches video-overlay.ts pattern).
 * Uses CSS border-image for 9-patch frame stretching.
 *
 * Two frame variants:
 *   "default" — photo frame with fixed 952:642 aspect ratio, prompt text overlaid,
 *               optional license badge in top-right corner
 *   "simple"  — blue rectangular frame (flags), no text
 */

import { SCORE_BAR_BOTTOM } from './score-bar'

let container: HTMLDivElement | null = null
let visible = false

/**
 * Show an image panel centered at top of screen.
 * Globe remains visible and clickable underneath.
 *
 * @param imageUrl - URL of the image to display
 * @param prompt - Question text shown overlaid on image (default frame only)
 * @param frame - Frame variant: "default" or "simple"
 * @param imageCredit - Photographer attribution (shown on badge click, default frame only)
 */
export function showImageOverlay(
    imageUrl: string,
    prompt: string,
    frame: "default" | "simple",
    imageCredit?: string
): void {
    hideImageOverlay()
    visible = true

    // Container — centered horizontally, top-aligned
    container = document.createElement('div')
    container.style.cssText =
        `position:fixed;top:${SCORE_BAR_BOTTOM}px;left:50%;transform:translateX(-50%);z-index:500;` +
        'pointer-events:auto;'

    // Wrapper — position:relative so the frame can be absolutely positioned on top
    const wrapper = document.createElement('div')
    wrapper.style.cssText = 'position:relative;display:inline-block;'

    if (frame === 'simple') {
        buildSimpleFrame(wrapper, imageUrl)
    } else {
        buildDefaultFrame(wrapper, imageUrl, prompt, imageCredit)
    }

    container.appendChild(wrapper)
    document.body.appendChild(container)
}

function buildDefaultFrame(
    wrapper: HTMLDivElement,
    imageUrl: string,
    prompt: string,
    imageCredit?: string
): void {
    // Fixed aspect ratio card: 952:642
    const ASPECT = 952 / 642
    const maxH = window.innerHeight * 0.35
    const maxW = window.innerWidth * 0.8
    let h = maxH, w = h * ASPECT
    if (w > maxW) { w = maxW; h = w / ASPECT }

    // Image container with fixed aspect ratio
    const imgContainer = document.createElement('div')
    imgContainer.style.cssText =
        `width:${w}px;height:${h}px;overflow:hidden;position:relative;border-radius:4px;`

    const img = document.createElement('img')
    img.src = imageUrl
    img.style.cssText =
        'width:100%;height:100%;object-fit:cover;display:block;'
    imgContainer.appendChild(img)

    // Prompt text — semitransparent at the bottom of the card
    if (prompt) {
        const textOverlay = document.createElement('div')
        textOverlay.style.cssText =
            'position:absolute;bottom:0;left:0;right:0;z-index:1;' +
            'background:linear-gradient(transparent, rgba(0,0,0,0.7));' +
            'padding:20px 16px 8px;' +
            'color:#fff;font-family:Arial,sans-serif;font-size:16px;font-weight:600;' +
            'text-align:center;'
        textOverlay.textContent = prompt
        imgContainer.appendChild(textOverlay)
    }

    // License badge — top-right corner
    const badge = document.createElement('img')
    badge.src = '/license-badge.png'
    badge.style.cssText =
        'position:absolute;top:6px;right:6px;z-index:2;' +
        'width:28px;height:28px;cursor:pointer;opacity:0.85;' +
        'filter:drop-shadow(0 1px 2px rgba(0,0,0,0.5));' +
        'transition:opacity 0.15s;'
    badge.onmouseenter = () => { badge.style.opacity = '1' }
    badge.onmouseleave = () => { badge.style.opacity = '0.85' }

    if (imageCredit) {
        badge.title = imageCredit
        badge.onclick = (e) => {
            e.stopPropagation()
            showCreditTooltip(badge, imageCredit, imgContainer)
        }
    }
    imgContainer.appendChild(badge)

    wrapper.appendChild(imgContainer)

    // Frame overlay — 9-patch border-image
    const frameEl = document.createElement('div')
    const frameSrc = '/frame-default.png'
    const overlap = 3
    const offsetY = 3
    const bw = 18
    frameEl.style.cssText =
        'position:absolute;pointer-events:none;' +
        `top:${-(bw - overlap) + offsetY}px;left:${-(bw - overlap)}px;right:${-(bw - overlap)}px;bottom:${-(bw - overlap) - offsetY}px;` +
        'border-style:solid;' +
        `border-width:${bw}px ${bw}px ${bw + 8}px ${bw}px;border-image:url("${frameSrc}") 40 40 55 40 fill stretch;`
    wrapper.appendChild(frameEl)
}

function buildSimpleFrame(wrapper: HTMLDivElement, imageUrl: string): void {
    const img = document.createElement('img')
    img.src = imageUrl
    img.style.cssText = 'display:block;'
    const pad = 8
    img.onload = () => {
        const ar = img.naturalWidth / img.naturalHeight
        const maxH = window.innerHeight * 0.25
        const maxW = window.innerWidth * 0.8
        let h = maxH, w = h * ar
        if (w > maxW) { w = maxW; h = w / ar }
        img.style.width = (w + pad * 2) + 'px'
        img.style.height = (h + pad * 2) + 'px'
        img.style.margin = `-${pad}px`
    }
    wrapper.appendChild(img)

    const frameEl = document.createElement('div')
    const frameSrc = '/frame-simple.png'
    const overlap = 3
    const bw = 16
    frameEl.style.cssText =
        'position:absolute;pointer-events:none;' +
        `top:${-(bw - overlap)}px;left:${-(bw - overlap)}px;right:${-(bw - overlap)}px;bottom:${-(bw - overlap)}px;` +
        'border-style:solid;' +
        `border-width:${bw}px;border-image:url("${frameSrc}") 50 50 50 50 fill stretch;`
    wrapper.appendChild(frameEl)

    // Scale-in animation
    wrapper.style.transform = 'scale(0)'
    wrapper.style.transition = 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)'
    requestAnimationFrame(() => { wrapper.style.transform = 'scale(1)' })
}

function showCreditTooltip(anchor: HTMLElement, credit: string, parent: HTMLElement): void {
    // Remove any existing tooltip
    const existing = parent.querySelector('.credit-tooltip')
    if (existing) { existing.remove(); return }

    const tooltip = document.createElement('div')
    tooltip.className = 'credit-tooltip'
    tooltip.style.cssText =
        'position:absolute;top:38px;right:6px;z-index:3;' +
        'background:rgba(0,0,0,0.85);color:#fff;' +
        'font-family:Arial,sans-serif;font-size:12px;' +
        'padding:6px 10px;border-radius:4px;max-width:220px;' +
        'white-space:normal;line-height:1.4;' +
        'pointer-events:auto;'
    tooltip.textContent = credit
    parent.appendChild(tooltip)

    // Auto-dismiss after 4s
    setTimeout(() => { tooltip.remove() }, 4000)
}

/**
 * Remove the image panel from the DOM.
 */
export function hideImageOverlay(): void {
    if (container) {
        container.remove()
        container = null
    }
    visible = false
}

/**
 * Whether the image overlay is currently visible.
 */
export function isImageVisible(): boolean {
    return visible
}
