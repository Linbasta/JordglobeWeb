/**
 * Answer Feedback Overlay — shows Checkmark or RedX image at a given screen
 * position (where the player placed their pin), then fades out.
 *
 * Module-level state, plain functions.
 */

let img: HTMLImageElement | null = null
let fadeTimer: ReturnType<typeof setTimeout> | null = null

const SHOW_DURATION = 400   // ms fully visible
const FADE_DURATION = 300   // ms fade-out
const IMG_SIZE = 128        // px

// Preload images once at module load to avoid repeated network requests
const preloadedImages: Map<string, HTMLImageElement> = new Map()

function preloadImage(src: string): void {
    const image = new Image()
    image.src = src
    preloadedImages.set(src, image)
}

preloadImage('/Checkmark.png')
preloadImage('/RedX.png')

export function showCorrectFeedback(x: number, y: number): void {
    showFeedback('/Checkmark.png', x, y)
}

export function showWrongFeedback(x: number, y: number): void {
    showFeedback('/RedX.png', x, y)
}

function showFeedback(src: string, x: number, y: number): void {
    dispose()

    // Clone preloaded image to avoid triggering new requests
    const preloaded = preloadedImages.get(src)
    img = preloaded ? preloaded.cloneNode() as HTMLImageElement : document.createElement('img')
    if (!preloaded) img.src = src  // Fallback if preload failed
    img.style.cssText =
        `position:absolute;left:${x}px;top:${y}px;` +
        `width:${IMG_SIZE}px;height:${IMG_SIZE}px;` +
        `transform:translate(-50%,-50%) scale(0.5);` +
        `pointer-events:none;z-index:300;` +
        `opacity:0;transition:opacity ${FADE_DURATION}ms ease-out, transform 0.15s ease-out;`

    document.body.appendChild(img)

    // Pop in on next frame
    requestAnimationFrame(() => {
        if (!img) return
        img.style.opacity = '1'
        img.style.transform = 'translate(-50%,-50%) scale(1)'
    })

    // Start fade-out after SHOW_DURATION
    fadeTimer = setTimeout(() => {
        if (!img) return
        img.style.opacity = '0'
        img.style.transform = 'translate(-50%,-50%) scale(0.8)'
        // Remove after fade completes
        fadeTimer = setTimeout(() => {
            dispose()
        }, FADE_DURATION)
    }, SHOW_DURATION)
}

function dispose(): void {
    if (fadeTimer) {
        clearTimeout(fadeTimer)
        fadeTimer = null
    }
    if (img) {
        img.remove()
        img = null
    }
}
