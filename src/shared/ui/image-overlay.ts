/**
 * Image Overlay — framed image panel for image questions
 *
 * Module-level state, plain functions (matches video-overlay.ts pattern).
 * Uses CSS border-image for 9-patch frame stretching.
 *
 * Two frame variants:
 *   "default" — photo frame with rounded corners + shadow, prompt text overlaid
 *   "simple"  — blue rectangular frame (flags), no text
 */

let container: HTMLDivElement | null = null
let visible = false

/**
 * Show an image panel centered at top of screen.
 * Globe remains visible and clickable underneath.
 *
 * @param imageUrl - URL of the image to display
 * @param prompt - Question text shown overlaid on image (default frame only)
 * @param frame - Frame variant: "default" or "simple"
 */
export function showImageOverlay(
    imageUrl: string,
    prompt: string,
    frame: "default" | "simple"
): void {
    hideImageOverlay()
    visible = true

    // Container — centered horizontally, top-aligned
    container = document.createElement('div')
    container.style.cssText =
        'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:500;' +
        'pointer-events:auto;'

    // Wrapper — position:relative so the frame can be absolutely positioned on top
    const wrapper = document.createElement('div')
    wrapper.style.cssText = 'position:relative;display:inline-block;'

    // Image element
    const img = document.createElement('img')
    img.src = imageUrl

    if (frame === 'simple') {
        // Explicit sizing + negative margin: the flag renders pad px larger than the
        // layout box on each side. The frame's inner border (bw - overlap = 13px)
        // covers the overhang, eliminating the air gap without overflow issues.
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
    } else {
        img.style.cssText = 'max-height:25vh;max-width:80vw;display:block;object-fit:contain;'
    }

    wrapper.appendChild(img)

    // Frame overlay — absolutely positioned on top of the image
    // Uses border-image for 9-patch stretching. The frame div extends outward
    // from the image edges by the border-width, minus a small overlap so the
    // inner edge of the frame sits a few px on top of the flag.
    //
    // Reference: ImageTextCardC.cs — frame is asymmetric (thicker bottom for shadow)
    // borderTop=10, borderBottom=18, marginY=2
    const frameEl = document.createElement('div')
    const frameSrc = frame === 'simple' ? '/frame-simple.png' : '/frame-default.png'

    // How many px the frame inner edge overlaps the image
    const overlap = 3
    // Asymmetric Y: frame bottom is thicker, shift frame down to compensate
    // Flag should sit ~1px below frame center
    const offsetY = frame === 'simple' ? 0 : 3
    // Border widths for 9-patch rendering
    const bw = frame === 'simple' ? 16 : 18

    frameEl.style.cssText =
        'position:absolute;pointer-events:none;' +
        `top:${-(bw - overlap) + offsetY}px;left:${-(bw - overlap)}px;right:${-(bw - overlap)}px;bottom:${-(bw - overlap) - offsetY}px;` +
        'border-style:solid;' +
        (frame === 'simple'
            ? `border-width:${bw}px;border-image:url("${frameSrc}") 50 50 50 50 fill stretch;`
            : `border-width:${bw}px ${bw}px ${bw + 8}px ${bw}px;border-image:url("${frameSrc}") 40 40 55 40 fill stretch;`)

    wrapper.appendChild(frameEl)

    // Prompt text overlay (default frame only)
    if (frame === 'default' && prompt) {
        const textOverlay = document.createElement('div')
        textOverlay.style.cssText =
            'position:absolute;bottom:0;left:0;right:0;z-index:1;' +
            'background:linear-gradient(transparent, rgba(0,0,0,0.7));' +
            'padding:20px 16px 8px;' +
            'color:#fff;font-family:Arial,sans-serif;font-size:16px;font-weight:600;' +
            'text-align:center;'
        textOverlay.textContent = prompt
        wrapper.appendChild(textOverlay)
    }

    // Scale-in animation (simple frame only)
    if (frame === 'simple') {
        wrapper.style.transform = 'scale(0)'
        wrapper.style.transition = 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)'
        requestAnimationFrame(() => { wrapper.style.transform = 'scale(1)' })
    }

    container.appendChild(wrapper)
    document.body.appendChild(container)
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
