/**
 * Quiz Pipeline - Type Definitions
 *
 * Pure data types for questions and execution steps.
 * No logic, no state - just data.
 */

// ============================================================================
// Question Types (Input Data)
// ============================================================================

/**
 * Country identification question - user clicks on globe
 */
export type CountryQuestion = {
    type: "country"
    countryISO2: string       // e.g. "SE"
    prompt: string            // e.g. "Where is Sweden?"
}

/**
 * Location question - user clicks on specific lat/lon
 */
export type LocationQuestion = {
    type: "location"
    lat: number
    lng: number
    prompt: string            // e.g. "Where is Stockholm?"
}

/**
 * Multiple choice question - user selects from options
 */
export type AlternativeQuestion = {
    type: "alternative"
    prompt: string
    options: string[]
    correctIndex: number
}

/**
 * Video question - user watches a clip, then clicks the correct country
 * Same answer mechanic as CountryQuestion — only the presentation differs.
 */
export type VideoQuestion = {
    type: "video"
    youtubeId: string
    startTime?: number
    endTime?: number
    countryISO2: string     // correct country (same as CountryQuestion)
    prompt: string
}

/**
 * Union of all question types
 */
export type Question = CountryQuestion | LocationQuestion | AlternativeQuestion | VideoQuestion

// ============================================================================
// Step Types (Execution Bytecode)
// ============================================================================

/**
 * Step operation codes
 * String enum preserves human-readable values in debug output
 */
export enum StepOp {
    DisableNonGameCountries = "disable_non_game_countries",
    HighlightCountry = "highlight_country",
    ClearHighlight = "clear_highlight",
    ShowQuestion = "show_question",
    WaitPinPlacement = "wait_pin_placement",
    WaitAlternativeAnswer = "wait_alternative_answer",
    AnimateCorrect = "animate_correct",
    AnimateWrongReveal = "animate_wrong_reveal",
    AnimateWrongShake = "animate_wrong_shake",
    ShowResult = "show_result",
    Pause = "pause",
    GameComplete = "game_complete",
    ShowAllLocationMarkers = "show_all_location_markers",
    AnimateMarkerCorrect = "animate_marker_correct",
    AnimateMarkerWrongShake = "animate_marker_wrong_shake",
    AnimateMarkerWrongReveal = "animate_marker_wrong_reveal",
    FrameLocations = "frame_locations",
    ShowVideo = "show_video",
    HideVideo = "hide_video",
}

/**
 * Steps are the "bytecode" that the quiz runner executes.
 * Each step is a simple data object with an operation type and parameters.
 */
export type Step =
    // Setup
    | { op: StepOp.DisableNonGameCountries }

    // Country highlighting
    | { op: StepOp.HighlightCountry; countryIndex: number }
    | { op: StepOp.ClearHighlight }

    // Question display
    | { op: StepOp.ShowQuestion; questionIndex: number }

    // User input
    | { op: StepOp.WaitPinPlacement }
    | { op: StepOp.WaitAlternativeAnswer }

    // Animation sequences
    | { op: StepOp.AnimateCorrect; countryIndex: number }
    | { op: StepOp.AnimateWrongReveal; wrongCountryIndex: number; correctCountryIndex: number }
    | { op: StepOp.AnimateWrongShake; wrongCountryIndex: number }

    // Location markers
    | { op: StepOp.ShowAllLocationMarkers }
    | { op: StepOp.AnimateMarkerCorrect; markerId: number }
    | { op: StepOp.AnimateMarkerWrongShake; wrongMarkerId: number; correctMarkerId: number }
    | { op: StepOp.AnimateMarkerWrongReveal; wrongMarkerId: number; correctMarkerId: number;
        wrongLat: number; wrongLng: number; correctLat: number; correctLng: number }

    // Video
    | { op: StepOp.ShowVideo; questionIndex: number }
    | { op: StepOp.HideVideo }

    // Framing
    | { op: StepOp.FrameLocations; points: { lat: number; lon: number }[]; duration: number }

    // Result display
    | { op: StepOp.ShowResult; questionIndex: number; wasCorrect: boolean }

    // Timing
    | { op: StepOp.Pause; duration: number }

    // Completion
    | { op: StepOp.GameComplete }

// ============================================================================
// Debug Types
// ============================================================================

/**
 * Complete state snapshot for debugging
 */
export interface DebugState {
    steps: Step[]
    pc: number                // Program counter
    questions: Question[]
    score: number
    waiting: boolean
    stepStartTime: number
    pendingAnswer: { countryIndex: number; latLon: { lat: number; lng: number } } | { optionIndex: number } | null
}
