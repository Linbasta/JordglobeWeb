import type { EarthGlobe } from '../../earth-globe/earth-globe';
import type { StreamLocation, LocationSet } from './locations';
import { pickRound } from './locations';

export interface RoundLocation {
    location: StreamLocation;
    markerId: number;
    guessed: boolean;
    index: number;
}

let roundLocations: RoundLocation[] = [];
let guessedCount = 0;
let roundActive = false;

function normalize(text: string): string {
    return text
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '');
}

export function startRound(
    globe: EarthGlobe,
    set: LocationSet,
    count: number,
): RoundLocation[] {
    resetRound(globe);

    const picked = pickRound(set, count);
    roundLocations = picked.map((loc, i) => ({
        location: loc,
        markerId: globe.acquireMarker(loc.lat, loc.lon),
        guessed: false,
        index: i,
    }));
    guessedCount = 0;
    roundActive = true;
    return roundLocations;
}

export function processGuess(text: string): RoundLocation | null {
    if (!roundActive) return null;
    const guess = normalize(text);
    if (!guess) return null;

    for (const rl of roundLocations) {
        if (rl.guessed) continue;
        if (normalize(rl.location.name) === guess) {
            rl.guessed = true;
            guessedCount++;
            return rl;
        }
        if (rl.location.aliases) {
            for (const alias of rl.location.aliases) {
                if (normalize(alias) === guess) {
                    rl.guessed = true;
                    guessedCount++;
                    return rl;
                }
            }
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

export function resetRound(globe: EarthGlobe): void {
    if (roundLocations.length > 0) {
        globe.releaseAllMarkers();
    }
    roundLocations = [];
    guessedCount = 0;
    roundActive = false;
}
