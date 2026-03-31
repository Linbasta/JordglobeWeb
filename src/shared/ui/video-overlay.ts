/**
 * Video Overlay — YouTube iframe panel for video questions
 *
 * Uses YouTube IFrame API for proper segment looping within compilation videos.
 *
 * Panel is centered on screen (same position as the question card) with the
 * prompt text shown below the video inside the same frame.
 * Constrained to max 25% of viewport height.
 * Click to hide/show animation (slides under score bar).
 */

import { SCORE_BAR_BOTTOM, SCORE_BAR_GAP, PANEL_HEIGHT_VH, PANEL_ASPECT } from './score-bar'

// YouTube IFrame API types
declare global {
    interface Window {
        YT: {
            Player: new (elementId: string, config: YTPlayerConfig) => YTPlayer
            PlayerState: {
                PLAYING: number
                PAUSED: number
                ENDED: number
            }
        }
        onYouTubeIframeAPIReady: () => void
    }
}

interface YTPlayerConfig {
    videoId: string
    playerVars: Record<string, number | string>
    events?: {
        onReady?: (event: { target: YTPlayer }) => void
        onStateChange?: (event: { data: number; target: YTPlayer }) => void
    }
}

interface YTPlayer {
    getCurrentTime(): number
    seekTo(seconds: number, allowSeekAhead: boolean): void
    destroy(): void
}

let clipWrapper: HTMLDivElement | null = null
let container: HTMLDivElement | null = null
let visible = false
let isHidden = false
let ytPlayer: YTPlayer | null = null
let loopInterval: number | null = null
let apiReady = false
let apiReadyCallbacks: (() => void)[] = []

/**
 * Load YouTube IFrame API if not already loaded
 */
function ensureYouTubeAPI(): Promise<void> {
    return new Promise((resolve) => {
        if (apiReady && window.YT?.Player) {
            resolve()
            return
        }

        // Already loading, queue callback
        if (document.querySelector('script[src*="youtube.com/iframe_api"]')) {
            apiReadyCallbacks.push(resolve)
            return
        }

        // Load the API
        const script = document.createElement('script')
        script.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(script)

        const originalCallback = window.onYouTubeIframeAPIReady
        window.onYouTubeIframeAPIReady = () => {
            apiReady = true
            originalCallback?.()
            resolve()
            apiReadyCallbacks.forEach(cb => cb())
            apiReadyCallbacks = []
        }
    })
}

export interface VideoOverlayOptions {
    youtubeId: string
    prompt: string
    startTime?: number
    endTime?: number
    /** Hide top 15% of video (YouTube title overlay) */
    hideTop?: boolean
    /** Hide bottom center of video (country name in compilation) */
    hideBottom?: boolean
}

/**
 * Show a YouTube video panel centered on screen.
 * Globe remains visible and rotatable underneath.
 */
export async function showVideoOverlay(options: VideoOverlayOptions): Promise<void>
/**
 * @deprecated Use options object instead
 */
export async function showVideoOverlay(
    youtubeId: string,
    prompt: string,
    startTime?: number,
    endTime?: number,
    hideTitle?: boolean
): Promise<void>
export async function showVideoOverlay(
    optionsOrYoutubeId: VideoOverlayOptions | string,
    prompt?: string,
    startTime?: number,
    endTime?: number,
    hideTitle = false
): Promise<void> {
    // Normalize arguments
    const options: VideoOverlayOptions = typeof optionsOrYoutubeId === 'string'
        ? {
            youtubeId: optionsOrYoutubeId,
            prompt: prompt!,
            startTime,
            endTime,
            hideTop: hideTitle,
            hideBottom: hideTitle,
        }
        : optionsOrYoutubeId

    const { youtubeId, prompt: promptText, hideTop, hideBottom } = options
    const videoStartTime = options.startTime
    const videoEndTime = options.endTime
    // Remove any existing overlay first
    hideVideoOverlay()

    visible = true

    // Clipping wrapper — masks content above score bar
    clipWrapper = document.createElement('div')
    const clipTop = SCORE_BAR_BOTTOM - SCORE_BAR_GAP
    clipWrapper.style.cssText =
        `position:fixed;top:${clipTop}px;left:0;right:0;bottom:0;` +
        'overflow:hidden;pointer-events:none;z-index:50;'

    // Container — centered horizontally, positioned inside clip wrapper
    container = document.createElement('div')
    container.style.cssText =
        'position:absolute;top:0;left:50%;transform:translateX(-50%);' +
        'display:flex;flex-direction:column;' +
        'border-radius:8px;overflow:hidden;' +
        'box-shadow:0 4px 24px rgba(0,0,0,0.5);' +
        'background:#111;pointer-events:auto;' +
        'transition:top 0.3s ease-in-out;'
    container.dataset.baseTop = '0'
    isHidden = false

    // Iframe wrapper — fixed height, aspect ratio determines width
    const iframeWrap = document.createElement('div')
    iframeWrap.style.cssText =
        `position:relative;height:${PANEL_HEIGHT_VH}vh;aspect-ratio:${PANEL_ASPECT};overflow:hidden;`

    // Create placeholder div for YouTube player
    const playerDiv = document.createElement('div')
    playerDiv.id = 'yt-player-' + Date.now()
    playerDiv.style.cssText = 'width:100%;height:100%;'
    iframeWrap.appendChild(playerDiv)

    // Top bar - hides YouTube title overlay
    if (hideTop) {
        const topCover = document.createElement('div')
        topCover.style.cssText =
            'position:absolute;top:0;left:0;right:0;height:15%;' +
            'background:#000;pointer-events:none;z-index:1;'
        iframeWrap.appendChild(topCover)
    }

    // Bottom bar - hides country name overlay in compilation video
    // Centered, 35% width, 12% height, 10% from bottom
    if (hideBottom) {
        const bottomCover = document.createElement('div')
        bottomCover.style.cssText =
            'position:absolute;bottom:10%;left:50%;transform:translateX(-50%);' +
            'width:45%;height:12%;' +
            'background:#000;pointer-events:none;z-index:1;'
        iframeWrap.appendChild(bottomCover)
    }

    container.appendChild(iframeWrap)

    // Prompt bar with text and toggle button
    const promptBar = document.createElement('div')
    promptBar.style.cssText =
        'display:flex;align-items:center;padding:12px 16px;gap:8px;cursor:pointer;min-height:40px;'

    const promptEl = document.createElement('div')
    promptEl.textContent = promptText
    promptEl.style.cssText =
        'flex:1;color:#fff;font-family:Arial,sans-serif;font-size:16px;font-weight:600;' +
        'text-align:center;'

    const toggleBtn = document.createElement('div')
    toggleBtn.style.cssText =
        'width:24px;height:24px;display:flex;align-items:center;justify-content:center;' +
        'color:#fff;font-size:16px;opacity:0.7;'
    toggleBtn.textContent = '▼'

    promptBar.appendChild(promptEl)
    promptBar.appendChild(toggleBtn)
    container.appendChild(promptBar)

    clipWrapper.appendChild(container)
    document.body.appendChild(clipWrapper)

    // Toggle hide/show animation
    const toggleHide = () => {
        if (!container) return
        const baseTop = Number(container.dataset.baseTop)
        const cardHeight = container.offsetHeight

        if (isHidden) {
            container.style.top = `${baseTop}px`
            toggleBtn.textContent = '▼'
            isHidden = false
        } else {
            const hiddenTop = baseTop - (cardHeight * 0.9)
            container.style.top = `${hiddenTop}px`
            toggleBtn.textContent = '▲'
            isHidden = true
        }
    }

    // Click on prompt bar to toggle
    promptBar.addEventListener('click', toggleHide)

    // Load YouTube API and create player
    await ensureYouTubeAPI()

    const start = videoStartTime ?? 0

    ytPlayer = new window.YT.Player(playerDiv.id, {
        videoId: youtubeId,
        playerVars: {
            autoplay: 1,
            controls: 0,
            rel: 0,
            playsinline: 1,
            modestbranding: 1,
            iv_load_policy: 3,
            start: Math.floor(start),
        },
        events: {
            onReady: () => {
                // Start loop checker if we have an endTime
                if (videoEndTime !== undefined) {
                    loopInterval = window.setInterval(() => {
                        if (!ytPlayer) return
                        const currentTime = ytPlayer.getCurrentTime()
                        if (currentTime >= videoEndTime) {
                            ytPlayer.seekTo(start, true)
                        }
                    }, 250)
                }
            }
        }
    })
}

/**
 * Remove the video panel from the DOM.
 */
export function hideVideoOverlay(): void {
    // Clear loop interval
    if (loopInterval !== null) {
        clearInterval(loopInterval)
        loopInterval = null
    }

    // Destroy YouTube player
    if (ytPlayer) {
        try {
            ytPlayer.destroy()
        } catch {
            // Player may already be destroyed
        }
        ytPlayer = null
    }

    if (clipWrapper) {
        clipWrapper.remove()
        clipWrapper = null
        container = null
    }
    visible = false
    isHidden = false
}

/**
 * Whether the video overlay is currently visible.
 */
export function isVideoVisible(): boolean {
    return visible
}
