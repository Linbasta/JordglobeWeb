/**
 * Quiz Pipeline - Flow Generation
 *
 * Converts question data into step arrays.
 * Pure functions - no state, no side effects.
 */

import type { Question, Step } from './quizTypes'
import { StepOp } from './quizTypes'

/**
 * Generate the main quiz flow steps
 *
 * Pre-generates steps up to each wait point (where user input is needed).
 * Post-answer steps are generated dynamically by generateCountryAnswerSteps.
 *
 * @param questions - Array of questions to convert into steps
 * @returns Flat array of steps to execute
 */
export function generateQuizSteps(questions: Question[]): Step[] {
    const steps: Step[] = []

    // Initial setup
    steps.push({ op: StepOp.DisableNonGameCountries })

    // Generate steps for each question
    for (let i = 0; i < questions.length; i++) {
        const q = questions[i]

        // Show question UI
        steps.push({ op: StepOp.ShowQuestion, questionIndex: i })

        // Wait for answer based on question type
        if (q.type === "country" || q.type === "location") {
            steps.push({ op: StepOp.WaitPinPlacement })
        } else {
            steps.push({ op: StepOp.WaitAlternativeAnswer })
        }

        // Post-answer steps will be spliced in by the runner
        // when the answer is received
    }

    // End game
    steps.push({ op: StepOp.GameComplete })

    return steps
}

/**
 * Generate steps after user answers a country question
 *
 * These steps are spliced into the main step array after the wait_pin_placement step.
 *
 * @param correct - Whether the answer was correct
 * @param correctCountryIndex - Index of the correct country
 * @param clickedCountryIndex - Index of the country the user clicked
 * @param revealOnWrong - If false, just shake. If true, show arc and reveal correct.
 * @returns Steps to splice into the main array
 */
export function generateCountryAnswerSteps(
    correct: boolean,
    correctCountryIndex: number,
    clickedCountryIndex: number,
    revealOnWrong: boolean
): Step[] {
    if (correct) {
        return [
            { op: StepOp.AnimateCorrect, countryIndex: correctCountryIndex },
        ]
    }

    // Wrong answer
    if (revealOnWrong) {
        // Mode A: Full reveal sequence
        return [
            { op: StepOp.AnimateWrongReveal, wrongCountryIndex: clickedCountryIndex, correctCountryIndex },
        ]
    }

    // Mode B: Just shake
    return [
        { op: StepOp.AnimateWrongShake, wrongCountryIndex: clickedCountryIndex },
    ]
}

/**
 * Generate steps after user answers an alternative question
 *
 * @param correct - Whether the answer was correct
 * @param questionIndex - Index of the question
 * @returns Steps to splice into the main array
 */
export function generateAlternativeAnswerSteps(
    correct: boolean,
    questionIndex: number
): Step[] {
    return [
        { op: StepOp.ShowResult, questionIndex, wasCorrect: correct },
        { op: StepOp.Pause, duration: 1500 }, // Hold result for 1.5s
    ]
}
