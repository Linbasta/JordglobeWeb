/**
 * Local-storage leaderboard for the Eurovision playtest.
 *
 * Reuses the chrome of the production leaderboard popup (`showLeaderboardPopup`)
 * but stores entries in localStorage instead of Firestore, and skips the auth
 * flow entirely. Each round prompts the player for a free-text name, sorts the
 * tally by score desc / time asc, and re-renders.
 *
 * This file ships only via the dev-test URL; deleting it (along with the
 * sibling .astro page) fully removes the playtest variant.
 */

import {
    showLeaderboardPopup,
    type LeaderboardEntry,
    type LeaderboardHandle,
} from '../shared/ui/leaderboard-popup'

const STORAGE_KEY = 'playtest_leaderboard_euro-music-quiz'
const ROW_COUNT = 10

function loadEntries(): LeaderboardEntry[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed : []
    } catch {
        return []
    }
}

function saveEntries(entries: LeaderboardEntry[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

function sortEntries(entries: LeaderboardEntry[]): LeaderboardEntry[] {
    return [...entries].sort(
        (a, b) => b.score - a.score || a.elapsed_ms - b.elapsed_ms,
    )
}

function formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function fillRows(
    handle: LeaderboardHandle,
    entries: LeaderboardEntry[],
    highlight: LeaderboardEntry | null,
): void {
    for (let i = 0; i < ROW_COUNT; i++) {
        const row = handle.rows[i]
        if (i < entries.length) {
            const e = entries[i]
            const isMe =
                !!highlight &&
                e.created_at === highlight.created_at &&
                e.name === highlight.name &&
                e.score === highlight.score
            row.className = isMe ? 'lb-row lb-you' : 'lb-row'
            row.cells[0].textContent = `${i + 1}`
            row.cells[1].textContent = e.name
            row.cells[2].textContent = `${e.score}/${e.total}`
            row.cells[3].textContent = formatTime(e.elapsed_ms)
        } else {
            row.className = 'lb-row'
            row.cells[0].textContent = `${i + 1}`
            row.cells[1].innerHTML = '&nbsp;'
            row.cells[2].innerHTML = '&nbsp;'
            row.cells[3].innerHTML = '&nbsp;'
        }
    }
    // Hide the prod popup's separate user row + separator — we render the
    // user inline as a highlighted row instead.
    handle.userRow.style.display = 'none'
    const sep = handle.userRow.previousElementSibling as HTMLElement | null
    if (sep) sep.style.display = 'none'
}

function injectStyles(): void {
    const styleId = 'pt-leaderboard-styles'
    if (document.getElementById(styleId)) return
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
        .pt-score-pre { font-size:14px;color:#a0c4e0;margin-bottom:10px;font-family:Arial,sans-serif; }
        .pt-score-pre b { color:#ffd700; }
        .pt-name-form { display:flex;gap:8px;margin:0 0 14px;justify-content:center; }
        .pt-name-input { flex:1;max-width:240px;padding:8px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.25);color:#fff;font-size:14px;font-family:Arial,sans-serif; }
        .pt-name-input:focus { outline:none;border-color:#ffd700; }
        .pt-name-submit { padding:8px 16px;background:#ffd700;color:#0f2744;border:none;border-radius:8px;font-size:14px;font-weight:bold;cursor:pointer;font-family:Arial,sans-serif; }
        .pt-name-submit:hover { background:#ffe54d; }
        .pt-clear { display:inline-block;margin-top:8px;margin-left:8px;padding:10px 16px;background:transparent;border:1px solid rgba(255,107,107,0.4);border-radius:10px;color:#ff8a8a;font-size:13px;cursor:pointer;font-family:Arial,sans-serif; }
        .pt-clear:hover { background:rgba(255,107,107,0.1); }
    `
    document.head.appendChild(style)
}

export function showLeaderboardLocal(config: {
    userScore: number
    userTotal: number
    userElapsedMs: number
    onClose: () => void
}): void {
    const { userScore, userTotal, userElapsedMs, onClose } = config

    injectStyles()

    const handle = showLeaderboardPopup(onClose)

    const scorePre = document.createElement('div')
    scorePre.className = 'pt-score-pre'
    scorePre.innerHTML = `You scored <b>${Math.floor(userScore)}/${Math.floor(userTotal)}</b> in ${formatTime(userElapsedMs)}`

    const form = document.createElement('div')
    form.className = 'pt-name-form'
    form.innerHTML = `
        <input type="text" class="pt-name-input" placeholder="Your name" maxlength="20" autocomplete="off" />
        <button type="button" class="pt-name-submit">Add me</button>
    `

    const table = handle.card.querySelector('table')!
    handle.card.insertBefore(form, table)
    handle.card.insertBefore(scorePre, form)

    const input = form.querySelector<HTMLInputElement>('.pt-name-input')!
    const submitBtn = form.querySelector<HTMLButtonElement>('.pt-name-submit')!

    const closeBtn = handle.card.querySelector<HTMLButtonElement>('.lb-close')!
    const clearBtn = document.createElement('button')
    clearBtn.type = 'button'
    clearBtn.className = 'pt-clear'
    clearBtn.textContent = 'Clear tally'
    closeBtn.insertAdjacentElement('afterend', clearBtn)

    // Initial render: show current standings while the player types their name.
    fillRows(handle, sortEntries(loadEntries()), null)

    let submitted = false
    const submit = () => {
        if (submitted) return
        submitted = true
        const name = input.value.trim() || 'Anonymous'
        const entry: LeaderboardEntry = {
            name,
            score: Math.floor(userScore),
            total: Math.floor(userTotal),
            elapsed_ms: Math.floor(userElapsedMs),
            created_at: new Date().toISOString(),
        }
        const next = sortEntries([...loadEntries(), entry])
        saveEntries(next)
        scorePre.remove()
        form.remove()
        fillRows(handle, next, entry)
    }

    submitBtn.addEventListener('click', submit)
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submit()
    })

    clearBtn.addEventListener('click', () => {
        if (!confirm('Clear all playtest scores?')) return
        localStorage.removeItem(STORAGE_KEY)
        fillRows(handle, [], null)
    })

    setTimeout(() => input.focus(), 50)
}
