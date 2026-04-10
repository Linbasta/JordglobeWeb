/**
 * Quiz Pipeline - Runner
 *
 * Module-level state and tick-based execution engine.
 * No classes, no callbacks - just plain functions and explicit state.
 */

import { Vector3, Matrix } from '@babylonjs/core/Maths/math.vector'

import type { EarthGlobeAPI, RegionData } from '../../earth-globe/types'
import type { Question, Step, DebugState } from './quiz-types'
import { StepOp } from './quiz-types'
import { generateQuizSteps, generateCountryAnswerSteps, generateLocationAnswerSteps, generateAlternativeAnswerSteps, generateLocationGuessAnswerSteps } from './quiz-flow'
import {
    animateCorrectRegion,
    animateWrongRegion,
    animateShowCorrectRegion,
    animateToClearedAfterRevealRegion,
    setRegionDisabledImmediate,
    animateDisableWave,
    // Legacy exports for backward compatibility
    animateCorrect,
    animateWrong,
    animateShowCorrect,
    animateToClearedAfterReveal,
    setDisabledImmediate
} from '../animation/region-animations'
import { frameCountry, frameLocations, cameraShake, getZoomValue, animateToLocation, type ViewportRegion } from '../animation/camera-utils'
import { ArcDrawer } from '../visualizers/arc-drawer'
import { latLonToSphere, haversineDistance } from '../../earth-globe/geo-math'
import { zoom, STATE_DISABLED, STATE_CLEARED } from '../../earth-globe'
import { ALTITUDE_NORMAL, ALTITUDE_CLEARED, ALTITUDE_WRONG_POP, ALTITUDE_SHOW_CORRECT } from '../../earth-globe/constants'
import { burstAtPosition, wrongBurstAtPosition } from '../effects/marker-particles'
import { showVideoOverlay, suspendVideoOverlay, expandVideoOverlay } from '../ui/video-overlay'
import { showImageOverlay, hideImageOverlay } from '../ui/image-overlay'
import { showTextCardOverlay, hideTextCardOverlay } from '../ui/text-card-overlay'
import { showDistanceOverlay, hideDistanceOverlay } from '../ui/distance-overlay'
import { showCorrectFeedback, showWrongFeedback } from '../ui/answer-feedback-overlay'

// ============================================================================
// Module State
// ============================================================================

let steps: Step[] = []
let questions: Question[] = []
let gameCountries: RegionData[] = []
let gameProvinces: RegionData[] = []  // Provinces when in region mode
let locationMarkers: Map<number, number> = new Map() // questionIndex -> markerId
let pc = 0                    // Program counter
let stepStartTime = 0
let waiting = false           // True when blocked on user input
let score = 0
let wrongCount = 0
let results: boolean[] = []   // per-question correct/wrong
let distances: number[] = []  // km per question (location-guess)
let done = false

// Input buffer (set by caller before tick)
let pendingAnswer: { countryIndex: number; latLon: { lat: number; lng: number } } | { optionIndex: number } | null = null

// Hover tracking for location markers
let hoveredMarkerId = -1

// Animation tracking
let activeAnimation: Promise<void> | null = null

// Question display tracking - ensures UI has time to update
let questionShown = false

// Config
let revealOnWrong = true
let removeOnWrong = false
let onRevealCorrectCb: ((correctCountryIndex: number) => void) | null = null
let onHideRevealCb: (() => void) | null = null
let onAnswerCb: ((data: {
    questionIndex: number;
    questionId: string;
    correctId: string;
    answerId: string;
    lat: number;
    lng: number;
    correct: boolean;
    distanceKm?: number;
}) => void) | null = null

// Globe reference and helpers
let globe: EarthGlobeAPI | null = null
let arcDrawer: ArcDrawer | null = null

// Last answer screen position for feedback overlay
let lastAnswerLatLon: { lat: number; lng: number } | null = null

function projectLatLonToScreen(lat: number, lng: number): { x: number; y: number } {
    if (!globe) return { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const worldPos = latLonToSphere(lat, lng, 0)
    const scene = globe.getScene()
    const camera = globe.getCamera()
    const engine = scene.getEngine()
    const viewport = camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight())
    const screenPos = Vector3.Project(worldPos, Matrix.Identity(), scene.getTransformMatrix(), viewport)
    return { x: screenPos.x, y: screenPos.y }
}

function getAnswerScreenPos(): { x: number; y: number } {
    if (lastAnswerLatLon) return projectLatLonToScreen(lastAnswerLatLon.lat, lastAnswerLatLon.lng)
    return { x: window.innerWidth / 2, y: window.innerHeight / 2 }
}

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
        onRevealCorrect?: (correctCountryIndex: number) => void
        onHideReveal?: () => void
        onAnswer?: (data: {
            questionIndex: number;
            questionId: string;
            correctId: string;
            answerId: string;
            lat: number;
            lng: number;
            correct: boolean;
            distanceKm?: number;
        }) => void
    }
) {
    // Reset state
    questions = qs
    gameCountries = []
    gameProvinces = []
    locationMarkers = new Map()
    pc = 0
    stepStartTime = 0
    waiting = false
    score = 0
    wrongCount = 0
    results = []
    distances = []
    done = false
    pendingAnswer = null
    lastAnswerLatLon = null
    hoveredMarkerId = -1
    activeAnimation = null

    globe = globeAPI
    arcDrawer = new ArcDrawer(globe.getScene(), globe)

    revealOnWrong = config?.revealCorrectOnWrong ?? true
    removeOnWrong = config?.removeOnWrong ?? false
    onRevealCorrectCb = config?.onRevealCorrect ?? null
    onHideRevealCb = config?.onHideReveal ?? null
    onAnswerCb = config?.onAnswer ?? null

    // Resolve countries from questions
    for (const q of questions) {
        if (q.answer === 'country') {
            const country = globe.getCountryByISO2(q.countryISO2!)
            if (country) {
                gameCountries.push(country)
            }
        }
    }

    // Generate steps
    steps = generateQuizSteps(questions)

    // Frame camera to show all game countries
    if (gameCountries.length > 0) {
        const allPolygons = globe.getCountryPicker().getAllPolygons()
        const gamePolygons = allPolygons.filter(p =>
            gameCountries.some(c => c.index === p.regionIndex)
        )

        // Collect all perimeter points, sampled
        const allPoints: { lat: number; lon: number }[] = []
        for (const polygon of gamePolygons) {
            allPoints.push(...polygon.points)
        }
        const MAX_POINTS = 500
        const points = allPoints.length > MAX_POINTS
            ? allPoints.filter((_, i) => i % Math.ceil(allPoints.length / MAX_POINTS) === 0)
            : allPoints

        // For non-animated disable, insert FrameLocations as a separate step
        // For animated disable, framing runs in parallel inside the handler
        const insertIndex = steps.findIndex(s => s.op === StepOp.DisableNonGameCountries)
        if (insertIndex !== -1) {
            steps.splice(insertIndex + 1, 0, {
                op: StepOp.FrameLocations, points, duration: 800
            })
        }
    }

    // Frame camera for province quizzes - show the parent country
    const provinceQuestions = questions.filter(q => q.answer === 'province')
    if (provinceQuestions.length > 0 && gameCountries.length === 0) {
        // Get parent country from first province question
        const parentISO2 = provinceQuestions[0].countryISO2
        if (parentISO2) {
            const parentCountry = globe.getCountryByISO2(parentISO2)
            if (parentCountry) {
                // Get all polygons for the parent country
                const allPolygons = globe.getCountryPicker().getAllPolygons()
                const parentPolygons = allPolygons.filter(p => p.regionIndex === parentCountry.index)

                // Collect all perimeter points, sampled
                const allPoints: { lat: number; lon: number }[] = []
                for (const polygon of parentPolygons) {
                    allPoints.push(...polygon.points)
                }
                const MAX_POINTS = 500
                const points = allPoints.length > MAX_POINTS
                    ? allPoints.filter((_, i) => i % Math.ceil(allPoints.length / MAX_POINTS) === 0)
                    : allPoints

                const insertIndex = steps.findIndex(s =>
                    s.op === StepOp.DisableNonGameCountries || s.op === StepOp.AnimateDisableNonGameCountries
                )
                if (insertIndex !== -1) {
                    steps.splice(insertIndex + 1, 0, {
                        op: StepOp.FrameLocations, points, duration: 800
                    })
                }
            }
        }
    }
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
            // Works for both countries and provinces via active region API
            const allRegions = globe.getAllActiveRegions()
            const controller = globe.getActiveController()

            // Extract game region IDs/indices from questions
            if (globe.isInRegionMode()) {
                // Province mode: build composite IDs (e.g., "IT-10") and find matching provinces
                const provinceQuestions = questions.filter(q => q.answer === 'province')
                const gameProvinceIds = new Set(
                    provinceQuestions.map(q => `${q.countryISO2}-${q.provinceId}`)
                )

                for (const region of allRegions) {
                    if (!gameProvinceIds.has(region.id)) {
                        setRegionDisabledImmediate(globe, region.index)
                        // Hide marker for disabled small regions
                        if (controller.isSmallRegion(region.index)) {
                            controller.hideSmallRegionMarker(region.index)
                        }
                    }
                }

                // After disabling non-game provinces, show markers for enabled small provinces
                controller.showEnabledSmallRegionMarkers()
            } else {
                // Country mode: use country indices from gameCountries
                const gameIndices = new Set(gameCountries.map(c => c.index))
                for (const region of allRegions) {
                    if (!gameIndices.has(region.index)) {
                        setRegionDisabledImmediate(globe, region.index)
                        // Hide marker for disabled small regions
                        if (controller.isSmallRegion(region.index)) {
                            controller.hideSmallRegionMarker(region.index)
                        }
                    }
                }
            }

            // After disabling non-game countries, show markers for enabled small countries
            // This ensures small game countries (Malta, Vatican, etc.) show their markers
            controller.showEnabledSmallRegionMarkers()

            // Show islands frames only for game countries
            // Build set of game country ISO2 codes
            const gameISO2Codes = new Set(gameCountries.map(c => c.id))
            globe.showIslandsFramesForCountries(gameISO2Codes)

            advance(now)
            break
        }

        case StepOp.AnimateDisableNonGameCountries: {
            // Animated version: countries sink to disabled with longitude-based wave
            if (!activeAnimation) {
                const allRegions = globe.getAllActiveRegions()
                const controller = globe.getActiveController()
                const gameIndices = new Set(gameCountries.map(c => c.index))

                // Collect regions to disable with their longitude
                const toDisable: { index: number; lon: number }[] = []
                for (const region of allRegions) {
                    if (!gameIndices.has(region.index)) {
                        // Set disabled state immediately so marker logic works
                        controller.setState(region.index, STATE_DISABLED)
                        if (controller.isSmallRegion(region.index)) {
                            controller.hideSmallRegionMarker(region.index)
                        }
                        // Get longitude from centroid (atan2(z, x) in radians → degrees)
                        const c = region.centroid
                        const lon = c ? Math.atan2(c.z, c.x) * (180 / Math.PI) : 0
                        toDisable.push({ index: region.index, lon })
                    }
                }

                // Sort by longitude so the wave sweeps west → east
                toDisable.sort((a, b) => a.lon - b.lon)

                // Build delay array: 20 batches with 15ms between each, randomly assigned
                const NUM_BATCHES = 20
                const DELAY_PER_BATCH_MS = 15
                const indices: number[] = []
                const delays = new Float32Array(toDisable.length)

                // Shuffle into random order
                for (let i = toDisable.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [toDisable[i], toDisable[j]] = [toDisable[j], toDisable[i]]
                }

                for (let i = 0; i < toDisable.length; i++) {
                    indices.push(toDisable[i].index)
                    const batch = Math.floor(i / (toDisable.length / NUM_BATCHES))
                    delays[i] = Math.min(batch, NUM_BATCHES - 1) * DELAY_PER_BATCH_MS
                }

                // Show markers for enabled small game countries (after states are set)
                controller.showEnabledSmallRegionMarkers()

                // Show island frames only for game countries
                const gameISO2Codes = new Set(gameCountries.map(c => c.id))
                globe.showIslandsFramesForCountries(gameISO2Codes)

                // Frame camera to game countries in parallel with wave animation
                const allPolygons = globe.getCountryPicker().getAllPolygons()
                const gamePolygons = allPolygons.filter(p =>
                    gameCountries.some(c => c.index === p.regionIndex)
                )
                const allPoints: { lat: number; lon: number }[] = []
                for (const polygon of gamePolygons) {
                    allPoints.push(...polygon.points)
                }
                const MAX_POINTS = 500
                const framingPoints = allPoints.length > MAX_POINTS
                    ? allPoints.filter((_, i) => i % Math.ceil(allPoints.length / MAX_POINTS) === 0)
                    : allPoints
                const vp = getQuizViewportRegion()

                activeAnimation = Promise.all([
                    animateDisableWave(globe, indices, delays),
                    frameLocations(globe.getCamera(), framingPoints, 800, 0.8, vp),
                ]).then(() => {
                    activeAnimation = null
                    advance(performance.now())
                })
            }
            break
        }

        case StepOp.DisableNonParentCountries: {
            // Disable all countries except the parent country (for province quizzes)
            if (!globe) {
                advance(now)
                break
            }

            const parentCountry = globe.getCountryByISO2(step.countryISO2)
            if (!parentCountry) {
                console.warn(`DisableNonParentCountries: country not found: ${step.countryISO2}`)
                advance(now)
                break
            }

            // Get all countries and disable those that aren't the parent
            const allCountries = globe.getCountryController().getAllRegions()
            const controller = globe.getCountryController()

            for (const country of allCountries) {
                if (country.index !== parentCountry.index) {
                    setRegionDisabledImmediate(globe, country.index)
                    // Hide marker for disabled small countries
                    if (controller.isSmallRegion(country.index)) {
                        controller.hideSmallRegionMarker(country.index)
                    }
                }
            }

            advance(now)
            break
        }

        case StepOp.EnterRegionMode: {
            // Wait for provinces to load, then enter region mode
            if (!activeAnimation && globe) {
                activeAnimation = globe.waitForProvincesToLoad()
                    .then(async () => {
                        if (!globe) return
                        await globe.enterRegionMode(step.countryISO2)
                        activeAnimation = null
                        advance(performance.now())
                    })
            }
            break
        }

        case StepOp.ExitRegionMode: {
            // Exit region mode
            globe.exitRegionMode()
            advance(now)
            break
        }

        case StepOp.ShowAllLocationMarkers: {
            // Create markers for location-alternatives questions
            if (globe) {
                const g = globe
                questions.forEach((q, index) => {
                    if (q.answer === 'location-alternatives') {
                        const markerId = g.acquireMarker(q.lat!, q.lng!)
                        if (markerId !== -1) {
                            locationMarkers.set(index, markerId)
                        }
                    }
                })
            }

            // Hide small country markers so they don't clutter the location quiz
            globe.getCountryController().hideAllSmallRegionMarkers()

            advance(now)
            break
        }

        case StepOp.FrameLocations: {
            if (!activeAnimation) {
                const vp = getQuizViewportRegion()
                activeAnimation = frameLocations(globe.getCamera(), step.points, step.duration, 0.8, vp)
                    .then(() => {
                        activeAnimation = null
                        advance(performance.now())
                    })
            }
            break
        }

        case StepOp.ShowVideo: {
            const q = questions[step.questionIndex]
            if (q.present === 'video') {
                // Support both old hideTitle and new hideTop/hideBottom
                const hideTop = q.hideTop ?? q.hideTitle
                const hideBottom = q.hideBottom ?? q.hideTitle
                showVideoOverlay({
                    youtubeId: q.youtubeId!,
                    prompt: q.prompt,
                    startTime: q.startTime,
                    endTime: q.endTime,
                    hideTop,
                    hideBottom,
                })
                // Ensure video is expanded when showing new question
                expandVideoOverlay()
            }
            advance(now)
            break
        }

        case StepOp.HideVideo: {
            suspendVideoOverlay()
            advance(now)
            break
        }

        case StepOp.ShowImage: {
            const q = questions[step.questionIndex]
            if (q.present === 'image' && q.imageUrl) {
                showImageOverlay(q.imageUrl, q.prompt, q.imageFrame ?? 'default', q.imageCredit)
            }
            advance(now)
            break
        }

        case StepOp.HideImage: {
            hideImageOverlay()
            advance(now)
            break
        }

        case StepOp.ShowTextCard: {
            const q = questions[step.questionIndex]
            if (q.present === 'textcard') {
                showTextCardOverlay(q.prompt)
            }
            advance(now)
            break
        }

        case StepOp.HideTextCard: {
            hideTextCardOverlay()
            advance(now)
            break
        }

        case StepOp.ShowQuestion: {
            // Question display is handled by UI reading getCurrentStep()
            // Stay on this step for at least one frame so UI can update
            if (!questionShown) {
                questionShown = true
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
                const qi = findCurrentQuestionIndex()
                const q = questions[qi]
                lastAnswerLatLon = pendingAnswer.latLon

                if (q.answer === 'country') {
                    // Ignore ocean clicks (no country selected)
                    if (pendingAnswer.countryIndex === -1) {
                        pendingAnswer = null
                        break
                    }
                    waiting = false
                    const correctCountry = globe.getCountryByISO2(q.countryISO2!)
                    if (!correctCountry) break
                    const isCorrect = pendingAnswer.countryIndex === correctCountry.index
                    results.push(isCorrect)
                    if (isCorrect) { score++ } else { wrongCount++ }
                    // Fire answer callback
                    const answeredCountry = globe.getCountryByIndex(pendingAnswer.countryIndex)
                    onAnswerCb?.({
                        questionIndex: qi,
                        questionId: q.countryISO2!,
                        correctId: q.countryISO2!,
                        answerId: answeredCountry?.id ?? '',
                        lat: pendingAnswer.latLon.lat,
                        lng: pendingAnswer.latLon.lng,
                        correct: isCorrect,
                    })
                    const postSteps = generateCountryAnswerSteps(isCorrect, correctCountry.index, pendingAnswer.countryIndex, revealOnWrong)
                    steps.splice(pc + 1, 0, ...postSteps)
                    pendingAnswer = null
                    advance(now)

                } else if (q.answer === 'province') {
                    // Ignore ocean clicks (no province selected)
                    if (pendingAnswer.countryIndex === -1) {
                        pendingAnswer = null
                        break
                    }

                    // Capture answer data before any potential type narrowing loss
                    const clickedProvinceIndex = pendingAnswer.countryIndex
                    const clickLatLon = pendingAnswer.latLon

                    // Province question - find correct province by composite ID (e.g., "IT-10")
                    const allProvinces = globe.getAllActiveRegions()
                    const provinceId = `${q.countryISO2}-${q.provinceId}`
                    const correctProvince = allProvinces.find(p => p.id === provinceId)
                    if (!correctProvince) {
                        console.warn(`[Quiz] Province ${provinceId} not found!`)
                        break
                    }

                    // Check if clicked province is correct
                    const isCorrect = clickedProvinceIndex === correctProvince.index
                    results.push(isCorrect)
                    if (isCorrect) { score++ } else { wrongCount++ }
                    // Fire answer callback
                    const answeredProvince = allProvinces.find(p => p.index === clickedProvinceIndex)
                    onAnswerCb?.({
                        questionIndex: qi,
                        questionId: provinceId,
                        correctId: provinceId,
                        answerId: answeredProvince?.id ?? '',
                        lat: clickLatLon.lat,
                        lng: clickLatLon.lng,
                        correct: isCorrect,
                    })

                    // Generate answer steps (reuse country logic - works for provinces too!)
                    waiting = false
                    const postSteps = generateCountryAnswerSteps(isCorrect, correctProvince.index, clickedProvinceIndex, revealOnWrong)
                    steps.splice(pc + 1, 0, ...postSteps)
                    pendingAnswer = null
                    advance(now)

                } else if (q.answer === 'location-guess') {
                    // Free-form click — accept any click, measure distance
                    const clickLatLon = pendingAnswer.latLon
                    const distKm = haversineDistance(
                        clickLatLon.lat, clickLatLon.lng,
                        q.lat!, q.lng!
                    )
                    distances.push(distKm)
                    // Fire answer callback (location-guess has no correct/wrong, just distance)
                    const locationId = q.locationName ?? q.prompt
                    onAnswerCb?.({
                        questionIndex: qi,
                        questionId: locationId,
                        correctId: locationId,
                        answerId: locationId,  // Same as correct - user clicked to place
                        lat: clickLatLon.lat,
                        lng: clickLatLon.lng,
                        correct: true,  // Location-guess doesn't have wrong answers
                        distanceKm: distKm,
                    })
                    waiting = false
                    const postSteps = generateLocationGuessAnswerSteps(
                        clickLatLon.lat, clickLatLon.lng,
                        q.lat!, q.lng!,
                        distKm,
                        q.locationName ?? q.prompt
                    )
                    steps.splice(pc + 1, 0, ...postSteps)
                    pendingAnswer = null
                    advance(now)

                } else if (q.answer === 'location-alternatives') {
                    // Marker-based hit detection
                    const clickLatLon = pendingAnswer.latLon
                    const clickPoint = latLonToSphere(clickLatLon.lat, clickLatLon.lng, 0)
                    const camera = globe.getCamera()
                    const hitRadius = getZoomValue(camera, zoom.markerHitRadiusClose, zoom.markerHitRadiusFar)
                    const hitRadiusSqr = hitRadius * hitRadius

                    // Check ALL location markers for hit (find closest within radius)
                    let hitQuestionIndex = -1
                    let hitMarkerId = -1
                    let closestDistSqr = Infinity
                    for (const [questionIndex, markerId] of locationMarkers) {
                        const mq = questions[questionIndex]
                        if (mq.answer !== 'location-alternatives') continue
                        const markerPoint = latLonToSphere(mq.lat!, mq.lng!, 0)
                        const distSqr = Vector3.DistanceSquared(clickPoint, markerPoint)
                        if (distSqr <= hitRadiusSqr && distSqr < closestDistSqr) {
                            closestDistSqr = distSqr
                            hitQuestionIndex = questionIndex
                            hitMarkerId = markerId
                        }
                    }

                    if (hitMarkerId === -1) {
                        // No marker hit - stay in navigation state
                        pendingAnswer = null
                    } else {
                        waiting = false
                        clearLocationHover()
                        globe.setMarkerScale(hitMarkerId, 2.0)
                        const isCorrect = hitQuestionIndex === qi
                        results.push(isCorrect)
                        if (isCorrect) { score++ } else { wrongCount++ }
                        // Fire answer callback
                        const hitQ = questions[hitQuestionIndex]
                        const correctLocationId = q.locationName ?? q.prompt
                        const answeredLocationId = hitQ.locationName ?? hitQ.prompt
                        onAnswerCb?.({
                            questionIndex: qi,
                            questionId: correctLocationId,
                            correctId: correctLocationId,
                            answerId: answeredLocationId,
                            lat: clickLatLon.lat,
                            lng: clickLatLon.lng,
                            correct: isCorrect,
                        })
                        const correctMarkerId = locationMarkers.get(qi) ?? -1
                        const correctQ = questions[qi]
                        const wrongLat = hitQ.answer === 'location-alternatives' ? hitQ.lat! : 0
                        const wrongLng = hitQ.answer === 'location-alternatives' ? hitQ.lng! : 0
                        const correctLat = correctQ.answer === 'location-alternatives' ? correctQ.lat! : 0
                        const correctLng = correctQ.answer === 'location-alternatives' ? correctQ.lng! : 0
                        const postSteps = generateLocationAnswerSteps(
                            isCorrect, correctMarkerId, hitMarkerId, revealOnWrong,
                            wrongLat, wrongLng, correctLat, correctLng
                        )
                        steps.splice(pc + 1, 0, ...postSteps)
                        pendingAnswer = null
                        advance(now)
                    }
                }
            }
            break
        }

        case StepOp.AnimateCorrect: {
            if (!activeAnimation) {
                globe.clearCountryOutline()
                { const sp = getAnswerScreenPos(); showCorrectFeedback(sp.x, sp.y) }
                const country = globe.getCountryByIndex(step.countryIndex)
                if (country && globe.countryHasIslandsFrame(country.id)) {
                    globe.disableIslandsFrameForCountry(country.id)
                }
                const ctrl = globe.getActiveController()
                if (ctrl.isSmallRegion(step.countryIndex)) {
                    ctrl.hideSmallRegionMarker(step.countryIndex)
                }
                activeAnimation = animateCorrect(globe, step.countryIndex)
                activeAnimation.then(() => {
                    activeAnimation = null
                    advance(performance.now())
                })
            }
            break
        }

        case StepOp.AnimateMarkerCorrect: {
            { const sp = getAnswerScreenPos(); showCorrectFeedback(sp.x, sp.y) }
            const pos = globe.getMarkerPosition(step.markerId)
            if (pos) {
                globe.hideMarker(step.markerId)
                burstAtPosition(globe.getScene(), pos)
            }
            advance(now)
            break
        }

        case StepOp.AnimateMarkerWrongShake: {
            if (!activeAnimation && globe) {
                { const sp = getAnswerScreenPos(); showWrongFeedback(sp.x, sp.y) }
                // Red burst (fire-and-forget) + camera shake
                const wrongPos = globe.getMarkerPosition(step.wrongMarkerId)
                if (wrongPos) {
                    wrongBurstAtPosition(globe.getScene(), wrongPos)
                }
                activeAnimation = cameraShake(globe.getCamera(), 300, 0.02)
                activeAnimation.then(() => {
                    if (globe) {
                        globe.hideMarker(step.wrongMarkerId)
                        globe.hideMarker(step.correctMarkerId)
                    }
                    activeAnimation = null
                    advance(performance.now())
                })
            }
            break
        }

        case StepOp.AnimateMarkerWrongReveal: {
            if (!activeAnimation) {
                { const sp = getAnswerScreenPos(); showWrongFeedback(sp.x, sp.y) }
                activeAnimation = handleMarkerWrongReveal(
                    step.wrongMarkerId, step.correctMarkerId,
                    step.wrongLat, step.wrongLng,
                    step.correctLat, step.correctLng
                )
                activeAnimation.then(() => {
                    activeAnimation = null
                    advance(performance.now())
                })
            }
            break
        }

        case StepOp.RevealLocationGuess: {
            if (!activeAnimation) {
                activeAnimation = handleLocationGuessReveal(
                    step.guessLat, step.guessLng,
                    step.correctLat, step.correctLng,
                    step.distanceKm,
                    step.locationName
                )
                activeAnimation.then(() => {
                    activeAnimation = null
                    advance(performance.now())
                })
            }
            break
        }

        case StepOp.AnimateWrongShake: {
            if (!activeAnimation) {
                globe.clearCountryOutline()
                { const sp = getAnswerScreenPos(); showWrongFeedback(sp.x, sp.y) }
                activeAnimation = Promise.all([
                    cameraShake(globe.getCamera(), 300, 0.02),
                    animateWrong(globe, step.wrongCountryIndex, removeOnWrong)
                ]).then(() => {})

                activeAnimation.then(() => {
                    activeAnimation = null
                    advance(performance.now())
                })
            }
            break
        }

        case StepOp.AnimateWrongReveal: {
            if (!activeAnimation) {
                { const sp = getAnswerScreenPos(); showWrongFeedback(sp.x, sp.y) }
                activeAnimation = handleWrongReveal(step.wrongCountryIndex, step.correctCountryIndex)
                activeAnimation.then(() => {
                    activeAnimation = null
                    advance(performance.now())
                })
            }
            break
        }

        case StepOp.ShowResult: {
            // Result display handled by UI reading getCurrentStep()
            if (step.wasCorrect) { const sp = getAnswerScreenPos(); showCorrectFeedback(sp.x, sp.y) }
            else { const sp = getAnswerScreenPos(); showWrongFeedback(sp.x, sp.y) }
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

    }

    return true
}

// ============================================================================
// Getters
// ============================================================================

export function getScore() { return score }
export function getWrongCount() { return wrongCount }
export function getResults() { return results }
export function getDistances() { return distances }
export function getTotal() { return questions.length }
export function getQuestions() { return questions }
export function isDone() { return done }
export function isWaiting() { return waiting }
export function getCurrentStep() { return pc < steps.length ? steps[pc] : null }
export function getQuestion(index: number) { return questions[index] }
export function getCurrentQuestionIndex() { return findCurrentQuestionIndex() }

// ============================================================================
// Location Hover
// ============================================================================

/**
 * Called on every pointermove during placing mode.
 * Scales the closest marker up if within hit radius, resets previous.
 */
export function updateLocationHover(lat: number, lon: number): void {
    if (!globe || !waiting) return

    // Only applies to location questions
    const qi = findCurrentQuestionIndex()
    const q = questions[qi]
    if (!q || q.answer !== 'location-alternatives') return

    const clickPoint = latLonToSphere(lat, lon, 0)
    const camera = globe.getCamera()
    const hitRadius = getZoomValue(camera, zoom.markerHitRadiusClose, zoom.markerHitRadiusFar)
    const hitRadiusSqr = hitRadius * hitRadius

    // Find closest marker within hit radius
    let closestId = -1
    let closestDistSqr = Infinity
    for (const [questionIndex, markerId] of locationMarkers) {
        const mq = questions[questionIndex]
        if (mq.answer !== 'location-alternatives') continue
        const markerPoint = latLonToSphere(mq.lat!, mq.lng!, 0)
        const distSqr = Vector3.DistanceSquared(clickPoint, markerPoint)
        if (distSqr <= hitRadiusSqr && distSqr < closestDistSqr) {
            closestDistSqr = distSqr
            closestId = markerId
        }
    }

    // Update hover state
    if (closestId !== hoveredMarkerId) {
        // Reset old
        if (hoveredMarkerId !== -1) {
            globe.setMarkerScale(hoveredMarkerId, 1.0)
        }
        // Set new
        if (closestId !== -1) {
            globe.setMarkerScale(closestId, 2.0)
        }
        hoveredMarkerId = closestId
    }
}

/**
 * Reset any hovered marker to normal scale.
 */
function clearLocationHover(): void {
    if (hoveredMarkerId !== -1 && globe) {
        globe.setMarkerScale(hoveredMarkerId, 1.0)
        hoveredMarkerId = -1
    }
}

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
}

/**
 * Compute the normalized viewport region between the question card and bottom panel.
 * Called at execution time so it reflects the current window size.
 */
function getQuizViewportRegion(): ViewportRegion {
    const h = window.innerHeight
    const topPx = 120   // question card: 20px offset + 100px height
    const bottomPx = 180 // bottom panel: 30px offset + 150px height
    return {
        x: 0,
        y: topPx / h,
        width: 1,
        height: (h - topPx - bottomPx) / h
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
 * Handle wrong marker answer with reveal choreography
 * (Red burst, arc from wrong→correct, camera fly, scale up correct, hold, scale down)
 */
async function handleMarkerWrongReveal(
    wrongMarkerId: number,
    correctMarkerId: number,
    wrongLat: number,
    wrongLng: number,
    correctLat: number,
    correctLng: number
): Promise<void> {
    if (!globe || !arcDrawer) return

    // 1. Red burst at wrong marker (fire-and-forget) + reset scale
    const wrongPos = globe.getMarkerPosition(wrongMarkerId)
    if (wrongPos) {
        wrongBurstAtPosition(globe.getScene(), wrongPos)
    }
    globe.setMarkerScale(wrongMarkerId, 1.0)

    // 2. Arc from wrong → correct + camera fly to correct (parallel)
    const arcId = arcDrawer.addArc(
        wrongLat, wrongLng,
        correctLat, correctLng,
        '#ffffff', 0.3, 0
    )

    const arcPromise = arcDrawer.animateArc(arcId, 500)
    const cameraPromise = animateToLocation(
        globe.getCamera(),
        correctLat, correctLng,
        globe.getCamera().radius,
        800
    )

    await Promise.all([arcPromise, cameraPromise])

    // 3. Remove arc, scale up correct marker
    arcDrawer.removeArc(arcId)
    globe.setMarkerScale(correctMarkerId, 3.0)

    // 4. Hold
    await new Promise(r => setTimeout(r, 1500))

    // 5. Hide both markers (question won't repeat)
    globe.hideMarker(wrongMarkerId)
    globe.hideMarker(correctMarkerId)
}

/**
 * Handle location-guess reveal choreography
 * (Guess marker, arc, camera frame, distance text, burst, hold, cleanup)
 */
async function handleLocationGuessReveal(
    guessLat: number,
    guessLng: number,
    correctLat: number,
    correctLng: number,
    distanceKm: number,
    locationName: string
): Promise<void> {
    if (!globe || !arcDrawer) return

    // 1. Place marker at guess location
    const guessMarkerId = globe.acquireMarker(guessLat, guessLng)

    // 2. Arc from guess → correct (1.5s) + camera frames both (2s) in parallel
    const arcId = arcDrawer.addArc(
        guessLat, guessLng,
        correctLat, correctLng,
        '#ffffff', 0.3, 0
    )

    const arcPromise = arcDrawer.animateArc(arcId, 1500)
    const cameraPromise = animateToLocation(
        globe.getCamera(),
        correctLat, correctLng,
        globe.getCamera().radius,
        2000
    )

    await Promise.all([arcPromise, cameraPromise])

    // 3. Show distance text + burst at correct location
    showDistanceOverlay(distanceKm, locationName)
    const correctPos = latLonToSphere(correctLat, correctLng, 0)
    burstAtPosition(globe.getScene(), correctPos)

    // 4. Remove arc
    arcDrawer.removeArc(arcId)

    // 5. Hold 4s
    await new Promise(r => setTimeout(r, 4000))

    // 6. Cleanup
    hideDistanceOverlay()
    if (guessMarkerId !== -1) {
        globe.releaseMarker(guessMarkerId)
    }
}

/**
 * Handle wrong answer with reveal choreography
 * (Arc drawing, camera fly, reveal, hold, clear)
 */
async function handleWrongReveal(wrongCountryIndex: number, correctCountryIndex: number): Promise<void> {
    if (!globe || !arcDrawer) return

    // 1. Clear outline and pop wrong region UP (but don't drop it yet)
    globe.clearCountryOutline()
    const controller = globe.getActiveController()

    // Save altitude before popping so we can return to it
    const altitudeBeforePop = controller.getAltitude(wrongCountryIndex)

    await controller.animateAltitude(wrongCountryIndex, ALTITUDE_WRONG_POP, 200)

    // 2. Draw arc from wrong to correct
    const wrongCenter = getActiveRegionCenter(wrongCountryIndex)
    const correctCenter = getActiveRegionCenter(correctCountryIndex)

    const arcId = arcDrawer.addArc(
        wrongCenter.lat,
        wrongCenter.lon,
        correctCenter.lat,
        correctCenter.lon,
        '#ffffff',
        0.3,
        0
    )

    // 3. Animate arc and camera in parallel (keep wrong region elevated)
    const arcAnimationPromise = arcDrawer.animateArc(arcId, 500)

    const allPolygons = globe.getActiveRegionPolygons()
    const correctPolygons = allPolygons.filter(p => p.regionIndex === correctCountryIndex)

    const cameraFlyPromise = frameCountry(
        globe.getCamera(),
        globe,
        correctPolygons,
        '', // Country name not needed
        800,
        0.8,
        undefined,
        undefined,
        { overrideAltitude: ALTITUDE_SHOW_CORRECT }
    )

    await Promise.all([arcAnimationPromise, cameraFlyPromise])

    // 3b. Drop wrong region back after arc completes
    if (removeOnWrong) {
        controller.setState(wrongCountryIndex, STATE_CLEARED)
        const wrongCountry = globe.getCountryByIndex(wrongCountryIndex)
        if (wrongCountry && globe.countryHasIslandsFrame(wrongCountry.id)) {
            globe.disableIslandsFrameForCountry(wrongCountry.id)
        }
        if (controller.isSmallRegion(wrongCountryIndex)) {
            controller.hideSmallRegionMarker(wrongCountryIndex)
        }
        await Promise.all([
            controller.animateAltitude(wrongCountryIndex, ALTITUDE_CLEARED, 200),
            controller.animateBlend(wrongCountryIndex, 0.0, 200)
        ])
    } else {
        // Return to original altitude
        await controller.animateAltitude(wrongCountryIndex, altitudeBeforePop, 200)
    }

    // 4. Remove arc
    arcDrawer.removeArc(arcId)

    // 5. Show and elevate correct country
    globe.showCountryOutline(correctCountryIndex)
    await animateShowCorrect(globe, correctCountryIndex)
    onRevealCorrectCb?.(correctCountryIndex)

    // 6. Hold
    await new Promise(r => setTimeout(r, 1500))

    // 7. Clear and sink
    onHideRevealCb?.()
    globe.clearCountryOutline()
    const correctCountry = globe.getCountryByIndex(correctCountryIndex)
    if (correctCountry && globe.countryHasIslandsFrame(correctCountry.id)) {
        globe.disableIslandsFrameForCountry(correctCountry.id)
    }
    if (controller.isSmallRegion(correctCountryIndex)) {
        controller.hideSmallRegionMarker(correctCountryIndex)
    }
    await animateToClearedAfterReveal(globe, correctCountryIndex)
}

/**
 * Calculate spherical center of a region (country or province)
 * Works for both country mode and region mode (provinces)
 */
function getActiveRegionCenter(regionIndex: number): { lat: number; lon: number } {
    if (!globe) return { lat: 0, lon: 0 }

    const allPolygons = globe.getActiveRegionPolygons()
    const regionPolygons = allPolygons.filter(p => p.regionIndex === regionIndex)

    if (regionPolygons.length === 0) {
        return { lat: 0, lon: 0 }
    }

    // Collect all points
    const allPoints: Array<{ lat: number; lon: number }> = []
    for (const polygon of regionPolygons) {
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
