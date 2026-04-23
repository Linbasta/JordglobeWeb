/**
 * Leaderboard Popup — shows top scores.
 *
 * Two entry points:
 *  - showLeaderboardPopup(config) — creates the popup with skeleton rows, returns
 *    a handle to fill data into. Caller owns the data flow.
 *  - showLeaderboardWithAuth(config) — full flow: auth gate, submit score, fetch
 *    leaderboard, fill data.
 *
 * The table always has exactly ROW_COUNT rows. On creation they show skeleton bars.
 * fillWithData() updates each row's cells in place — no DOM rebuild.
 */

import { isRealUser } from '../firebase'
import { postRecord, getLeaderboard, type LeaderboardEntry } from '../firestore-records'
import { showLoginModal } from './login-modal'
import { startConfetti, stopConfetti } from './confetti'
import { t } from '../i18n/i18n'

export type { LeaderboardEntry }

let backdrop: HTMLDivElement | null = null

const ROW_COUNT = 10

export interface LeaderboardHandle {
    rows: HTMLTableRowElement[]
    userRow: HTMLTableRowElement
    card: HTMLElement
    recordEl: HTMLElement
}

function formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

const SKELETON_CELL = '<span class="lb-skeleton-bar"></span>'

function setRowEntry(row: HTMLTableRowElement, rank: number, score: number, total: number, elapsedMs: number): void {
    row.className = 'lb-row'
    row.cells[0].textContent = `${rank}`
    row.cells[1].textContent = `${score}/${total}`
    row.cells[2].textContent = formatTime(elapsedMs)
}

function setRowUser(row: HTMLTableRowElement, rank: number, score: number, total: number, elapsedMs: number): void {
    row.className = 'lb-row lb-you'
    row.cells[0].textContent = `${rank}`
    row.cells[1].innerHTML = `${score}/${total} <span class="lb-you-tag">${t('leaderboard.you')}</span>`
    row.cells[2].textContent = formatTime(elapsedMs)
}

function setRowEmpty(row: HTMLTableRowElement, rank: number): void {
    row.className = 'lb-row'
    row.cells[0].textContent = `${rank}`
    row.cells[1].innerHTML = '&nbsp;'
    row.cells[2].innerHTML = '&nbsp;'
}

export function fillWithData(handle: LeaderboardHandle, entries: LeaderboardEntry[], userScore: number, userTotal: number, userElapsedMs: number): void {
    const scoreInt = Math.floor(userScore)
    const elapsedInt = Math.floor(userElapsedMs)

    // Determine if user belongs in the top 10
    let userRank = entries.length + 1
    for (let i = 0; i < entries.length; i++) {
        if (scoreInt > entries[i].score || (scoreInt === entries[i].score && elapsedInt < entries[i].elapsed_ms)) {
            userRank = i + 1
            break
        }
    }
    const userInTop10 = userRank <= ROW_COUNT

    if (userInTop10) {
        // Merge user into the top 10 list
        let rowIdx = 0
        let entryIdx = 0
        let userPlaced = false

        while (rowIdx < ROW_COUNT) {
            if (!userPlaced && userRank === rowIdx + 1) {
                setRowUser(handle.rows[rowIdx], rowIdx + 1, scoreInt, userTotal, userElapsedMs)
                userPlaced = true
                rowIdx++
                continue
            }
            if (entryIdx < entries.length) {
                const e = entries[entryIdx]
                setRowEntry(handle.rows[rowIdx], rowIdx + 1, e.score, e.total ?? userTotal, e.elapsed_ms)
                entryIdx++
            } else {
                setRowEmpty(handle.rows[rowIdx], rowIdx + 1)
            }
            rowIdx++
        }

        // Hide the separate user row since they're already in the list
        handle.userRow.style.display = 'none'
        handle.userRow.previousElementSibling!.setAttribute('style', 'display:none') // hide separator
    } else {
        // Fill top 10 entries only
        for (let i = 0; i < ROW_COUNT; i++) {
            if (i < entries.length) {
                const e = entries[i]
                setRowEntry(handle.rows[i], i + 1, e.score, e.total ?? userTotal, e.elapsed_ms)
            } else {
                setRowEmpty(handle.rows[i], i + 1)
            }
        }

        // Show user below separator
        handle.userRow.style.display = ''
        handle.userRow.previousElementSibling!.removeAttribute('style')
        setRowUser(handle.userRow, 0, scoreInt, userTotal, userElapsedMs)
        handle.userRow.cells[0].innerHTML = '&nbsp;'
    }
}

/** Creates the popup with skeleton rows. Returns a handle to fill data into. */
export function showLeaderboardPopup(onClose: () => void): LeaderboardHandle {
    hideLeaderboardPopup()

    const styleId = 'leaderboard-popup-styles'
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style')
        style.id = styleId
        style.textContent = `
            .lb-backdrop { position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:350;opacity:0;transition:opacity 0.3s ease-in-out; }
            .lb-card { width:380px;max-width:calc(100vw - 32px);background:linear-gradient(180deg,#1a3a5c 0%,#0f2744 100%);border-radius:16px;padding:24px 20px;text-align:center;position:relative;box-shadow:0 8px 32px rgba(0,0,0,0.4);transform:scale(0.9);opacity:0;transition:transform 0.3s ease-out,opacity 0.3s ease-out; }
            .lb-title { font-size:24px;font-weight:bold;color:#ffd700;margin-bottom:16px;font-family:Arial,sans-serif; }
            .lb-record { font-size:18px;font-weight:bold;color:#ffd700;text-shadow:0 0 12px rgba(255,215,0,0.6);margin-bottom:12px;font-family:Arial,sans-serif;opacity:0;transition:opacity 0.5s ease-in; }
            .lb-record.visible { opacity:1; }
            .lb-table { width:100%;border-collapse:collapse;margin-bottom:16px; }
            .lb-table th { font-size:12px;color:#7eb8e0;font-weight:bold;text-transform:uppercase;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.15);font-family:Arial,sans-serif;text-align:left; }
            .lb-row td { padding:8px;font-size:15px;color:#ddd;font-family:Arial,sans-serif;border-bottom:1px solid rgba(255,255,255,0.06);text-align:left; }
            .lb-rank { font-weight:bold;color:#7eb8e0;width:36px; }
            .lb-you td { color:#fff;background:rgba(255,215,0,0.12); }
            .lb-you .lb-rank { color:#ffd700; }
            .lb-you-tag { font-size:11px;background:#ffd700;color:#0f2744;padding:1px 6px;border-radius:4px;margin-left:6px;font-weight:bold; }
            .lb-close { display:inline-block;margin-top:8px;padding:10px 24px;background:transparent;border:1px solid rgba(255,255,255,0.3);border-radius:10px;color:#a0c4e0;font-size:14px;cursor:pointer;font-family:Arial,sans-serif;transition:background 0.15s; }
            .lb-close:hover { background:rgba(255,255,255,0.1); }
            .lb-separator td { padding:10px;border-bottom:none; }
            .lb-skeleton-bar { display:inline-block;width:60px;height:14px;background:rgba(255,255,255,0.08);border-radius:4px;animation:lb-pulse 1.2s ease-in-out infinite; }
            @keyframes lb-pulse { 0%,100% { opacity:0.4; } 50% { opacity:0.8; } }
        `
        document.head.appendChild(style)
    }

    backdrop = document.createElement('div')
    backdrop.className = 'lb-backdrop'

    const card = document.createElement('div')
    card.className = 'lb-card'

    const table = document.createElement('table')
    table.className = 'lb-table'

    const thead = document.createElement('thead')
    thead.innerHTML = `<tr><th>${t('leaderboard.rank')}</th><th>${t('leaderboard.score')}</th><th>${t('leaderboard.time')}</th></tr>`
    table.appendChild(thead)

    const tbody = document.createElement('tbody')
    const rows: HTMLTableRowElement[] = []
    for (let i = 0; i < ROW_COUNT; i++) {
        const tr = document.createElement('tr')
        tr.className = 'lb-row'
        tr.innerHTML = `<td class="lb-rank">${i + 1}</td><td>${SKELETON_CELL}</td><td>${SKELETON_CELL}</td>`
        tbody.appendChild(tr)
        rows.push(tr)
    }

    // Separator + user row
    const sepRow = document.createElement('tr')
    sepRow.className = 'lb-separator'
    sepRow.innerHTML = '<td colspan="3"></td>'
    tbody.appendChild(sepRow)

    const userRow = document.createElement('tr')
    userRow.className = 'lb-row'
    userRow.innerHTML = `<td class="lb-rank">&nbsp;</td><td>${SKELETON_CELL}</td><td>${SKELETON_CELL}</td>`
    tbody.appendChild(userRow)

    table.appendChild(tbody)

    const titleEl = document.createElement('div')
    titleEl.className = 'lb-title'
    titleEl.textContent = t('leaderboard.title')

    const recordEl = document.createElement('div')
    recordEl.className = 'lb-record'

    const closeBtn = document.createElement('button')
    closeBtn.className = 'lb-close'
    closeBtn.textContent = 'Close'
    closeBtn.addEventListener('click', () => {
        hideLeaderboardPopup()
        onClose()
    })

    card.appendChild(titleEl)
    card.appendChild(recordEl)
    card.appendChild(table)
    card.appendChild(closeBtn)

    backdrop.appendChild(card)
    document.body.appendChild(backdrop)

    requestAnimationFrame(() => {
        backdrop!.style.opacity = '1'
        card.style.transform = 'scale(1)'
        card.style.opacity = '1'
    })

    return { rows, userRow, card, recordEl }
}

/** Full flow: show popup, handle auth, submit score, fetch & display leaderboard. */
export function showLeaderboardWithAuth(config: {
    quizId: string
    userScore: number
    userTotal: number
    userElapsedMs: number
    isPersonalBest: boolean
    onClose: () => void
}): void {
    const { quizId, userScore, userTotal, userElapsedMs, isPersonalBest, onClose } = config
    const handle = showLeaderboardPopup(onClose)

    const doLoad = async () => {
        try {
            let isNewRecord = false
            if (isPersonalBest) {
                const result = await postRecord(quizId, userScore, userTotal, userElapsedMs)
                isNewRecord = result.isNewRecord
            }

            const leaderboard = await getLeaderboard(quizId)
            const entries = leaderboard?.entries ?? []

            fillWithData(handle, entries, userScore, userTotal, userElapsedMs)

            if (isNewRecord) {
                handle.recordEl.textContent = t('leaderboard.worldRecord')
                handle.recordEl.classList.add('visible')
                if (backdrop) startConfetti(backdrop, handle.card, 10)
            }
        } catch (e: any) {
            console.warn('Leaderboard load failed:', e)
            handle.rows.forEach((row, i) => setRowEmpty(row, i + 1))
            setRowEmpty(handle.userRow, 0)
            handle.rows[0].cells[1].textContent = 'Failed to load'
        }
    }

    if (isRealUser()) {
        doLoad()
    } else {
        showLoginModal({
            onSuccess: () => doLoad(),
            onCancel: () => {
                if (backdrop) {
                    backdrop.remove()
                    backdrop = null
                }
                onClose()
            },
        })
    }
}

export function hideLeaderboardPopup(): void {
    stopConfetti()
    if (backdrop) {
        backdrop.remove()
        backdrop = null
    }
}
