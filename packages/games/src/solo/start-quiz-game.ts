/**
 * Start Quiz Game — single entry point for quiz HTML pages
 *
 * Handles all boilerplate: loading screen, inspector,
 * shuffle, controller creation.
 * Pages provide complete question objects with explicit prompts.
 */

import type { Question } from '../shared/quiz/quiz-types'
import type { ScoreBarType } from '../shared/quiz/quiz-ui-adapter'
import type { QuizTranslations } from '../shared/i18n/types'
import { initI18n, t } from '../shared/i18n/i18n'
import { mountLanguageSwitcher } from '../shared/ui/language-switcher'
import { createLoadingScreen } from '../shared/ui/loading-screen'
import { preloadQuizImages } from '../shared/ui/image-preloader'
import { showMobileAppAd } from '../shared/ui/mobile-app-ad'
import { checkAndUpdatePersonalBest } from '../shared/ui/result-overlay'
import { showConsentBannerIfNeeded } from '../shared/ui/consent-banner'
import { initAnalytics } from '../shared/analytics'
import { SoloGameController } from './solo-game-controller'

export interface QuizGameConfig {
    questions: Question[]
    canvasId?: string
    title?: string
    shuffle?: boolean
    scoreBarType?: ScoreBarType
    revealCorrectOnWrong?: boolean
    removeOnWrong?: boolean
    /** Callback when game completes. isPersonalBest is true if this score beat the stored PB. */
    onGameComplete?: (score: number, total: number, elapsedMs: number, results: boolean[], isPersonalBest: boolean) => void
    showHoverLabel?: boolean
    onReady?: () => void | Promise<void>
    /** Quiz ID for personal best tracking (e.g., 'euro-music-quiz', 'country-quiz') */
    quizId?: string
    /** Analytics: game type (e.g., 'EuroMusicQuiz', 'Daily', 'Medal') */
    analyticsGame?: string
    /** Analytics: game ID (e.g., 'euro-music-quiz_2026', 'daily_2026-04-10') */
    analyticsGameId?: string
    /** Translation bundle. Declaring >1 availableLocales mounts the language switcher. */
    i18n?: QuizTranslations
}

export async function startQuizGame(config: QuizGameConfig): Promise<void> {
    const canvasId = config.canvasId ?? 'renderCanvas'

    // 0. Initialize i18n so t() is usable everywhere downstream.
    // Safe to call even if the quiz page already called initI18n at module top.
    initI18n(config.i18n)

    // 1. Loading screen (must exist before controller constructor queries it)
    createLoadingScreen(config.title ?? t('loading.title'))

    // Mount language switcher (no-op when <2 available locales)
    mountLanguageSwitcher()

    // 2. Mobile app ad (desktop only)
    showMobileAppAd()

    // 3. Consent banner & analytics
    showConsentBannerIfNeeded((granted) => {
        if (granted) initAnalytics()
    })

    // 4. Inspector (dev only, localhost only — too heavy over LAN)
    if (import.meta.env.DEV && location.hostname === 'localhost') {
        await import('@babylonjs/core/Debug/debugLayer')
        await import('@babylonjs/inspector')
    }

    // 5. Shuffle
    const questions = [...config.questions]
    if (config.shuffle !== false) {
        for (let i = questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [questions[i], questions[j]] = [questions[j], questions[i]]
        }
    }

    // 6. Preload images (warms browser cache before questions are shown)
    preloadQuizImages(questions)

    // 7. Derive showCountryLabel: show if any question uses text presentation
    const showCountryLabel = questions.some(q => q.present === 'text')

    // 8. Debug hint (dev only)
    if (import.meta.env.DEV) {
        const hint = document.createElement('div')
        hint.style.cssText =
            'position:fixed;bottom:10px;right:10px;' +
            'color:rgba(255,255,255,0.5);font-family:monospace;font-size:11px;z-index:100;'
        hint.textContent = 'Press D to toggle debug panel'
        document.body.appendChild(hint)
    }

    // 9. Create controller and start quiz
    return new Promise<void>((resolve) => {
        const game = new SoloGameController(canvasId, {
            showCountryLabel,
            showHoverLabel: config.showHoverLabel ?? false,
            onReady: async (controller) => {
                if (config.onReady) await config.onReady()

                // Wrap onGameComplete to check personal best
                const wrappedOnGameComplete = config.onGameComplete
                    ? (score: number, total: number, elapsedMs: number, results: boolean[]) => {
                        const isPersonalBest = config.quizId
                            ? checkAndUpdatePersonalBest(config.quizId, score, total, elapsedMs)
                            : false
                        config.onGameComplete!(score, total, elapsedMs, results, isPersonalBest)
                    }
                    : undefined

                controller.startQuizGame({
                    questions,
                    scoreBarType: config.scoreBarType,
                    revealCorrectOnWrong: config.revealCorrectOnWrong ?? true,
                    removeOnWrong: config.removeOnWrong ?? false,
                    onGameComplete: wrappedOnGameComplete,
                    quizId: config.quizId,
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
