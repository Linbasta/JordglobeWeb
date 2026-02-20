/**
 * Earth Globe Module - Country Animator
 *
 * Handles animated transitions for country altitude and blend values.
 */

import { AnimationTexture, STATE_NORMAL, STATE_DISABLED, STATE_CLEARED } from './animation-texture';

export { STATE_NORMAL, STATE_DISABLED, STATE_CLEARED };

type EasingFn = (t: number) => number;

function inOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

interface AnimationState {
    startValue: number;
    endValue: number;
    startTime: number;
    duration: number;
    resolve: () => void;
    easing?: EasingFn;
}

/**
 * Region Animator - Handles smooth transitions for region properties
 */
export class RegionAnimator {
    private animationTexture: AnimationTexture;

    /** Active altitude animations by country index */
    private altitudeAnimations: Map<number, AnimationState> = new Map();

    /** Active blend factor animations by country index */
    private blendAnimations: Map<number, AnimationState> = new Map();

    /** Active expansion animations by country index */
    private expansionAnimations: Map<number, AnimationState> = new Map();

    /** Segment animation index mappings (segment -> country indices) */
    private segmentCountryMap: Map<number, number[]> = new Map();

    /** Debug flag - log segment altitudes only once */
    private hasLoggedSegmentAltitudes = false;

    constructor(animationTexture: AnimationTexture) {
        this.animationTexture = animationTexture;
    }

    /**
     * Set segment to country index mappings
     * Used to synchronize segment borders with their countries
     */
    setSegmentCountryMap(map: Map<number, number[]>): void {
        this.segmentCountryMap = map;
        console.log(`[RegionAnimator] Segment map set: ${map.size} segments mapped to regions`);
        // Log first few mappings for debugging
        let count = 0;
        for (const [segmentIndex, regionIndices] of map) {
            if (count++ < 3) {
                console.log(`  segment ${segmentIndex} → regions [${regionIndices.join(', ')}]`);
            }
        }
    }

    /**
     * Animate a country's altitude from current value to target
     * @param countryIndex Country index
     * @param targetAltitude Target altitude (0-1)
     * @param durationMs Animation duration in milliseconds
     * @returns Promise that resolves when animation completes
     */
    animateAltitude(countryIndex: number, targetAltitude: number, durationMs: number, easing?: EasingFn): Promise<void> {
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
                resolve,
                easing
            };

            this.altitudeAnimations.set(countryIndex, animation);
        });
    }

    /**
     * Animate a country's blend factor from current value to target
     * @param countryIndex Country index
     * @param targetBlend Target blend (0 = full state effect, 1 = normal appearance)
     * @param durationMs Animation duration in milliseconds
     * @returns Promise that resolves when animation completes
     */
    animateBlend(countryIndex: number, targetBlend: number, durationMs: number, easing?: EasingFn): Promise<void> {
        return new Promise((resolve) => {
            // Cancel any existing animation for this country
            const existing = this.blendAnimations.get(countryIndex);
            if (existing) {
                existing.resolve();
            }

            const startValue = this.animationTexture.getBlend(countryIndex);
            const animation: AnimationState = {
                startValue,
                endValue: targetBlend,
                startTime: performance.now(),
                duration: durationMs,
                resolve,
                easing
            };

            this.blendAnimations.set(countryIndex, animation);
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
     * Set immediate state value (no animation)
     */
    setState(countryIndex: number, state: number): void {
        this.animationTexture.setState(countryIndex, state);
    }

    /**
     * Get current state value
     */
    getState(countryIndex: number): number {
        return this.animationTexture.getState(countryIndex);
    }

    /**
     * Set immediate blend value (no animation)
     */
    setBlend(countryIndex: number, blend: number): void {
        // Cancel any active animation
        const existing = this.blendAnimations.get(countryIndex);
        if (existing) {
            existing.resolve();
            this.blendAnimations.delete(countryIndex);
        }

        this.animationTexture.setBlend(countryIndex, blend);
    }

    /**
     * Get current blend value
     */
    getBlend(countryIndex: number): number {
        return this.animationTexture.getBlend(countryIndex);
    }

    /**
     * Animate a country's expansion factor from current value to target
     * @param countryIndex Country index
     * @param targetExpansion Target expansion (1.0 = normal, >1 = magnified)
     * @param durationMs Animation duration in milliseconds
     */
    animateExpansion(countryIndex: number, targetExpansion: number, durationMs: number, easing?: EasingFn): Promise<void> {
        return new Promise((resolve) => {
            const existing = this.expansionAnimations.get(countryIndex);
            if (existing) {
                existing.resolve();
            }

            const startValue = this.animationTexture.getExpansion(countryIndex);
            const animation: AnimationState = {
                startValue,
                endValue: targetExpansion,
                startTime: performance.now(),
                duration: durationMs,
                resolve,
                easing
            };

            this.expansionAnimations.set(countryIndex, animation);
        });
    }

    /**
     * Set immediate expansion value (no animation)
     */
    setExpansion(countryIndex: number, expansion: number): void {
        const existing = this.expansionAnimations.get(countryIndex);
        if (existing) {
            existing.resolve();
            this.expansionAnimations.delete(countryIndex);
        }

        this.animationTexture.setExpansion(countryIndex, expansion);
    }

    /**
     * Get current expansion value
     */
    getExpansion(countryIndex: number): number {
        return this.animationTexture.getExpansion(countryIndex);
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

            const eased = (anim.easing || inOutQuad)(progress);
            const value = anim.startValue + (anim.endValue - anim.startValue) * eased;

            this.animationTexture.setAltitude(countryIndex, value);
            needsUpdate = true;

            if (progress >= 1) {
                anim.resolve();
                this.altitudeAnimations.delete(countryIndex);
            }
        }

        // Process blend animations
        for (const [countryIndex, anim] of this.blendAnimations) {
            const elapsed = now - anim.startTime;
            const progress = Math.min(1, elapsed / anim.duration);

            const eased = (anim.easing || inOutQuad)(progress);
            const value = anim.startValue + (anim.endValue - anim.startValue) * eased;

            this.animationTexture.setBlend(countryIndex, value);
            needsUpdate = true;

            if (progress >= 1) {
                anim.resolve();
                this.blendAnimations.delete(countryIndex);
            }
        }

        // Process expansion animations
        for (const [countryIndex, anim] of this.expansionAnimations) {
            const elapsed = now - anim.startTime;
            const progress = Math.min(1, elapsed / anim.duration);

            const eased = (anim.easing || inOutQuad)(progress);
            const value = anim.startValue + (anim.endValue - anim.startValue) * eased;

            this.animationTexture.setExpansion(countryIndex, value);
            needsUpdate = true;

            if (progress >= 1) {
                anim.resolve();
                this.expansionAnimations.delete(countryIndex);
            }
        }

        // Update segment border animations (sync with countries)
        for (const [segmentIndex, countryIndices] of this.segmentCountryMap) {
            let maxAltitude = 0;
            let anyExpanding = false;
            for (const countryIndex of countryIndices) {
                maxAltitude = Math.max(maxAltitude, this.animationTexture.getAltitude(countryIndex));
                if (this.animationTexture.getExpansion(countryIndex) > 1.01) {
                    anyExpanding = true;
                }
            }
            const finalAltitude = anyExpanding ? 0 : maxAltitude;

            this.animationTexture.setAltitude(segmentIndex, finalAltitude);

            // Log first time we set non-zero altitude for debugging
            if (!this.hasLoggedSegmentAltitudes && finalAltitude > 0) {
                console.log(`[RegionAnimator] Setting segment ${segmentIndex} altitude=${finalAltitude.toFixed(3)} (from regions [${countryIndices.join(', ')}])`);
                this.hasLoggedSegmentAltitudes = true;
            }

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
        return this.altitudeAnimations.size > 0 || this.blendAnimations.size > 0 || this.expansionAnimations.size > 0;
    }

    /**
     * Cancel all active animations
     */
    cancelAll(): void {
        for (const anim of this.altitudeAnimations.values()) {
            anim.resolve();
        }
        this.altitudeAnimations.clear();

        for (const anim of this.blendAnimations.values()) {
            anim.resolve();
        }
        this.blendAnimations.clear();

        for (const anim of this.expansionAnimations.values()) {
            anim.resolve();
        }
        this.expansionAnimations.clear();
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
