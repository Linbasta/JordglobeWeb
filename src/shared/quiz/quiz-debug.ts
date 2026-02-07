/**
 * Quiz Pipeline - Debug Utilities
 *
 * Pure utility functions for formatting and displaying quiz steps.
 * DOM management has been moved to QuizDebugManager.
 */

import type { Step } from './quiz-types'
import { StepOp } from './quiz-types'

/**
 * Format a step for display in debug output
 * Used by QuizDebugManager and potentially other debugging tools
 */
export function formatStep(step: Step): string {
    switch (step.op) {
        case StepOp.DisableNonGameCountries:
            return 'disable_non_game_countries'
        case StepOp.ShowQuestion:
            return `show_question { q: ${step.questionIndex} }`
        case StepOp.WaitPinPlacement:
            return 'wait_pin_placement'
        case StepOp.WaitAlternativeAnswer:
            return 'wait_alternative_answer'
        case StepOp.AnimateCorrect:
            return `animate_correct { country: ${step.countryIndex} }`
        case StepOp.AnimateWrongShake:
            return `animate_wrong_shake { country: ${step.wrongCountryIndex} }`
        case StepOp.AnimateWrongReveal:
            return `animate_wrong_reveal { wrong: ${step.wrongCountryIndex}, correct: ${step.correctCountryIndex} }`
        case StepOp.ShowResult:
            return `show_result { q: ${step.questionIndex}, correct: ${step.wasCorrect} }`
        case StepOp.Pause:
            return `pause { ${step.duration}ms }`
        case StepOp.GameComplete:
            return 'game_complete'
        case StepOp.HighlightCountry:
            return `highlight_country { ${step.countryIndex} }`
        case StepOp.ClearHighlight:
            return 'clear_highlight'
        case StepOp.AnimateCamera:
            return `animate_camera { lat: ${step.lat.toFixed(2)}, lng: ${step.lng.toFixed(2)} }`
        default:
            return 'unknown'
    }
}
