import { onSchedule } from 'firebase-functions/v2/scheduler';
import { initializeApp, getApps } from 'firebase-admin/app';
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) initializeApp();
const db = getFirestore('webversion');

const TOP_N = 10;
const BATCH_CHUNK = 400;

type Entry = {
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

    const byQuiz = new Map<string, Entry[]>();
    for (const d of snap.docs) {
        const data = d.data();
        const quizId = data.quiz_id;
        if (typeof quizId !== 'string') continue;
        const list = byQuiz.get(quizId) ?? [];
        const ts = data.created_at;
        list.push({
            score: data.score,
            total: data.total,
            elapsed_ms: data.elapsed_ms,
            created_at: ts instanceof Timestamp ? ts.toDate().toISOString() : '',
        });
        byQuiz.set(quizId, list);
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
