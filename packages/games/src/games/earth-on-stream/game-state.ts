import type { EarthGlobe } from '../../earth-globe/earth-globe';
import type { StreamLocation, LocationSet, Continent } from './locations';
import { pickRoundForSession, POINTS_BY_DIFFICULTY } from './locations';

const HIGH_ROUND_KEY = 'eos-high-round';

export function getHighestRound(continent: Continent): number {
    try {
        const data = JSON.parse(localStorage.getItem(HIGH_ROUND_KEY) ?? '{}');
        return data[continent] ?? 0;
    } catch {
        return 0;
    }
}

export function updateHighestRound(continent: Continent, round: number): void {
    try {
        const data = JSON.parse(localStorage.getItem(HIGH_ROUND_KEY) ?? '{}');
        if (round > (data[continent] ?? 0)) {
            data[continent] = round;
            localStorage.setItem(HIGH_ROUND_KEY, JSON.stringify(data));
        }
    } catch {}
}

export interface RoundLocation {
    location: StreamLocation;
    markerId: number;
    guessed: boolean;
    index: number;
}

export interface PlayerScore {
    roundPoints: number;
    totalPoints: number;
}

export interface GuessResult {
    match: RoundLocation;
    points: number;
}

export interface LeaderboardEntry {
    username: string;
    roundPoints: number;
    totalPoints: number;
}

let roundLocations: RoundLocation[] = [];
let guessedCount = 0;
let roundActive = false;

let sessionRound = 1;
let globalRoundScore = 0;
let roundGoal = 0;
const playerScores = new Map<string, PlayerScore>();

function normalize(text: string): string {
    return text
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '');
}

export function startSession(): void {
    sessionRound = 1;
    globalRoundScore = 0;
    roundGoal = 0;
    playerScores.clear();
}

export function startRound(
    globe: EarthGlobe,
    set: LocationSet,
    count: number,
): RoundLocation[] {
    resetRound(globe);

    const picked = pickRoundForSession(set, count, sessionRound);
    roundLocations = picked.map((loc, i) => ({
        location: loc,
        markerId: globe.acquireMarker(loc.lat, loc.lon),
        guessed: false,
        index: i,
    }));
    guessedCount = 0;
    globalRoundScore = 0;

    const maxScore = picked.reduce((sum, loc) => sum + POINTS_BY_DIFFICULTY[loc.difficulty], 0);
    roundGoal = Math.round(maxScore * 0.6);

    for (const [, score] of playerScores) {
        score.roundPoints = 0;
    }

    roundActive = true;
    return roundLocations;
}

export function processGuess(text: string, username: string): GuessResult | null {
    if (!roundActive) return null;
    const guess = normalize(text);
    if (!guess) return null;

    for (const rl of roundLocations) {
        if (rl.guessed) continue;

        let matched = normalize(rl.location.name) === guess;
        if (!matched && rl.location.aliases) {
            for (const alias of rl.location.aliases) {
                if (normalize(alias) === guess) {
                    matched = true;
                    break;
                }
            }
        }

        if (matched) {
            rl.guessed = true;
            guessedCount++;

            const points = POINTS_BY_DIFFICULTY[rl.location.difficulty];
            globalRoundScore += points;

            let player = playerScores.get(username);
            if (!player) {
                player = { roundPoints: 0, totalPoints: 0 };
                playerScores.set(username, player);
            }
            player.roundPoints += points;
            player.totalPoints += points;

            return { match: rl, points };
        }
    }
    return null;
}

export function getGuessedCount(): number {
    return guessedCount;
}

export function getRoundTotal(): number {
    return roundLocations.length;
}

export function isRoundComplete(): boolean {
    return roundActive && guessedCount >= roundLocations.length;
}

export function getRemainingLocations(): RoundLocation[] {
    return roundLocations.filter((rl) => !rl.guessed);
}

export function getRoundLocation(index: number): RoundLocation | undefined {
    return roundLocations[index];
}

export function getSessionRoundNumber(): number {
    return sessionRound;
}

export function getGlobalRoundScore(): number {
    return globalRoundScore;
}

export function getCurrentRoundGoal(): number {
    return roundGoal;
}

export function isRoundGoalMet(): boolean {
    return globalRoundScore >= roundGoal;
}

export function advanceRound(): void {
    sessionRound++;
}

export function getLeaderboard(): LeaderboardEntry[] {
    const entries: LeaderboardEntry[] = [];
    for (const [username, score] of playerScores) {
        entries.push({
            username,
            roundPoints: score.roundPoints,
            totalPoints: score.totalPoints,
        });
    }
    entries.sort((a, b) => b.roundPoints - a.roundPoints || b.totalPoints - a.totalPoints);
    return entries;
}

export function cheatClearRound(): RoundLocation[] {
    const revealed: RoundLocation[] = [];
    for (const rl of roundLocations) {
        if (rl.guessed) continue;
        rl.guessed = true;
        guessedCount++;
        const points = POINTS_BY_DIFFICULTY[rl.location.difficulty];
        globalRoundScore += points;
        revealed.push(rl);
    }
    return revealed;
}

export function resetRound(globe: EarthGlobe): void {
    if (roundLocations.length > 0) {
        globe.releaseAllMarkers();
    }
    roundLocations = [];
    guessedCount = 0;
    roundActive = false;
}
