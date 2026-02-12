/**
 * JordGlobe Party Server
 *
 * Simple WebSocket server for coordinating players.
 * Kept separate to avoid merge conflicts - can be integrated with host later.
 *
 * Run with: npm run server
 */

import { WebSocketServer } from 'ws';
import os from 'os';
import { appendFileSync, writeFileSync } from 'fs';
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

const wss = new WebSocketServer({ port: PORT, host: '0.0.0.0' });

// Game state
const players = [];
const hosts = new Set();
let gameStarted = false;
let currentQuestion = null;  // Current question object (text or video)
const answers = new Map(); // playerName -> { lat, lng, positions }
const scores = new Map();  // playerName -> total score
let maxRounds = 2; // Default number of rounds
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
