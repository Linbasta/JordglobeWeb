/**
 * Loading Screen — injects loading screen DOM + CSS
 *
 * Creates the same #loadingScreen / #loadingProgress / #loadingText elements
 * that BaseGameController queries by ID. Call before constructing the controller.
 */

let styleEl: HTMLStyleElement | null = null
let screenEl: HTMLDivElement | null = null

export function createLoadingScreen(title: string): void {
    disposeLoadingScreen()

    // Inject CSS
    styleEl = document.createElement('style')
    styleEl.textContent = `
        #loadingScreen {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: linear-gradient(135deg, #0a0e27 0%, #1a1e3e 100%);
            display: flex; flex-direction: column;
            justify-content: center; align-items: center;
            z-index: 10000; opacity: 1;
            transition: opacity 0.5s;
        }
        #loadingScreen.hidden {
            opacity: 0; pointer-events: none;
        }
        #loadingScreen h2 {
            color: #fff; font-family: Arial, sans-serif;
            font-size: 32px; margin-bottom: 30px;
        }
        .loading-bar {
            width: 400px; height: 8px;
            background: rgba(255,255,255,0.1);
            border-radius: 4px; overflow: hidden;
            margin-bottom: 20px;
        }
        .loading-progress {
            height: 100%;
            background: linear-gradient(90deg, #4CAF50, #8BC34A);
            width: 0%; transition: width 0.3s;
        }
        .loading-text {
            color: rgba(255,255,255,0.7);
            font-family: Arial, sans-serif; font-size: 14px;
        }
    `
    document.head.appendChild(styleEl)

    // Inject HTML
    screenEl = document.createElement('div')
    screenEl.id = 'loadingScreen'
    screenEl.innerHTML =
        `<h2>${title}</h2>` +
        `<div class="loading-bar"><div class="loading-progress" id="loadingProgress"></div></div>` +
        `<div class="loading-text" id="loadingText">Initializing...</div>`
    document.body.appendChild(screenEl)
}

export function disposeLoadingScreen(): void {
    if (styleEl) { styleEl.remove(); styleEl = null }
    if (screenEl) { screenEl.remove(); screenEl = null }
}
