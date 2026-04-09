import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, authReady } from './firebase';

export async function getRecord(quizId: string): Promise<Record<string, unknown> | null> {
    await authReady;
    const snap = await getDoc(doc(db, 'records', quizId));
    return snap.exists() ? snap.data() : null;
}

export async function postRecord(
    quizId: string,
    score: number,
    total: number,
    elapsedMs: number,
): Promise<{ isNewRecord: boolean; record: Record<string, unknown> | null }> {
    await authReady;
    const current = await getRecord(quizId);
    let isNewRecord = false;
    if (!current) {
        isNewRecord = true;
    } else if (score > (current.score as number)) {
        isNewRecord = true;
    } else if (score === (current.score as number) && elapsedMs < (current.elapsed_ms as number)) {
        isNewRecord = true;
    }
    if (isNewRecord) {
        await setDoc(doc(db, 'records', quizId), {
            score,
            total,
            elapsed_ms: elapsedMs,
            created_at: new Date().toISOString(),
        });
    }
    const record = await getRecord(quizId);
    return { isNewRecord, record };
}
