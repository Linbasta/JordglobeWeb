import type { EarthGlobeAPI } from '../../earth-globe';
import { STATE_NORMAL, STATE_DISABLED, STATE_CLEARED } from '../../earth-globe';

// Configuration constants
const NORMAL_ALTITUDE = 0.4;      // Default country altitude
const CORRECT_ALTITUDE = 0.6;     // Pop height for correct answer
const WRONG_ALTITUDE = 0.5;       // Pop height for wrong answer
const CLEARED_ALTITUDE = 0.1;     // Sunk state for cleared countries
const SHOW_CORRECT_ALTITUDE = 0.55;

const ANIMATION_DURATION = 200;   // ms per phase

/**
 * Correct Animation (0.4s): Pop up → sink to cleared + gray out
 * Used when player clicks the correct country
 */
export async function animateCorrect(globe: EarthGlobeAPI, countryIndex: number): Promise<void> {
    // Set state to CLEARED (determines final color)
    globe.setCountryState(countryIndex, STATE_CLEARED);

    // Pop up while starting to gray out
    await Promise.all([
        globe.animateCountryAltitude(countryIndex, CORRECT_ALTITUDE, ANIMATION_DURATION),
        globe.animateCountryBlend(countryIndex, 0.5, ANIMATION_DURATION)
    ]);

    // Sink to globe surface while finishing gray out
    await Promise.all([
        globe.animateCountryAltitude(countryIndex, CLEARED_ALTITUDE, ANIMATION_DURATION),
        globe.animateCountryBlend(countryIndex, 0.0, ANIMATION_DURATION)
    ]);
}

/**
 * Cleared Animation (0.4s): Pop up → sink down + gray out
 * Used after correct answer to mark country as completed
 */
export async function animateToCleared(globe: EarthGlobeAPI, countryIndex: number): Promise<void> {
    // Set state to CLEARED (determines final color)
    globe.setCountryState(countryIndex, STATE_CLEARED);

    // Pop up while starting to gray out
    await Promise.all([
        globe.animateCountryAltitude(countryIndex, CORRECT_ALTITUDE, ANIMATION_DURATION),
        globe.animateCountryBlend(countryIndex, 0.5, ANIMATION_DURATION)
    ]);

    // Sink down while finishing gray out
    await Promise.all([
        globe.animateCountryAltitude(countryIndex, CLEARED_ALTITUDE, ANIMATION_DURATION),
        globe.animateCountryBlend(countryIndex, 0.0, ANIMATION_DURATION)
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
