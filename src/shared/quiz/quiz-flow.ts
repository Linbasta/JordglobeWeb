/**
 * Quiz Pipeline - Flow Generation
 *
 * Converts question data into step arrays.
 * Pure functions - no state, no side effects.
 */

import type { Question, Step } from './quiz-types'
import { StepOp } from './quiz-types'

/**
 * Generate the main quiz flow steps
 *
 * Pre-generates steps up to each wait point (where user input is needed).
 * Post-answer steps are generated dynamically by generateCountryAnswerSteps or generateLocationAnswerSteps.
 *
 * @param questions - Array of questions to convert into steps
 * @returns Flat array of steps to execute
 */
export function generateQuizSteps(questions: Question[]): Step[] {
    const steps: Step[] = []

    // Check answer types present
    const hasLocationAlternatives = questions.some(q => q.answer === "location-alternatives")
    const hasCountryQuestions = questions.some(q => q.answer === "country")
    const hasProvinceQuestions = questions.some(q => q.answer === "province")

    // Initial setup — markers, countries, and provinces are mutually exclusive
    if (hasLocationAlternatives) {
        // Show markers as clickable choices, frame them
        steps.push({ op: StepOp.ShowAllLocationMarkers })
        const locationPoints = questions
            .filter(q => q.answer === 'location-alternatives')
            .map(q => ({ lat: q.lat!, lon: q.lng! }))
        steps.push({ op: StepOp.FrameLocations, points: locationPoints, duration: 800 })
    } else if (hasProvinceQuestions) {
        // Province quiz: enter region mode and disable non-game regions
        const firstProvinceQuestion = questions.find(q => q.answer === "province")
        const countryISO2 = firstProvinceQuestion?.countryISO2 || 'US'  // Default to US
        steps.push({ op: StepOp.DisableNonParentCountries, countryISO2 })  // Disable all countries except parent
        steps.push({ op: StepOp.EnterRegionMode, countryISO2 })
        steps.push({ op: StepOp.DisableNonGameCountries })  // Works for provinces too!
    } else if (hasCountryQuestions) {
        // Country quiz: disable non-game regions
        steps.push({ op: StepOp.DisableNonGameCountries })
    }
    // location-guess: no setup needed — user clicks anywhere

    // Generate steps for each question
    for (let i = 0; i < questions.length; i++) {
        const q = questions[i]

        // Show question UI
        steps.push({ op: StepOp.ShowQuestion, questionIndex: i })

        if (q.present === "video") {
            steps.push({ op: StepOp.ShowVideo, questionIndex: i })
        } else if (q.present === "image") {
            steps.push({ op: StepOp.ShowImage, questionIndex: i })
        }

        // All current answer types click the globe
        steps.push({ op: StepOp.WaitPinPlacement })

        if (q.present === "video") {
            steps.push({ op: StepOp.HideVideo })
        } else if (q.present === "image") {
            steps.push({ op: StepOp.HideImage })
        }

        // Post-answer steps will be spliced in by the runner
        // when the answer is received
    }

    // End game
    if (hasProvinceQuestions) {
        steps.push({ op: StepOp.ExitRegionMode })
    }
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
 * Generate steps after user answers a location question
 *
 * @param correct - Whether the answer was correct
 * @param correctMarkerId - ID of the correct marker
 * @param wrongMarkerId - ID of the marker the user clicked (-1 if correct)
 * @param revealOnWrong - If false, just shake. If true, arc + fly to correct.
 * @param wrongLat - Lat of wrong marker
 * @param wrongLng - Lng of wrong marker
 * @param correctLat - Lat of correct marker
 * @param correctLng - Lng of correct marker
 * @returns Steps to splice into the main array
 */
export function generateLocationAnswerSteps(
    correct: boolean,
    correctMarkerId: number,
    wrongMarkerId: number,
    revealOnWrong: boolean,
    wrongLat: number,
    wrongLng: number,
    correctLat: number,
    correctLng: number
): Step[] {
    if (correct) {
        return [
            { op: StepOp.AnimateMarkerCorrect, markerId: correctMarkerId },
        ]
    }

    // Wrong answer
    if (revealOnWrong) {
        return [
            {
                op: StepOp.AnimateMarkerWrongReveal,
                wrongMarkerId,
                correctMarkerId,
                wrongLat, wrongLng,
                correctLat, correctLng
            },
        ]
    }

    return [
        { op: StepOp.AnimateMarkerWrongShake, wrongMarkerId, correctMarkerId },
    ]
}

/**
 * Generate steps after user answers a location-guess question
 *
 * @param guessLat - Latitude of the user's guess
 * @param guessLng - Longitude of the user's guess
 * @param correctLat - Latitude of the correct location
 * @param correctLng - Longitude of the correct location
 * @param distanceKm - Haversine distance in km
 * @returns Steps to splice into the main array
 */
export function generateLocationGuessAnswerSteps(
    guessLat: number,
    guessLng: number,
    correctLat: number,
    correctLng: number,
    distanceKm: number,
    locationName: string
): Step[] {
    return [
        { op: StepOp.RevealLocationGuess, guessLat, guessLng, correctLat, correctLng, distanceKm, locationName },
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
