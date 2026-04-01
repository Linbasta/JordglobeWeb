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
        onError?: (event: { data: number; target: YTPlayer }) => void
    }
}

interface YTPlayer {
    getCurrentTime(): number
    seekTo(seconds: number, allowSeekAhead: boolean): void
    loadVideoById(options: { videoId: string; startSeconds?: number }): void
    destroy(): void
}

let clipWrapper: HTMLDivElement | null = null
let container: HTMLDivElement | null = null
let promptElement: HTMLDivElement | null = null
let toggleBtn: HTMLDivElement | null = null
let visible = false
let isHidden = false
let ytPlayer: YTPlayer | null = null
let loopInterval: number | null = null
let apiReady = false
let apiReadyCallbacks: (() => void)[] = []
let currentYoutubeId: string | null = null
let currentStartTime = 0
let currentEndTime: number | undefined = undefined

// Error handling state
let errorOverlay: HTMLDivElement | null = null
let playbackTimeout: number | null = null
let hasStartedPlaying = false
let currentOptions: VideoOverlayOptions | null = null
const PLAYBACK_TIMEOUT_MS = 10000 // 10 seconds to detect if video fails to load
const RETRY_DELAY_SECONDS = 5

/**
 * Clear existing loop interval and set up new one if needed
 */
function setupLoopInterval(startTime: number, endTime: number | undefined): void {
    // Clear any existing loop
    if (loopInterval !== null) {
        clearInterval(loopInterval)
        loopInterval = null
    }

    // Store current times for reference
    currentStartTime = startTime
    currentEndTime = endTime

    // Set up new loop if we have an endTime
    if (endTime !== undefined && ytPlayer) {
        loopInterval = window.setInterval(() => {
            if (!ytPlayer) return
            const currentTime = ytPlayer.getCurrentTime()
            if (currentTime >= endTime) {
                ytPlayer.seekTo(startTime, true)
            }
        }, 250)
    }
}

/**
 * Clear playback timeout
 */
function clearPlaybackTimeout(): void {
    if (playbackTimeout !== null) {
        clearTimeout(playbackTimeout)
        playbackTimeout = null
    }
}

/**
 * Show error overlay with countdown retry button
 */
function showErrorOverlay(iframeWrap: HTMLElement): void {
    if (errorOverlay) return // Already showing

    errorOverlay = document.createElement('div')
    errorOverlay.style.cssText =
        'position:absolute;top:0;left:0;right:0;bottom:0;' +
        'background:rgba(0,0,0,0.85);display:flex;flex-direction:column;' +
        'align-items:center;justify-content:center;z-index:10;'

    const message = document.createElement('div')
    message.textContent = 'Video unavailable'
    message.style.cssText =
        'color:#fff;font-family:Arial,sans-serif;font-size:18px;margin-bottom:16px;'

    const retryBtn = document.createElement('button')
    retryBtn.style.cssText =
        'padding:12px 24px;font-size:16px;font-weight:600;font-family:Arial,sans-serif;' +
        'color:#fff;background:#E91E63;border:none;border-radius:6px;cursor:pointer;' +
        'min-width:140px;'
    retryBtn.disabled = true

    errorOverlay.appendChild(message)
    errorOverlay.appendChild(retryBtn)
    iframeWrap.appendChild(errorOverlay)

    // Countdown timer
    let countdown = RETRY_DELAY_SECONDS
    retryBtn.textContent = `Retry in ${countdown}...`

    const countdownInterval = setInterval(() => {
        countdown--
        if (countdown > 0) {
            retryBtn.textContent = `Retry in ${countdown}...`
        } else {
            clearInterval(countdownInterval)
            retryBtn.textContent = 'Try again'
            retryBtn.disabled = false
            retryBtn.style.cursor = 'pointer'
        }
    }, 1000)

    retryBtn.addEventListener('click', () => {
        if (retryBtn.disabled) return
        clearInterval(countdownInterval)
        retryVideo()
    })
}

/**
 * Hide error overlay
 */
function hideErrorOverlay(): void {
    if (errorOverlay) {
        errorOverlay.remove()
        errorOverlay = null
    }
}

/**
 * Retry loading the video
 */
function retryVideo(): void {
    if (!currentOptions) return

    // Destroy current player
    if (ytPlayer) {
        try {
            ytPlayer.destroy()
        } catch {
            // Player may already be destroyed
        }
        ytPlayer = null
    }

    // Reset state
    hideErrorOverlay()
    currentYoutubeId = null
    hasStartedPlaying = false

    // Re-show with current options
    showVideoOverlay(currentOptions)
}

/**
 * Handle YouTube player error
 */
function handlePlayerError(): void {
    clearPlaybackTimeout()
    const iframeWrap = container?.querySelector('div[style*="aspect-ratio"]') as HTMLElement
    if (iframeWrap) {
        showErrorOverlay(iframeWrap)
    }
}

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
    const start = videoStartTime ?? 0

    // Store options for retry
    currentOptions = options

    // OPTIMIZATION: Reuse existing player if possible
    // This prevents YouTube rate-limiting by avoiding repeated player creation
    if (ytPlayer && currentYoutubeId === youtubeId && clipWrapper) {
        // Same video — just seek to new position and update UI
        hideErrorOverlay()
        ytPlayer.seekTo(start, true)
        setupLoopInterval(start, videoEndTime)
        if (promptElement) {
            promptElement.textContent = promptText
        }
        visible = true
        return
    }

    if (ytPlayer && currentYoutubeId !== youtubeId && clipWrapper) {
        // Different video — reuse player with loadVideoById
        hideErrorOverlay()
        ytPlayer.loadVideoById({ videoId: youtubeId, startSeconds: start })
        currentYoutubeId = youtubeId
        setupLoopInterval(start, videoEndTime)
        if (promptElement) {
            promptElement.textContent = promptText
        }
        visible = true
        return
    }

    // No existing player — create everything from scratch
    hideVideoOverlay()

    visible = true
    currentYoutubeId = youtubeId
    hasStartedPlaying = false
    clearPlaybackTimeout()

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

    promptElement = document.createElement('div')
    promptElement.textContent = promptText
    promptElement.style.cssText =
        'flex:1;color:#fff;font-family:Arial,sans-serif;font-size:16px;font-weight:600;' +
        'text-align:center;'

    toggleBtn = document.createElement('div')
    toggleBtn.style.cssText =
        'width:24px;height:24px;display:flex;align-items:center;justify-content:center;' +
        'color:#fff;font-size:16px;opacity:0.7;'
    toggleBtn.textContent = '▼'

    promptBar.appendChild(promptElement)
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
            if (toggleBtn) toggleBtn.textContent = '▼'
            isHidden = false
        } else {
            const hiddenTop = baseTop - (cardHeight * 0.9) + 40
            container.style.top = `${hiddenTop}px`
            if (toggleBtn) toggleBtn.textContent = '▲'
            isHidden = true
        }
    }

    // Click on prompt bar to toggle
    promptBar.addEventListener('click', toggleHide)

    // Load YouTube API and create player
    await ensureYouTubeAPI()

    // Set up timeout to detect if video fails to load
    playbackTimeout = window.setTimeout(() => {
        if (!hasStartedPlaying) {
            handlePlayerError()
        }
    }, PLAYBACK_TIMEOUT_MS)

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
                // Set up loop interval after player is ready
                setupLoopInterval(start, videoEndTime)
            },
            onStateChange: (event: { data: number }) => {
                // YT.PlayerState.PLAYING = 1
                if (event.data === 1) {
                    hasStartedPlaying = true
                    clearPlaybackTimeout()
                    hideErrorOverlay()
                }
            },
            onError: () => {
                handlePlayerError()
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

    // Clear playback timeout
    clearPlaybackTimeout()

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

    // Reset all state
    promptElement = null
    toggleBtn = null
    errorOverlay = null
    currentYoutubeId = null
    currentStartTime = 0
    currentEndTime = undefined
    currentOptions = null
    hasStartedPlaying = false
    visible = false
    isHidden = false
}

/**
 * Whether the video overlay is currently visible.
 */
export function isVideoVisible(): boolean {
    return visible
}

/**
 * Collapse the video overlay (slide up, showing only the prompt bar).
 * Used when entering pin placement state.
 */
export function collapseVideoOverlay(): void {
    if (!container || !visible) return
    if (isHidden) return // Already collapsed

    const baseTop = Number(container.dataset.baseTop)
    const cardHeight = container.offsetHeight
    const hiddenTop = baseTop - (cardHeight * 0.9) + 40
    container.style.top = `${hiddenTop}px`

    if (toggleBtn) toggleBtn.textContent = '▲'

    isHidden = true
}

/**
 * Expand the video overlay (slide down, showing full video).
 * Used when a new question loads.
 */
export function expandVideoOverlay(): void {
    if (!container || !visible) return
    if (!isHidden) return // Already expanded

    const baseTop = Number(container.dataset.baseTop)
    container.style.top = `${baseTop}px`

    if (toggleBtn) toggleBtn.textContent = '▼'

    isHidden = false
}
