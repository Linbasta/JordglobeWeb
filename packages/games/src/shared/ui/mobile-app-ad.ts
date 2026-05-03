/**
 * Mobile App Ad — shows a download banner for desktop users during solo games
 *
 * Only visible on desktop. Positioned in bottom-right corner.
 * Banner layout: blue-gradient background, QR code on the left, four phones
 * overflowing the top edge on the right, "Download the app now!" at bottom.
 */

import { asset } from '../asset-path'

let adContainer: HTMLDivElement | null = null
let resizeHandler: (() => void) | null = null

const AD_MARGIN = 16
const BANNER_WIDTH = 480
const BANNER_HEIGHT = 160
const QR_SIZE = 120
const PHONES_WIDTH = 300
const PHONES_OVERFLOW_TOP = 25
const MIN_ASPECT_RATIO = 1.2

// Scale the banner to the viewport. Below these reference dimensions the banner
// shrinks proportionally (anchored to its bottom-right corner) so it stops
// colliding with the pin UI or the bottom score bar on smaller windows.
const SCALE_REF_WIDTH = 1800
const SCALE_REF_HEIGHT = 1100
const MIN_SCALE = 0.35

function isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

export function showMobileAppAd(): void {
    if (isMobile()) return
    if (adContainer) return

    adContainer = document.createElement('div')
    adContainer.className = 'mobile-app-ad'
    adContainer.style.cssText =
        `position:fixed;bottom:${AD_MARGIN}px;right:${AD_MARGIN}px;` +
        `width:${BANNER_WIDTH}px;height:${BANNER_HEIGHT}px;` +
        `background:url('${asset('euro-music-quiz/blue_gradient.png')}') center/cover no-repeat;` +
        'border-radius:12px;' +
        'z-index:100;' +
        'font-family:Arial,sans-serif;' +
        'box-shadow:0 4px 12px rgba(0,0,0,0.25);' +
        'overflow:visible;' +
        'transform-origin:bottom right;'

    const qrImg = document.createElement('img')
    qrImg.src = asset('qr-download.png')
    qrImg.alt = 'Download'
    qrImg.width = QR_SIZE
    qrImg.height = QR_SIZE
    qrImg.style.cssText =
        'position:absolute;left:18px;top:50%;transform:translateY(-50%);' +
        `width:${QR_SIZE}px;height:${QR_SIZE}px;` +
        'background:#fff;border-radius:8px;padding:6px;box-sizing:border-box;' +
        'display:block;z-index:2;'

    const phones = document.createElement('img')
    phones.src = asset('euro-music-quiz/4_phones.png')
    phones.alt = ''
    phones.style.cssText =
        `position:absolute;right:6px;top:-${PHONES_OVERFLOW_TOP}px;` +
        `width:${PHONES_WIDTH}px;height:auto;pointer-events:none;z-index:1;`

    const text = document.createElement('div')
    text.style.cssText =
        `position:absolute;bottom:10px;left:${QR_SIZE + 28}px;right:12px;` +
        'color:#fff;font-size:18px;font-weight:800;' +
        'text-transform:uppercase;text-align:center;' +
        'letter-spacing:0.5px;line-height:1;white-space:nowrap;' +
        'text-shadow:0 2px 4px rgba(0,0,0,0.35);z-index:2;'
    text.textContent = 'Download the app now!'

    adContainer.appendChild(qrImg)
    adContainer.appendChild(phones)
    adContainer.appendChild(text)
    document.body.appendChild(adContainer)

    resizeHandler = () => updateVisibility()
    window.addEventListener('resize', resizeHandler)
    updateVisibility()
}

function updateVisibility(): void {
    if (!adContainer) return
    const aspectRatio = window.innerWidth / window.innerHeight
    if (aspectRatio < MIN_ASPECT_RATIO) {
        adContainer.style.display = 'none'
        return
    }
    adContainer.style.display = 'block'
    const scale = Math.max(
        MIN_SCALE,
        Math.min(
            1,
            window.innerWidth / SCALE_REF_WIDTH,
            window.innerHeight / SCALE_REF_HEIGHT,
        ),
    )
    adContainer.style.transform = `scale(${scale})`
}

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
