import { onSchedule } from 'firebase-functions/v2/scheduler';
import { initializeApp, getApps } from 'firebase-admin/app';
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) initializeApp();
const db = getFirestore('webversion');
const userDb = getFirestore('jordglobe');

const TOP_N = 10;
const BATCH_CHUNK = 400;

type Entry = {
    name: string;
    score: number;
    total: number;
    elapsed_ms: number;
    created_at: string;
};

export async function buildDailyLeaderboards(): Promise<{ quizzes: number; totalSubmissions: number }> {
    const now = new Date();
    const startUtc = new Date(Date.UTC(
        now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
    ));
    const dateKey = startUtc.toISOString().slice(0, 10);

    const snap = await db.collection('submissions')
        .where('created_at', '>=', Timestamp.fromDate(startUtc))
        .get();

    // Collect unique UIDs to batch-fetch Usernames
    const uidSet = new Set<string>();
    for (const d of snap.docs) {
        const uid = d.data().uid;
        if (typeof uid === 'string') uidSet.add(uid);
    }

    // Look up Usernames from the jordglobe database
    const uidToName = new Map<string, string>();
    const uids = [...uidSet];
    for (let i = 0; i < uids.length; i += 10) {
        const batch = uids.slice(i, i + 10);
        const userSnaps = await Promise.all(
            batch.map(uid => userDb.collection('users').doc(uid).get()),
        );
        for (const userSnap of userSnaps) {
            if (userSnap.exists) {
                const Username = userSnap.data()?.Username;
                if (typeof Username === 'string') {
                    uidToName.set(userSnap.id, Username);
                }
            }
        }
    }

    // Per (quizId, uid), keep only the user's best submission so the
    // leaderboard never shows the same person twice.
    const byQuizByUid = new Map<string, Map<string, Entry>>();
    for (const d of snap.docs) {
        const data = d.data();
        const quizId = data.quiz_id;
        if (typeof quizId !== 'string') continue;
        const uid = data.uid;
        if (typeof uid !== 'string') continue;
        const name = uidToName.get(uid);
        if (!name) continue;
        const ts = data.created_at;
        const candidate: Entry = {
            name,
            score: data.score,
            total: data.total,
            elapsed_ms: data.elapsed_ms,
            created_at: ts instanceof Timestamp ? ts.toDate().toISOString() : '',
        };
        const byUid = byQuizByUid.get(quizId) ?? new Map<string, Entry>();
        const prev = byUid.get(uid);
        if (!prev
            || candidate.score > prev.score
            || (candidate.score === prev.score && candidate.elapsed_ms < prev.elapsed_ms)
        ) {
            byUid.set(uid, candidate);
        }
        byQuizByUid.set(quizId, byUid);
    }

    const byQuiz = new Map<string, Entry[]>();
    for (const [quizId, byUid] of byQuizByUid) {
        byQuiz.set(quizId, [...byUid.values()]);
    }

    const quizIds = [...byQuiz.keys()];
    for (let i = 0; i < quizIds.length; i += BATCH_CHUNK) {
        const batch = db.batch();
        for (const quizId of quizIds.slice(i, i + BATCH_CHUNK)) {
            const entries = byQuiz.get(quizId)!;
            entries.sort((a, b) =>
                b.score - a.score || a.elapsed_ms - b.elapsed_ms,
            );
            batch.set(db.collection('leaderboards').doc(quizId), {
                date: dateKey,
                entries: entries.slice(0, TOP_N),
                updated_at: FieldValue.serverTimestamp(),
            });
        }
        await batch.commit();
    }

    return { quizzes: byQuiz.size, totalSubmissions: snap.size };
}

export const updateDailyLeaderboards = onSchedule(
    { schedule: 'every 15 minutes', timeZone: 'UTC', region: 'us-central1' },
    async () => {
        await buildDailyLeaderboards();
    },
);
