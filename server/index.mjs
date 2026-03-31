/**
 * JordGlobe Party Server
 *
 * Simple WebSocket server for coordinating players.
 * Kept separate to avoid merge conflicts - can be integrated with host later.
 *
 * Run with: npm run server
 */

import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import os from 'os';
import { appendFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import { getRandomCity, calculateDistance } from './cities.mjs';
import { getRandomVideo, videos } from './videos.mjs';

// ============================================================================
// QUIZ CONFIGURATION
// ============================================================================
const QUIZ_CONFIG = {
    mode: 'video-only',          // 'mixed' | 'text-only' | 'video-only'
    randomOrder: false,           // true = random selection, false = sequential order
    videoProbability: 0.3,        // Only used in 'mixed' mode (0.3 = 30% videos)
    showPresentationOnClient: false  // false = host-only, true = show on player devices too
};
// ============================================================================

// Logging setup
const LOG_FILE = 'game-server.log';
writeFileSync(LOG_FILE, ''); // Clear log on startup

function log(message, data = null) {
    const timestamp = new Date().toISOString();
    const logLine = data
        ? `[${timestamp}] ${message} ${JSON.stringify(data)}\n`
        : `[${timestamp}] ${message}\n`;

    // Write to file
    appendFileSync(LOG_FILE, logLine);

    // Also print to console
    process.stdout.write(logLine);
}

const PORT = 3003;
const WEB_PORT = 4817; // Vite server port

// Get local network IP address
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

// ============================================================================
// SQLITE VOTES DATABASE
// ============================================================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, '..', 'data');
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(join(DATA_DIR, 'votes.db'));
db.pragma('journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS votes (
  game_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  vote    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (game_id, user_id)
)`);

// ============================================================================
// SQLITE RECORDS TABLE
// ============================================================================
db.exec(`CREATE TABLE IF NOT EXISTS records (
  quiz_id    TEXT PRIMARY KEY,
  score      INTEGER NOT NULL,
  total      INTEGER NOT NULL,
  elapsed_ms INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`);

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

const stmtGetScores = db.prepare('SELECT game_id, SUM(vote) AS score FROM votes GROUP BY game_id');
const stmtGetUserVotes = db.prepare('SELECT game_id, vote FROM votes WHERE user_id = ?');
const stmtUpsertVote = db.prepare('INSERT INTO votes (game_id, user_id, vote) VALUES (?, ?, ?) ON CONFLICT(game_id, user_id) DO UPDATE SET vote = excluded.vote');
const stmtGameScore = db.prepare('SELECT SUM(vote) AS score FROM votes WHERE game_id = ?');

// ============================================================================
// HTTP SERVER (serves REST API + upgrades to WebSocket)
// ============================================================================
function handleRequest(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    if (req.url?.startsWith('/api/votes') && req.method === 'GET') {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const userId = url.searchParams.get('user_id');
        const scores = Object.fromEntries(stmtGetScores.all().map(r => [r.game_id, r.score]));
        const userVotes = userId
            ? Object.fromEntries(stmtGetUserVotes.all(userId).map(r => [r.game_id, r.vote]))
            : {};
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ scores, userVotes }));
    } else if (req.url === '/api/vote' && req.method === 'POST') {
        let body = '';
        req.on('data', c => body += c);
        req.on('end', () => {
            try {
                const { game_id, user_id, vote } = JSON.parse(body);
                if (!game_id || !user_id || ![1, -1, 0].includes(vote)) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Bad request' }));
                    return;
                }
                stmtUpsertVote.run(game_id, user_id, vote);
                const row = stmtGameScore.get(game_id);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ score: row?.score ?? 0 }));
            } catch {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
    } else if (req.url?.startsWith('/api/record') && req.method === 'GET') {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const quizId = url.searchParams.get('quiz_id');
        if (!quizId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'quiz_id required' }));
            return;
        }
        const row = stmtGetRecord.get(quizId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ record: row ?? null }));
    } else if (req.url === '/api/record' && req.method === 'POST') {
        let body = '';
        req.on('data', c => body += c);
        req.on('end', () => {
            try {
                const { quiz_id, score, total, elapsed_ms } = JSON.parse(body);
                if (!quiz_id || score == null || !total || !elapsed_ms) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Bad request' }));
                    return;
                }
                // Check current record
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
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ isNewRecord, record }));
            } catch {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
}

const httpServer = createServer(handleRequest);
httpServer.listen(PORT, '0.0.0.0');
const wss = new WebSocketServer({ server: httpServer });

// Game state
const players = [];
const hosts = new Set();
let gameStarted = false;
let currentQuestion = null;  // Current question object (text or video)
const answers = new Map(); // playerName -> { lat, lng, positions }
const scores = new Map();  // playerName -> total score
let maxRounds = 7; // Default number of rounds (7 viral videos)
let currentRound = 0;
let videoQuestionIndex = 0;  // For sequential video questions (when randomOrder=false)

function broadcast(message) {
    const data = JSON.stringify(message);
    wss.clients.forEach(client => {
        if (client.readyState === 1) {
            client.send(data);
        }
    });
}

function getPlayerList() {
    return players.map(p => ({
        name: p.name,
        isFirst: p.isFirst,
        score: scores.get(p.name) || 0
    }));
}

function startNewRound() {
    answers.clear();
    currentRound++;

    // Select question based on QUIZ_CONFIG
    if (QUIZ_CONFIG.mode === 'video-only') {
        if (QUIZ_CONFIG.randomOrder) {
            currentQuestion = getRandomVideo();
        } else {
            // Sequential order through videos array
            currentQuestion = videos[videoQuestionIndex % videos.length];
            videoQuestionIndex++;
        }
    } else if (QUIZ_CONFIG.mode === 'text-only') {
        currentQuestion = getRandomCity();
    } else {
        // Mixed mode - use videoProbability
        const useVideo = Math.random() < QUIZ_CONFIG.videoProbability;
        currentQuestion = useVideo ? getRandomVideo() : getRandomCity();
    }

    log(`Round ${currentRound}/${maxRounds}: ${currentQuestion.present} question - ${currentQuestion.locationName || currentQuestion.prompt}`);

    broadcast({
        type: 'question',
        question: currentQuestion,
        showPresentationOnClient: QUIZ_CONFIG.showPresentationOnClient,
        round: currentRound,
        maxRounds: maxRounds
    });
}

function checkAllAnswered() {
    if (players.length === 0) return;

    const allAnswered = players.every(p => answers.has(p.name));
    if (!allAnswered) return;

    // Calculate results
    const results = players.map(p => {
        const answer = answers.get(p.name);
        const distance = calculateDistance(
            currentQuestion.lat, currentQuestion.lng,
            answer.lat, answer.lng
        );
        return {
            name: p.name,
            distance: distance,
            lat: answer.lat,
            lng: answer.lng,
            positions: answer.positions || []
        };
    });

    // Sort by distance (closest first)
    results.sort((a, b) => a.distance - b.distance);

    // Assign points: last place = 0, 2nd last = 1, etc.
    const numPlayers = results.length;
    results.forEach((r, i) => {
        r.points = numPlayers - 1 - i;
        const currentScore = scores.get(r.name) || 0;
        scores.set(r.name, currentScore + r.points);
        r.totalScore = scores.get(r.name);
    });

    log('All answered! Results:', results);

    broadcast({
        type: 'reveal',
        question: currentQuestion,  // Include original question for context
        correct: {
            lat: currentQuestion.lat,
            lng: currentQuestion.lng,
            locationName: currentQuestion.locationName || currentQuestion.prompt
        },
        results: results,
        players: getPlayerList(),
        round: currentRound,
        maxRounds: maxRounds
    });

    // Check if game is over
    if (currentRound >= maxRounds) {
        setTimeout(() => {
            log('Game finished! Sending final results...');
            broadcast({
                type: 'final-results',
                players: getPlayerList()
            });
        }, 5000); // Wait 5 seconds after reveal before showing final results
    }
}

wss.on('connection', (ws) => {
    log('Client connected');
    let playerName = null;
    let isHost = false;

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());
            log('Received:', message);

            switch (message.type) {
                case 'host-connect': {
                    isHost = true;
                    hosts.add(ws);
                    const localIP = getLocalIP();
                    log('Host connected, local IP:', localIP);
                    ws.send(JSON.stringify({
                        type: 'host-info',
                        localIP,
                        webPort: WEB_PORT,
                        players: getPlayerList()
                    }));
                    break;
                }

                case 'join': {
                    if (players.some(p => p.name === message.name)) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Name already taken'
                        }));
                        return;
                    }

                    const isFirst = players.length === 0;
                    playerName = message.name;
                    players.push({ name: playerName, isFirst, ws });

                    log(`Player joined: ${playerName} (isFirst: ${isFirst})`);

                    ws.send(JSON.stringify({
                        type: 'joined',
                        name: playerName,
                        isFirst,
                        players: getPlayerList()
                    }));

                    broadcast({
                        type: 'player-list',
                        players: getPlayerList()
                    });
                    break;
                }

                case 'start-game': {
                    const player = players.find(p => p.name === playerName);
                    if (player && player.isFirst) {
                        gameStarted = true;
                        currentRound = 0;
                        scores.clear();
                        videoQuestionIndex = 0;  // Reset video index for sequential mode

                        // Set max rounds if provided
                        if (message.maxRounds && message.maxRounds > 0) {
                            maxRounds = message.maxRounds;
                        }

                        log(`Game started! Mode: ${QUIZ_CONFIG.mode}, Random: ${QUIZ_CONFIG.randomOrder}, Max rounds: ${maxRounds}`);
                        broadcast({ type: 'game-start', maxRounds });

                        // Start first round after short delay
                        setTimeout(() => startNewRound(), 2000);
                    }
                    break;
                }

                case 'submit-answer': {
                    if (!gameStarted || !currentQuestion) return;
                    if (answers.has(playerName)) return; // Already answered

                    answers.set(playerName, {
                        lat: message.lat,
                        lng: message.lng || message.lon,  // Support both lng (new) and lon (old) for compatibility
                        positions: message.positions || [] // Optional recorded positions
                    });
                    log(`${playerName} answered: lat=${message.lat}, lng=${message.lng || message.lon}, positions=${message.positions ? message.positions.length : 0}`);

                    // Broadcast that this player answered
                    broadcast({
                        type: 'player-answered',
                        playerName: playerName
                    });

                    // Check if all players have answered
                    checkAllAnswered();
                    break;
                }

                case 'next-round': {
                    const player = players.find(p => p.name === playerName);
                    log(`next-round request from ${playerName} (isFirst: ${player?.isFirst}, gameStarted: ${gameStarted}, currentRound: ${currentRound}/${maxRounds})`);

                    if (player && player.isFirst && gameStarted) {
                        if (currentRound >= maxRounds) {
                            log('Game already finished - ignoring next-round request');
                        } else {
                            log('Starting next round...');
                            startNewRound();
                        }
                    } else {
                        log(`next-round DENIED - player: ${!!player}, isFirst: ${player?.isFirst}, gameStarted: ${gameStarted}`);
                    }
                    break;
                }

                case 'reset-game': {
                    log('Resetting game state...');

                    // Clear all game state
                    players.length = 0;
                    hosts.clear();
                    gameStarted = false;
                    currentQuestion = null;
                    answers.clear();
                    scores.clear();
                    currentRound = 0;
                    maxRounds = 2;
                    videoQuestionIndex = 0;

                    // Notify all clients
                    broadcast({ type: 'game-reset' });

                    log('Game reset complete');
                    break;
                }
            }
        } catch (err) {
            log('Error parsing message:', err);
        }
    });

    ws.on('close', () => {
        if (isHost) {
            hosts.delete(ws);
            log('Host disconnected');
        } else if (playerName) {
            const index = players.findIndex(p => p.name === playerName);
            if (index !== -1) {
                players.splice(index, 1);
                log(`Player left: ${playerName}`);

                if (players.length > 0 && !players.some(p => p.isFirst)) {
                    players[0].isFirst = true;
                    log(`New host: ${players[0].name}`);
                }

                broadcast({
                    type: 'player-list',
                    players: getPlayerList()
                });
            }
        }
        log('Client disconnected');
    });
});

log(`JordGlobe Party Server running on ws://localhost:${PORT}`);
log(`Logging to ${LOG_FILE}`);
log('Waiting for players to join...');
