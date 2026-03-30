/**
 * Start Quiz Game — single entry point for quiz HTML pages
 *
 * Handles all boilerplate: loading screen, inspector,
 * shuffle, controller creation.
 * Pages provide complete question objects with explicit prompts.
 */

import type { Question } from '../shared/quiz/quiz-types'
import { createLoadingScreen } from '../shared/ui/loading-screen'
import { preloadQuizImages } from '../shared/ui/image-preloader'
import { SoloGameController } from './solo-game-controller'

export interface QuizGameConfig {
    questions: Question[]
    canvasId?: string
    title?: string
    shuffle?: boolean
    revealCorrectOnWrong?: boolean
    removeOnWrong?: boolean
    onGameComplete?: (score: number, total: number, elapsedMs: number) => void
    showHoverLabel?: boolean
    onReady?: () => void | Promise<void>
}

export async function startQuizGame(config: QuizGameConfig): Promise<void> {
    const canvasId = config.canvasId ?? 'renderCanvas'

    // 1. Loading screen (must exist before controller constructor queries it)
    createLoadingScreen(config.title ?? 'Loading Quiz')

    // 2. Inspector (dev only)
    if (import.meta.env.DEV) {
        await import('@babylonjs/core/Debug/debugLayer')
        await import('@babylonjs/inspector')
    }

    // 3. Shuffle
    const questions = [...config.questions]
    if (config.shuffle !== false) {
        for (let i = questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [questions[i], questions[j]] = [questions[j], questions[i]]
        }
    }

    // 4. Preload images (warms browser cache before questions are shown)
    preloadQuizImages(questions)

    // 5. Derive showCountryLabel: show if any question uses text presentation
    const showCountryLabel = questions.some(q => q.present === 'text')

    // 6. Debug hint (dev only)
    if (import.meta.env.DEV) {
        const hint = document.createElement('div')
        hint.style.cssText =
            'position:fixed;bottom:10px;right:10px;' +
            'color:rgba(255,255,255,0.5);font-family:monospace;font-size:11px;z-index:100;'
        hint.textContent = 'Press D to toggle debug panel'
        document.body.appendChild(hint)
    }

    // 7. Create controller and start quiz
    return new Promise<void>((resolve) => {
        const game = new SoloGameController(canvasId, {
            showCountryLabel,
            showHoverLabel: config.showHoverLabel ?? false,
            onReady: async (controller) => {
                if (config.onReady) await config.onReady()

                controller.startQuizGame({
                    questions,
                    revealCorrectOnWrong: config.revealCorrectOnWrong ?? true,
                    removeOnWrong: config.removeOnWrong ?? false,
                    onGameComplete: config.onGameComplete,
                })

                resolve()
            }
        });

        // Expose for debugging
        (window as any).soloGame = game
    })
}
