/**
 * Location Name Overlay — large centered text showing the correct location
 * name after the player answers. Used by quizzes with `answer: 'location-alternatives'`
 * (or similar) where the prompt didn't already reveal the answer (e.g. video-based quizzes).
 */

let container: HTMLDivElement | null = null

export function showLocationNameOverlay(name: string): void {
    hideLocationNameOverlay()

    container = document.createElement('div')
    container.style.cssText =
        'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);' +
        'color:#fff;font-family:Arial,sans-serif;text-align:center;' +
        'font-size:48px;font-weight:bold;' +
        'text-shadow:0 2px 8px rgba(0,0,0,0.7);' +
        'z-index:200;pointer-events:none;' +
        'opacity:0;transition:opacity 0.3s ease-in;'
    container.textContent = name

    document.body.appendChild(container)

    requestAnimationFrame(() => {
        if (container) container.style.opacity = '1'
    })
}

export function hideLocationNameOverlay(): void {
    if (container) {
        container.remove()
        container = null
    }
}
