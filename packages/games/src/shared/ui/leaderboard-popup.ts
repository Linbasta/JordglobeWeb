/**
 * Leaderboard Popup — shows top scores with a Daily/Weekly toggle.
 *
 * Two entry points:
 *  - showLeaderboardPopup(onClose) — creates the popup with skeleton rows, returns
 *    a handle to fill data into. Caller owns the data flow.
 *  - showLeaderboardWithAuth(config) — full flow: auth gate, submit score, fetch
 *    leaderboard, fill data.
 *
 * The table always has exactly ROW_COUNT rows. On creation they show skeleton bars.
 * fillWithData() loads both daily + weekly into the handle's state, picks an
 * initial mode (weekly when daily has < 5 entries), and renders. Tab clicks
 * switch the mode and re-render in place — no DOM rebuild.
 */

import { postRecord, getLeaderboard, type LeaderboardEntry } from '../firestore-records'
import { showLoginModal } from './login-modal'
import { getCachedUsername } from '../username-cache'
import { startConfetti, stopConfetti } from './confetti'
import { t, getLocale } from '../i18n/i18n'

export type { LeaderboardEntry }
export type LeaderboardMode = 'daily' | 'weekly'

let backdrop: HTMLDivElement | null = null
let countdownTimer: number | null = null

const ROW_COUNT = 10
const WEEKLY_DEFAULT_THRESHOLD = 5

function msUntilUtcMidnight(): number {
    const now = new Date()
    const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0)
    return Math.max(0, next - now.getTime())
}

function formatCountdown(ms: number): string {
    const totalMin = Math.ceil(ms / 60000)
    const hours = Math.floor(totalMin / 60)
    const minutes = totalMin % 60
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}

function formatTodayUtc(): string {
    return new Intl.DateTimeFormat(getLocale(), { dateStyle: 'long', timeZone: 'UTC' }).format(new Date())
}

interface LeaderboardState {
    mode: LeaderboardMode
    daily: LeaderboardEntry[]
    weekly: LeaderboardEntry[]
    userScore: number
    userTotal: number
    userElapsedMs: number
    isNewRecord: boolean
}

export interface LeaderboardHandle {
    rows: HTMLTableRowElement[]
    userRow: HTMLTableRowElement
    userSepRow: HTMLTableRowElement
    card: HTMLElement
    recordEl: HTMLElement
    titleEl: HTMLElement
    subtitleEl: HTMLElement
    countdownEl: HTMLElement
    dailyBtn: HTMLButtonElement
    weeklyBtn: HTMLButtonElement
    state: LeaderboardState
}

function formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

const SKELETON_CELL = '<span class="lb-skeleton-bar"></span>'

function setRowEntry(row: HTMLTableRowElement, rank: number, name: string, score: number, total: number, elapsedMs: number): void {
    row.className = 'lb-row'
    row.cells[0].textContent = `${rank}`
    row.cells[1].textContent = name || '—'
    row.cells[2].textContent = `${score}/${total}`
    row.cells[3].textContent = formatTime(elapsedMs)
}

function setRowUser(row: HTMLTableRowElement, rank: number, score: number, total: number, elapsedMs: number): void {
    row.className = 'lb-row lb-you'
    row.cells[0].textContent = `${rank}`

    const nameCell = row.cells[1]
    nameCell.textContent = ''
    const username = getCachedUsername()
    if (username) {
        nameCell.appendChild(document.createTextNode(username + ' '))
    }
    const tag = document.createElement('span')
    tag.className = 'lb-you-tag'
    tag.textContent = t('leaderboard.you')
    nameCell.appendChild(tag)

    row.cells[2].textContent = `${score}/${total}`
    row.cells[3].textContent = formatTime(elapsedMs)
}

function setRowEmpty(row: HTMLTableRowElement, rank: number): void {
    row.className = 'lb-row'
    row.cells[0].textContent = `${rank}`
    row.cells[1].innerHTML = '&nbsp;'
    row.cells[2].innerHTML = '&nbsp;'
    row.cells[3].innerHTML = '&nbsp;'
}

function renderRows(
    handle: LeaderboardHandle,
    entries: LeaderboardEntry[],
    userScore: number,
    userTotal: number,
    userElapsedMs: number,
): void {
    let scoreInt = Math.floor(userScore)
    let elapsedInt = Math.floor(userElapsedMs)
    let totalInt = userTotal

    // Dedupe: collapse any rows belonging to this user into the "You" row,
    // using whichever score is best. Defends against stale aggregates
    // (server now dedupes by uid, but this guards against transitional state).
    const username = getCachedUsername()
    let dedupedEntries = entries
    if (username) {
        const own = entries.filter(e => e.name === username)
        if (own.length > 0) {
            for (const o of own) {
                if (o.score > scoreInt || (o.score === scoreInt && o.elapsed_ms < elapsedInt)) {
                    scoreInt = o.score
                    elapsedInt = o.elapsed_ms
                    totalInt = o.total ?? totalInt
                }
            }
            dedupedEntries = entries.filter(e => e.name !== username)
        }
    }

    let userRank = dedupedEntries.length + 1
    for (let i = 0; i < dedupedEntries.length; i++) {
        if (scoreInt > dedupedEntries[i].score || (scoreInt === dedupedEntries[i].score && elapsedInt < dedupedEntries[i].elapsed_ms)) {
            userRank = i + 1
            break
        }
    }
    const userInTop10 = userRank <= ROW_COUNT

    if (userInTop10) {
        let rowIdx = 0
        let entryIdx = 0
        let userPlaced = false

        while (rowIdx < ROW_COUNT) {
            if (!userPlaced && userRank === rowIdx + 1) {
                setRowUser(handle.rows[rowIdx], rowIdx + 1, scoreInt, totalInt, elapsedInt)
                userPlaced = true
                rowIdx++
                continue
            }
            if (entryIdx < dedupedEntries.length) {
                const e = dedupedEntries[entryIdx]
                setRowEntry(handle.rows[rowIdx], rowIdx + 1, e.name, e.score, e.total ?? totalInt, e.elapsed_ms)
                entryIdx++
            } else {
                setRowEmpty(handle.rows[rowIdx], rowIdx + 1)
            }
            rowIdx++
        }

        handle.userRow.style.display = 'none'
        handle.userSepRow.style.display = 'none'
    } else {
        for (let i = 0; i < ROW_COUNT; i++) {
            if (i < dedupedEntries.length) {
                const e = dedupedEntries[i]
                setRowEntry(handle.rows[i], i + 1, e.name, e.score, e.total ?? totalInt, e.elapsed_ms)
            } else {
                setRowEmpty(handle.rows[i], i + 1)
            }
        }

        handle.userRow.style.display = ''
        handle.userSepRow.style.display = ''
        setRowUser(handle.userRow, 0, scoreInt, totalInt, elapsedInt)
        handle.userRow.cells[0].innerHTML = '&nbsp;'
    }
}

function applyMode(handle: LeaderboardHandle): void {
    const { mode, daily, weekly, userScore, userTotal, userElapsedMs, isNewRecord } = handle.state

    handle.dailyBtn.classList.toggle('lb-tab-active', mode === 'daily')
    handle.weeklyBtn.classList.toggle('lb-tab-active', mode === 'weekly')

    if (mode === 'daily') {
        handle.titleEl.textContent = t('leaderboard.title')
        handle.subtitleEl.textContent = formatTodayUtc()
        handle.countdownEl.style.display = ''
        if (isNewRecord) {
            handle.recordEl.classList.add('visible')
        }
    } else {
        handle.titleEl.textContent = t('leaderboard.titleWeekly')
        handle.subtitleEl.textContent = t('leaderboard.weeklyRange')
        handle.countdownEl.style.display = 'none'
        handle.recordEl.classList.remove('visible')
    }

    const entries = mode === 'daily' ? daily : weekly
    renderRows(handle, entries, userScore, userTotal, userElapsedMs)
}

function pickInitialMode(daily: LeaderboardEntry[], weekly: LeaderboardEntry[]): LeaderboardMode {
    // Default to weekly when daily is sparse, but only if weekly actually has
    // more to show — otherwise sticking with daily is the same picture.
    if (daily.length < WEEKLY_DEFAULT_THRESHOLD && weekly.length > daily.length) return 'weekly'
    return 'daily'
}

export function fillWithData(
    handle: LeaderboardHandle,
    daily: LeaderboardEntry[],
    weekly: LeaderboardEntry[],
    userScore: number,
    userTotal: number,
    userElapsedMs: number,
    options: { isNewRecord?: boolean; initialMode?: LeaderboardMode } = {},
): void {
    handle.state = {
        mode: options.initialMode ?? pickInitialMode(daily, weekly),
        daily,
        weekly,
        userScore,
        userTotal,
        userElapsedMs,
        isNewRecord: options.isNewRecord ?? false,
    }
    applyMode(handle)
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
            .lb-tabs { display:flex;gap:4px;background:rgba(0,0,0,0.25);border-radius:10px;padding:3px;margin:0 auto 14px;width:fit-content; }
            .lb-tab { background:transparent;border:none;color:#a0c4e0;font-family:Arial,sans-serif;font-size:13px;font-weight:600;padding:6px 18px;border-radius:8px;cursor:pointer;transition:background 0.15s,color 0.15s; }
            .lb-tab:hover { color:#fff; }
            .lb-tab-active { background:rgba(126,184,224,0.25);color:#fff; }
            .lb-title { font-size:24px;font-weight:bold;color:#ffd700;margin-bottom:4px;font-family:Arial,sans-serif; }
            .lb-subtitle { font-size:13px;color:#a0c4e0;margin-bottom:8px;font-family:Arial,sans-serif; }
            .lb-countdown { display:inline-block;font-size:11px;background:rgba(126,184,224,0.15);color:#7eb8e0;padding:3px 10px;border-radius:10px;margin-bottom:14px;font-family:Arial,sans-serif;font-weight:600;letter-spacing:0.3px;text-transform:uppercase; }
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

    const tabsEl = document.createElement('div')
    tabsEl.className = 'lb-tabs'

    const dailyBtn = document.createElement('button')
    dailyBtn.className = 'lb-tab lb-tab-active'
    dailyBtn.textContent = t('leaderboard.tabDaily')

    const weeklyBtn = document.createElement('button')
    weeklyBtn.className = 'lb-tab'
    weeklyBtn.textContent = t('leaderboard.tabWeekly')

    tabsEl.appendChild(dailyBtn)
    tabsEl.appendChild(weeklyBtn)

    const table = document.createElement('table')
    table.className = 'lb-table'

    const thead = document.createElement('thead')
    thead.innerHTML = `<tr><th>${t('leaderboard.rank')}</th><th>${t('leaderboard.name')}</th><th>${t('leaderboard.score')}</th><th>${t('leaderboard.time')}</th></tr>`
    table.appendChild(thead)

    const tbody = document.createElement('tbody')
    const rows: HTMLTableRowElement[] = []
    for (let i = 0; i < ROW_COUNT; i++) {
        const tr = document.createElement('tr')
        tr.className = 'lb-row'
        tr.innerHTML = `<td class="lb-rank">${i + 1}</td><td>${SKELETON_CELL}</td><td>${SKELETON_CELL}</td><td>${SKELETON_CELL}</td>`
        tbody.appendChild(tr)
        rows.push(tr)
    }

    const userSepRow = document.createElement('tr')
    userSepRow.className = 'lb-separator'
    userSepRow.innerHTML = '<td colspan="4"></td>'
    tbody.appendChild(userSepRow)

    const userRow = document.createElement('tr')
    userRow.className = 'lb-row'
    userRow.innerHTML = `<td class="lb-rank">&nbsp;</td><td>${SKELETON_CELL}</td><td>${SKELETON_CELL}</td><td>${SKELETON_CELL}</td>`
    tbody.appendChild(userRow)

    table.appendChild(tbody)

    const titleEl = document.createElement('div')
    titleEl.className = 'lb-title'
    titleEl.textContent = t('leaderboard.title')

    const subtitleEl = document.createElement('div')
    subtitleEl.className = 'lb-subtitle'
    subtitleEl.textContent = formatTodayUtc()

    const countdownEl = document.createElement('div')
    countdownEl.className = 'lb-countdown'
    const updateCountdown = () => {
        countdownEl.textContent = t('leaderboard.resetsIn').replace('{time}', formatCountdown(msUntilUtcMidnight()))
    }
    updateCountdown()
    countdownTimer = window.setInterval(updateCountdown, 30000)

    const recordEl = document.createElement('div')
    recordEl.className = 'lb-record'

    const closeBtn = document.createElement('button')
    closeBtn.className = 'lb-close'
    closeBtn.textContent = 'Close'
    closeBtn.addEventListener('click', () => {
        hideLeaderboardPopup()
        onClose()
    })

    card.appendChild(tabsEl)
    card.appendChild(titleEl)
    card.appendChild(subtitleEl)
    card.appendChild(countdownEl)
    card.appendChild(recordEl)
    card.appendChild(table)
    card.appendChild(closeBtn)

    backdrop.appendChild(card)
    document.body.appendChild(backdrop)

    const handle: LeaderboardHandle = {
        rows,
        userRow,
        userSepRow,
        card,
        recordEl,
        titleEl,
        subtitleEl,
        countdownEl,
        dailyBtn,
        weeklyBtn,
        state: {
            mode: 'daily',
            daily: [],
            weekly: [],
            userScore: 0,
            userTotal: 0,
            userElapsedMs: 0,
            isNewRecord: false,
        },
    }

    dailyBtn.addEventListener('click', () => {
        if (handle.state.mode === 'daily') return
        handle.state.mode = 'daily'
        applyMode(handle)
    })
    weeklyBtn.addEventListener('click', () => {
        if (handle.state.mode === 'weekly') return
        handle.state.mode = 'weekly'
        applyMode(handle)
    })

    requestAnimationFrame(() => {
        backdrop!.style.opacity = '1'
        card.style.transform = 'scale(1)'
        card.style.opacity = '1'
    })

    return handle
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
            const daily = leaderboard?.entries ?? []
            const weekly = leaderboard?.weekly_entries ?? []

            fillWithData(handle, daily, weekly, userScore, userTotal, userElapsedMs, { isNewRecord })

            if (isNewRecord) {
                handle.recordEl.textContent = t('leaderboard.worldRecord')
                if (handle.state.mode === 'daily') {
                    handle.recordEl.classList.add('visible')
                    if (backdrop) startConfetti(backdrop, handle.card, 10)
                }
            }
        } catch (e: any) {
            console.warn('Leaderboard load failed:', e)
            handle.rows.forEach((row, i) => setRowEmpty(row, i + 1))
            setRowEmpty(handle.userRow, 0)
            handle.rows[0].cells[1].textContent = 'Failed to load'
        }
    }

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

export function hideLeaderboardPopup(): void {
    stopConfetti()
    if (countdownTimer !== null) {
        clearInterval(countdownTimer)
        countdownTimer = null
    }
    if (backdrop) {
        backdrop.remove()
        backdrop = null
    }
}
