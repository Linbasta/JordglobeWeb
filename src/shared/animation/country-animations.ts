import type { EarthGlobeAPI } from '../../earth-globe';
import { STATE_NORMAL, STATE_DISABLED, STATE_CLEARED } from '../../earth-globe';

// Configuration constants
const NORMAL_ALTITUDE = 0.4;      // Default country altitude
const WRONG_ALTITUDE = 0.5;       // Pop height for wrong answer
const CLEARED_ALTITUDE = 0.1;     // Sunk state for cleared countries
const SHOW_CORRECT_ALTITUDE = 0.55;

const ANIMATION_DURATION = 200;   // ms per phase
const CORRECT_DURATION = 400;

// Easing lookup table for correct animation: pops up then settles down
// Normalized 0→1 easing space, designed in the keyframe editor
export const CORRECT_EASING = [0, -0.493, -1.104, -1.465, -1.66, -1.826, -2, -2, -1.965, -1.91, -1.271, -0.16, 0.035, 0.811, 0.847, 0.879, 0.907, 0.932, 0.953, 0.97, 0.983, 0.992, 0.998, 1];

function lookupEasing(table: number[], t: number): number {
    const n = table.length - 1;
    const idx = t * n;
    const lo = Math.floor(idx);
    const hi = Math.min(lo + 1, n);
    const frac = idx - lo;
    return table[lo] + (table[hi] - table[lo]) * frac;
}

/**
 * Correct Animation: Pop up then sink to cleared + gray out
 * Uses hand-authored easing curve from keyframe editor
 */
export function animateCorrect(globe: EarthGlobeAPI, countryIndex: number): Promise<void> {
    globe.setCountryState(countryIndex, STATE_CLEARED);
    return new Promise((resolve) => {
        const startTime = performance.now();
        function tick() {
            const elapsed = performance.now() - startTime;
            const t = Math.min(1, elapsed / CORRECT_DURATION);
            const eased = lookupEasing(CORRECT_EASING, t);
            const altitude = NORMAL_ALTITUDE + (CLEARED_ALTITUDE - NORMAL_ALTITUDE) * eased;
            globe.setCountryAltitude(countryIndex, altitude);
            const blend = Math.max(0, Math.min(1,
                (altitude - CLEARED_ALTITUDE) / (NORMAL_ALTITUDE - CLEARED_ALTITUDE)
            ));
            globe.setCountryBlend(countryIndex, blend);
            if (t >= 1) { resolve(); return; }
            requestAnimationFrame(tick);
        }
        tick();
    });
}

/**
 * Cleared after reveal: simple sink + gray out (no pop)
 * Used after wrong answer to clear the revealed correct country
 */
export async function animateToClearedAfterReveal(globe: EarthGlobeAPI, countryIndex: number): Promise<void> {
    globe.setCountryState(countryIndex, STATE_CLEARED);
    await Promise.all([
        globe.animateCountryAltitude(countryIndex, CLEARED_ALTITUDE, ANIMATION_DURATION * 2),
        globe.animateCountryBlend(countryIndex, 0.0, ANIMATION_DURATION * 2),
    ]);
}

/**
 * Disabled Animation (0.2s): Sink down + gray out immediately
 * Used at game start for non-game countries
 */
export async function animateToDisabled(globe: EarthGlobeAPI, countryIndex: number): Promise<void> {
    globe.setCountryState(countryIndex, STATE_DISABLED);
    await Promise.all([
        globe.animateCountryAltitude(countryIndex, CLEARED_ALTITUDE, ANIMATION_DURATION),
        globe.animateCountryBlend(countryIndex, 0.0, ANIMATION_DURATION)
    ]);
}

/**
 * Set disabled state immediately (no animation)
 * Used for batch-disabling countries at game start
 */
export function setDisabledImmediate(globe: EarthGlobeAPI, countryIndex: number): void {
    globe.setCountryState(countryIndex, STATE_DISABLED);
    globe.setCountryBlend(countryIndex, 0.0);
    globe.setCountryAltitude(countryIndex, CLEARED_ALTITUDE);
}

/**
 * Wrong Animation (0.2s): Brief pop, returns to normal or cleared
 * Used when player clicks wrong country
 */
export async function animateWrong(globe: EarthGlobeAPI, countryIndex: number, markAsCleared: boolean = false): Promise<void> {
    // Brief pop up
    await globe.animateCountryAltitude(countryIndex, WRONG_ALTITUDE, ANIMATION_DURATION);

    if (markAsCleared) {
        // Transition to cleared state
        globe.setCountryState(countryIndex, STATE_CLEARED);
        await Promise.all([
            globe.animateCountryAltitude(countryIndex, CLEARED_ALTITUDE, ANIMATION_DURATION),
            globe.animateCountryBlend(countryIndex, 0.0, ANIMATION_DURATION)
        ]);
    } else {
        // Return to normal
        await globe.animateCountryAltitude(countryIndex, NORMAL_ALTITUDE, ANIMATION_DURATION);
    }
}

/**
 * Show Correct Animation (0.3s): Rise up to highlight
 * Used to reveal the correct answer after wrong guess
 */
export async function animateShowCorrect(globe: EarthGlobeAPI, countryIndex: number): Promise<void> {
    await globe.animateCountryAltitude(countryIndex, SHOW_CORRECT_ALTITUDE, 300);
}

/**
 * Return to Normal (0.2s): Animate back to normal state
 */
export async function animateToNormal(globe: EarthGlobeAPI, countryIndex: number): Promise<void> {
    globe.setCountryState(countryIndex, STATE_NORMAL);
    await Promise.all([
        globe.animateCountryAltitude(countryIndex, NORMAL_ALTITUDE, ANIMATION_DURATION),
        globe.animateCountryBlend(countryIndex, 1.0, ANIMATION_DURATION)
    ]);
}
