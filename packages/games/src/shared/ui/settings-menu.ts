/**
 * Settings Menu — reusable popup + cog-icon button factory
 *
 * Appearance follows result-overlay.ts (dark gradient card on backdrop).
 * The trigger button has variants so different games can place it differently.
 */

import { asset } from '../asset-path'
import { getAvailableLocales, getLocale, setLocale, t } from '../i18n/i18n'

const MORE_GAMES_URL = 'https://jordglobe.com/games/'
const APP_STORE_URL = 'https://apps.apple.com/app/id1599500931'
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.linbasta.jordglobegeo'

const COG_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94 0 .31.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>'

const CLOSE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>'

const EXIT_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3h12v4h-2V5H5v14h8v-2h2v4H3V3z"/><path d="M11 11h8.5l-2.3-2.3 1.4-1.4 4.4 4.4c.3.3.3.8 0 1.1l-4.4 4.4-1.4-1.4 2.3-2.3H11v-2.5z"/></svg>'

const SHARE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>'

const CHECK_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>'

function copyToClipboard(text: string): void {
    if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text)
        return
    }
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.cssText = 'position:fixed;left:-9999px'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
}

// ── Styles ──

const STYLE_ID = 'settings-menu-styles'
const BLUE_SLICE = 20
const FRAME_BORDER = 8
const BUTTON_SIZE = 36

function injectStyles(): void {
    if (document.getElementById(STYLE_ID)) return
    const style = document.createElement('style')
    style.id = STYLE_ID
    style.textContent = `
        .sm-cog-btn { position:relative;box-sizing:border-box;width:${BUTTON_SIZE}px;height:${BUTTON_SIZE}px;padding:0;background:transparent;cursor:pointer;flex-shrink:0;border-style:solid;border-width:${FRAME_BORDER}px;border-image:url("${asset('BlueButton.png')}") ${BLUE_SLICE} ${BLUE_SLICE} ${BLUE_SLICE} ${BLUE_SLICE} fill stretch;transition:transform 0.1s; }
        .sm-cog-btn:hover { transform:scale(1.05); }
        .sm-cog-btn:active { transform:scale(0.95); }
        .sm-cog-btn svg { position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:20px;height:20px;fill:#fff;pointer-events:none; }
        .sm-cog-btn::before { content:'';position:absolute;inset:-8px;pointer-events:auto; }
        @media (pointer: coarse) {
            .sm-cog-btn::before { inset:-14px; }
        }
        .sm-backdrop { position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:300;opacity:0;transition:opacity 0.2s ease-in-out; }
        .sm-card { width:320px;max-width:calc(100vw - 32px);background:linear-gradient(180deg,#1a3a5c 0%,#0f2744 100%);border-radius:16px;padding:24px;text-align:center;position:relative;box-shadow:0 8px 32px rgba(0,0,0,0.4);transform:scale(0.9);opacity:0;transition:transform 0.2s ease-out,opacity 0.2s ease-out;font-family:Arial,sans-serif; }
        .sm-close { position:absolute;top:10px;right:10px;width:32px;height:32px;background:transparent;border:none;border-radius:8px;color:#a0c4e0;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 0.15s; }
        .sm-close:hover { background:rgba(255,255,255,0.1);color:#fff; }
        .sm-close svg { width:18px;height:18px;fill:currentColor; }
        .sm-title { font-size:24px;font-weight:bold;color:#fff;margin-bottom:20px;text-shadow:0 2px 8px rgba(0,0,0,0.3); }
        .sm-row { display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-top:1px solid rgba(255,255,255,0.12);gap:12px; }
        .sm-row:first-of-type { border-top:none; }
        .sm-label { font-size:15px;color:#a0c4e0;font-weight:bold; }
        .sm-value { font-size:15px;color:#fff; }
        .sm-lang-group { display:flex;flex-wrap:wrap;gap:6px;justify-content:flex-end; }
        .sm-lang-btn { padding:6px 12px;background:transparent;border:1px solid rgba(255,255,255,0.25);border-radius:8px;color:#a0c4e0;font-size:13px;font-weight:bold;cursor:pointer;font-family:inherit;transition:background 0.15s,color 0.15s,border-color 0.15s; }
        .sm-lang-btn:hover { background:rgba(255,255,255,0.08);color:#fff; }
        .sm-lang-btn.active { background:#2a7fff;border-color:#2a7fff;color:#fff; }
        .sm-lang-btn.active:hover { background:#3d8fff; }
        .sm-more-btn { display:flex;align-items:center;justify-content:center;gap:8px;width:100%;margin-top:20px;padding:12px 20px;background:#2a7fff;border:none;border-radius:10px;color:#fff;font-size:16px;font-weight:bold;cursor:pointer;text-decoration:none;text-align:center;transition:background 0.15s,transform 0.1s;font-family:inherit;box-sizing:border-box; }
        .sm-more-btn:hover { background:#3d8fff;transform:scale(1.02); }
        .sm-more-btn:active { transform:scale(0.98); }
        .sm-more-btn svg { width:20px;height:20px;fill:currentColor;flex-shrink:0; }
        .sm-share-btn { display:flex;align-items:center;justify-content:center;gap:8px;width:100%;margin-top:16px;padding:10px 20px;background:transparent;border:1px solid rgba(255,255,255,0.3);border-radius:10px;color:#a0c4e0;font-size:14px;font-weight:bold;cursor:pointer;text-decoration:none;text-align:center;transition:background 0.15s,transform 0.1s,color 0.15s;font-family:inherit;box-sizing:border-box; }
        .sm-share-btn:hover { background:rgba(255,255,255,0.1);color:#fff;transform:scale(1.02); }
        .sm-share-btn:active { transform:scale(0.98); }
        .sm-share-btn svg { width:18px;height:18px;fill:currentColor;flex-shrink:0; }
        .sm-share-btn.copied { background:#22c55e;border-color:#22c55e;color:#fff; }
        .sm-share-btn.copied:hover { background:#22c55e; }
        .sm-store-links { display:flex;justify-content:center;gap:12px;margin-top:20px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.12); }
        .sm-store-badge { height:36px;transition:transform 0.1s,opacity 0.15s;opacity:0.9; }
        .sm-store-badge:hover { transform:scale(1.05);opacity:1; }
    `
    document.head.appendChild(style)
}

// ── Cog button factory ──

export type SettingsButtonVariant = 'scorebar-left'

export function createSettingsButton(variant: SettingsButtonVariant = 'scorebar-left'): HTMLButtonElement {
    injectStyles()
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.setAttribute('aria-label', 'Settings')
    btn.className = variant === 'scorebar-left' ? 'sm-cog-btn' : 'sm-cog-btn'
    btn.innerHTML = COG_ICON
    btn.addEventListener('click', (e) => {
        e.stopPropagation()
        showSettingsMenu()
    })
    return btn
}

// ── Popup ──

let backdrop: HTMLDivElement | null = null
let keyListener: ((e: KeyboardEvent) => void) | null = null

export function showSettingsMenu(): void {
    hideSettingsMenu()
    injectStyles()

    backdrop = document.createElement('div')
    backdrop.className = 'sm-backdrop'

    const card = document.createElement('div')
    card.className = 'sm-card'
    card.innerHTML = `
        <button class="sm-close" aria-label="Close settings">${CLOSE_ICON}</button>
        <div class="sm-title">${t('settings.title')}</div>
        ${renderLanguageRow()}
        <a class="sm-more-btn" href="${MORE_GAMES_URL}">${t('settings.moreGames')}${EXIT_ICON}</a>
        <div class="sm-store-links">
            <a href="${APP_STORE_URL}" target="_blank" rel="noopener"><img src="${asset('app-store-badge.svg')}" alt="Download on the App Store" class="sm-store-badge"></a>
            <a href="${PLAY_STORE_URL}" target="_blank" rel="noopener"><img src="${asset('google-play-badge.png')}" alt="Get it on Google Play" class="sm-store-badge"></a>
        </div>
        <button class="sm-share-btn">${SHARE_ICON}${t('settings.share')}</button>
    `

    backdrop.appendChild(card)
    document.body.appendChild(backdrop)

    wireLanguageButtons(card)
    wireShareButton(card)

    const closeBtn = card.querySelector('.sm-close') as HTMLButtonElement
    closeBtn.addEventListener('click', hideSettingsMenu)

    backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) hideSettingsMenu()
    })

    keyListener = (e) => {
        if (e.key === 'Escape') hideSettingsMenu()
    }
    document.addEventListener('keydown', keyListener)

    requestAnimationFrame(() => {
        if (!backdrop) return
        backdrop.style.opacity = '1'
        const c = backdrop.querySelector('.sm-card') as HTMLElement
        if (c) {
            c.style.transform = 'scale(1)'
            c.style.opacity = '1'
        }
    })
}

function renderLanguageRow(): string {
    const locales = getAvailableLocales()
    if (locales.length < 2) return ''
    const active = getLocale()
    const buttons = locales.map(loc => {
        const cls = 'sm-lang-btn' + (loc.code === active ? ' active' : '')
        return `<button type="button" class="${cls}" data-locale="${loc.code}">${loc.label}</button>`
    }).join('')
    return `
        <div class="sm-row">
            <span class="sm-label">${t('settings.language')}</span>
            <div class="sm-lang-group">${buttons}</div>
        </div>
    `
}

function wireLanguageButtons(card: HTMLElement): void {
    const active = getLocale()
    card.querySelectorAll<HTMLButtonElement>('.sm-lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const code = btn.dataset.locale
            if (code && code !== active) setLocale(code)
        })
    })
}

function wireShareButton(card: HTMLElement): void {
    const shareBtn = card.querySelector('.sm-share-btn') as HTMLButtonElement
    if (!shareBtn) return
    shareBtn.addEventListener('click', () => {
        const url = window.location.href
        copyToClipboard(url)
        shareBtn.innerHTML = `${CHECK_ICON}${t('settings.shareCopied')}`
        shareBtn.classList.add('copied')
        setTimeout(() => {
            shareBtn.innerHTML = `${SHARE_ICON}${t('settings.share')}`
            shareBtn.classList.remove('copied')
        }, 2000)
    })
}

export function hideSettingsMenu(): void {
    if (keyListener) {
        document.removeEventListener('keydown', keyListener)
        keyListener = null
    }
    if (backdrop) {
        backdrop.remove()
        backdrop = null
    }
}
