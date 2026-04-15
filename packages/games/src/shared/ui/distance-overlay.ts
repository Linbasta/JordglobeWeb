/**
 * Distance Overlay — centered screen text showing location name + km distance
 *
 * Module-level state, plain functions (matches score-hud.ts pattern).
 */

let container: HTMLDivElement | null = null

export function showDistanceOverlay(distKm: number, locationName: string): void {
    hideDistanceOverlay()

    container = document.createElement('div')
    container.style.cssText =
        'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);' +
        'color:#fff;font-family:Arial,sans-serif;text-align:center;' +
        'text-shadow:0 2px 8px rgba(0,0,0,0.7);' +
        'z-index:200;pointer-events:none;' +
        'opacity:0;transition:opacity 0.3s ease-in;'

    const nameLine = document.createElement('div')
    nameLine.style.cssText = 'font-size:32px;font-weight:bold;margin-bottom:8px;'
    nameLine.textContent = locationName

    const distLine = document.createElement('div')
    distLine.style.cssText = 'font-size:48px;font-weight:bold;'
    distLine.textContent = `${Math.round(distKm)} km`

    container.appendChild(nameLine)
    container.appendChild(distLine)
    document.body.appendChild(container)

    // Trigger fade-in on next frame
    requestAnimationFrame(() => {
        if (container) container.style.opacity = '1'
    })
}

export function hideDistanceOverlay(): void {
    if (container) {
        container.remove()
        container = null
    }
}
