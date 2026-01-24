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
        this.cameraAnimator = new CameraAnimator(globe.getCamera());
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
     * @returns true if correct, false if wrong, null if disabled country (ignored)
     */
    async checkAnswer(clickedCountry: CountryPolygon | null): Promise<boolean | null> {
        if (!this.currentQuestion || this.isProcessingAnswer) return false;
        if (!clickedCountry) return false;

        // Ignore disabled countries - return null to signal "no action"
        const countryState = this.globe.getCountryState(clickedCountry.countryIndex);
        if (countryState === STATE_DISABLED) {
            return null;
        }

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

        // Play correct animation (pop up + gray out + sink)
        await animateCorrect(this.globe, country.countryIndex);

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

            // TODO: 2. Draw arc from wrong to correct (need lat/lon for both)
            // TODO: Need to get center lat/lon for countries
            // if (this.arcDrawer) {
            //     this.arcDrawer.addArc(wrongLat, wrongLon, correctLat, correctLon);
            // }

            // TODO: 3. Fly camera to correct country
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
                this.cameraAnimator.cameraShake(300, 0.02),
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
