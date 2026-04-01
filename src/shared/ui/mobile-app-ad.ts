/**
 * Mobile App Ad — shows QR code ad for desktop users during solo games
 *
 * Only visible on desktop. Positioned in bottom-right corner.
 * Horizontal layout: QR code left, text right.
 */

// ── DOM element ──
let adContainer: HTMLDivElement | null = null
let resizeHandler: (() => void) | null = null

// ── Constants ──
const DOWNLOAD_URL = 'https://jordglobe.com/download'
const QR_SIZE = 70
const AD_MARGIN = 16
const BG_COLOR = '#4a6fa5'  // Blue matching app theme
const MIN_ASPECT_RATIO = 1.2  // Hide ad when narrower than this (e.g. portrait)

/**
 * Detect if user is on a mobile device
 */
function isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

/**
 * Show the mobile app ad (desktop only)
 */
export function showMobileAppAd(): void {
    // Don't show on mobile devices
    if (isMobile()) return

    // Don't create duplicate
    if (adContainer) return

    adContainer = document.createElement('div')
    adContainer.style.cssText =
        `position:fixed;bottom:${AD_MARGIN}px;right:${AD_MARGIN}px;` +
        `background:${BG_COLOR};` +
        'border-radius:12px;' +
        'padding:10px;' +
        'display:flex;align-items:center;gap:12px;' +
        'z-index:100;' +
        'font-family:Arial,sans-serif;' +
        'box-shadow:0 4px 12px rgba(0,0,0,0.25);'

    // QR code container (left side)
    const qrContainer = document.createElement('div')
    qrContainer.style.cssText =
        `width:${QR_SIZE}px;height:${QR_SIZE}px;` +
        'background:#fff;' +
        'border-radius:6px;' +
        'display:flex;align-items:center;justify-content:center;' +
        'flex-shrink:0;'

    // Generate QR code
    generateQRCode(DOWNLOAD_URL, qrContainer)

    // Phone icon (center)
    const phoneIcon = document.createElement('img')
    phoneIcon.src = '/phone-icon.svg'
    phoneIcon.alt = ''
    phoneIcon.style.cssText = 'width:64px;height:64px;flex-shrink:0;'

    // Text section (right side)
    const mainText = document.createElement('div')
    mainText.style.cssText =
        'color:#fff;font-size:13px;font-weight:bold;text-transform:uppercase;' +
        'line-height:1.2;'
    mainText.innerHTML = 'More fun<br>in the app!'

    adContainer.appendChild(qrContainer)
    adContainer.appendChild(phoneIcon)
    adContainer.appendChild(mainText)
    document.body.appendChild(adContainer)

    // Handle aspect ratio changes
    resizeHandler = () => updateVisibility()
    window.addEventListener('resize', resizeHandler)
    updateVisibility()
}

/**
 * Update ad visibility based on aspect ratio
 */
function updateVisibility(): void {
    if (!adContainer) return
    const aspectRatio = window.innerWidth / window.innerHeight
    adContainer.style.display = aspectRatio >= MIN_ASPECT_RATIO ? 'flex' : 'none'
}

/**
 * Hide the mobile app ad
 */
export function hideMobileAppAd(): void {
    if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler)
        resizeHandler = null
    }
    if (adContainer) {
        adContainer.remove()
        adContainer = null
    }
}

/**
 * Generate QR code using canvas
 */
function generateQRCode(url: string, container: HTMLElement): void {
    import('qrcode').then(QRCode => {
        const canvas = document.createElement('canvas')
        canvas.width = QR_SIZE
        canvas.height = QR_SIZE
        QRCode.toCanvas(canvas, url, {
            width: QR_SIZE,
            margin: 1,
            color: { dark: '#000000', light: '#ffffff' }
        }, (error) => {
            if (error) {
                console.error('QR code generation failed:', error)
                showFallbackLink(container, url)
            } else {
                container.innerHTML = ''
                container.appendChild(canvas)
            }
        })
    }).catch(() => {
        showFallbackLink(container, url)
    })
}

/**
 * Show a simple link as fallback when QR code generation fails
 */
function showFallbackLink(container: HTMLElement, url: string): void {
    container.innerHTML = ''
    const link = document.createElement('a')
    link.href = url
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    link.style.cssText =
        'font-size:9px;color:#333;text-align:center;text-decoration:none;'
    link.textContent = 'Download'
    container.appendChild(link)
}
