/**
 * Quiz Pipeline - Runner
 *
 * Module-level state and tick-based execution engine.
 * No classes, no callbacks - just plain functions and explicit state.
 */

import { Vector3 } from '@babylonjs/core/Maths/math.vector'

import type { EarthGlobeAPI, CountryData } from '../../earth-globe/types'
import type { Question, Step, DebugState } from './quiz-types'
import { StepOp } from './quiz-types'
import { generateQuizSteps, generateCountryAnswerSteps, generateLocationAnswerSteps, generateAlternativeAnswerSteps } from './quiz-flow'
import {
    animateCorrect,
    animateWrong,
    animateShowCorrect,
    animateToCleared,
    setDisabledImmediate
} from '../animations/country-animations'
import { frameCountry, cameraShake, getZoomValue } from '../animation/camera-utils'
import { ArcDrawer } from '../visualizers/arc-drawer'
import { latLonToSphere } from '../../earth-globe/geo-math'
import { getConfig } from '../config/global-config'

// ============================================================================
// Module State
// ============================================================================

let steps: Step[] = []
let questions: Question[] = []
let gameCountries: CountryData[] = []
let locationMarkers: Map<number, number> = new Map() // questionIndex -> markerId
let pc = 0                    // Program counter
let stepStartTime = 0
let waiting = false           // True when blocked on user input
let score = 0
let wrongCount = 0
let done = false

// Input buffer (set by caller before tick)
let pendingAnswer: { countryIndex: number; latLon: { lat: number; lng: number } } | { optionIndex: number } | null = null

// Animation tracking
let activeAnimation: Promise<void> | null = null

// Question display tracking - ensures UI has time to update
let questionShown = false

// Config
let revealOnWrong = true
let removeOnWrong = false

// Globe reference and helpers
let globe: EarthGlobeAPI | null = null
let arcDrawer: ArcDrawer | null = null

// ============================================================================
// Public API
// ============================================================================

/**
 * Initialize and start a new quiz
 *
 * @param qs - Questions to ask
 * @param globeAPI - Globe instance
 * @param config - Quiz configuration
 */
export function startQuiz(
    qs: Question[],
    globeAPI: EarthGlobeAPI,
    config?: {
        revealCorrectOnWrong?: boolean
        removeOnWrong?: boolean
    }
) {
    // Reset state
    questions = qs
    gameCountries = []
    locationMarkers = new Map()
    pc = 0
    stepStartTime = 0
    waiting = false
    score = 0
    wrongCount = 0
    done = false
    pendingAnswer = null
    activeAnimation = null

    globe = globeAPI
    arcDrawer = new ArcDrawer(globe.getScene(), globe)

    revealOnWrong = config?.revealCorrectOnWrong ?? true
    removeOnWrong = config?.removeOnWrong ?? false

    // Resolve countries from questions
    for (const q of questions) {
        if (q.type === 'country') {
            const country = globe.getCountryByISO2(q.countryISO2)
            if (country) {
                gameCountries.push(country)
            }
        }
    }

    // Generate steps
    steps = generateQuizSteps(questions)
}

/**
 * Submit a country answer (from pin placement)
 */
export function submitCountryAnswer(countryIndex: number, latLon: { lat: number; lng: number }) {
    if (waiting) {
        pendingAnswer = { countryIndex, latLon }
    }
}

/**
 * Submit an alternative answer (from button click)
 */
export function submitAlternativeAnswer(optionIndex: number) {
    if (waiting) {
        pendingAnswer = { optionIndex }
    }
}

/**
 * Main tick function - call every frame
 *
 * @param now - Current time in milliseconds
 * @returns true if quiz is still active, false if done
 */
export function tickQuiz(now: number): boolean {
    if (!globe || done || pc >= steps.length) return false

    // Initialize step start time on first tick
    if (stepStartTime === 0) {
        stepStartTime = now
    }

    const step = steps[pc]
    const elapsed = now - stepStartTime

    // Execute current step
    switch (step.op) {
        case StepOp.DisableNonGameCountries: {
            const allCountries = globe.getAllCountries()
            const gameIndices = new Set(gameCountries.map(c => c.index))

            for (const country of allCountries) {
                if (!gameIndices.has(country.index)) {
                    setDisabledImmediate(globe, country.index)
                }
            }

            advance(now)
            break
        }

        case StepOp.ShowAllLocationMarkers: {
            console.log('[Quiz Runner] Showing all location markers')

            // Create markers for all location questions
            questions.forEach((q, index) => {
                if (q.type === 'location') {
                    const markerId = globe.acquireMarker(q.lat, q.lng)
                    if (markerId !== -1) {
                        locationMarkers.set(index, markerId)
                        console.log(`  Marker ${markerId} for question ${index}: ${q.prompt}`)
                    }
                }
            })

            advance(now)
            break
        }

        case StepOp.ShowQuestion: {
            // Question display is handled by UI reading getCurrentStep()
            // Stay on this step for at least one frame so UI can update
            if (!questionShown) {
                questionShown = true
                console.log(`[Quiz Runner] Showing question ${step.questionIndex}, waiting one frame for UI`)
            } else {
                // UI has had a chance to update, now advance
                questionShown = false
                advance(now)
            }
            break
        }

        case StepOp.WaitPinPlacement: {
            waiting = true

            if (pendingAnswer && 'countryIndex' in pendingAnswer) {
                waiting = false

                // Find the current question
                const qi = findCurrentQuestionIndex()
                const q = questions[qi]

                if (q.type === 'country') {
                    const correctCountry = globe.getCountryByISO2(q.countryISO2)
                    if (!correctCountry) break

                    const isCorrect = pendingAnswer.countryIndex === correctCountry.index

                    if (isCorrect) {
                        score++
                    } else {
                        wrongCount++
                    }

                    // Generate post-answer steps
                    const postSteps = generateCountryAnswerSteps(
                        isCorrect,
                        correctCountry.index,
                        pendingAnswer.countryIndex,
                        revealOnWrong
                    )

                    console.log(`[Quiz Runner] Answer ${isCorrect ? 'correct' : 'wrong'}, splicing ${postSteps.length} steps at position ${pc + 1}`)

                    // Splice them in after current step
                    steps.splice(pc + 1, 0, ...postSteps)
                } else if (q.type === 'location') {
                    // Distance-based hit detection with zoom-dependent radius
                    const clickLatLon = pendingAnswer.latLon
                    const clickPoint = latLonToSphere(clickLatLon.lat, clickLatLon.lon, 0)
                    const targetPoint = latLonToSphere(q.lat, q.lng, 0)

                    const distSqr = Vector3.DistanceSquared(clickPoint, targetPoint)

                    // Get zoom-dependent hit radius from config
                    const camera = globe.getCamera()
                    const config = getConfig()
                    const hr = config.zoom.markerHitRadius
                    const hitRadius = getZoomValue(camera, hr.closeValue, hr.farValue, hr.easing)
                    const hitRadiusSqr = hitRadius * hitRadius

                    const isCorrect = distSqr <= hitRadiusSqr

                    console.log(`[Quiz Runner] Location hit test: dist=${Math.sqrt(distSqr).toFixed(4)}, hitRadius=${hitRadius.toFixed(4)}, correct=${isCorrect}`)

                    if (isCorrect) {
                        score++
                    } else {
                        wrongCount++
                    }

                    // Get marker ID for this question
                    const markerId = locationMarkers.get(qi) ?? -1

                    // Generate post-answer steps
                    const postSteps = generateLocationAnswerSteps(isCorrect, markerId)

                    console.log(`[Quiz Runner] Location answer ${isCorrect ? 'correct' : 'wrong'}, splicing ${postSteps.length} steps`)

                    // Splice them in after current step
                    steps.splice(pc + 1, 0, ...postSteps)
                }

                pendingAnswer = null
                advance(now)
            }
            break
        }

        case StepOp.WaitAlternativeAnswer: {
            waiting = true

            if (pendingAnswer && 'optionIndex' in pendingAnswer) {
                waiting = false

                const qi = findCurrentQuestionIndex()
                const q = questions[qi]

                if (q.type === 'alternative') {
                    const isCorrect = pendingAnswer.optionIndex === q.correctIndex

                    if (isCorrect) {
                        score++
                    } else {
                        wrongCount++
                    }

                    // Generate post-answer steps
                    const postSteps = generateAlternativeAnswerSteps(isCorrect, qi)
                    steps.splice(pc + 1, 0, ...postSteps)
                }

                pendingAnswer = null
                advance(now)
            }
            break
        }

        case StepOp.AnimateCorrect: {
            if (!activeAnimation) {
                console.log(`[Quiz Runner] Starting animate_correct for country ${step.countryIndex}`)
                globe.clearCountryOutline()
                activeAnimation = animateCorrect(globe, step.countryIndex)
                activeAnimation.then(() => {
                    console.log(`[Quiz Runner] animate_correct completed`)
                    activeAnimation = null
                    advance(performance.now())
                })
            }
            break
        }

        case StepOp.AnimateMarkerCorrect: {
            console.log(`[Quiz Runner] Animating marker ${step.markerId} correct`)
            // Scale up the marker
            globe.setMarkerScale(step.markerId, 2.0)
            advance(now)
            break
        }

        case StepOp.AnimateWrongShake: {
            if (!activeAnimation) {
                console.log(`[Quiz Runner] Starting animate_wrong_shake`)
                globe.clearCountryOutline()
                activeAnimation = Promise.all([
                    cameraShake(globe.getCamera(), 300, 0.02),
                    animateWrong(globe, step.wrongCountryIndex, removeOnWrong)
                ]).then(() => {})

                activeAnimation.then(() => {
                    console.log(`[Quiz Runner] animate_wrong_shake completed`)
                    activeAnimation = null
                    advance(performance.now())
                })
            }
            break
        }

        case StepOp.AnimateWrongReveal: {
            if (!activeAnimation) {
                console.log(`[Quiz Runner] Starting animate_wrong_reveal`)
                activeAnimation = handleWrongReveal(step.wrongCountryIndex, step.correctCountryIndex)
                activeAnimation.then(() => {
                    console.log(`[Quiz Runner] animate_wrong_reveal completed`)
                    activeAnimation = null
                    advance(performance.now())
                })
            }
            break
        }

        case StepOp.ShowResult: {
            // Result display handled by UI reading getCurrentStep()
            advance(now)
            break
        }

        case StepOp.Pause: {
            if (elapsed >= step.duration) {
                advance(now)
            }
            break
        }

        case StepOp.GameComplete: {
            done = true
            break
        }

        case StepOp.HighlightCountry: {
            globe.showCountryOutline(step.countryIndex)
            advance(now)
            break
        }

        case StepOp.ClearHighlight: {
            globe.clearCountryOutline()
            advance(now)
            break
        }

        case StepOp.AnimateCamera: {
            // TODO: implement camera animation step
            advance(now)
            break
        }
    }

    return true
}

// ============================================================================
// Getters
// ============================================================================

export function getScore() { return score }
export function getWrongCount() { return wrongCount }
export function getTotal() { return questions.length }
export function isDone() { return done }
export function isWaiting() { return waiting }
export function getCurrentStep() { return pc < steps.length ? steps[pc] : null }
export function getQuestion(index: number) { return questions[index] }
export function getCurrentQuestionIndex() { return findCurrentQuestionIndex() }

// ============================================================================
// Debug API (Approach A - Fire-and-forget)
// ============================================================================

export function getDebugState(): DebugState {
    return {
        steps: [...steps],
        pc,
        questions: [...questions],
        score,
        waiting,
        stepStartTime,
        pendingAnswer
    }
}

export function debugJumpToStep(index: number) {
    if (index >= 0 && index < steps.length) {
        pc = index
        stepStartTime = performance.now()
        waiting = false
        pendingAnswer = null
        activeAnimation = null
    }
}

export function debugStepForward() {
    if (pc < steps.length - 1) {
        pc++
        stepStartTime = performance.now()
        waiting = false
        activeAnimation = null
    }
}

export function debugStepBackward() {
    if (pc > 0) {
        pc--
        stepStartTime = performance.now()
        waiting = false
        activeAnimation = null
    }
}

// ============================================================================
// Helpers
// ============================================================================

function advance(now: number) {
    pc++
    stepStartTime = now
    const nextStep = pc < steps.length ? steps[pc] : null
    if (nextStep) {
        console.log(`[Quiz Runner] Advanced to step ${pc}: ${nextStep.op}`)
    }
}

function findCurrentQuestionIndex(): number {
    // Find the most recent show_question step
    for (let i = pc; i >= 0; i--) {
        const s = steps[i]
        if (s.op === 'show_question') {
            return s.questionIndex
        }
    }
    return 0
}

/**
 * Handle wrong answer with reveal choreography
 * (Arc drawing, camera fly, reveal, hold, clear)
 */
async function handleWrongReveal(wrongCountryIndex: number, correctCountryIndex: number): Promise<void> {
    if (!globe || !arcDrawer) return

    // 1. Clear outline and sink wrong country
    globe.clearCountryOutline()
    await animateWrong(globe, wrongCountryIndex, removeOnWrong)

    // 2. Draw arc from wrong to correct
    const wrongCenter = getCountryCenter(wrongCountryIndex)
    const correctCenter = getCountryCenter(correctCountryIndex)

    const arcId = arcDrawer.addArc(
        wrongCenter.lat,
        wrongCenter.lon,
        correctCenter.lat,
        correctCenter.lon,
        '#ffffff',
        0.3,
        0
    )

    // 3. Animate arc and camera in parallel
    const arcAnimationPromise = arcDrawer.animateArc(arcId, 500)

    const allPolygons = globe.getCountryPicker().getAllPolygons()
    const correctPolygons = allPolygons.filter(p => p.countryIndex === correctCountryIndex)

    const cameraFlyPromise = frameCountry(
        globe.getCamera(),
        globe,
        correctPolygons,
        '', // Country name not needed
        800,
        0.8,
        undefined,
        undefined,
        { overrideAltitude: 0.5 }
    )

    await Promise.all([arcAnimationPromise, cameraFlyPromise])

    // 4. Remove arc
    arcDrawer.removeArc(arcId)

    // 5. Show and elevate correct country
    globe.showCountryOutline(correctCountryIndex)
    await animateShowCorrect(globe, correctCountryIndex)

    // 6. Hold
    await new Promise(r => setTimeout(r, 1500))

    // 7. Clear and sink
    globe.clearCountryOutline()
    await animateToCleared(globe, correctCountryIndex)
}

/**
 * Calculate spherical center of a country
 */
function getCountryCenter(countryIndex: number): { lat: number; lon: number } {
    if (!globe) return { lat: 0, lon: 0 }

    const allPolygons = globe.getCountryPicker().getAllPolygons()
    const countryPolygons = allPolygons.filter(p => p.countryIndex === countryIndex)

    if (countryPolygons.length === 0) {
        return { lat: 0, lon: 0 }
    }

    // Collect all points
    const allPoints: Array<{ lat: number; lon: number }> = []
    for (const polygon of countryPolygons) {
        allPoints.push(...polygon.points)
    }

    if (allPoints.length === 0) {
        return { lat: 0, lon: 0 }
    }

    // Average in 3D Cartesian space
    let sumX = 0, sumY = 0, sumZ = 0

    for (const point of allPoints) {
        const latRad = point.lat * (Math.PI / 180)
        const lonRad = point.lon * (Math.PI / 180)

        const x = Math.cos(latRad) * Math.cos(lonRad)
        const y = Math.sin(latRad)
        const z = Math.cos(latRad) * Math.sin(lonRad)

        sumX += x
        sumY += y
        sumZ += z
    }

    const avgX = sumX / allPoints.length
    const avgY = sumY / allPoints.length
    const avgZ = sumZ / allPoints.length

    // Normalize
    const length = Math.sqrt(avgX * avgX + avgY * avgY + avgZ * avgZ)
    const normalizedX = avgX / length
    const normalizedY = avgY / length
    const normalizedZ = avgZ / length

    // Convert back to lat/lon
    const lat = Math.asin(normalizedY) * (180 / Math.PI)
    const lon = Math.atan2(normalizedZ, normalizedX) * (180 / Math.PI)

    return { lat, lon }
}
