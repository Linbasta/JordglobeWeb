/**
 * End Game Overlay — shows quiz results with retry/menu options
 *
 * Displays score, time, and celebration if perfect score.
 * Module-level state, plain functions (consistent with other overlays).
 */

// ── DOM elements ──
let backdrop: HTMLDivElement | null = null
let container: HTMLDivElement | null = null

// ── Constants ──
const BACKDROP_COLOR = 'rgba(0, 0, 0, 0.6)'
const CARD_WIDTH = 320
const BUTTON_HEIGHT = 50

/**
 * Show the end game overlay with score and time
 *
 * @param score - Number of correct answers
 * @param total - Total number of questions
 * @param elapsedMs - Time taken in milliseconds
 * @param onRetry - Callback when retry button clicked
 * @param onMoreMedals - Callback when more medals button clicked
 */
export function showEndGameOverlay(
    score: number,
    total: number,
    elapsedMs: number,
    onRetry: () => void,
    onMoreMedals: () => void
): void {
    hideEndGameOverlay()

    const isPerfect = score === total

    // Format time as m:ss or mm:ss
    const totalSeconds = Math.floor(elapsedMs / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`

    // Backdrop
    backdrop = document.createElement('div')
    backdrop.style.cssText =
        `position:fixed;inset:0;background:${BACKDROP_COLOR};z-index:200;` +
        'display:flex;align-items:center;justify-content:center;' +
        'opacity:0;transition:opacity 0.3s ease-in-out;'

    // Container card
    container = document.createElement('div')
    container.style.cssText =
        `width:${CARD_WIDTH}px;` +
        'border-style:solid;border-width:10px;' +
        'border-image:url("/BlueButton.png") 20 20 20 20 fill stretch;' +
        'box-sizing:border-box;' +
        'transform:scale(0.8);opacity:0;' +
        'transition:transform 0.3s ease-out, opacity 0.3s ease-out;'

    // Inner content area
    const content = document.createElement('div')
    content.style.cssText =
        'background:#fff;padding:24px;text-align:center;'

    // Title
    const title = document.createElement('div')
    title.style.cssText =
        'font-family:Arial,sans-serif;font-weight:bold;' +
        `font-size:${isPerfect ? '28px' : '24px'};` +
        `color:${isPerfect ? '#4caf50' : '#333'};` +
        'margin-bottom:16px;'
    title.textContent = isPerfect ? 'Congratulations!' : 'Quiz Complete!'

    // Score display
    const scoreEl = document.createElement('div')
    scoreEl.style.cssText =
        'font-family:Arial,sans-serif;font-size:18px;color:#666;' +
        'margin-bottom:8px;'
    scoreEl.textContent = `${score} / ${total} correct`

    // Time display
    const timeEl = document.createElement('div')
    timeEl.style.cssText =
        'font-family:Arial,sans-serif;' +
        `font-size:${isPerfect ? '32px' : '18px'};` +
        `font-weight:${isPerfect ? 'bold' : 'normal'};` +
        `color:${isPerfect ? '#4caf50' : '#666'};` +
        'margin-bottom:24px;'
    timeEl.textContent = isPerfect ? timeStr : `Time: ${timeStr}`

    // Buttons container
    const buttons = document.createElement('div')
    buttons.style.cssText = 'display:flex;flex-direction:column;gap:12px;'

    // Retry button
    const retryBtn = createButton('Retry', () => {
        hideEndGameOverlay()
        onRetry()
    })

    // More medals button
    const moreMedalsBtn = createButton('More Medals', () => {
        hideEndGameOverlay()
        onMoreMedals()
    })

    buttons.appendChild(retryBtn)
    buttons.appendChild(moreMedalsBtn)

    content.appendChild(title)
    content.appendChild(scoreEl)
    content.appendChild(timeEl)
    content.appendChild(buttons)

    container.appendChild(content)
    backdrop.appendChild(container)
    document.body.appendChild(backdrop)

    // Trigger animations
    requestAnimationFrame(() => {
        if (backdrop) backdrop.style.opacity = '1'
        if (container) {
            container.style.transform = 'scale(1)'
            container.style.opacity = '1'
        }
    })
}

/**
 * Hide and remove the end game overlay
 */
export function hideEndGameOverlay(): void {
    if (backdrop) {
        backdrop.remove()
        backdrop = null
        container = null
    }
}

/**
 * Create a styled button with BlueButton.png background
 */
function createButton(text: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button')
    btn.style.cssText =
        `width:100%;height:${BUTTON_HEIGHT}px;` +
        'border:none;background:none;cursor:pointer;' +
        'font-family:Arial,sans-serif;font-size:18px;font-weight:bold;' +
        'color:#fff;' +
        'border-style:solid;border-width:8px;' +
        'border-image:url("/BlueButton.png") 20 20 20 20 fill stretch;' +
        'transition:transform 0.1s ease-out;'

    btn.textContent = text

    btn.addEventListener('mouseenter', () => {
        btn.style.transform = 'scale(1.05)'
    })
    btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'scale(1)'
    })
    btn.addEventListener('click', onClick)

    return btn
}
