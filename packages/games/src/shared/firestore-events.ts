import { addDoc, collection } from 'firebase/firestore'
import { db } from './firebase'

// Anonymous play-count telemetry. Writes regardless of consent.
// INVARIANT: never add a field that could identify a visitor (uid, sessionId,
// IP-derived data, fingerprint). If that ever changes, the consent gate (see
// analytics.ts) must come back. Time is stored at minute resolution only to
// prevent sub-second correlation between paired start/end events.

function utcDateAndMinute(): { date: string; minute: string } {
    const d = new Date()
    const y = d.getUTCFullYear()
    const m = String(d.getUTCMonth() + 1).padStart(2, '0')
    const day = String(d.getUTCDate()).padStart(2, '0')
    const hh = String(d.getUTCHours()).padStart(2, '0')
    const mm = String(d.getUTCMinutes()).padStart(2, '0')
    return { date: `${y}-${m}-${day}`, minute: `${hh}:${mm}` }
}

export async function logGameStarted(quizId: string): Promise<void> {
    if (!quizId) return
    try {
        await addDoc(collection(db, 'games_started'), {
            quiz_id: quizId,
            ...utcDateAndMinute(),
        })
    } catch {
        // Silent — anonymous telemetry must never break the game.
    }
}

export async function logGameEnded(
    quizId: string,
    score: number,
    total: number,
): Promise<void> {
    if (!quizId) return
    try {
        await addDoc(collection(db, 'games_ended'), {
            quiz_id: quizId,
            score: Math.floor(score),
            total: Math.floor(total),
            ...utcDateAndMinute(),
        })
    } catch {
        // Silent.
    }
}
