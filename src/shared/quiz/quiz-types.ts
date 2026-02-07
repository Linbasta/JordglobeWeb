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
 * Union of all question types
 */
export type Question = CountryQuestion | LocationQuestion | AlternativeQuestion

// ============================================================================
// Step Types (Execution Bytecode)
// ============================================================================

/**
 * Step operation codes
 * String enum preserves human-readable values in debug output
 */
export enum StepOp {
    DisableNonGameCountries = "disable_non_game_countries",
    AnimateCamera = "animate_camera",
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
    GameComplete = "game_complete"
}

/**
 * Steps are the "bytecode" that the quiz runner executes.
 * Each step is a simple data object with an operation type and parameters.
 */
export type Step =
    // Setup
    | { op: StepOp.DisableNonGameCountries }

    // Camera control
    | { op: StepOp.AnimateCamera; lat: number; lng: number; duration: number }

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
    pendingAnswer: { countryIndex: number } | { optionIndex: number } | null
}
