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
    private arcDrawer: ArcDrawer;

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
        this.arcDrawer = new ArcDrawer(globe.getScene(), globe);
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
            // Mode A: Reveal correct answer with full choreography

            // 1. Sink wrong country
            await animateWrong(this.globe, wrongCountry.countryIndex, this.config.removeOnWrong);

            // 2. Draw arc from wrong to correct
            const wrongCenter = this.getCountryCenter(wrongCountry.countryIndex);
            const correctCenter = this.getCountryCenter(correctCountry.index);

            const arcId = this.arcDrawer.addArc(
                wrongCenter.lat,
                wrongCenter.lon,
                correctCenter.lat,
                correctCenter.lon,
                '#ff6b6b', // Red-ish color for wrong → correct arc
                0.3 // Arc altitude
            );

            // Animate arc drawing (parallel with camera movement start)
            const arcAnimationPromise = this.arcDrawer.animateArc(arcId, 800);

            // 3. Fly camera to correct country (frame it perfectly)
            const allPolygons = this.globe.getCountryPicker().getAllPolygons();
            const correctPolygons = allPolygons.filter(p => p.countryIndex === correctCountry.index);

            const cameraFlyPromise = this.cameraAnimator.frameCountry(
                correctPolygons,
                correctCountry.name,
                800, // 800ms camera animation
                0.8  // 80% margin
            );

            // Wait for both arc and camera to complete
            await Promise.all([arcAnimationPromise, cameraFlyPromise]);

            // 4. Show correct country elevated
            await animateShowCorrect(this.globe, correctCountry.index);

            // 5. Hold for a moment
            await new Promise(r => setTimeout(r, 1500));

            // 6. Animate correct to cleared
            await animateToCleared(this.globe, correctCountry.index);

            // 7. Clean up arc
            this.arcDrawer.removeArc(arcId);

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

    /**
     * Calculate the spherical center of a country
     * Uses 3D Cartesian averaging to handle antimeridian and polar regions correctly
     */
    private getCountryCenter(countryIndex: number): { lat: number; lon: number } {
        // Get all polygons for this country
        const allPolygons = this.globe.getCountryPicker().getAllPolygons();
        const countryPolygons = allPolygons.filter(p => p.countryIndex === countryIndex);

        if (countryPolygons.length === 0) {
            console.error('No polygons found for country index:', countryIndex);
            return { lat: 0, lon: 0 };
        }

        // Collect all points from all polygons
        const allPoints: Array<{ lat: number; lon: number }> = [];
        for (const polygon of countryPolygons) {
            allPoints.push(...polygon.points);
        }

        if (allPoints.length === 0) {
            return { lat: 0, lon: 0 };
        }

        // Convert all points to Cartesian and average in 3D space
        let sumX = 0, sumY = 0, sumZ = 0;

        for (const point of allPoints) {
            const latRad = point.lat * (Math.PI / 180);
            const lonRad = point.lon * (Math.PI / 180);

            const x = Math.cos(latRad) * Math.cos(lonRad);
            const y = Math.sin(latRad);
            const z = Math.cos(latRad) * Math.sin(lonRad);

            sumX += x;
            sumY += y;
            sumZ += z;
        }

        // Average
        const avgX = sumX / allPoints.length;
        const avgY = sumY / allPoints.length;
        const avgZ = sumZ / allPoints.length;

        // Normalize to sphere surface
        const length = Math.sqrt(avgX * avgX + avgY * avgY + avgZ * avgZ);
        const normalizedX = avgX / length;
        const normalizedY = avgY / length;
        const normalizedZ = avgZ / length;

        // Convert back to lat/lon
        const lat = Math.asin(normalizedY) * (180 / Math.PI);
        const lon = Math.atan2(normalizedZ, normalizedX) * (180 / Math.PI);

        return { lat, lon };
    }
}
