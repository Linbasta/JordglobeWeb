/**
 * Earth Globe Module - Country Animator
 *
 * Handles animated transitions for country altitude and saturation values.
 */

import { AnimationTexture } from './AnimationTexture';

interface AnimationState {
    startValue: number;
    endValue: number;
    startTime: number;
    duration: number;
    resolve: () => void;
}

/**
 * Country Animator - Handles smooth transitions for country properties
 */
export class CountryAnimator {
    private animationTexture: AnimationTexture;

    /** Active altitude animations by country index */
    private altitudeAnimations: Map<number, AnimationState> = new Map();

    /** Active saturation animations by country index */
    private saturationAnimations: Map<number, AnimationState> = new Map();

    /** Segment animation index mappings (segment -> country indices) */
    private segmentCountryMap: Map<number, number[]> = new Map();

    constructor(animationTexture: AnimationTexture) {
        this.animationTexture = animationTexture;
    }

    /**
     * Set segment to country index mappings
     * Used to synchronize segment borders with their countries
     */
    setSegmentCountryMap(map: Map<number, number[]>): void {
        this.segmentCountryMap = map;
    }

    /**
     * Animate a country's altitude from current value to target
     * @param countryIndex Country index
     * @param targetAltitude Target altitude (0-1)
     * @param durationMs Animation duration in milliseconds
     * @returns Promise that resolves when animation completes
     */
    animateAltitude(countryIndex: number, targetAltitude: number, durationMs: number): Promise<void> {
        return new Promise((resolve) => {
            // Cancel any existing animation for this country
            const existing = this.altitudeAnimations.get(countryIndex);
            if (existing) {
                existing.resolve();
            }

            const startValue = this.animationTexture.getAltitude(countryIndex);
            const animation: AnimationState = {
                startValue,
                endValue: targetAltitude,
                startTime: performance.now(),
                duration: durationMs,
                resolve
            };

            this.altitudeAnimations.set(countryIndex, animation);
        });
    }

    /**
     * Animate a country's saturation from current value to target
     * @param countryIndex Country index
     * @param targetSaturation Target saturation (0-1)
     * @param durationMs Animation duration in milliseconds
     * @returns Promise that resolves when animation completes
     */
    animateSaturation(countryIndex: number, targetSaturation: number, durationMs: number): Promise<void> {
        return new Promise((resolve) => {
            // Cancel any existing animation for this country
            const existing = this.saturationAnimations.get(countryIndex);
            if (existing) {
                existing.resolve();
            }

            const startValue = this.animationTexture.getSaturation(countryIndex);
            const animation: AnimationState = {
                startValue,
                endValue: targetSaturation,
                startTime: performance.now(),
                duration: durationMs,
                resolve
            };

            this.saturationAnimations.set(countryIndex, animation);
        });
    }

    /**
     * Set immediate altitude value (no animation)
     */
    setAltitude(countryIndex: number, altitude: number): void {
        // Cancel any active animation
        const existing = this.altitudeAnimations.get(countryIndex);
        if (existing) {
            existing.resolve();
            this.altitudeAnimations.delete(countryIndex);
        }

        this.animationTexture.setAltitude(countryIndex, altitude);
    }

    /**
     * Get current altitude value
     */
    getAltitude(countryIndex: number): number {
        return this.animationTexture.getAltitude(countryIndex);
    }

    /**
     * Set immediate saturation value (no animation)
     */
    setSaturation(countryIndex: number, saturation: number): void {
        // Cancel any active animation
        const existing = this.saturationAnimations.get(countryIndex);
        if (existing) {
            existing.resolve();
            this.saturationAnimations.delete(countryIndex);
        }

        this.animationTexture.setSaturation(countryIndex, saturation);
    }

    /**
     * Get current saturation value
     */
    getSaturation(countryIndex: number): number {
        return this.animationTexture.getSaturation(countryIndex);
    }

    /**
     * Update all active animations
     * Call this once per frame
     */
    update(): void {
        const now = performance.now();
        let needsUpdate = false;

        // Process altitude animations
        for (const [countryIndex, anim] of this.altitudeAnimations) {
            const elapsed = now - anim.startTime;
            const progress = Math.min(1, elapsed / anim.duration);

            // Ease out cubic for smooth deceleration
            const eased = 1 - Math.pow(1 - progress, 3);
            const value = anim.startValue + (anim.endValue - anim.startValue) * eased;

            this.animationTexture.setAltitude(countryIndex, value);
            needsUpdate = true;

            if (progress >= 1) {
                anim.resolve();
                this.altitudeAnimations.delete(countryIndex);
            }
        }

        // Process saturation animations
        for (const [countryIndex, anim] of this.saturationAnimations) {
            const elapsed = now - anim.startTime;
            const progress = Math.min(1, elapsed / anim.duration);

            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const value = anim.startValue + (anim.endValue - anim.startValue) * eased;

            this.animationTexture.setSaturation(countryIndex, value);
            needsUpdate = true;

            if (progress >= 1) {
                anim.resolve();
                this.saturationAnimations.delete(countryIndex);
            }
        }

        // Update segment border animations (sync with countries)
        for (const [segmentIndex, countryIndices] of this.segmentCountryMap) {
            let maxAltitude = 0;
            for (const countryIndex of countryIndices) {
                maxAltitude = Math.max(maxAltitude, this.animationTexture.getAltitude(countryIndex));
            }
            this.animationTexture.setAltitude(segmentIndex, maxAltitude);
            needsUpdate = true;
        }

        // Update the GPU texture if any values changed
        if (needsUpdate) {
            this.animationTexture.update();
        }
    }

    /**
     * Check if any animations are currently active
     */
    hasActiveAnimations(): boolean {
        return this.altitudeAnimations.size > 0 || this.saturationAnimations.size > 0;
    }

    /**
     * Cancel all active animations
     */
    cancelAll(): void {
        for (const anim of this.altitudeAnimations.values()) {
            anim.resolve();
        }
        this.altitudeAnimations.clear();

        for (const anim of this.saturationAnimations.values()) {
            anim.resolve();
        }
        this.saturationAnimations.clear();
    }

    /**
     * Run a demo animation (wave effect across all countries)
     * @param countryCount Number of countries
     * @param enabled Whether animation is enabled
     */
    runDemoAnimation(countryCount: number, enabled: boolean): void {
        if (!enabled) return;

        const time = Date.now() * 0.001; // Time in seconds

        // Animate all countries with unique sine wave patterns
        const altitudeData = this.animationTexture.getAltitudeData();
        for (let i = 0; i < countryCount; i++) {
            const offset = i * 0.5;
            const frequency = 0.5 + (i % 10) * 0.1;
            altitudeData[i] = (Math.sin(time * frequency + offset) + 1) * 0.5;
        }

        // Update segment borders to match their countries
        for (const [segmentIndex, countryIndices] of this.segmentCountryMap) {
            let maxValue = 0;
            for (const countryIndex of countryIndices) {
                maxValue = Math.max(maxValue, altitudeData[countryIndex] || 0);
            }
            altitudeData[segmentIndex] = maxValue;
        }

        this.animationTexture.update();
    }
}
