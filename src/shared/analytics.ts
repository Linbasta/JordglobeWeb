/**
 * Firebase Analytics wrapper
 *
 * Provides a simple interface for logging analytics events.
 * Event names and parameters follow GEO2020 conventions (PascalCase).
 *
 * Usage:
 *   import { initAnalytics, logGameSessionStart } from './analytics';
 *   initAnalytics();  // Call once to enable
 *   logGameSessionStart('Eurovision', 'eurovision_2025', sessionId);
 */

import { Analytics, getAnalytics, logEvent } from 'firebase/analytics';
import { app } from './firebase';
import { hasAnalyticsConsent } from './ui/consent-banner';

let analytics: Analytics | null = null;

// crypto.randomUUID() only works in secure contexts (HTTPS or localhost)
// On LAN HTTP, we disable analytics entirely
const analyticsAvailable = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function';

/**
 * Initialize Firebase Analytics. Call once at startup to enable event logging.
 * If not called, all log functions are no-ops.
 * Analytics is disabled on non-secure contexts (e.g., LAN HTTP) or without consent.
 */
export function initAnalytics(): void {
    if (!analyticsAvailable) {
        console.log('[Analytics] Disabled (non-secure context)');
        return;
    }
    if (!hasAnalyticsConsent()) {
        console.log('[Analytics] Disabled (no consent)');
        return;
    }
    if (typeof window !== 'undefined' && !analytics) {
        try {
            analytics = getAnalytics(app);
            console.log('[Analytics] Initialized');
        } catch (e) {
            console.warn('[Analytics] Failed to initialize:', e);
        }
    }
}

/**
 * Generate a unique session ID (UUID v4)
 * Returns empty string on non-secure contexts where crypto.randomUUID is unavailable.
 */
export function generateSessionId(): string {
    if (!analyticsAvailable) return '';
    return crypto.randomUUID();
}

// =============================================================================
// Game Session Events
// =============================================================================

/**
 * Log game session start
 * Maps to GEO2020 GameSession event with State: Start
 */
export function logGameSessionStart(
    game: string,
    gameId: string,
    sessionId: string
): void {
    console.log('[Analytics] GameSession Start:', game, gameId, sessionId);
    if (!analytics) return;
    logEvent(analytics, 'GameSession', {
        Game: game,
        GameId: gameId,
        SessionId: sessionId,
        State: 'Start',
    });
}

/**
 * Log game session end
 * Maps to GEO2020 GameSession event with State: End
 */
export function logGameSessionEnd(
    game: string,
    gameId: string,
    sessionId: string,
    score: number,
    total: number,
    elapsedMs: number
): void {
    console.log('[Analytics] GameSession End:', game, score, '/', total);
    if (!analytics) return;
    logEvent(analytics, 'GameSession', {
        Game: game,
        GameId: gameId,
        SessionId: sessionId,
        State: 'End',
        Score: score,
        Total: total,
        ElapsedMs: Math.round(elapsedMs),
        Success: score === total ? 1 : 0,
    });
}

// =============================================================================
// Answer Events
// =============================================================================

/**
 * Log a quiz answer
 * Maps to GEO2020 Answer event
 */
export function logAnswer(data: {
    game: string;
    gameId: string;
    sessionId: string;
    questionId: string;       // e.g., country ISO2 code
    correctId: string;        // The correct answer ID (e.g., "SE")
    answerId: string;         // What user selected (e.g., "NO" if they clicked Norway)
    latitude: number;
    longitude: number;
    correct: boolean;
    timeMs?: number;          // Time to answer this question
    distanceKm?: number;      // For location-guess questions
}): void {
    console.log('[Analytics] Answer:', data.questionId, data.correct ? '✓' : '✗');
    if (!analytics) return;
    logEvent(analytics, 'Answer', {
        Game: data.game,
        GameId: data.gameId,
        SessionId: data.sessionId,
        QuestionId: data.questionId,
        CorrectId: data.correctId,
        AnswerId: data.answerId,
        Latitude: data.latitude,
        Longitude: data.longitude,
        CorrectAnswer: data.correct ? 1 : 0,
        ...(data.timeMs !== undefined && { TimeMs: Math.round(data.timeMs) }),
        ...(data.distanceKm !== undefined && { DistanceKm: Math.round(data.distanceKm) }),
    });
}
