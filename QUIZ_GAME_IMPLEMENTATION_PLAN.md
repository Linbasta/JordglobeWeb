# Country Quiz Game Implementation Plan

## Status: Phase 1-4 Complete

### Completed Phases

#### Phase 1-4: Core Infrastructure (DONE)
- **AnimationTexture.ts**: Added `stateData` and `blendData` arrays, `setState/getState`, `setBlend/getBlend` methods
- **CountryAnimator.ts**: Added `animateBlend()`, `setState/getState`, `setBlend/getBlend` methods
- **country.fragment.glsl**: Updated shader to read state/blend, implements state-based coloring
- **EarthGlobe.ts**: Exposed `setCountryState`, `getCountryState`, `setCountryBlend`, `getCountryBlend`, `animateCountryBlend`
- **types.ts**: Updated EarthGlobeAPI interface
- **Updated all consumers**: CountrySelectionBehavior, SoloGameController, GlobeState, host/main.ts

#### State Constants (exported from earth-globe module)
```typescript
STATE_NORMAL = 0.0     // No visual effect
STATE_DISABLED = 0.25  // Dark gray (non-game countries)
STATE_CLEARED = 0.50   // Light gray/white tint (completed countries)
```

#### Blend Factor
- `0.0` = Full state effect (gray)
- `1.0` = Normal appearance (colored)

---

## Remaining Phases

### Phase 5: Create Animation Helpers
**File to create:** `src/shared/animations/CountryAnimations.ts`

High-level animation functions that combine altitude and blend animations:

```typescript
import type { EarthGlobeAPI } from '../../earth-globe';
import { STATE_NORMAL, STATE_DISABLED, STATE_CLEARED } from '../../earth-globe';

// Configuration constants
const NORMAL_ALTITUDE = 0.4;      // Default country altitude
const CORRECT_ALTITUDE = 0.6;     // Pop height for correct answer
const WRONG_ALTITUDE = 0.5;       // Pop height for wrong answer
const CLEARED_ALTITUDE = 0.1;     // Sunk state for cleared countries
const SHOW_CORRECT_ALTITUDE = 0.55;

const ANIMATION_DURATION = 200;   // ms per phase

/**
 * Correct Animation (0.4s): Pop up → back down, no state change
 * Used when player clicks the correct country
 */
export async function animateCorrect(globe: EarthGlobeAPI, countryIndex: number): Promise<void> {
    // Pop up
    await globe.animateCountryAltitude(countryIndex, CORRECT_ALTITUDE, ANIMATION_DURATION);
    // Back down to normal
    await globe.animateCountryAltitude(countryIndex, NORMAL_ALTITUDE, ANIMATION_DURATION);
}

/**
 * Cleared Animation (0.4s): Pop up → sink down + gray out
 * Used after correct answer to mark country as completed
 */
export async function animateToCleared(globe: EarthGlobeAPI, countryIndex: number): Promise<void> {
    // Set state to CLEARED (determines final color)
    globe.setCountryState(countryIndex, STATE_CLEARED);

    // Pop up while starting to gray out
    await Promise.all([
        globe.animateCountryAltitude(countryIndex, CORRECT_ALTITUDE, ANIMATION_DURATION),
        globe.animateCountryBlend(countryIndex, 0.5, ANIMATION_DURATION)
    ]);

    // Sink down while finishing gray out
    await Promise.all([
        globe.animateCountryAltitude(countryIndex, CLEARED_ALTITUDE, ANIMATION_DURATION),
        globe.animateCountryBlend(countryIndex, 0.0, ANIMATION_DURATION)
    ]);
}

/**
 * Disabled Animation (0.2s): Sink down + gray out immediately
 * Used at game start for non-game countries
 */
export async function animateToDisabled(globe: EarthGlobeAPI, countryIndex: number): Promise<void> {
    globe.setCountryState(countryIndex, STATE_DISABLED);
    await Promise.all([
        globe.animateCountryAltitude(countryIndex, CLEARED_ALTITUDE, ANIMATION_DURATION),
        globe.animateCountryBlend(countryIndex, 0.0, ANIMATION_DURATION)
    ]);
}

/**
 * Set disabled state immediately (no animation)
 * Used for batch-disabling countries at game start
 */
export function setDisabledImmediate(globe: EarthGlobeAPI, countryIndex: number): void {
    globe.setCountryState(countryIndex, STATE_DISABLED);
    globe.setCountryBlend(countryIndex, 0.0);
    globe.setCountryAltitude(countryIndex, CLEARED_ALTITUDE);
}

/**
 * Wrong Animation (0.2s): Brief pop, returns to normal or cleared
 * Used when player clicks wrong country
 */
export async function animateWrong(globe: EarthGlobeAPI, countryIndex: number, markAsCleared: boolean = false): Promise<void> {
    // Brief pop up
    await globe.animateCountryAltitude(countryIndex, WRONG_ALTITUDE, ANIMATION_DURATION);

    if (markAsCleared) {
        // Transition to cleared state
        globe.setCountryState(countryIndex, STATE_CLEARED);
        await Promise.all([
            globe.animateCountryAltitude(countryIndex, CLEARED_ALTITUDE, ANIMATION_DURATION),
            globe.animateCountryBlend(countryIndex, 0.0, ANIMATION_DURATION)
        ]);
    } else {
        // Return to normal
        await globe.animateCountryAltitude(countryIndex, NORMAL_ALTITUDE, ANIMATION_DURATION);
    }
}

/**
 * Show Correct Animation (0.3s): Rise up to highlight
 * Used to reveal the correct answer after wrong guess
 */
export async function animateShowCorrect(globe: EarthGlobeAPI, countryIndex: number): Promise<void> {
    await globe.animateCountryAltitude(countryIndex, SHOW_CORRECT_ALTITUDE, 300);
}

/**
 * Return to Normal (0.2s): Animate back to normal state
 */
export async function animateToNormal(globe: EarthGlobeAPI, countryIndex: number): Promise<void> {
    globe.setCountryState(countryIndex, STATE_NORMAL);
    await Promise.all([
        globe.animateCountryAltitude(countryIndex, NORMAL_ALTITUDE, ANIMATION_DURATION),
        globe.animateCountryBlend(countryIndex, 1.0, ANIMATION_DURATION)
    ]);
}
```

**Verification:** Import in browser console and test each animation function individually.

---

### Phase 6-7: Camera Shake (ArcDrawer already exists!)
**File to modify:** `src/shared/animation/CameraAnimator.ts`

Add camera shake effect for wrong answers:

```typescript
/**
 * Camera shake effect for wrong answers
 * @param duration Duration in ms (default 300)
 * @param intensity Shake intensity (default 0.02)
 */
async cameraShake(duration: number = 300, intensity: number = 0.02): Promise<void> {
    const camera = this.camera;
    const originalAlpha = camera.alpha;
    const originalBeta = camera.beta;

    const startTime = performance.now();

    return new Promise((resolve) => {
        const shake = () => {
            const elapsed = performance.now() - startTime;
            const progress = elapsed / duration;

            if (progress >= 1) {
                camera.alpha = originalAlpha;
                camera.beta = originalBeta;
                resolve();
                return;
            }

            // Decay shake over time
            const decay = 1 - progress;
            const offsetAlpha = (Math.random() - 0.5) * intensity * decay;
            const offsetBeta = (Math.random() - 0.5) * intensity * decay;

            camera.alpha = originalAlpha + offsetAlpha;
            camera.beta = originalBeta + offsetBeta;

            requestAnimationFrame(shake);
        };
        shake();
    });
}
```

**Note:** ArcDrawer already exists at `src/shared/visualizers/ArcDrawer.ts` with `addArc()`, `animateArcs()`, `clearArcs()`.

**Verification:** Test camera shake in console.

---

### Phase 8: Create CountryQuizGame Class
**File to create:** `src/shared/games/CountryQuizGame.ts`

```typescript
import type { EarthGlobeAPI, CountryPolygon, CountryData } from '../../earth-globe';
import { STATE_DISABLED } from '../../earth-globe';
import {
    animateCorrect,
    animateToCleared,
    animateWrong,
    animateShowCorrect,
    animateToNormal,
    setDisabledImmediate
} from '../animations/CountryAnimations';
import { CameraAnimator } from '../animation/CameraAnimator';
import { ArcDrawer } from '../visualizers/ArcDrawer';

export interface QuizGameConfig {
    /** ISO2 codes of countries in the game */
    countries: string[];
    /** Show correct answer when wrong (Mode A) vs just shake (Mode B) */
    revealCorrectOnWrong: boolean;
    /** Remove wrong country from play after wrong answer */
    removeOnWrong: boolean;
    /** Callbacks */
    onQuestionChanged?: (countryName: string, index: number, total: number) => void;
    onCorrectAnswer?: (countryName: string) => void;
    onWrongAnswer?: (wrongCountry: string, correctCountry: string) => void;
    onGameComplete?: (score: number, total: number) => void;
}

export class CountryQuizGame {
    private globe: EarthGlobeAPI;
    private config: QuizGameConfig;
    private cameraAnimator: CameraAnimator;
    private arcDrawer: ArcDrawer | null = null;

    private gameCountries: CountryData[] = [];
    private remainingCountries: CountryData[] = [];
    private currentQuestion: CountryData | null = null;
    private score = 0;
    private wrongCount = 0;
    private isProcessingAnswer = false;

    constructor(globe: EarthGlobeAPI, config: QuizGameConfig) {
        this.globe = globe;
        this.config = config;
        this.cameraAnimator = new CameraAnimator(globe.getCamera(), globe.getScene());
    }

    /**
     * Initialize and start the game
     */
    start(): void {
        // Resolve country ISO2 codes to CountryData
        this.gameCountries = this.config.countries
            .map(iso2 => this.globe.getCountryByISO2(iso2))
            .filter((c): c is CountryData => c !== undefined);

        // Shuffle for random order
        this.remainingCountries = [...this.gameCountries].sort(() => Math.random() - 0.5);

        // Disable all non-game countries
        const allCountries = this.globe.getAllCountries();
        const gameIndices = new Set(this.gameCountries.map(c => c.index));

        for (const country of allCountries) {
            if (!gameIndices.has(country.index)) {
                setDisabledImmediate(this.globe, country.index);
            }
        }

        // Start first question
        this.nextQuestion();
    }

    /**
     * Check if clicked country is the correct answer
     * @returns true if correct, false if wrong
     */
    async checkAnswer(clickedCountry: CountryPolygon | null): Promise<boolean> {
        if (!this.currentQuestion || this.isProcessingAnswer) return false;
        if (!clickedCountry) return false;

        this.isProcessingAnswer = true;

        const isCorrect = clickedCountry.countryIndex === this.currentQuestion.index;

        if (isCorrect) {
            await this.handleCorrectAnswer(clickedCountry);
        } else {
            await this.handleWrongAnswer(clickedCountry);
        }

        this.isProcessingAnswer = false;
        return isCorrect;
    }

    private async handleCorrectAnswer(country: CountryPolygon): Promise<void> {
        this.score++;

        // Callback
        this.config.onCorrectAnswer?.(country.name);

        // Play correct animation then cleared animation
        await animateCorrect(this.globe, country.countryIndex);
        await animateToCleared(this.globe, country.countryIndex);

        // Next question
        this.nextQuestion();
    }

    private async handleWrongAnswer(wrongCountry: CountryPolygon): Promise<void> {
        this.wrongCount++;
        const correctCountry = this.currentQuestion!;

        // Callback
        this.config.onWrongAnswer?.(wrongCountry.name, correctCountry.name);

        if (this.config.revealCorrectOnWrong) {
            // Mode A: Reveal correct answer

            // 1. Wrong country pops briefly
            await animateWrong(this.globe, wrongCountry.countryIndex, this.config.removeOnWrong);

            // 2. Draw arc from wrong to correct (need lat/lon for both)
            // TODO: Get center lat/lon for countries

            // 3. Fly camera to correct country
            // TODO: Get center lat/lon for correct country
            // await this.cameraAnimator.animateToLocation(lat, lon, radius, 800);

            // 4. Show correct country elevated
            await animateShowCorrect(this.globe, correctCountry.index);

            // 5. Hold for a moment
            await new Promise(r => setTimeout(r, 1500));

            // 6. Animate correct to cleared
            await animateToCleared(this.globe, correctCountry.index);

        } else {
            // Mode B: Just shake and brief pop
            await Promise.all([
                this.cameraAnimator.cameraShake?.(300, 0.02),
                animateWrong(this.globe, wrongCountry.countryIndex, this.config.removeOnWrong)
            ]);
        }

        // Move to next question (same country was the answer, now cleared)
        this.nextQuestion();
    }

    private nextQuestion(): void {
        if (this.remainingCountries.length === 0) {
            // Game complete
            this.currentQuestion = null;
            this.config.onGameComplete?.(this.score, this.gameCountries.length);
            return;
        }

        this.currentQuestion = this.remainingCountries.shift()!;
        const questionIndex = this.gameCountries.length - this.remainingCountries.length;

        this.config.onQuestionChanged?.(
            this.currentQuestion.name,
            questionIndex,
            this.gameCountries.length
        );
    }

    getCurrentQuestion(): string | null {
        return this.currentQuestion?.name ?? null;
    }

    getScore(): { correct: number; wrong: number; total: number } {
        return {
            correct: this.score,
            wrong: this.wrongCount,
            total: this.gameCountries.length
        };
    }

    isComplete(): boolean {
        return this.remainingCountries.length === 0 && !this.isProcessingAnswer;
    }
}
```

**Verification:** Create a simple quiz with 3-5 countries and test correct/wrong answer flows.

---

### Phase 9: Integrate into SoloGameController
**File to modify:** `src/solo/SoloGameController.ts`

Add quiz game support:

```typescript
import { CountryQuizGame, QuizGameConfig } from '../shared/games/CountryQuizGame';

// Add to class:
private quizGame: CountryQuizGame | null = null;

/**
 * Start a country quiz game
 */
startQuizGame(config: QuizGameConfig): void {
    this.quizGame = new CountryQuizGame(this.globe, config);

    // Override click handling to check quiz answers
    this.pinManager.onPinPlaced(async (country, latLon) => {
        if (this.quizGame && !this.quizGame.isComplete()) {
            await this.quizGame.checkAnswer(country);

            // Update label with current question
            const question = this.quizGame.getCurrentQuestion();
            if (question && this.countryLabelUI) {
                this.countryLabelUI.show(`Find: ${question}`);
            }
        } else {
            // Normal click handling
            this.onPinPlaced(country, latLon);
        }
    });

    this.quizGame.start();

    // Show first question
    const question = this.quizGame.getCurrentQuestion();
    if (question && this.countryLabelUI) {
        this.countryLabelUI.show(`Find: ${question}`);
    }
}

/**
 * Get the active quiz game
 */
getQuizGame(): CountryQuizGame | null {
    return this.quizGame;
}
```

**Verification:** Start a quiz from console:
```javascript
soloGame.startQuizGame({
    countries: ['SE', 'NO', 'FI', 'DK'],
    revealCorrectOnWrong: true,
    removeOnWrong: false,
    onQuestionChanged: (name, i, total) => console.log(`Question ${i}/${total}: Find ${name}`),
    onCorrectAnswer: (name) => console.log(`Correct! ${name}`),
    onWrongAnswer: (wrong, correct) => console.log(`Wrong! You clicked ${wrong}, answer was ${correct}`),
    onGameComplete: (score, total) => console.log(`Game over! Score: ${score}/${total}`)
});
```

---

## File Summary

### Files to Create
1. `src/shared/animations/CountryAnimations.ts` - Animation helper functions
2. `src/shared/games/CountryQuizGame.ts` - Quiz game logic

### Files to Modify
1. `src/shared/animation/CameraAnimator.ts` - Add `cameraShake()` method
2. `src/solo/SoloGameController.ts` - Add quiz game integration

### Existing Files to Reuse
1. `src/shared/visualizers/ArcDrawer.ts` - Arc lines (already exists)
2. `src/shared/animation/CameraAnimator.ts` - Camera fly-to (already exists)

---

## Testing Commands

Test file created: `test-state-blend.js` - Copy into browser console to test state/blend system.

For quiz game testing, use the verification code in Phase 9.
