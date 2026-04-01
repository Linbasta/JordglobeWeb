/**
 * Result Overlay — dark card with score, time, message, confetti, and share button
 */

import { startConfetti, stopConfetti } from './confetti'
import { generateShareMessage } from './share-message'

let backdrop: HTMLDivElement | null = null

export interface ResultOverlayConfig {
    score: number
    total: number
    elapsedMs: number
    results: boolean[]
    quizTitle: string
    shareUrl: string
    shareEmoji?: string
    /** Path prefix for sprite images (e.g. '/eurovision/' expects /eurovision/1.png through /eurovision/6.png) */
    spritePath?: string
    /** Names for each sprite level (index 0 = sprite 1, etc). Shown below the avatar. */
    spriteNames?: string[]
    /** Custom message function override. Called with (score, total) to produce the result message. */
    getMessage?: (score: number, total: number) => string
    /** Custom share squares formatter. If provided, replaces the default 🟩🟥 grid in the share message. */
    formatShareSquares?: (results: boolean[]) => string
    isNewRecord?: boolean
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
    if (pct === 1) return 'Congratulations!'
    if (pct >= 0.8) return 'Well played!'
    if (pct >= 0.5) return 'Not bad!'
    return 'Better luck next time!'
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

const COPY_ICON = '<svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>'
const CHECK_ICON = '<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>'

export function showResultOverlay(config: ResultOverlayConfig): void {
    hideResultOverlay()

    const { score, total, elapsedMs, results, quizTitle, shareUrl, shareEmoji, spritePath, spriteNames, getMessage: customGetMessage, formatShareSquares, isNewRecord, onRetry } = config
    const isPerfect = score === total
    const SPRITE_COUNT = 6

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
            .ro-share-text { font-size:14px;color:#a0c4e0;margin-bottom:14px;line-height:1.4;font-family:Arial,sans-serif; }
            .ro-share-btn { display:inline-flex;align-items:center;gap:8px;padding:12px 28px;background:#2a7fff;border:none;border-radius:10px;color:#fff;font-size:16px;font-weight:bold;cursor:pointer;transition:background 0.15s,transform 0.1s;font-family:Arial,sans-serif; }
            .ro-share-btn:hover { background:#3d8fff;transform:scale(1.03); }
            .ro-share-btn:active { transform:scale(0.97); }
            .ro-share-btn svg { width:20px;height:20px;fill:#fff; }
            .ro-share-btn.copied { background:#22c55e; }
            .ro-share-btn.copied:hover { background:#22c55e; }
            .ro-retry-btn { display:inline-flex;align-items:center;gap:8px;padding:10px 24px;background:transparent;border:1px solid rgba(255,255,255,0.3);border-radius:10px;color:#a0c4e0;font-size:14px;cursor:pointer;transition:background 0.15s,transform 0.1s;margin-top:16px;font-family:Arial,sans-serif; }
            .ro-retry-btn:hover { background:rgba(255,255,255,0.1);transform:scale(1.03); }
            .ro-record { font-size:20px;font-weight:bold;color:#ffd700;margin-bottom:16px;font-family:Arial,sans-serif;text-shadow:0 0 12px rgba(255,215,0,0.6);opacity:0;transition:opacity 0.5s ease-in; }
            .ro-record.visible { opacity:1; }
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
    const spriteHtml = spritePath
        ? `<img class="ro-sprite" src="${spritePath}1.png" alt="">`
        : ''

    card.innerHTML = `
        <div class="ro-title">${isPerfect ? 'Perfect!' : 'Congrats!'}</div>
        <div class="ro-stats">
            <div class="ro-stat">
                <div class="ro-stat-label">Result</div>
                <div class="ro-stat-value ro-score-value">0/${total}</div>
            </div>
            ${spriteHtml}
            <div class="ro-stat">
                <div class="ro-stat-label">Time</div>
                <div class="ro-stat-value">${formatTime(elapsedMs)}</div>
            </div>
        </div>
        ${isNewRecord ? '<div class="ro-record">🏆 NEW WORLD RECORD 🏆</div>' : ''}
        <div class="ro-message">${(customGetMessage ?? getMessage)(score, total)}</div>
        <div class="ro-share">
            <div class="ro-share-text">Can your friends beat your score?</div>
            <button class="ro-share-btn">${COPY_ICON} Copy challenge link</button>
            ${onRetry ? '<br><button class="ro-retry-btn">Play again</button>' : ''}
        </div>
    `

    // Count-up animation — duration ensures each sprite frame shows for at least 1s
    const scoreValueEl = card.querySelector('.ro-score-value') as HTMLElement
    const spriteEl = spritePath ? card.querySelector('.ro-sprite') as HTMLImageElement : null
    const messageEl = card.querySelector('.ro-message') as HTMLElement
    const MS_PER_FRAME = 400
    const COUNT_UP_DURATION = spritePath ? finalSpriteIndex * MS_PER_FRAME : 1200
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
        if (spriteEl && spritePath) {
            const spriteIdx = displayScore === total
                ? SPRITE_COUNT
                : displayScore === 0
                    ? 1
                    : Math.max(1, Math.min(SPRITE_COUNT - 1, Math.ceil((displayScore / total) * (SPRITE_COUNT - 1))))
            spriteEl.src = `${spritePath}${spriteIdx}.png`
            if (spriteNames && messageEl) messageEl.textContent = spriteNames[spriteIdx - 1]
        }

        if (t < 1) {
            requestAnimationFrame(countUpTick)
        } else {
            // Fire confetti when count-up finishes
            const bursts = isNewRecord ? 10 : isPerfect ? 6 : 2
            startConfetti(backdrop!, card, bursts)
            // Reveal world record text
            if (isNewRecord) {
                const recordEl = card.querySelector('.ro-record')
                if (recordEl) recordEl.classList.add('visible')
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
        shareBtn.innerHTML = `${CHECK_ICON} Copied!`
        shareBtn.classList.add('copied')
        setTimeout(() => {
            shareBtn.innerHTML = `${COPY_ICON} Copy challenge link`
            shareBtn.classList.remove('copied')
        }, 2000)
    })

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
