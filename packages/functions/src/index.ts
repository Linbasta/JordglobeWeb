import { onSchedule } from 'firebase-functions/v2/scheduler';
import { initializeApp, getApps } from 'firebase-admin/app';
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) initializeApp();
const db = getFirestore('webversion');
const userDb = getFirestore('jordglobe');

const TOP_N = 10;
const BATCH_CHUNK = 400;
const WEEKLY_DAYS = 7;

type Entry = {
    name: string;
    score: number;
    total: number;
    elapsed_ms: number;
    created_at: string;
};

function isBetter(candidate: Entry, prev: Entry): boolean {
    return candidate.score > prev.score
        || (candidate.score === prev.score && candidate.elapsed_ms < prev.elapsed_ms);
}

function upsertBest(
    map: Map<string, Map<string, Entry>>,
    quizId: string,
    uid: string,
    candidate: Entry,
): void {
    const byUid = map.get(quizId) ?? new Map<string, Entry>();
    const prev = byUid.get(uid);
    if (!prev || isBetter(candidate, prev)) {
        byUid.set(uid, candidate);
    }
    map.set(quizId, byUid);
}

function sortAndSlice(entries: Entry[]): Entry[] {
    entries.sort((a, b) => b.score - a.score || a.elapsed_ms - b.elapsed_ms);
    return entries.slice(0, TOP_N);
}

export async function buildDailyLeaderboards(): Promise<{
    quizzes: number;
    totalSubmissions: number;
    weeklyQuizzes: number;
}> {
    const now = new Date();
    const startToday = new Date(Date.UTC(
        now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
    ));
    const startWeek = new Date(startToday);
    startWeek.setUTCDate(startWeek.getUTCDate() - (WEEKLY_DAYS - 1));

    const dateKey = startToday.toISOString().slice(0, 10);
    const weekStartKey = startWeek.toISOString().slice(0, 10);

    const snap = await db.collection('submissions')
        .where('created_at', '>=', Timestamp.fromDate(startWeek))
        .get();

    const uidSet = new Set<string>();
    for (const d of snap.docs) {
        const uid = d.data().uid;
        if (typeof uid === 'string') uidSet.add(uid);
    }

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

    const dailyByQuizByUid = new Map<string, Map<string, Entry>>();
    const weeklyByQuizByUid = new Map<string, Map<string, Entry>>();
    const startTodayMs = startToday.getTime();

    for (const d of snap.docs) {
        const data = d.data();
        const quizId = data.quiz_id;
        if (typeof quizId !== 'string') continue;
        const uid = data.uid;
        if (typeof uid !== 'string') continue;
        const name = uidToName.get(uid);
        if (!name) continue;
        const ts = data.created_at;
        const createdMs = ts instanceof Timestamp ? ts.toDate().getTime() : 0;
        const candidate: Entry = {
            name,
            score: data.score,
            total: data.total,
            elapsed_ms: data.elapsed_ms,
            created_at: ts instanceof Timestamp ? ts.toDate().toISOString() : '',
        };
        upsertBest(weeklyByQuizByUid, quizId, uid, candidate);
        if (createdMs >= startTodayMs) {
            upsertBest(dailyByQuizByUid, quizId, uid, candidate);
        }
    }

    const existingSnap = await db.collection('leaderboards').get();
    const allQuizIds = new Set<string>([
        ...weeklyByQuizByUid.keys(),
        ...dailyByQuizByUid.keys(),
        ...existingSnap.docs.map(d => d.id),
    ]);

    const quizIds = [...allQuizIds];
    for (let i = 0; i < quizIds.length; i += BATCH_CHUNK) {
        const batch = db.batch();
        for (const quizId of quizIds.slice(i, i + BATCH_CHUNK)) {
            const dailyEntries = sortAndSlice([...(dailyByQuizByUid.get(quizId)?.values() ?? [])]);
            const weeklyEntries = sortAndSlice([...(weeklyByQuizByUid.get(quizId)?.values() ?? [])]);
            batch.set(db.collection('leaderboards').doc(quizId), {
                date: dateKey,
                entries: dailyEntries,
                week_start_date: weekStartKey,
                weekly_entries: weeklyEntries,
                updated_at: FieldValue.serverTimestamp(),
            });
        }
        await batch.commit();
    }

    return {
        quizzes: dailyByQuizByUid.size,
        totalSubmissions: snap.size,
        weeklyQuizzes: weeklyByQuizByUid.size,
    };
}

export const updateDailyLeaderboards = onSchedule(
    { schedule: 'every 15 minutes', timeZone: 'UTC', region: 'us-central1' },
    async () => {
        await buildDailyLeaderboards();
    },
);
