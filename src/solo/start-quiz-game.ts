/**
 * Start Quiz Game — single entry point for quiz HTML pages
 *
 * Handles all boilerplate: loading screen, inspector,
 * shuffle, controller creation.
 * Pages provide complete question objects with explicit prompts.
 */

import type { Question } from '../shared/quiz/quiz-types'
import type { ScoreBarType } from '../shared/quiz/quiz-ui-adapter'
import { createLoadingScreen } from '../shared/ui/loading-screen'
import { preloadQuizImages } from '../shared/ui/image-preloader'
import { showMobileAppAd } from '../shared/ui/mobile-app-ad'
import { SoloGameController } from './solo-game-controller'

export interface QuizGameConfig {
    questions: Question[]
    canvasId?: string
    title?: string
    shuffle?: boolean
    scoreBarType?: ScoreBarType
    revealCorrectOnWrong?: boolean
    removeOnWrong?: boolean
    onGameComplete?: (score: number, total: number, elapsedMs: number, results: boolean[]) => void
    showHoverLabel?: boolean
    onReady?: () => void | Promise<void>
    /** Analytics: game type (e.g., 'Eurovision', 'Daily', 'Medal') */
    analyticsGame?: string
    /** Analytics: game ID (e.g., 'eurovision_2025', 'daily_2026-04-10') */
    analyticsGameId?: string
}

export async function startQuizGame(config: QuizGameConfig): Promise<void> {
    const canvasId = config.canvasId ?? 'renderCanvas'

    // 1. Loading screen (must exist before controller constructor queries it)
    createLoadingScreen(config.title ?? 'Loading Quiz')

    // 2. Mobile app ad (desktop only)
    showMobileAppAd()

    // 3. Inspector (dev only, localhost only — too heavy over LAN)
    if (import.meta.env.DEV && location.hostname === 'localhost') {
        await import('@babylonjs/core/Debug/debugLayer')
        await import('@babylonjs/inspector')
    }

    // 4. Shuffle
    const questions = [...config.questions]
    if (config.shuffle !== false) {
        for (let i = questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [questions[i], questions[j]] = [questions[j], questions[i]]
        }
    }

    // 5. Preload images (warms browser cache before questions are shown)
    preloadQuizImages(questions)

    // 6. Derive showCountryLabel: show if any question uses text presentation
    const showCountryLabel = questions.some(q => q.present === 'text')

    // 7. Debug hint (dev only)
    if (import.meta.env.DEV) {
        const hint = document.createElement('div')
        hint.style.cssText =
            'position:fixed;bottom:10px;right:10px;' +
            'color:rgba(255,255,255,0.5);font-family:monospace;font-size:11px;z-index:100;'
        hint.textContent = 'Press D to toggle debug panel'
        document.body.appendChild(hint)
    }

    // 8. Create controller and start quiz
    return new Promise<void>((resolve) => {
        const game = new SoloGameController(canvasId, {
            showCountryLabel,
            showHoverLabel: config.showHoverLabel ?? false,
            onReady: async (controller) => {
                if (config.onReady) await config.onReady()

                controller.startQuizGame({
                    questions,
                    scoreBarType: config.scoreBarType,
                    revealCorrectOnWrong: config.revealCorrectOnWrong ?? true,
                    removeOnWrong: config.removeOnWrong ?? false,
                    onGameComplete: config.onGameComplete,
                    analyticsGame: config.analyticsGame,
                    analyticsGameId: config.analyticsGameId,
                })

                resolve()
            }
        });

        // Expose for debugging
        (window as any).soloGame = game
    })
}
