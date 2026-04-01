/**
 * Shared database setup and API handlers.
 * Used by both dev (index.mjs) and production (production.mjs) servers.
 */

import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, '..', 'data');
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(join(DATA_DIR, 'votes.db'));
db.pragma('journal_mode = WAL');

// Votes table
db.exec(`CREATE TABLE IF NOT EXISTS votes (
  game_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  vote    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (game_id, user_id)
)`);

// Records table
db.exec(`CREATE TABLE IF NOT EXISTS records (
  quiz_id    TEXT PRIMARY KEY,
  score      INTEGER NOT NULL,
  total      INTEGER NOT NULL,
  elapsed_ms INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`);

// Prepared statements
const stmtGetScores = db.prepare('SELECT game_id, SUM(vote) AS score FROM votes GROUP BY game_id');
const stmtGetUserVotes = db.prepare('SELECT game_id, vote FROM votes WHERE user_id = ?');
const stmtUpsertVote = db.prepare('INSERT INTO votes (game_id, user_id, vote) VALUES (?, ?, ?) ON CONFLICT(game_id, user_id) DO UPDATE SET vote = excluded.vote');
const stmtGameScore = db.prepare('SELECT SUM(vote) AS score FROM votes WHERE game_id = ?');
const stmtGetRecord = db.prepare('SELECT score, total, elapsed_ms FROM records WHERE quiz_id = ?');
const stmtUpsertRecord = db.prepare(`
  INSERT INTO records (quiz_id, score, total, elapsed_ms)
  VALUES (?, ?, ?, ?)
  ON CONFLICT(quiz_id) DO UPDATE SET
    score = excluded.score,
    total = excluded.total,
    elapsed_ms = excluded.elapsed_ms,
    created_at = datetime('now')
`);

// API handler functions — return { status, body } objects

export function getVotes(userId) {
    const scores = Object.fromEntries(stmtGetScores.all().map(r => [r.game_id, r.score]));
    const userVotes = userId
        ? Object.fromEntries(stmtGetUserVotes.all(userId).map(r => [r.game_id, r.vote]))
        : {};
    return { status: 200, body: { scores, userVotes } };
}

export function postVote(game_id, user_id, vote) {
    if (!game_id || !user_id || ![1, -1, 0].includes(vote)) {
        return { status: 400, body: { error: 'Bad request' } };
    }
    stmtUpsertVote.run(game_id, user_id, vote);
    const row = stmtGameScore.get(game_id);
    return { status: 200, body: { score: row?.score ?? 0 } };
}

export function getRecord(quizId) {
    if (!quizId) {
        return { status: 400, body: { error: 'quiz_id required' } };
    }
    const row = stmtGetRecord.get(quizId);
    return { status: 200, body: { record: row ?? null } };
}

export function postRecord(quiz_id, score, total, elapsed_ms) {
    if (!quiz_id || score == null || !total || !elapsed_ms) {
        return { status: 400, body: { error: 'Bad request' } };
    }
    const current = stmtGetRecord.get(quiz_id);
    let isNewRecord = false;
    if (!current) {
        isNewRecord = true;
    } else if (score > current.score) {
        isNewRecord = true;
    } else if (score === current.score && elapsed_ms < current.elapsed_ms) {
        isNewRecord = true;
    }
    if (isNewRecord) {
        stmtUpsertRecord.run(quiz_id, score, total, elapsed_ms);
    }
    const record = stmtGetRecord.get(quiz_id);
    return { status: 200, body: { isNewRecord, record } };
}
