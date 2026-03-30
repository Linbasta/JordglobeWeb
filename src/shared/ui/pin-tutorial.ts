/**
 * Pin Tutorial
 *
 * Shows a hand animation teaching users to drag the pin upward.
 * Displays once for new users, dismisses when they start dragging.
 */

const TUTORIAL_SEEN_KEY = 'pin-tutorial-seen'
const TUTORIAL_DELAY_MS = 5000

let tutorialElement: HTMLDivElement | null = null
let dismissCallback: (() => void) | null = null
let pendingTimer: number | null = null

/**
 * Detect if user is on a mobile device
 */
function isMobile(): boolean {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

/**
 * Check if tutorial was already shown
 */
function wasSeen(): boolean {
    try {
        return localStorage.getItem(TUTORIAL_SEEN_KEY) === 'true'
    } catch {
        return false
    }
}

/**
 * Mark tutorial as seen
 */
function markSeen(): void {
    try {
        localStorage.setItem(TUTORIAL_SEEN_KEY, 'true')
    } catch {
        // localStorage not available
    }
}

/**
 * Create the tutorial overlay element
 */
function createTutorialElement(): HTMLDivElement {
    const container = document.createElement('div')
    container.id = 'pin-tutorial'
    // Position to match pin button location
    container.style.cssText = `
        position: fixed;
        bottom: -12vh;
        left: calc(50% + 130px);
        transform: translateX(-50%);
        pointer-events: none;
        z-index: 200;
        opacity: 1;
    `

    const hand = document.createElement('img')
    hand.src = '/PointWhite0006.png'
    hand.style.cssText = `
        width: 160px;
        height: auto;
        animation: pinTutorialDrag 1.8s ease-in-out infinite;
    `

    // Add keyframes animation (move up, jump cut back to start)
    const style = document.createElement('style')
    style.textContent = `
        @keyframes pinTutorialDrag {
            0% {
                transform: translateY(0);
            }
            80% {
                transform: translateY(-220px);
            }
            100% {
                transform: translateY(-220px);
            }
        }
    `
    document.head.appendChild(style)

    container.appendChild(hand)

    // Add instructional text on desktop
    if (!isMobile()) {
        const text = document.createElement('div')
        text.style.cssText = `
            color: white;
            font-size: 18px;
            font-weight: bold;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            text-shadow:
                -1px -1px 0 #000,
                 1px -1px 0 #000,
                -1px  1px 0 #000,
                 1px  1px 0 #000;
            text-align: center;
            margin-top: 10px;
            white-space: nowrap;
        `
        text.textContent = 'Pick up the pin or right-click to answer'
        container.appendChild(text)
    }

    return container
}

/**
 * Remove the tutorial from DOM
 */
function removeTutorial(): void {
    if (tutorialElement) {
        tutorialElement.remove()
        tutorialElement = null
    }
    if (dismissCallback) {
        dismissCallback()
        dismissCallback = null
    }
}

/**
 * Show the pin drag tutorial after a delay
 * @param force - If true, show even if already seen (and show immediately)
 */
export function showPinTutorial(force = false): void {
    // Don't show if already seen (unless forced)
    if (!force && wasSeen()) {
        return
    }

    // Don't show/schedule multiple times
    if (tutorialElement || pendingTimer) {
        return
    }

    if (force) {
        // Show immediately when forced (debug)
        displayTutorial()
    } else {
        // Schedule to show after delay
        pendingTimer = window.setTimeout(() => {
            pendingTimer = null
            displayTutorial()
        }, TUTORIAL_DELAY_MS)
    }
}

/**
 * Actually display the tutorial
 */
function displayTutorial(): void {
    if (tutorialElement) return

    // Mark as seen
    markSeen()

    // Create and show - loops until user picks up pin
    tutorialElement = createTutorialElement()
    document.body.appendChild(tutorialElement)
}

/**
 * Dismiss the tutorial early (e.g., when user starts dragging)
 * Also cancels pending tutorial if it hasn't shown yet
 */
export function dismissPinTutorial(): void {
    // Cancel pending timer
    if (pendingTimer) {
        clearTimeout(pendingTimer)
        pendingTimer = null
    }

    // Remove tutorial if showing
    if (tutorialElement) {
        removeTutorial()
    }
}

/**
 * Register a callback for when tutorial is dismissed
 */
export function onTutorialDismiss(callback: () => void): void {
    dismissCallback = callback
}

/**
 * Check if tutorial is currently showing
 */
export function isTutorialShowing(): boolean {
    return tutorialElement !== null
}

/**
 * Reset tutorial state (for testing)
 */
export function resetPinTutorial(): void {
    try {
        localStorage.removeItem(TUTORIAL_SEEN_KEY)
    } catch {
        // localStorage not available
    }
}

/**
 * Adjust tutorial position (for debugging)
 * Usage in console: setTutorialPos(50) or setTutorialPos(-20)
 */
export function setTutorialXOffset(xOffsetPx: number): void {
    if (tutorialElement) {
        tutorialElement.style.left = `calc(50% + ${xOffsetPx}px)`
        console.log(`Tutorial X offset set to ${xOffsetPx}px`)
    } else {
        console.log('Tutorial not showing. Press T first.')
    }
}

// Expose to window for console access
if (typeof window !== 'undefined') {
    (window as any).setTutorialPos = setTutorialXOffset
}
