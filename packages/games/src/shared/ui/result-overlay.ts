/**
 * Result Overlay — dark card with score, time, message, confetti, and share button
 */

import { startConfetti, stopConfetti } from './confetti'
import { generateShareMessage } from './share-message'
import { asset } from '../asset-path'
import { t } from '../i18n/i18n'

let backdrop: HTMLDivElement | null = null

export interface ResultOverlayConfig {
    score: number
    total: number
    elapsedMs: number
    results: boolean[]
    quizTitle: string
    shareUrl: string
    shareEmoji?: string
    /** Sprite image URLs, one per tier. Last entry is the perfect-score sprite. */
    sprites?: string[]
    /** Names for each sprite tier (index 0 = lowest tier). Shown below the avatar. */
    spriteNames?: string[]
    /** Custom message function override. Called with (score, total) to produce the result message. */
    getMessage?: (score: number, total: number) => string
    /** Custom share squares formatter. If provided, replaces the default 🟩🟥 grid in the share message. */
    formatShareSquares?: (results: boolean[]) => string
    /** Display "Personal Best" banner when user beats their previous best score */
    isPersonalBest?: boolean
    /** Called when user clicks "See Where You Rank" */
    onSeeRanking?: () => void
    onRetry?: () => void
}

function formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function getMessage(score: number, total: number): string {
    const pct = score / total
    if (pct === 1) return t('result.message.perfect')
    if (pct >= 0.8) return t('result.message.great')
    if (pct >= 0.5) return t('result.message.ok')
    return t('result.message.poor')
}

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

const SHARE_ICON = '<svg viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg>'
const CHECK_ICON = '<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>'
const EXIT_ICON = '<svg viewBox="0 0 24 24"><path d="M3 3h12v4h-2V5H5v14h8v-2h2v4H3V3z"/><path d="M11 11h8.5l-2.3-2.3 1.4-1.4 4.4 4.4c.3.3.3.8 0 1.1l-4.4 4.4-1.4-1.4 2.3-2.3H11v-2.5z"/></svg>'
const RETRY_ICON = '<svg viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>'
const TROPHY_ICON = '<svg viewBox="0 0 24 24"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/></svg>'
const APP_STORE_URL = 'https://apps.apple.com/app/id1599500931'
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.linbasta.jordglobegeo'
const MORE_GAMES_URL = 'https://jordglobe.com/'

export function showResultOverlay(config: ResultOverlayConfig): void {
    hideResultOverlay()

    const { score, total, elapsedMs, results, quizTitle, shareUrl, shareEmoji, sprites, spriteNames, getMessage: customGetMessage, formatShareSquares, isPersonalBest, onSeeRanking, onRetry } = config
    const isPerfect = score === total
    const SPRITE_COUNT = sprites?.length ?? 0

    // Inject styles
    const styleId = 'result-overlay-styles'
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style')
        style.id = styleId
        style.textContent = `
            .ro-backdrop { position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:200;opacity:0;transition:opacity 0.3s ease-in-out; }
            .ro-card { width:340px;background:linear-gradient(180deg,#1a3a5c 0%,#0f2744 100%);border-radius:16px;padding:28px 24px;text-align:center;position:relative;box-shadow:0 8px 32px rgba(0,0,0,0.4);transform:scale(0.8);opacity:0;transition:transform 0.3s ease-out,opacity 0.3s ease-out; }
            .ro-title { font-size:36px;font-weight:bold;color:#fff;margin-bottom:24px;text-shadow:0 2px 8px rgba(0,0,0,0.3);font-family:Arial,sans-serif; }
            .ro-stats { display:flex;justify-content:center;align-items:center;gap:16px;margin-bottom:20px; }
            .ro-stat { text-align:center;flex:1; }
            .ro-stat-label { font-size:14px;color:#7eb8e0;margin-bottom:4px;font-weight:bold;font-family:Arial,sans-serif; }
            .ro-stat-value { font-size:32px;font-weight:bold;color:#fff;font-family:Arial,sans-serif; }
            .ro-sprite { width:100px;height:100px;object-fit:contain;flex-shrink:0; }
            .ro-message { font-size:18px;font-weight:bold;color:#7cf6ff;margin-bottom:24px;font-family:Arial,sans-serif; }
            .ro-share { border-top:1px solid rgba(255,255,255,0.15);padding-top:20px;margin-top:4px; }
            .ro-share-btn { display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:12px 20px;background:#22c55e;border:none;border-radius:10px;color:#fff;font-size:16px;font-weight:bold;cursor:pointer;transition:background 0.15s,transform 0.1s;margin-bottom:20px;font-family:Arial,sans-serif;box-shadow:0 2px 12px rgba(34,197,94,0.3);box-sizing:border-box; }
            .ro-share-btn:hover { background:#16a34a;transform:scale(1.03);box-shadow:0 4px 16px rgba(34,197,94,0.4); }
            .ro-share-btn:active { transform:scale(0.97); }
            .ro-share-btn svg { width:20px;height:20px;fill:#fff; }
            .ro-share-btn.copied { background:#16a34a; }
            .ro-share-btn.copied:hover { background:#16a34a; }
            .ro-ranking-btn, .ro-more-btn, .ro-retry-btn { display:flex;align-items:center;justify-content:center;gap:8px;width:100%;margin-top:10px;padding:12px 20px;background:#2a7fff;border:none;border-radius:10px;color:#fff;font-size:16px;font-weight:bold;cursor:pointer;text-decoration:none;text-align:center;transition:background 0.15s,transform 0.1s;font-family:Arial,sans-serif;box-sizing:border-box; }
            .ro-ranking-btn:hover, .ro-more-btn:hover, .ro-retry-btn:hover { background:#3d8fff;transform:scale(1.02); }
            .ro-ranking-btn:active, .ro-more-btn:active, .ro-retry-btn:active { transform:scale(0.98); }
            .ro-retry-btn { margin-top:24px; }
            .ro-ranking-btn svg, .ro-more-btn svg, .ro-retry-btn svg { width:20px;height:20px;fill:currentColor;flex-shrink:0; }
            .ro-store-links { display:flex;justify-content:center;gap:12px;margin-top:24px; }
            .ro-store-badge { height:36px;transition:transform 0.1s,opacity 0.15s;opacity:0.9; }
            .ro-store-badge:hover { transform:scale(1.05);opacity:1; }
            .ro-personal-best { font-size:18px;font-weight:bold;color:#7cf6ff;margin-bottom:16px;font-family:Arial,sans-serif;text-shadow:0 0 10px rgba(124,246,255,0.5);opacity:0;transition:opacity 0.5s ease-in; }
            .ro-personal-best.visible { opacity:1; }
        `
        document.head.appendChild(style)
    }

    backdrop = document.createElement('div')
    backdrop.className = 'ro-backdrop'

    const card = document.createElement('div')
    card.className = 'ro-card'

    // Determine starting sprite (1 = lowest)
    const finalSpriteIndex = score === total
        ? SPRITE_COUNT
        : Math.max(1, Math.min(SPRITE_COUNT - 1, Math.ceil((score / total) * (SPRITE_COUNT - 1))))
    const spriteHtml = sprites
        ? `<img class="ro-sprite" src="${sprites[0]}" alt="">`
        : ''

    card.innerHTML = `
        <div class="ro-title">${isPerfect ? t('result.title.perfect') : t('result.title.default')}</div>
        <div class="ro-stats">
            <div class="ro-stat">
                <div class="ro-stat-label">${t('result.stat.score')}</div>
                <div class="ro-stat-value ro-score-value">0/${total}</div>
            </div>
            ${spriteHtml}
            <div class="ro-stat">
                <div class="ro-stat-label">${t('result.stat.time')}</div>
                <div class="ro-stat-value">${formatTime(elapsedMs)}</div>
            </div>
        </div>
        ${isPersonalBest ? `<div class="ro-personal-best">${t('result.badge.personalBest')}</div>` : ''}
        <div class="ro-message">${(customGetMessage ?? getMessage)(score, total)}</div>
        <button class="ro-share-btn">${SHARE_ICON} ${t('result.share.copy')}</button>
        <div class="ro-share">
            ${onSeeRanking ? `<button class="ro-ranking-btn">${TROPHY_ICON}${t('result.seeRanking')}</button>` : ''}
            <a class="ro-more-btn" href="${MORE_GAMES_URL}">${EXIT_ICON}${t('settings.moreGames')}</a>
            ${onRetry ? `<button class="ro-retry-btn">${RETRY_ICON}${t('result.retry')}</button>` : ''}
            <div class="ro-store-links">
                <a href="${APP_STORE_URL}" target="_blank" rel="noopener"><img src="${asset('app-store-badge.svg')}" alt="Download on the App Store" class="ro-store-badge"></a>
                <a href="${PLAY_STORE_URL}" target="_blank" rel="noopener"><img src="${asset('google-play-badge.png')}" alt="Get it on Google Play" class="ro-store-badge"></a>
            </div>
        </div>
    `

    // Count-up animation — duration ensures each sprite frame shows for at least 1s
    const scoreValueEl = card.querySelector('.ro-score-value') as HTMLElement
    const spriteEl = sprites ? card.querySelector('.ro-sprite') as HTMLImageElement : null
    const messageEl = card.querySelector('.ro-message') as HTMLElement
    const MS_PER_FRAME = 400
    const COUNT_UP_DURATION = sprites ? finalSpriteIndex * MS_PER_FRAME : 1200
    const countUpStart = performance.now() + 400 // delay to let card animate in

    function countUpTick() {
        const elapsed = performance.now() - countUpStart
        if (elapsed < 0) { requestAnimationFrame(countUpTick); return }

        const t = Math.min(1, elapsed / COUNT_UP_DURATION)
        // Ease out quad
        const eased = 1 - (1 - t) * (1 - t)
        const displayScore = Math.round(eased * score)

        scoreValueEl.textContent = `${displayScore}/${total}`

        // Update sprite based on current display score
        if (spriteEl && sprites) {
            const spriteIdx = displayScore === total
                ? SPRITE_COUNT
                : displayScore === 0
                    ? 1
                    : Math.max(1, Math.min(SPRITE_COUNT - 1, Math.ceil((displayScore / total) * (SPRITE_COUNT - 1))))
            spriteEl.src = sprites[spriteIdx - 1]
            if (spriteNames && messageEl) messageEl.textContent = spriteNames[spriteIdx - 1]
        }

        if (t < 1) {
            requestAnimationFrame(countUpTick)
        } else {
            // Fire confetti when count-up finishes
            const bursts = isPersonalBest ? 8 : isPerfect ? 6 : 2
            startConfetti(backdrop!, card, bursts)
            // Reveal personal best text
            if (isPersonalBest) {
                const pbEl = card.querySelector('.ro-personal-best')
                if (pbEl) pbEl.classList.add('visible')
            }
        }
    }
    requestAnimationFrame(countUpTick)

    // Share button
    const shareBtn = card.querySelector('.ro-share-btn') as HTMLButtonElement
    shareBtn.addEventListener('click', () => {
        const customSquares = formatShareSquares ? formatShareSquares(results) : undefined
        const msg = generateShareMessage(quizTitle, score, total, elapsedMs, results, shareUrl, shareEmoji, customSquares)
        copyToClipboard(msg)
        shareBtn.innerHTML = `${CHECK_ICON} ${t('result.share.copied')}`
        shareBtn.classList.add('copied')
        setTimeout(() => {
            shareBtn.innerHTML = `${SHARE_ICON} ${t('result.share.copy')}`
            shareBtn.classList.remove('copied')
        }, 2000)
    })

    // Ranking button
    if (onSeeRanking) {
        const rankingBtn = card.querySelector('.ro-ranking-btn') as HTMLButtonElement
        rankingBtn.addEventListener('click', () => onSeeRanking())
    }

    // Retry button
    if (onRetry) {
        const retryBtn = card.querySelector('.ro-retry-btn') as HTMLButtonElement
        retryBtn.addEventListener('click', () => {
            hideResultOverlay()
            onRetry()
        })
    }

    backdrop.appendChild(card)
    document.body.appendChild(backdrop)

    // Animate in
    requestAnimationFrame(() => {
        backdrop!.style.opacity = '1'
        card.style.transform = 'scale(1)'
        card.style.opacity = '1'
    })
}

export function hideResultOverlay(): void {
    stopConfetti()
    if (backdrop) {
        backdrop.remove()
        backdrop = null
    }
}

// --- Personal Best localStorage helpers ---

export interface PersonalBestRecord {
    score: number
    total: number
    elapsedMs: number
    timestamp: number
}

const PB_PREFIX = 'pb_'

/**
 * Get the stored personal best for a quiz
 * @param quizId Unique identifier for the quiz (e.g. 'euro-music-quiz', 'country-quiz')
 */
export function getPersonalBest(quizId: string): PersonalBestRecord | null {
    try {
        const stored = localStorage.getItem(PB_PREFIX + quizId)
        if (!stored) return null
        return JSON.parse(stored) as PersonalBestRecord
    } catch {
        return null
    }
}

/**
 * Save a new personal best record
 */
export function setPersonalBest(quizId: string, score: number, total: number, elapsedMs: number): void {
    const record: PersonalBestRecord = {
        score,
        total,
        elapsedMs,
        timestamp: Date.now()
    }
    localStorage.setItem(PB_PREFIX + quizId, JSON.stringify(record))
}

/**
 * Check if the current score beats the personal best and update if so.
 * Returns true if this is a new personal best.
 *
 * Scoring logic:
 * 1. Higher score always wins
 * 2. On tie, time only matters once you've hit 100% — matching a sub-perfect
 *    score faster is not a PB.
 */
export function checkAndUpdatePersonalBest(quizId: string, score: number, total: number, elapsedMs: number): boolean {
    const existing = getPersonalBest(quizId)

    // No existing record = new personal best
    if (!existing) {
        setPersonalBest(quizId, score, total, elapsedMs)
        return true
    }

    // Higher score wins
    if (score > existing.score) {
        setPersonalBest(quizId, score, total, elapsedMs)
        return true
    }

    // Perfect-score tie: faster time wins
    if (score === existing.score && score === total && elapsedMs < existing.elapsedMs) {
        setPersonalBest(quizId, score, total, elapsedMs)
        return true
    }

    return false
}

/**
 * Clear the personal best for a quiz (useful for testing)
 */
export function clearPersonalBest(quizId: string): void {
    localStorage.removeItem(PB_PREFIX + quizId)
}
