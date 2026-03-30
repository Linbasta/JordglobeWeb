/**
 * Mobile initialization
 *
 * Consolidates all mobile-specific setup:
 * - Theme color (browser UI color)
 * - App store banners
 */

import { initAppBanner } from './app-banner'

// Match the pin UI bottom panel color
export const THEME_COLOR = '#6496DC'

/**
 * Set the browser theme color (address bar area on mobile)
 */
function setThemeColor(color: string): void {
    // Try to find existing meta tag first
    let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null
    if (meta) {
        meta.content = color
        return
    }

    // Create and insert new meta tag
    meta = document.createElement('meta')
    meta.name = 'theme-color'
    meta.content = color

    // Insert at the beginning of head for earliest possible effect
    if (document.head.firstChild) {
        document.head.insertBefore(meta, document.head.firstChild)
    } else {
        document.head.appendChild(meta)
    }
}

/**
 * Initialize all mobile-specific features
 *
 * Call this on page load for quiz pages.
 */
export function initMobile(): void {
    setThemeColor(THEME_COLOR)
    initAppBanner()
}
