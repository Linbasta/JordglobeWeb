/**
 * GlobeState - Centralized State Interface Definitions
 *
 * This module defines the state shape for the entire globe application.
 * The state is the single source of truth - all rendering is derived from it.
 *
 * Architecture:
 *   User Action → GlobeState.setXxx() → Mark dirty → Frame sync → Babylon.js update
 */

// ============================================================================
// Animation Types
// ============================================================================

/**
 * Animation tracking for any property.
 * Captures full animation state for debugging and replay.
 */
export interface Animation<T> {
    /** Value when animation started */
    startValue: T;
    /** Target value when animation completes */
    endValue: T;
    /** Timestamp when animation started (performance.now()) */
    startTime: number;
    /** Duration in milliseconds */
    duration: number;
    /** Current progress 0-1, computed each frame */
    progress: number;
    /** Current interpolated value, computed each frame */
    currentValue: T;
}

/**
 * Per-country animation state
 */
export interface CountryAnimationState {
    altitude: Animation<number> | null;
    saturation: Animation<number> | null;
}

// ============================================================================
// Camera Types
// ============================================================================

/**
 * Camera state snapshot
 */
export interface CameraState {
    /** Horizontal rotation angle (radians) */
    alpha: number;
    /** Vertical rotation angle (radians) */
    beta: number;
    /** Zoom distance from target */
    radius: number;
    /** Camera target point */
    target: { x: number; y: number; z: number };
}

// ============================================================================
// Pin Types
// ============================================================================

/**
 * Geographic position
 */
export interface GeoPosition {
    lat: number;
    lon: number;
}

// ============================================================================
// Change Tracking Types
// ============================================================================

/**
 * Entry in the change log for debugging
 */
export interface ChangeLogEntry {
    /** Timestamp of the change (performance.now()) */
    timestamp: number;
    /** Field path that changed (e.g., "hoveredCountryIndex", "camera.alpha") */
    field: string;
    /** Value before the change */
    oldValue: unknown;
    /** Value after the change */
    newValue: unknown;
}

// ============================================================================
// State Listener Types
// ============================================================================

/**
 * Callback for state change notifications
 */
export type StateChangeListener = (
    state: Readonly<GlobeState>,
    changedFields: Set<string>
) => void;

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
// GlobeState Class (Centralized State Management)
// ============================================================================

/**
 * GlobeState - Centralized State Management
 *
 * This class is the single source of truth for all globe state and provides:
 * - Setters that mark fields as dirty and log changes
 * - A sync() method that pushes dirty state to renderers once per frame
 * - Change logging for debugging and replay
 * - Subscription support for reactive updates
 *
 * Usage:
 *   const state = new GlobeState();
 *   state.setHoveredCountry(5);  // Marks dirty, logs change
 *   state.sync(globe, deltaTime); // Pushes to Babylon.js
 */
export class GlobeState {
    // =========================================================================
    // State Fields
    // =========================================================================

    /** Currently hovered country index, or null if none */
    private hoveredCountryIndex: number | null = null;

    /** Currently selected country index, or null if none */
    private selectedCountryIndex: number | null = null;

    /**
     * Active animations per country.
     * Only contains entries for countries with active animations.
     */
    private countryAnimations: Map<number, CountryAnimationState> = new Map();

    /** Full camera state for snapshots/replay */
    private camera: CameraState = {
        alpha: 0,
        beta: Math.PI / 3,
        radius: 3,
        target: { x: 0, y: 0, z: 0 }
    };

    /** Whether pin placement mode is active */
    private _isPlacingMode: boolean = false;

    /** Preview pin position while placing, or null if not showing */
    private previewPinPosition: GeoPosition | null = null;

    /** Final placed pin position, or null if no pin placed */
    private placedPin: GeoPosition | null = null;

    /** Whether the country label is visible */
    private labelVisible: boolean = false;

    /** Current label text content */
    private labelText: string = '';

    // =========================================================================
    // Internal State
    // =========================================================================

    private dirty: Set<string> = new Set();
    private changeLog: ChangeLogEntry[] = [];
    private listeners: StateChangeListener[] = [];

    /** Enable/disable console logging of state changes */
    public debugLogging: boolean = false;

    // =========================================================================
    // Getters (read-only access)
    // =========================================================================

    /**
     * Get the currently hovered country index
     */
    getHoveredCountry(): number | null {
        return this.hoveredCountryIndex;
    }

    /**
     * Get the currently selected country index
     */
    getSelectedCountry(): number | null {
        return this.selectedCountryIndex;
    }

    /**
     * Get the current camera state
     */
    getCamera(): Readonly<CameraState> {
        return this.camera;
    }

    /**
     * Check if pin placing mode is active
     */
    isPlacingMode(): boolean {
        return this._isPlacingMode;
    }

    /**
     * Get the preview pin position
     */
    getPreviewPinPosition(): GeoPosition | null {
        return this.previewPinPosition;
    }

    /**
     * Get the placed pin position
     */
    getPlacedPin(): GeoPosition | null {
        return this.placedPin;
    }

    /**
     * Get the label visibility
     */
    isLabelVisible(): boolean {
        return this.labelVisible;
    }

    /**
     * Get the label text
     */
    getLabelText(): string {
        return this.labelText;
    }

    // =========================================================================
    // Setters (mark dirty + log change)
    // =========================================================================

    /**
     * Set the hovered country index
     */
    setHoveredCountry(index: number | null): void {
        if (this.hoveredCountryIndex === index) return;

        this.logChange('hoveredCountryIndex', this.hoveredCountryIndex, index);
        this.hoveredCountryIndex = index;
        this.dirty.add('hoveredCountryIndex');
    }

    /**
     * Set the selected country index
     */
    setSelectedCountry(index: number | null): void {
        if (this.selectedCountryIndex === index) return;

        this.logChange('selectedCountryIndex', this.selectedCountryIndex, index);
        this.selectedCountryIndex = index;
        this.dirty.add('selectedCountryIndex');
    }

    /**
     * Set pin placing mode
     */
    setPlacingMode(active: boolean): void {
        if (this._isPlacingMode === active) return;

        this.logChange('isPlacingMode', this._isPlacingMode, active);
        this._isPlacingMode = active;
        this.dirty.add('isPlacingMode');
    }

    /**
     * Set the preview pin position
     */
    setPreviewPinPosition(position: GeoPosition | null): void {
        const oldPos = this.previewPinPosition;
        const positionsEqual = (
            oldPos?.lat === position?.lat &&
            oldPos?.lon === position?.lon
        );
        if (positionsEqual) return;

        this.logChange('previewPinPosition', oldPos, position);
        this.previewPinPosition = position ? { ...position } : null;
        this.dirty.add('previewPinPosition');
    }

    /**
     * Set the placed pin position
     */
    setPlacedPin(position: GeoPosition | null): void {
        this.logChange('placedPin', this.placedPin, position);
        this.placedPin = position ? { ...position } : null;
        this.dirty.add('placedPin');
    }

    /**
     * Set the camera state
     */
    setCamera(camera: Partial<CameraState>): void {
        const oldCamera = { ...this.camera };
        this.camera = { ...this.camera, ...camera };
        this.logChange('camera', oldCamera, this.camera);
        this.dirty.add('camera');
    }

    /**
     * Set the label visibility and text
     */
    setLabel(visible: boolean, text?: string): void {
        let changed = false;

        if (this.labelVisible !== visible) {
            this.logChange('labelVisible', this.labelVisible, visible);
            this.labelVisible = visible;
            this.dirty.add('labelVisible');
            changed = true;
        }

        if (text !== undefined && this.labelText !== text) {
            this.logChange('labelText', this.labelText, text);
            this.labelText = text;
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
        const countryState = this.countryAnimations.get(countryIndex)!;
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
        const countryState = this.countryAnimations.get(countryIndex)!;
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
    sync(globe: any, deltaTime: number): void {
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
            hoveredCountryIndex: this.hoveredCountryIndex,
            selectedCountryIndex: this.selectedCountryIndex,
            countryAnimations: Object.fromEntries(this.countryAnimations),
            camera: this.camera,
            isPlacingMode: this._isPlacingMode,
            previewPinPosition: this.previewPinPosition,
            placedPin: this.placedPin,
            labelVisible: this.labelVisible,
            labelText: this.labelText
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
                listener(this, frozenDirty);
            } catch (e) {
                console.error('[GlobeState] Listener error:', e);
            }
        }
    }

    private ensureCountryAnimationState(countryIndex: number): void {
        if (!this.countryAnimations.has(countryIndex)) {
            this.countryAnimations.set(countryIndex, {
                altitude: null,
                saturation: null
            });
        }
    }

    private getCountryAnimationCurrentAltitude(countryIndex: number): number {
        const anim = this.countryAnimations.get(countryIndex)?.altitude;
        if (anim) {
            return anim.currentValue;
        }
        return DEFAULT_ALTITUDE;
    }

    private getCountryAnimationCurrentSaturation(countryIndex: number): number {
        const anim = this.countryAnimations.get(countryIndex)?.saturation;
        if (anim) {
            return anim.currentValue;
        }
        return 1.0; // Default saturation
    }

    private updateAnimations(globe: any, now: number): void {
        const completedAnimations: { countryIndex: number; type: 'altitude' | 'saturation' }[] = [];

        for (const [countryIndex, animState] of this.countryAnimations) {
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
            const animState = this.countryAnimations.get(countryIndex);
            if (animState) {
                if (type === 'altitude') {
                    animState.altitude = null;
                } else {
                    animState.saturation = null;
                }

                // Remove entry if no more animations
                if (!animState.altitude && !animState.saturation) {
                    this.countryAnimations.delete(countryIndex);
                }
            }
        }
    }

    private syncCameraFromBabylon(globe: any): void {
        const camera = globe.getCamera();
        const target = camera.target;

        // Only update if changed (avoid unnecessary dirty flags)
        if (
            this.camera.alpha !== camera.alpha ||
            this.camera.beta !== camera.beta ||
            this.camera.radius !== camera.radius ||
            this.camera.target.x !== target.x ||
            this.camera.target.y !== target.y ||
            this.camera.target.z !== target.z
        ) {
            this.camera = {
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
// Exports
// ============================================================================

// Export convenience constants for hover/selection altitudes
export { HOVER_ALTITUDE, SELECTED_ALTITUDE, DEFAULT_ALTITUDE };
