/**
 * GlobeStateManager - Centralized State Management
 *
 * This class manages the GlobeState and provides:
 * - Setters that mark fields as dirty and log changes
 * - A sync() method that pushes dirty state to renderers once per frame
 * - Change logging for debugging and replay
 * - Subscription support for reactive updates
 *
 * Usage:
 *   const stateManager = new GlobeStateManager();
 *   stateManager.setHoveredCountry(5);  // Marks dirty, logs change
 *   stateManager.sync(globe, deltaTime); // Pushes to Babylon.js
 */

import type { EarthGlobeAPI } from '../../earth-globe';
import {
    GlobeState,
    ChangeLogEntry,
    StateChangeListener,
    Animation,
    CountryAnimationState,
    CameraState,
    GeoPosition,
    createInitialGlobeState
} from './GlobeState';

// ============================================================================
// Configuration
// ============================================================================

/** Maximum number of change log entries to keep */
const MAX_CHANGE_LOG_SIZE = 1000;

/** Default animation duration in milliseconds */
const DEFAULT_ANIMATION_DURATION = 200;

/** Altitude for hovered countries */
const HOVER_ALTITUDE = 0.02;

/** Altitude for selected countries */
const SELECTED_ALTITUDE = 0.025;

/** Default altitude for countries */
const DEFAULT_ALTITUDE = 0.015;

// ============================================================================
// GlobeStateManager Class
// ============================================================================

export class GlobeStateManager {
    private state: GlobeState;
    private dirty: Set<string> = new Set();
    private changeLog: ChangeLogEntry[] = [];
    private listeners: StateChangeListener[] = [];

    /** Enable/disable console logging of state changes */
    public debugLogging: boolean = false;

    constructor() {
        this.state = createInitialGlobeState();
    }

    // =========================================================================
    // Getters (read-only access)
    // =========================================================================

    /**
     * Get the full state (read-only).
     * Use specific getters for type-safe access.
     */
    getState(): Readonly<GlobeState> {
        return this.state;
    }

    /**
     * Get the currently hovered country index
     */
    getHoveredCountry(): number | null {
        return this.state.hoveredCountryIndex;
    }

    /**
     * Get the currently selected country index
     */
    getSelectedCountry(): number | null {
        return this.state.selectedCountryIndex;
    }

    /**
     * Get the current camera state
     */
    getCamera(): Readonly<CameraState> {
        return this.state.camera;
    }

    /**
     * Check if pin placing mode is active
     */
    isPlacingMode(): boolean {
        return this.state.isPlacingMode;
    }

    /**
     * Get the preview pin position
     */
    getPreviewPinPosition(): GeoPosition | null {
        return this.state.previewPinPosition;
    }

    /**
     * Get the placed pin position
     */
    getPlacedPin(): GeoPosition | null {
        return this.state.placedPin;
    }

    /**
     * Get the label visibility
     */
    isLabelVisible(): boolean {
        return this.state.labelVisible;
    }

    /**
     * Get the label text
     */
    getLabelText(): string {
        return this.state.labelText;
    }

    // =========================================================================
    // Setters (mark dirty + log change)
    // =========================================================================

    /**
     * Set the hovered country index
     */
    setHoveredCountry(index: number | null): void {
        if (this.state.hoveredCountryIndex === index) return;

        this.logChange('hoveredCountryIndex', this.state.hoveredCountryIndex, index);
        this.state.hoveredCountryIndex = index;
        this.dirty.add('hoveredCountryIndex');
    }

    /**
     * Set the selected country index
     */
    setSelectedCountry(index: number | null): void {
        if (this.state.selectedCountryIndex === index) return;

        this.logChange('selectedCountryIndex', this.state.selectedCountryIndex, index);
        this.state.selectedCountryIndex = index;
        this.dirty.add('selectedCountryIndex');
    }

    /**
     * Set pin placing mode
     */
    setPlacingMode(active: boolean): void {
        if (this.state.isPlacingMode === active) return;

        this.logChange('isPlacingMode', this.state.isPlacingMode, active);
        this.state.isPlacingMode = active;
        this.dirty.add('isPlacingMode');
    }

    /**
     * Set the preview pin position
     */
    setPreviewPinPosition(position: GeoPosition | null): void {
        const oldPos = this.state.previewPinPosition;
        const positionsEqual = (
            oldPos?.lat === position?.lat &&
            oldPos?.lon === position?.lon
        );
        if (positionsEqual) return;

        this.logChange('previewPinPosition', oldPos, position);
        this.state.previewPinPosition = position ? { ...position } : null;
        this.dirty.add('previewPinPosition');
    }

    /**
     * Set the placed pin position
     */
    setPlacedPin(position: GeoPosition | null): void {
        this.logChange('placedPin', this.state.placedPin, position);
        this.state.placedPin = position ? { ...position } : null;
        this.dirty.add('placedPin');
    }

    /**
     * Set the camera state
     */
    setCamera(camera: Partial<CameraState>): void {
        const oldCamera = { ...this.state.camera };
        this.state.camera = { ...this.state.camera, ...camera };
        this.logChange('camera', oldCamera, this.state.camera);
        this.dirty.add('camera');
    }

    /**
     * Set the label visibility and text
     */
    setLabel(visible: boolean, text?: string): void {
        let changed = false;

        if (this.state.labelVisible !== visible) {
            this.logChange('labelVisible', this.state.labelVisible, visible);
            this.state.labelVisible = visible;
            this.dirty.add('labelVisible');
            changed = true;
        }

        if (text !== undefined && this.state.labelText !== text) {
            this.logChange('labelText', this.state.labelText, text);
            this.state.labelText = text;
            this.dirty.add('labelText');
            changed = true;
        }
    }

    // =========================================================================
    // Animation Methods
    // =========================================================================

    /**
     * Start an altitude animation for a country
     */
    animateCountryAltitude(
        countryIndex: number,
        targetAltitude: number,
        duration: number = DEFAULT_ANIMATION_DURATION
    ): void {
        const now = performance.now();
        const currentAltitude = this.getCountryAnimationCurrentAltitude(countryIndex);

        const animation: Animation<number> = {
            startValue: currentAltitude,
            endValue: targetAltitude,
            startTime: now,
            duration,
            progress: 0,
            currentValue: currentAltitude
        };

        this.ensureCountryAnimationState(countryIndex);
        const countryState = this.state.countryAnimations.get(countryIndex)!;
        countryState.altitude = animation;

        this.logChange(`countryAnimations[${countryIndex}].altitude`, null, animation);
        this.dirty.add('countryAnimations');
    }

    /**
     * Start a saturation animation for a country
     */
    animateCountrySaturation(
        countryIndex: number,
        targetSaturation: number,
        duration: number = DEFAULT_ANIMATION_DURATION
    ): void {
        const now = performance.now();
        const currentSaturation = this.getCountryAnimationCurrentSaturation(countryIndex);

        const animation: Animation<number> = {
            startValue: currentSaturation,
            endValue: targetSaturation,
            startTime: now,
            duration,
            progress: 0,
            currentValue: currentSaturation
        };

        this.ensureCountryAnimationState(countryIndex);
        const countryState = this.state.countryAnimations.get(countryIndex)!;
        countryState.saturation = animation;

        this.logChange(`countryAnimations[${countryIndex}].saturation`, null, animation);
        this.dirty.add('countryAnimations');
    }

    // =========================================================================
    // Frame Sync
    // =========================================================================

    /**
     * Sync dirty state to the globe renderers.
     * Call this once per frame in onBeforeRenderObservable.
     *
     * @param globe - The EarthGlobe API to sync to
     * @param deltaTime - Time since last frame in milliseconds
     */
    sync(globe: EarthGlobeAPI, deltaTime: number): void {
        const now = performance.now();

        // Update animations and get completion status
        this.updateAnimations(globe, now);

        // Sync camera from Babylon.js to state (camera is source of truth in Babylon)
        this.syncCameraFromBabylon(globe);

        // Notify listeners if anything changed
        if (this.dirty.size > 0) {
            this.notifyListeners();
        }

        // Clear dirty set after sync
        this.dirty.clear();
    }

    // =========================================================================
    // Subscription
    // =========================================================================

    /**
     * Subscribe to state changes.
     * @returns Unsubscribe function
     */
    subscribe(listener: StateChangeListener): () => void {
        this.listeners.push(listener);
        return () => {
            const index = this.listeners.indexOf(listener);
            if (index >= 0) {
                this.listeners.splice(index, 1);
            }
        };
    }

    // =========================================================================
    // Debugging
    // =========================================================================

    /**
     * Get recent change log entries
     */
    getChangeLog(limit: number = 50): ChangeLogEntry[] {
        return this.changeLog.slice(-limit);
    }

    /**
     * Dump the current state as JSON string
     */
    dumpState(): string {
        // Convert Map to object for JSON serialization
        const stateForDump = {
            ...this.state,
            countryAnimations: Object.fromEntries(this.state.countryAnimations)
        };
        return JSON.stringify(stateForDump, null, 2);
    }

    /**
     * Get a snapshot of dirty fields
     */
    getDirtyFields(): string[] {
        return Array.from(this.dirty);
    }

    // =========================================================================
    // Private Helpers
    // =========================================================================

    private logChange(field: string, oldValue: unknown, newValue: unknown): void {
        const entry: ChangeLogEntry = {
            timestamp: performance.now(),
            field,
            oldValue,
            newValue
        };

        this.changeLog.push(entry);

        // Trim log if too large
        if (this.changeLog.length > MAX_CHANGE_LOG_SIZE) {
            this.changeLog = this.changeLog.slice(-MAX_CHANGE_LOG_SIZE / 2);
        }

        // Console logging if enabled
        if (this.debugLogging) {
            console.log(`[GlobeState] ${field}:`, oldValue, '→', newValue);
        }
    }

    private notifyListeners(): void {
        const frozenDirty = new Set(this.dirty);
        for (const listener of this.listeners) {
            try {
                listener(this.state, frozenDirty);
            } catch (e) {
                console.error('[GlobeStateManager] Listener error:', e);
            }
        }
    }

    private ensureCountryAnimationState(countryIndex: number): void {
        if (!this.state.countryAnimations.has(countryIndex)) {
            this.state.countryAnimations.set(countryIndex, {
                altitude: null,
                saturation: null
            });
        }
    }

    private getCountryAnimationCurrentAltitude(countryIndex: number): number {
        const anim = this.state.countryAnimations.get(countryIndex)?.altitude;
        if (anim) {
            return anim.currentValue;
        }
        return DEFAULT_ALTITUDE;
    }

    private getCountryAnimationCurrentSaturation(countryIndex: number): number {
        const anim = this.state.countryAnimations.get(countryIndex)?.saturation;
        if (anim) {
            return anim.currentValue;
        }
        return 1.0; // Default saturation
    }

    private updateAnimations(globe: EarthGlobeAPI, now: number): void {
        const completedAnimations: { countryIndex: number; type: 'altitude' | 'saturation' }[] = [];

        for (const [countryIndex, animState] of this.state.countryAnimations) {
            // Update altitude animation
            if (animState.altitude) {
                const anim = animState.altitude;
                const elapsed = now - anim.startTime;
                const progress = Math.min(1, elapsed / anim.duration);

                // Ease out cubic
                const eased = 1 - Math.pow(1 - progress, 3);
                anim.progress = progress;
                anim.currentValue = anim.startValue + (anim.endValue - anim.startValue) * eased;

                // Apply to globe
                globe.setCountryAltitude(countryIndex, anim.currentValue);

                // Mark as completed
                if (progress >= 1) {
                    completedAnimations.push({ countryIndex, type: 'altitude' });
                }
            }

            // Update saturation animation
            if (animState.saturation) {
                const anim = animState.saturation;
                const elapsed = now - anim.startTime;
                const progress = Math.min(1, elapsed / anim.duration);

                // Ease out cubic
                const eased = 1 - Math.pow(1 - progress, 3);
                anim.progress = progress;
                anim.currentValue = anim.startValue + (anim.endValue - anim.startValue) * eased;

                // Apply to globe
                globe.setCountrySaturation(countryIndex, anim.currentValue);

                // Mark as completed
                if (progress >= 1) {
                    completedAnimations.push({ countryIndex, type: 'saturation' });
                }
            }
        }

        // Clean up completed animations
        for (const { countryIndex, type } of completedAnimations) {
            const animState = this.state.countryAnimations.get(countryIndex);
            if (animState) {
                if (type === 'altitude') {
                    animState.altitude = null;
                } else {
                    animState.saturation = null;
                }

                // Remove entry if no more animations
                if (!animState.altitude && !animState.saturation) {
                    this.state.countryAnimations.delete(countryIndex);
                }
            }
        }
    }

    private syncCameraFromBabylon(globe: EarthGlobeAPI): void {
        const camera = globe.getCamera();
        const target = camera.target;

        // Only update if changed (avoid unnecessary dirty flags)
        if (
            this.state.camera.alpha !== camera.alpha ||
            this.state.camera.beta !== camera.beta ||
            this.state.camera.radius !== camera.radius ||
            this.state.camera.target.x !== target.x ||
            this.state.camera.target.y !== target.y ||
            this.state.camera.target.z !== target.z
        ) {
            this.state.camera = {
                alpha: camera.alpha,
                beta: camera.beta,
                radius: camera.radius,
                target: { x: target.x, y: target.y, z: target.z }
            };
            // Don't mark as dirty - camera sync is passive observation
        }
    }
}

// ============================================================================
// Singleton Export (optional, for debugging convenience)
// ============================================================================

// The state manager is created by BaseGameController, but we expose
// convenience constants for hover/selection altitudes
export { HOVER_ALTITUDE, SELECTED_ALTITUDE, DEFAULT_ALTITUDE };
