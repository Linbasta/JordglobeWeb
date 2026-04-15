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

import { SCORE_BAR_BOTTOM, SCORE_BAR_GAP } from './score-bar'
import { asset } from '../asset-path'

const SIMPLE_FRAME_TOP_MARGIN = 12  // Gap between score bar and simple frame (flags)

let clipWrapper: HTMLDivElement | null = null  // Clipping container
let container: HTMLDivElement | null = null
let visible = false
let isHidden = false  // Track if card is slid up under score bar
let bannerOffsetPx = 0

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

    // Simple frame (flags): positioned below score bar, no clipping, no hide behavior
    if (frame === 'simple') {
        clipWrapper = document.createElement('div')
        const simpleTop = SCORE_BAR_BOTTOM + bannerOffsetPx + SIMPLE_FRAME_TOP_MARGIN
        clipWrapper.style.cssText =
            `position:fixed;top:${simpleTop}px;left:0;right:0;pointer-events:none;z-index:50;` +
            'display:flex;justify-content:center;'

        container = document.createElement('div')
        container.style.cssText = 'pointer-events:auto;'
        isHidden = false

        const wrapper = document.createElement('div')
        wrapper.style.cssText = 'position:relative;display:inline-block;'
        buildSimpleFrame(wrapper, imageUrl)

        container.appendChild(wrapper)
        clipWrapper.appendChild(container)
        document.body.appendChild(clipWrapper)
        return
    }

    // Default frame: clipping wrapper masks content above score bar
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

    // Wrapper — position:relative so the frame can be absolutely positioned on top
    const wrapper = document.createElement('div')
    wrapper.style.cssText = 'position:relative;display:inline-block;'

    buildDefaultFrame(wrapper, imageUrl, prompt, imageCredit)

    container.appendChild(wrapper)
    clipWrapper.appendChild(container)
    document.body.appendChild(clipWrapper)

    // Click to toggle hide/show animation (default frame only)
    container.addEventListener('click', () => {
        if (!container) return
        const baseTop = Number(container.dataset.baseTop)
        const cardHeight = container.offsetHeight

        if (isHidden) {
            // Slide back down to original position
            container.style.top = `${baseTop}px`
            isHidden = false
        } else {
            // Slide up so only ~10% shows below score bar
            const hiddenTop = baseTop - (cardHeight * 0.9)
            container.style.top = `${hiddenTop}px`
            isHidden = true
        }
    })
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
        `width:${w}px;height:${h}px;overflow:hidden;position:relative;border-radius:12px;`

    const img = document.createElement('img')
    img.src = imageUrl
    img.style.cssText =
        'width:100%;height:100%;object-fit:cover;display:block;'
    imgContainer.appendChild(img)

    // Prompt text with gradient background
    if (prompt) {
        // Gradient layer — under the text
        const gradient = document.createElement('div')
        gradient.style.cssText =
            'position:absolute;bottom:0;left:0;right:0;height:25%;z-index:1;' +
            'background:linear-gradient(to bottom, transparent, rgba(0,0,0,0.95));' +
            'pointer-events:none;'
        imgContainer.appendChild(gradient)

        // Text layer — centered in bottom quarter
        const textOverlay = document.createElement('div')
        textOverlay.style.cssText =
            'position:absolute;bottom:0;left:0;right:0;height:25%;z-index:2;' +
            'display:flex;align-items:center;justify-content:center;' +
            'padding:8px 16px;box-sizing:border-box;' +
            'color:#fff;font-family:Arial,sans-serif;font-size:16px;font-weight:600;' +
            'text-align:center;'
        textOverlay.textContent = prompt
        imgContainer.appendChild(textOverlay)
    }

    wrapper.appendChild(imgContainer)

    // Frame overlay — 9-patch border-image
    const frameEl = document.createElement('div')
    const frameSrc = asset('frame-default.png')
    const overlapTop = 18
    const overlapSide = 17  // 1px less to extend frame beyond image
    const overlapBottom = 26
    const bw = 18
    const bwBottom = 26  // Bottom border is thicker in the frame image
    frameEl.style.cssText =
        'position:absolute;pointer-events:none;' +
        `top:${-(bw - overlapTop)}px;left:${-(bw - overlapSide)}px;right:${-(bw - overlapSide)}px;bottom:${-(bwBottom - overlapBottom)}px;` +
        'border-style:solid;' +
        `border-width:${bw}px ${bw}px ${bwBottom}px ${bw}px;` +
        `border-image-source:url("${frameSrc}");` +
        'border-image-slice:40 40 55 40;' +
        'border-image-repeat:stretch;z-index:10;'
    wrapper.appendChild(frameEl)

    // Credit label — top-right corner, under the frame
    const credit = (imageCredit || 'Image credit placeholder').replace(/^Photo:\s*/i, '')
    const creditLabel = document.createElement('div')
    creditLabel.style.cssText =
        'position:absolute;top:4px;right:4px;z-index:5;' +
        'background:rgba(0,0,0,0.15);color:rgba(255,255,255,0.8);' +
        'font-family:Arial,sans-serif;font-size:6px;' +
        'padding:1px 3px;border-radius:2px;max-width:150px;' +
        'line-height:1.2;'
    creditLabel.textContent = credit
    wrapper.appendChild(creditLabel)
}

function buildSimpleFrame(wrapper: HTMLDivElement, imageUrl: string): void {
    const img = document.createElement('img')
    img.src = imageUrl
    img.style.cssText = 'display:block;'
    const pad = 8
    img.onload = () => {
        const ar = img.naturalWidth / img.naturalHeight
        const maxH = window.innerHeight * 0.12  // Smaller for flags
        const maxW = window.innerWidth * 0.4
        let h = maxH, w = h * ar
        if (w > maxW) { w = maxW; h = w / ar }
        img.style.width = (w + pad * 2) + 'px'
        img.style.height = (h + pad * 2) + 'px'
        img.style.margin = `-${pad}px`
    }
    wrapper.appendChild(img)

    const frameEl = document.createElement('div')
    const frameSrc = asset('frame-simple.png')
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
        'position:absolute;top:44px;right:10px;z-index:200;' +
        'background:rgba(0,0,0,0.9);color:#fff;' +
        'font-family:Arial,sans-serif;font-size:13px;' +
        'padding:8px 12px;border-radius:6px;max-width:250px;' +
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
    if (clipWrapper) {
        clipWrapper.remove()
        clipWrapper = null
        container = null
    }
    visible = false
    isHidden = false
}

/**
 * Whether the image overlay is currently visible.
 */
export function isImageVisible(): boolean {
    return visible
}

/** Set banner offset (call when Android app banner visibility changes) */
export function setImageBannerOffset(offsetPx: number): void {
    bannerOffsetPx = offsetPx
    if (clipWrapper) {
        // For simple frame, top is SCORE_BAR_BOTTOM + offset + margin
        // For default frame, top is SCORE_BAR_BOTTOM + offset - gap
        // We check if it's a simple frame by looking at the overflow style
        const isSimple = clipWrapper.style.overflow !== 'hidden'
        const newTop = isSimple
            ? SCORE_BAR_BOTTOM + bannerOffsetPx + SIMPLE_FRAME_TOP_MARGIN
            : SCORE_BAR_BOTTOM + bannerOffsetPx - SCORE_BAR_GAP
        clipWrapper.style.top = `${newTop}px`
    }
}
