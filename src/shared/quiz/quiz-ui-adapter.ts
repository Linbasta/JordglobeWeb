/**
 * Quiz UI Adapter
 *
 * Bridges the quiz runner (pure logic) with UI components (CountryLabelUI).
 * Handles question display, user callbacks, and quiz state management.
 *
 * Separates quiz integration logic from SoloGameController.
 */

import type { EarthGlobeAPI } from '../../earth-globe/types'
import type { CountryLabelUI } from '../ui/country-label-ui'
import type { Question } from './quiz-types'
import { StepOp } from './quiz-types'
import {
    startQuiz,
    tickQuiz,
    submitCountryAnswer,
    getScore,
    getTotal,
    getWrongCount,
    isDone,
    isWaiting,
    getCurrentStep,
    getQuestion
} from './quiz-runner'
import { createScoreBar, updateScoreBar, disposeScoreBar } from '../ui/score-bar'
import { createSimpleScoreBar, updateSimpleScoreBar, disposeSimpleScoreBar } from '../ui/score-bar-simple'

/**
 * Quiz configuration
 */
export type ScoreBarType = 'progressbar' | 'simple'

export interface QuizConfig {
    questions: Question[]
    scoreBarType?: ScoreBarType
    revealCorrectOnWrong?: boolean
    removeOnWrong?: boolean
    onQuestionChanged?: (prompt: string, index: number, total: number) => void
    onCorrectAnswer?: (prompt: string) => void
    onWrongAnswer?: (wrongCountry: string, correctCountry: string) => void
    onGameComplete?: (score: number, total: number, elapsedMs: number) => void
}

/**
 * Manages quiz-UI integration
 */
export interface HoverLabel {
    show(text: string): void
    hide(): void
    showAtScreenPos(text: string, x: number, y: number): void
}

export class QuizUIAdapter {
    private globe: EarthGlobeAPI
    private countryLabelUI: CountryLabelUI | null
    private hoverLabel: HoverLabel | null = null
    private config: QuizConfig | null = null
    private active = false
    private lastShownQuestionIndex = -1
    private startTime = 0

    constructor(globe: EarthGlobeAPI, countryLabelUI: CountryLabelUI | null) {
        this.globe = globe
        this.countryLabelUI = countryLabelUI
    }

    setHoverLabel(label: HoverLabel | null): void {
        this.hoverLabel = label
    }

    /**
     * Start a quiz game
     */
    startQuiz(config: QuizConfig): void {
        this.config = config
        this.active = true
        this.lastShownQuestionIndex = -1
        this.startTime = performance.now()

        if (config.scoreBarType === 'simple') {
            createSimpleScoreBar(config.questions.length, config.questions.length)
        } else {
            createScoreBar(config.questions.length, config.questions.length)
        }

        // Initialize the quiz runner
        startQuiz(
            config.questions,
            this.globe,
            {
                revealCorrectOnWrong: config.revealCorrectOnWrong,
                removeOnWrong: config.removeOnWrong,
                onRevealCorrect: (correctCountryIndex) => {
                    if (!this.hoverLabel) return
                    const country = this.globe.getCountryByIndex(correctCountryIndex)
                    if (!country) return
                    const x = window.innerWidth / 2
                    const y = window.innerHeight / 2
                    this.hoverLabel.showAtScreenPos(country.name, x, y)
                },
                onHideReveal: () => {
                    this.hoverLabel?.hide()
                },
            }
        )

        // Show first question
        this.updateUI()
    }

    /**
     * Tick the quiz - call this every frame
     * @returns true if quiz is still active, false if done
     */
    tick(now: number): boolean {
        if (!this.active) return false

        const stillActive = tickQuiz(now)

        const total = getTotal()
        const score = getScore()
        const turnsLeft = total - score - getWrongCount()
        const elapsedMs = performance.now() - this.startTime

        if (this.config?.scoreBarType === 'simple') {
            updateSimpleScoreBar(score, turnsLeft, total, elapsedMs)
        } else {
            updateScoreBar(score, turnsLeft, total)
        }

        if (!stillActive) {
            // Quiz completed
            this.active = false
            const elapsedMs = performance.now() - this.startTime
            if (this.config?.onGameComplete) {
                this.config.onGameComplete(getScore(), getTotal(), elapsedMs)
            }
            return false
        }

        // Update UI based on current step
        this.updateUI()

        return true
    }

    /**
     * Submit an answer (from pin placement)
     */
    submitAnswer(countryIndex: number, latLon: { lat: number; lng: number }): void {
        if (this.active) {
            submitCountryAnswer(countryIndex, latLon)
        }
    }

    /**
     * Get current quiz state
     */
    getState() {
        return {
            active: this.active,
            score: getScore(),
            total: getTotal(),
            done: isDone(),
            waiting: isWaiting()
        }
    }

    /**
     * Update the country label UI reference (e.g., after GUI recreation on resize)
     */
    setCountryLabelUI(ui: CountryLabelUI | null): void {
        this.countryLabelUI = ui
    }

    /**
     * Stop the quiz and cleanup
     */
    dispose(): void {
        this.active = false
        this.config = null
        this.lastShownQuestionIndex = -1
        disposeScoreBar()
        disposeSimpleScoreBar()
    }

    // ========================================================================
    // Private
    // ========================================================================


    private updateUI(): void {
        const step = getCurrentStep()
        if (!step) return

        // Handle different step types that affect UI
        if (step.op === StepOp.ShowQuestion) {
            const questionIndex = step.questionIndex

            // Only update if this is a new question
            if (questionIndex !== this.lastShownQuestionIndex) {
                this.lastShownQuestionIndex = questionIndex

                const question = getQuestion(questionIndex)
                const total = getTotal()

                console.log(`[Quiz UI] Showing question ${questionIndex}: ${question?.prompt}`)

                // Video/image/textcard show prompt inside their overlay — only show card for 'text'
                if (this.countryLabelUI) {
                    if (question && question.present === 'text') {
                        this.countryLabelUI.show(question.prompt)
                    } else {
                        this.countryLabelUI.hide()
                    }
                }

                // Callback
                if (this.config?.onQuestionChanged) {
                    this.config.onQuestionChanged(
                        question?.prompt || '',
                        questionIndex + 1,
                        total
                    )
                }
            }
        }

        // Handle game complete
        if (step.op === StepOp.GameComplete && !isDone()) {
            // This is the first frame of game_complete
            // (isDone() will be true on the next frame)
            const elapsedMs = performance.now() - this.startTime
            if (this.config?.onGameComplete) {
                this.config.onGameComplete(getScore(), getTotal(), elapsedMs)
            }
        }
    }
}
