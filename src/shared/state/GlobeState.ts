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
// Main State Interface
// ============================================================================

/**
 * GlobeState - Phase 1 (Minimal)
 *
 * This is the single source of truth for all globe state.
 * Renderers read from this state, never maintain their own.
 */
export interface GlobeState {
    // =========================================================================
    // Selection State
    // =========================================================================

    /** Currently hovered country index, or null if none */
    hoveredCountryIndex: number | null;

    /** Currently selected country index, or null if none */
    selectedCountryIndex: number | null;

    // =========================================================================
    // Country Animations
    // =========================================================================

    /**
     * Active animations per country.
     * Only contains entries for countries with active animations.
     */
    countryAnimations: Map<number, CountryAnimationState>;

    // =========================================================================
    // Camera State
    // =========================================================================

    /** Full camera state for snapshots/replay */
    camera: CameraState;

    // =========================================================================
    // Pin Placement State
    // =========================================================================

    /** Whether pin placement mode is active */
    isPlacingMode: boolean;

    /** Preview pin position while placing, or null if not showing */
    previewPinPosition: GeoPosition | null;

    /** Final placed pin position, or null if no pin placed */
    placedPin: GeoPosition | null;

    // =========================================================================
    // UI State
    // =========================================================================

    /** Whether the country label is visible */
    labelVisible: boolean;

    /** Current label text content */
    labelText: string;
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
// Factory Function
// ============================================================================

/**
 * Create initial GlobeState with default values
 */
export function createInitialGlobeState(): GlobeState {
    return {
        // Selection
        hoveredCountryIndex: null,
        selectedCountryIndex: null,

        // Animations
        countryAnimations: new Map(),

        // Camera (will be synced from actual camera on first frame)
        camera: {
            alpha: 0,
            beta: Math.PI / 3,
            radius: 3,
            target: { x: 0, y: 0, z: 0 }
        },

        // Pin placement
        isPlacingMode: false,
        previewPinPosition: null,
        placedPin: null,

        // UI
        labelVisible: false,
        labelText: ''
    };
}
