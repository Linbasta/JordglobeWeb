import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, auth, authReady, isRealUser } from './firebase';

function utcDateKey(d = new Date()): string {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

export type LeaderboardEntry = {
    name: string;
    score: number;
    total: number;
    elapsed_ms: number;
    created_at: string;
};

export type LeaderboardDoc = {
    date: string;
    entries: LeaderboardEntry[];
    week_start_date?: string;
    weekly_entries?: LeaderboardEntry[];
};

export async function getLeaderboard(quizId: string): Promise<LeaderboardDoc | null> {
    await authReady;
    if (!isRealUser()) throw new Error('Authentication required to read leaderboard');
    const snap = await getDoc(doc(db, 'leaderboards', quizId));
    return snap.exists() ? (snap.data() as LeaderboardDoc) : null;
}

/**
 * Submit a play. Writes to /submissions/{uid}_{quizId}_{YYYY-MM-DD}; the doc is
 * upserted but Firestore rules reject worse-or-equal updates, so only the
 * user's best play of the day for this quiz survives. A rule-rejected write is
 * a no-op (caller already had a better entry).
 *
 * Returns whether the play would be a new world record vs. the current top
 * entry on /leaderboards/{quizId}. The leaderboard is rebuilt every 15 min by
 * the Cloud Function, so this comparison is against the *previous* run.
 */
export async function postRecord(
    quizId: string,
    score: number,
    total: number,
    elapsedMs: number,
): Promise<{ isNewRecord: boolean; record: LeaderboardEntry | null }> {
    await authReady;
    if (!isRealUser()) throw new Error('Authentication required to submit scores');

    const uid = auth.currentUser!.uid;
    const date = utcDateKey();
    const docId = `${uid}_${quizId}_${date}`;
    const scoreInt = Math.floor(score);
    const totalInt = Math.floor(total);
    const elapsedInt = Math.floor(elapsedMs);

    try {
        await setDoc(doc(db, 'submissions', docId), {
            uid,
            quiz_id: quizId,
            date,
            score: scoreInt,
            total: totalInt,
            elapsed_ms: elapsedInt,
            created_at: serverTimestamp(),
        });
    } catch (e: any) {
        if (e?.code !== 'permission-denied') throw e;
    }

    const leaderboard = await getLeaderboard(quizId);
    const top = leaderboard?.entries[0] ?? null;

    let isNewRecord: boolean;
    if (!top) {
        isNewRecord = true;
    } else if (scoreInt > top.score) {
        isNewRecord = true;
    } else if (scoreInt === top.score && elapsedInt < top.elapsed_ms) {
        isNewRecord = true;
    } else {
        isNewRecord = false;
    }

    return { isNewRecord, record: top };
}
