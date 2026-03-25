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

/**
 * Quiz configuration
 */
export interface QuizConfig {
    questions: Question[]
    revealCorrectOnWrong?: boolean
    removeOnWrong?: boolean
    onQuestionChanged?: (prompt: string, index: number, total: number) => void
    onCorrectAnswer?: (prompt: string) => void
    onWrongAnswer?: (wrongCountry: string, correctCountry: string) => void
    onGameComplete?: (score: number, total: number) => void
}

/**
 * Manages quiz-UI integration
 */
export class QuizUIAdapter {
    private globe: EarthGlobeAPI
    private countryLabelUI: CountryLabelUI | null
    private config: QuizConfig | null = null
    private active = false
    private lastShownQuestionIndex = -1

    constructor(globe: EarthGlobeAPI, countryLabelUI: CountryLabelUI | null) {
        this.globe = globe
        this.countryLabelUI = countryLabelUI
    }

    /**
     * Start a quiz game
     */
    startQuiz(config: QuizConfig): void {
        this.config = config
        this.active = true
        this.lastShownQuestionIndex = -1

        createScoreBar(config.questions.length, config.questions.length)

        // Initialize the quiz runner
        startQuiz(
            config.questions,
            this.globe,
            {
                revealCorrectOnWrong: config.revealCorrectOnWrong,
                removeOnWrong: config.removeOnWrong
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
        updateScoreBar(score, turnsLeft, total)

        if (!stillActive) {
            // Quiz completed
            this.active = false
            if (this.config?.onGameComplete) {
                this.config.onGameComplete(getScore(), getTotal())
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
    }

    // ========================================================================
    // Private - UI Update Logic
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
            if (this.config?.onGameComplete) {
                this.config.onGameComplete(getScore(), getTotal())
            }
        }
    }
}
