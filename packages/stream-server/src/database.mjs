import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, '..', 'data');
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(join(DATA_DIR, 'stream.db'));
db.pragma('journal_mode = WAL');

db.exec(`CREATE TABLE IF NOT EXISTS twitch_sessions (
  session_key   TEXT PRIMARY KEY,
  twitch_id     TEXT NOT NULL UNIQUE,
  twitch_login  TEXT NOT NULL,
  display_name  TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
)`);

const stmtUpsertSession = db.prepare(`
  INSERT INTO twitch_sessions (session_key, twitch_id, twitch_login, display_name, refresh_token)
  VALUES (?, ?, ?, ?, ?)
  ON CONFLICT(twitch_id) DO UPDATE SET
    session_key = excluded.session_key,
    twitch_login = excluded.twitch_login,
    display_name = excluded.display_name,
    refresh_token = excluded.refresh_token,
    created_at = datetime('now')
`);

const stmtGetSession = db.prepare(
  'SELECT twitch_id, twitch_login, display_name, refresh_token FROM twitch_sessions WHERE session_key = ?'
);

const stmtUpdateRefreshToken = db.prepare(
  'UPDATE twitch_sessions SET refresh_token = ? WHERE session_key = ?'
);

export function upsertSession(sessionKey, twitchId, twitchLogin, displayName, refreshToken) {
  stmtUpsertSession.run(sessionKey, twitchId, twitchLogin, displayName, refreshToken);
}

export function getSession(sessionKey) {
  return stmtGetSession.get(sessionKey) ?? null;
}

export function updateRefreshToken(sessionKey, refreshToken) {
  stmtUpdateRefreshToken.run(refreshToken, sessionKey);
}
