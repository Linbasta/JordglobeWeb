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
 * How the question is presented to the user
 */
export type PresentTag = "text" | "video" | "image"

/**
 * What kind of answer the question expects
 */
export type AnswerTag = "country" | "province" | "location-guess" | "location-alternatives"

/**
 * Flat question struct — presentation and answer type are independent.
 *
 * Old type mapping:
 *   "country"     → present: "text",  answer: "country"
 *   "location"    → present: "text",  answer: "location-guess"
 *   "alternative" → present: "text",  answer: "location-alternatives"
 *   "video"       → present: "video", answer: "country"
 */
export type Question = {
    present: PresentTag
    answer: AnswerTag
    prompt: string

    // answer: "country"
    countryISO2?: string

    // answer: "province"
    provinceId?: number
    // countryISO2 also used for provinces (which country the province belongs to)

    // answer: "location-guess"
    lat?: number
    lng?: number
    locationName?: string

    // answer: "location-alternatives"
    options?: string[]
    correctIndex?: number

    // present: "video"
    youtubeId?: string
    startTime?: number
    endTime?: number

    // present: "image"
    imageUrl?: string
    imageFrame?: "default" | "simple"
    imageCredit?: string
}

// ============================================================================
// Step Types (Execution Bytecode)
// ============================================================================

/**
 * Step operation codes
 * String enum preserves human-readable values in debug output
 */
export enum StepOp {
    DisableNonGameCountries = "disable_non_game_countries",  // Works for both countries and provinces
    DisableNonParentCountries = "disable_non_parent_countries",  // For province mode: disable all countries except parent
    EnterRegionMode = "enter_region_mode",
    ExitRegionMode = "exit_region_mode",
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
    ShowImage = "show_image",
    HideImage = "hide_image",
    RevealLocationGuess = "reveal_location_guess",
}

/**
 * Steps are the "bytecode" that the quiz runner executes.
 * Each step is a simple data object with an operation type and parameters.
 */
export type Step =
    // Setup
    | { op: StepOp.DisableNonGameCountries }  // Works for both countries and provinces
    | { op: StepOp.DisableNonParentCountries; countryISO2: string }  // For province mode: disable all countries except parent
    | { op: StepOp.EnterRegionMode; countryISO2: string }
    | { op: StepOp.ExitRegionMode }

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

    // Image
    | { op: StepOp.ShowImage; questionIndex: number }
    | { op: StepOp.HideImage }

    // Location guess reveal
    | { op: StepOp.RevealLocationGuess;
        guessLat: number; guessLng: number;
        correctLat: number; correctLng: number;
        distanceKm: number;
        locationName: string }

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
