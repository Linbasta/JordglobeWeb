/**
 * App Store Banner
 *
 * Shows download prompts for mobile users:
 * - iOS: Uses native Apple Smart App Banner (via meta tag)
 * - Android: Custom dismissible banner linking to Google Play
 */

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.linbasta.jordglobegeo'
const BANNER_DISMISSED_KEY = 'app-banner-dismissed'
const BANNER_HEIGHT = '60px'
const BANNER_HEIGHT_PX = 60 // Numeric value for calculations

// TEMP: Set to true to always show banner (for desktop testing)
const DEBUG_ALWAYS_SHOW_BANNER = false

/**
 * Banner visibility change callback
 */
type BannerVisibilityCallback = (visible: boolean, heightPx: number) => void

const visibilityCallbacks: BannerVisibilityCallback[] = []

// Track current banner state for late subscribers
let currentBannerVisible = false

/**
 * Get the current banner height in pixels
 * Use this to initialize UI elements with correct offset
 */
export function getBannerHeight(): number {
    return currentBannerVisible ? BANNER_HEIGHT_PX : 0
}

/**
 * Subscribe to banner visibility changes
 * @param callback - Called when banner visibility changes (not on subscribe)
 * @returns Unsubscribe function
 */
export function onBannerVisibilityChange(callback: BannerVisibilityCallback): () => void {
    visibilityCallbacks.push(callback)
    return () => {
        const index = visibilityCallbacks.indexOf(callback)
        if (index !== -1) {
            visibilityCallbacks.splice(index, 1)
        }
    }
}

/**
 * Notify all subscribers of banner visibility change
 */
function notifyVisibilityChange(visible: boolean): void {
    currentBannerVisible = visible
    visibilityCallbacks.forEach(callback => callback(visible, BANNER_HEIGHT_PX))
}

/**
 * Detect if user is on Android
 */
function isAndroid(): boolean {
    return /Android/i.test(navigator.userAgent)
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000

/**
 * Check if banner was dismissed within the last 24 hours
 */
function wasDismissed(): boolean {
    try {
        const dismissedAt = localStorage.getItem(BANNER_DISMISSED_KEY)
        if (!dismissedAt) return false
        const elapsed = Date.now() - Number(dismissedAt)
        return elapsed < ONE_DAY_MS
    } catch {
        return false
    }
}

/**
 * Mark banner as dismissed (stores timestamp)
 */
function setDismissed(): void {
    try {
        localStorage.setItem(BANNER_DISMISSED_KEY, Date.now().toString())
    } catch {
        // localStorage not available
    }
}

/**
 * Create and show the Android app banner
 */
function createAndroidBanner(): HTMLElement {
    const banner = document.createElement('div')
    banner.id = 'android-app-banner'
    banner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 10000;
        background: linear-gradient(90deg, #1a1a2e 0%, #16213e 100%);
        padding: 10px 12px;
        display: flex;
        align-items: center;
        gap: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `

    // Close button
    const closeBtn = document.createElement('button')
    closeBtn.textContent = '✕'
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: #888;
        font-size: 18px;
        padding: 4px 8px;
        cursor: pointer;
        line-height: 1;
    `
    closeBtn.onclick = () => {
        setDismissed()
        banner.remove()
        notifyVisibilityChange(false)
    }

    // App icon
    const icon = document.createElement('img')
    icon.src = '/AppIcon.png'
    icon.alt = 'Jordglobe'
    icon.style.cssText = `
        width: 40px;
        height: 40px;
        border-radius: 8px;
    `

    // Text container
    const textContainer = document.createElement('div')
    textContainer.style.cssText = `
        flex: 1;
        min-width: 0;
    `

    const title = document.createElement('div')
    title.textContent = 'Jordglobe'
    title.style.cssText = `
        color: #fff;
        font-size: 14px;
        font-weight: 600;
    `

    const subtitle = document.createElement('div')
    subtitle.textContent = 'Get the app for the best experience'
    subtitle.style.cssText = `
        color: #aaa;
        font-size: 12px;
    `

    textContainer.appendChild(title)
    textContainer.appendChild(subtitle)

    // View button
    const viewBtn = document.createElement('a')
    viewBtn.href = PLAY_STORE_URL
    viewBtn.textContent = 'VIEW'
    viewBtn.style.cssText = `
        background: #4CAF50;
        color: #fff;
        text-decoration: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 600;
        white-space: nowrap;
    `

    banner.appendChild(closeBtn)
    banner.appendChild(icon)
    banner.appendChild(textContainer)
    banner.appendChild(viewBtn)

    return banner
}

/**
 * Initialize app banner
 *
 * Call this on page load. It will:
 * - On Android: Show custom banner (if not dismissed)
 * - On iOS: Do nothing (Apple Smart Banner is handled via meta tag)
 */
export function initAppBanner(): void {
    // Only show on Android, and only if not dismissed
    // (unless DEBUG_ALWAYS_SHOW_BANNER is true)
    if (!DEBUG_ALWAYS_SHOW_BANNER && (!isAndroid() || wasDismissed())) {
        return
    }

    // Wait for DOM to be ready
    // Banner is position:fixed overlay. UI elements are offset via callbacks.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            document.body.appendChild(createAndroidBanner())
            notifyVisibilityChange(true)
        })
    } else {
        document.body.appendChild(createAndroidBanner())
        notifyVisibilityChange(true)
    }
}
