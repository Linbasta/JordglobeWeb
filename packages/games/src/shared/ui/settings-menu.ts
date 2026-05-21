/**
 * Settings Menu — reusable popup + cog-icon button factory
 *
 * Appearance follows result-overlay.ts (dark gradient card on backdrop).
 * The trigger button has variants so different games can place it differently.
 */

import { asset } from '../asset-path'
import { getAvailableLocales, getLocale, setLocale, t } from '../i18n/i18n'
import { auth, isRealUser } from '../firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { getInputMode, setInputMode, type InputMode } from '../input-mode'

const MORE_GAMES_URL = 'https://jordglobe.com/'
const APP_STORE_URL = 'https://apps.apple.com/app/id1599500931'
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.linbasta.jordglobegeo'

const COG_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94 0 .31.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>'

const CLOSE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>'

const EXIT_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3h12v4h-2V5H5v14h8v-2h2v4H3V3z"/><path d="M11 11h8.5l-2.3-2.3 1.4-1.4 4.4 4.4c.3.3.3.8 0 1.1l-4.4 4.4-1.4-1.4 2.3-2.3H11v-2.5z"/></svg>'

const RETRY_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>'

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
        .sm-lang-select { appearance:none;-webkit-appearance:none;-moz-appearance:none;padding:8px 36px 8px 12px;background-color:rgba(255,255,255,0.08);background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill='%23a0c4e0' d='M7 10l5 5 5-5z'/></svg>");background-repeat:no-repeat;background-position:right 8px center;background-size:18px 18px;border:1px solid rgba(255,255,255,0.25);border-radius:8px;color:#fff;font-size:14px;font-weight:bold;cursor:pointer;font-family:inherit;transition:background-color 0.15s,border-color 0.15s;min-width:140px; }
        .sm-lang-select:hover { background-color:rgba(255,255,255,0.14);border-color:rgba(255,255,255,0.4); }
        .sm-lang-select:focus { outline:none;border-color:#2a7fff; }
        .sm-lang-select option { background:#0f2744;color:#fff; }
        .sm-more-btn { display:flex;align-items:center;justify-content:center;gap:8px;width:100%;margin-top:12px;padding:10px 20px;background:transparent;border:1px solid rgba(255,255,255,0.3);border-radius:10px;color:#a0c4e0;font-size:14px;font-weight:bold;cursor:pointer;text-decoration:none;text-align:center;transition:background 0.15s,color 0.15s,transform 0.1s;font-family:inherit;box-sizing:border-box; }
        .sm-more-btn:hover { background:rgba(255,255,255,0.1);color:#fff;transform:scale(1.02); }
        .sm-more-btn:active { transform:scale(0.98); }
        .sm-more-btn svg { width:18px;height:18px;fill:currentColor;flex-shrink:0; }
        .sm-share-btn { display:flex;align-items:center;justify-content:center;gap:8px;width:100%;margin-top:16px;padding:10px 20px;background:transparent;border:1px solid rgba(255,255,255,0.3);border-radius:10px;color:#a0c4e0;font-size:14px;font-weight:bold;cursor:pointer;text-decoration:none;text-align:center;transition:background 0.15s,transform 0.1s,color 0.15s;font-family:inherit;box-sizing:border-box; }
        .sm-share-btn:hover { background:rgba(255,255,255,0.1);color:#fff;transform:scale(1.02); }
        .sm-share-btn:active { transform:scale(0.98); }
        .sm-share-btn svg { width:18px;height:18px;fill:currentColor;flex-shrink:0; }
        .sm-share-btn.copied { background:#22c55e;border-color:#22c55e;color:#fff; }
        .sm-share-btn.copied:hover { background:#22c55e; }
        .sm-retry-btn { display:flex;align-items:center;justify-content:center;gap:8px;width:100%;margin-top:20px;padding:12px 20px;background:#2a7fff;border:none;border-radius:10px;color:#fff;font-size:16px;font-weight:bold;cursor:pointer;text-align:center;transition:background 0.15s,transform 0.1s;font-family:inherit;box-sizing:border-box; }
        .sm-retry-btn:hover { background:#3d8fff;transform:scale(1.02); }
        .sm-retry-btn:active { transform:scale(0.98); }
        .sm-retry-btn svg { width:20px;height:20px;fill:currentColor;flex-shrink:0; }
        .sm-auth-banner { display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.06);border-radius:10px;padding:10px 14px;margin-bottom:16px; }
        .sm-auth-avatar { width:32px;height:32px;border-radius:50%;background:#2a7fff;color:#fff;font-size:14px;font-weight:bold;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-family:inherit; }
        .sm-auth-email { flex:1;font-size:13px;color:#a0c4e0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:left; }
        .sm-auth-link { font-size:13px;color:#7eb8e0;cursor:pointer;background:none;border:none;padding:0;font-family:inherit;text-decoration:underline;flex-shrink:0;transition:color 0.15s; }
        .sm-auth-link:hover { color:#fff; }
        .sm-store-links { display:flex;justify-content:center;gap:12px;margin-top:20px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.12); }
        .sm-store-badge { height:36px;transition:transform 0.1s,opacity 0.15s;opacity:0.9; }
        .sm-store-badge:hover { transform:scale(1.05);opacity:1; }
    `
    document.head.appendChild(style)
}

// ── Cog button factory ──

export type SettingsButtonVariant = 'scorebar-left'

export interface SettingsMenuOptions {
    /** When provided, a "Play again" button is rendered at the bottom of the menu. */
    onRetry?: () => void
}

export function createSettingsButton(variant: SettingsButtonVariant = 'scorebar-left', opts: SettingsMenuOptions = {}): HTMLButtonElement {
    injectStyles()
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.setAttribute('aria-label', 'Settings')
    btn.className = variant === 'scorebar-left' ? 'sm-cog-btn' : 'sm-cog-btn'
    btn.innerHTML = COG_ICON
    btn.addEventListener('click', (e) => {
        e.stopPropagation()
        showSettingsMenu(opts)
    })
    return btn
}

// ── Popup ──

let backdrop: HTMLDivElement | null = null
let keyListener: ((e: KeyboardEvent) => void) | null = null

export function showSettingsMenu(opts: SettingsMenuOptions = {}): void {
    hideSettingsMenu()
    injectStyles()

    backdrop = document.createElement('div')
    backdrop.className = 'sm-backdrop'

    const card = document.createElement('div')
    card.className = 'sm-card'
    card.innerHTML = `
        <button class="sm-close" aria-label="Close settings">${CLOSE_ICON}</button>
        <div class="sm-title">${t('settings.title')}</div>
        <div class="sm-auth-banner">
            <div class="sm-auth-avatar"></div>
            <span class="sm-auth-email"></span>
            <button class="sm-auth-link" type="button"></button>
        </div>
        ${renderLanguageRow()}
        ${renderInputModeRow()}
        ${opts.onRetry ? `<button class="sm-retry-btn" type="button">${RETRY_ICON}${t('settings.retry')}</button>` : ''}
        <a class="sm-more-btn" href="${MORE_GAMES_URL}">${t('settings.moreGames')}${EXIT_ICON}</a>
        <button class="sm-share-btn">${SHARE_ICON}${t('settings.share')}</button>
        <div class="sm-store-links">
            <a href="${APP_STORE_URL}" target="_blank" rel="noopener"><img src="${asset('app-store-badge.svg')}" alt="Download on the App Store" class="sm-store-badge"></a>
            <a href="${PLAY_STORE_URL}" target="_blank" rel="noopener"><img src="${asset('google-play-badge.png')}" alt="Get it on Google Play" class="sm-store-badge"></a>
        </div>
    `

    backdrop.appendChild(card)
    document.body.appendChild(backdrop)

    wireLanguageButtons(card)
    wireInputModeButtons(card)
    wireShareButton(card)
    wireAuthRow(card)

    if (opts.onRetry) {
        const retryBtn = card.querySelector('.sm-retry-btn') as HTMLButtonElement | null
        retryBtn?.addEventListener('click', () => {
            hideSettingsMenu()
            opts.onRetry!()
        })
    }

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
    const options = locales.map(loc => {
        const sel = loc.code === active ? ' selected' : ''
        return `<option value="${loc.code}"${sel}>${loc.label}</option>`
    }).join('')
    return `
        <div class="sm-row">
            <span class="sm-label">${t('settings.language')}</span>
            <select class="sm-lang-select" aria-label="${t('settings.language')}">${options}</select>
        </div>
    `
}

function renderInputModeRow(): string {
    const active = getInputMode()
    const opt = (val: InputMode, label: string) =>
        `<option value="${val}"${val === active ? ' selected' : ''}>${label}</option>`
    return `
        <div class="sm-row">
            <span class="sm-label">${t('settings.inputMode')}</span>
            <select class="sm-input-mode-select sm-lang-select" aria-label="${t('settings.inputMode')}">
                ${opt('cursor', t('settings.inputModeCursor'))}
                ${opt('pin', t('settings.inputModePin'))}
            </select>
        </div>
    `
}

function wireInputModeButtons(card: HTMLElement): void {
    const select = card.querySelector<HTMLSelectElement>('.sm-input-mode-select')
    if (!select) return
    const active = getInputMode()
    select.addEventListener('change', () => {
        const value = select.value
        if (value !== 'cursor' && value !== 'pin') return
        if (value === active) return
        setInputMode(value)
        window.location.reload()
    })
}

function wireLanguageButtons(card: HTMLElement): void {
    const select = card.querySelector<HTMLSelectElement>('.sm-lang-select')
    if (!select) return
    const active = getLocale()
    select.addEventListener('change', () => {
        const code = select.value
        if (code && code !== active) setLocale(code)
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

function wireAuthRow(card: HTMLElement): void {
    const avatarEl = card.querySelector('.sm-auth-avatar') as HTMLElement
    const emailEl = card.querySelector('.sm-auth-email') as HTMLElement
    const linkEl = card.querySelector('.sm-auth-link') as HTMLButtonElement

    function update() {
        const user = auth.currentUser
        if (user && !user.isAnonymous) {
            const email = user.email ?? user.uid
            avatarEl.textContent = (email[0] ?? '?').toUpperCase()
            avatarEl.style.background = '#2a7fff'
            emailEl.textContent = email
            linkEl.textContent = t('settings.signOut')
            linkEl.onclick = () => signOut(auth)
        } else {
            avatarEl.textContent = '?'
            avatarEl.style.background = '#555'
            emailEl.textContent = t('settings.notSignedIn')
            linkEl.textContent = t('settings.signIn')
            linkEl.onclick = async () => {
                hideSettingsMenu()
                const { showLoginModal } = await import('./login-modal')
                showLoginModal({
                    onSuccess: () => showSettingsMenu(),
                    onCancel: () => showSettingsMenu(),
                })
            }
        }
    }

    update()
    const unsub = onAuthStateChanged(auth, () => update())
    ;(card as any)._authUnsub = unsub
}

export function hideSettingsMenu(): void {
    if (keyListener) {
        document.removeEventListener('keydown', keyListener)
        keyListener = null
    }
    if (backdrop) {
        const card = backdrop.querySelector('.sm-card') as any
        if (card?._authUnsub) card._authUnsub()
        backdrop.remove()
        backdrop = null
    }
}
