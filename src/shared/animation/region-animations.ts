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
 * Works for both countries and provinces (uses active region API)
 */
export function animateCorrectRegion(globe: EarthGlobeAPI, regionIndex: number): Promise<void> {
    const controller = globe.getActiveController();
    controller.setState(regionIndex, STATE_CLEARED);
    return new Promise((resolve) => {
        const startTime = performance.now();
        function tick() {
            const elapsed = performance.now() - startTime;
            const t = Math.min(1, elapsed / CORRECT_DURATION);
            const eased = lookupEasing(CORRECT_EASING, t);
            const altitude = NORMAL_ALTITUDE + (CLEARED_ALTITUDE - NORMAL_ALTITUDE) * eased;
            controller.setAltitude(regionIndex, altitude);
            const blend = Math.max(0, Math.min(1,
                (altitude - CLEARED_ALTITUDE) / (NORMAL_ALTITUDE - CLEARED_ALTITUDE)
            ));
            controller.setBlend(regionIndex, blend);
            if (t >= 1) { resolve(); return; }
            requestAnimationFrame(tick);
        }
        tick();
    });
}

/**
 * @deprecated Use animateCorrectRegion instead
 */
export function animateCorrect(globe: EarthGlobeAPI, countryIndex: number): Promise<void> {
    return animateCorrectRegion(globe, countryIndex);
}

/**
 * Cleared after reveal: simple sink + gray out (no pop)
 * Used after wrong answer to clear the revealed correct region
 * Works for both countries and provinces (uses active region API)
 */
export async function animateToClearedAfterRevealRegion(globe: EarthGlobeAPI, regionIndex: number): Promise<void> {
    const controller = globe.getActiveController();
    controller.setState(regionIndex, STATE_CLEARED);
    await Promise.all([
        controller.animateAltitude(regionIndex, CLEARED_ALTITUDE, ANIMATION_DURATION * 2),
        controller.animateBlend(regionIndex, 0.0, ANIMATION_DURATION * 2),
    ]);
}

/**
 * @deprecated Use animateToClearedAfterRevealRegion instead
 */
export async function animateToClearedAfterReveal(globe: EarthGlobeAPI, countryIndex: number): Promise<void> {
    return animateToClearedAfterRevealRegion(globe, countryIndex);
}

/**
 * Disabled Animation (0.2s): Sink down + gray out immediately
 * Used at game start for non-game regions
 * Works for both countries and provinces (uses active region API)
 */
export async function animateToDisabledRegion(globe: EarthGlobeAPI, regionIndex: number): Promise<void> {
    const controller = globe.getActiveController();
    controller.setState(regionIndex, STATE_DISABLED);
    await Promise.all([
        controller.animateAltitude(regionIndex, CLEARED_ALTITUDE, ANIMATION_DURATION),
        controller.animateBlend(regionIndex, 0.0, ANIMATION_DURATION)
    ]);
}

/**
 * @deprecated Use animateToDisabledRegion instead
 */
export async function animateToDisabled(globe: EarthGlobeAPI, countryIndex: number): Promise<void> {
    return animateToDisabledRegion(globe, countryIndex);
}

/**
 * Set disabled state immediately (no animation)
 * Used for batch-disabling regions at game start
 * Works for both countries and provinces (uses active region API)
 */
export function setRegionDisabledImmediate(globe: EarthGlobeAPI, regionIndex: number): void {
    const controller = globe.getActiveController();
    controller.setState(regionIndex, STATE_DISABLED);
    controller.setBlend(regionIndex, 0.0);
    controller.setAltitude(regionIndex, CLEARED_ALTITUDE);
}

/**
 * @deprecated Use setRegionDisabledImmediate instead
 */
export function setDisabledImmediate(globe: EarthGlobeAPI, countryIndex: number): void {
    setRegionDisabledImmediate(globe, countryIndex);
}

/**
 * Wrong Animation (0.2s): Brief pop, returns to normal or cleared
 * Used when player clicks wrong region
 * Works for both countries and provinces (uses active region API)
 */
export async function animateWrongRegion(globe: EarthGlobeAPI, regionIndex: number, markAsCleared: boolean = false): Promise<void> {
    const controller = globe.getActiveController();
    // Brief pop up
    await controller.animateAltitude(regionIndex, WRONG_ALTITUDE, ANIMATION_DURATION);

    if (markAsCleared) {
        // Transition to cleared state
        controller.setState(regionIndex, STATE_CLEARED);
        await Promise.all([
            controller.animateAltitude(regionIndex, CLEARED_ALTITUDE, ANIMATION_DURATION),
            controller.animateBlend(regionIndex, 0.0, ANIMATION_DURATION)
        ]);
    } else {
        // Return to normal
        await controller.animateAltitude(regionIndex, NORMAL_ALTITUDE, ANIMATION_DURATION);
    }
}

/**
 * @deprecated Use animateWrongRegion instead
 */
export async function animateWrong(globe: EarthGlobeAPI, countryIndex: number, markAsCleared: boolean = false): Promise<void> {
    return animateWrongRegion(globe, countryIndex, markAsCleared);
}

/**
 * Show Correct Animation (0.3s): Rise up to highlight
 * Used to reveal the correct answer after wrong guess
 * Works for both countries and provinces (uses active region API)
 */
export async function animateShowCorrectRegion(globe: EarthGlobeAPI, regionIndex: number): Promise<void> {
    const controller = globe.getActiveController();
    await controller.animateAltitude(regionIndex, SHOW_CORRECT_ALTITUDE, 300);
}

/**
 * @deprecated Use animateShowCorrectRegion instead
 */
export async function animateShowCorrect(globe: EarthGlobeAPI, countryIndex: number): Promise<void> {
    return animateShowCorrectRegion(globe, countryIndex);
}

/**
 * Return to Normal (0.2s): Animate back to normal state
 * Works for both countries and provinces (uses active region API)
 */
export async function animateToNormalRegion(globe: EarthGlobeAPI, regionIndex: number): Promise<void> {
    const controller = globe.getActiveController();
    controller.setState(regionIndex, STATE_NORMAL);
    await Promise.all([
        controller.animateAltitude(regionIndex, NORMAL_ALTITUDE, ANIMATION_DURATION),
        controller.animateBlend(regionIndex, 1.0, ANIMATION_DURATION)
    ]);
}

/**
 * @deprecated Use animateToNormalRegion instead
 */
export async function animateToNormal(globe: EarthGlobeAPI, countryIndex: number): Promise<void> {
    return animateToNormalRegion(globe, countryIndex);
}
