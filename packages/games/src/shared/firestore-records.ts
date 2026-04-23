import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db, authReady, isRealUser } from './firebase';

export type LeaderboardEntry = {
    score: number;
    total: number;
    elapsed_ms: number;
    created_at: string;
};

export type LeaderboardDoc = {
    date: string;
    entries: LeaderboardEntry[];
};

export async function getLeaderboard(quizId: string): Promise<LeaderboardDoc | null> {
    await authReady;
    if (!isRealUser()) throw new Error('Authentication required to read leaderboard');
    const snap = await getDoc(doc(db, 'leaderboards', quizId));
    return snap.exists() ? (snap.data() as LeaderboardDoc) : null;
}

/**
 * Submit a play as a personal best. Caller is responsible for only invoking
 * this when the score beats the user's previous PB — submissions are one-per-PB,
 * not one-per-play.
 *
 * Requires real (non-anonymous) Firebase authentication.
 *
 * Returns whether the play is a new world record (beats current top-10 entry
 * on /leaderboards/{quizId}). The leaderboard is materialised by a scheduled
 * Cloud Function every 15 minutes, so WR detection compares against the
 * *current* top entry at submit time — it will not see this play until the
 * next CF run.
 */
export async function postRecord(
    quizId: string,
    score: number,
    total: number,
    elapsedMs: number,
): Promise<{ isNewRecord: boolean; record: LeaderboardEntry | null }> {
    await authReady;
    if (!isRealUser()) throw new Error('Authentication required to submit scores');

    const scoreInt = Math.floor(score);
    const totalInt = Math.floor(total);
    const elapsedInt = Math.floor(elapsedMs);

    await addDoc(collection(db, 'submissions'), {
        quiz_id: quizId,
        score: scoreInt,
        total: totalInt,
        elapsed_ms: elapsedInt,
        created_at: serverTimestamp(),
    });

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
