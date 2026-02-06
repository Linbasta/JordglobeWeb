/**
 * Solo Game Controller
 *
 * Extends BaseGameController with solo game-specific features:
 * - Country selection visual feedback
 * - Country label display
 * - Keyboard shortcuts (Inspector, Water shader controls)
 */

import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';

import type { LatLon, CountryPolygon, EarthGlobeAPI } from '../earth-globe';

import { BaseGameController, BaseGameOptions } from '../shared/controllers/BaseGameController';
import { handleHover, clearSelection } from '../shared/behaviors/countrySelection';
import { CountryLabelUI } from '../shared/ui/CountryLabelUI';
import { HoverCountryLabel } from '../shared/ui/HoverCountryLabel';
import { CountryQuizGame, QuizGameConfig } from '../shared/games/CountryQuizGame';
import { reloadConfig, getConfig } from '../shared/config/GlobalConfig';
import { ZoomBasedValue } from '../shared/animation/CameraAnimator';

export interface SoloGameOptions extends BaseGameOptions {
    onReady?: (controller: SoloGameController) => void;
    disableSelectionBehavior?: boolean;
    showCountryLabel?: boolean;
    showHoverLabel?: boolean;
}

/**
 * Solo Game Controller
 *
 * Extends BaseGameController with solo game-specific features:
 * - Country hover selection (altitude raise + outline)
 * - CountryLabelUI for displaying country names
 * - Inspector and debug shortcuts
 */
export class SoloGameController extends BaseGameController {
    // Solo-specific modules
    private selectionEnabled = false;
    private countryLabelUI: CountryLabelUI | null = null;
    private hoverCountryLabel: HoverCountryLabel | null = null;
    private quizGame: CountryQuizGame | null = null;

    // Solo-specific callbacks
    private onCountrySelected: ((country: CountryPolygon | null, latLon: LatLon) => void) | null = null;
    private onCountryHovered: ((country: CountryPolygon | null, latLon: LatLon) => void) | null = null;
    private hoveredCountry: CountryPolygon | null = null;

    constructor(canvasId: string = 'renderCanvas', options?: SoloGameOptions) {
        super(canvasId, options);
        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();
    }

    // =========================================================================
    // BaseGameController Hooks
    // =========================================================================

    protected async onGlobeReady(globe: EarthGlobeAPI): Promise<void> {
        // Base class has already created PinManager at this point
        // Now we create solo-specific modules
    }

    protected onPinPlaced(country: CountryPolygon | null, latLon: LatLon): void {
        // Delegate to user callback if set
        if (this.onCountrySelected) {
            this.onCountrySelected(country, latLon);
        }
    }

    protected setupAdditionalUI(): void {
        if (!this.advancedTexture) return;

        // Create country label UI (optional)
        if ((this.options as SoloGameOptions)?.showCountryLabel) {
            this.countryLabelUI = new CountryLabelUI(this.advancedTexture);
            this.countryLabelUI.show('Sweden');
        }

        // Create hover country label (shows at pin location) - optional
        const showHoverLabel = (this.options as SoloGameOptions)?.showHoverLabel !== false; // Default true
        if (showHoverLabel) {
            this.hoverCountryLabel = new HoverCountryLabel(this.advancedTexture);
            const previewPin = this.pinManager.getPreviewPin();
            if (previewPin) {
                this.hoverCountryLabel.linkToNode(previewPin);
            }
        }

        // Wire hover selection (unless disabled)
        if (!(this.options as SoloGameOptions).disableSelectionBehavior) {
            this.selectionEnabled = true;
            this.pinManager.onCountryHover((country, latLon) => {
                handleHover(this.globe, country, latLon);

                // Update hover label
                if (country) {
                    this.hoverCountryLabel?.show(country.name);
                } else {
                    this.hoverCountryLabel?.hide();
                }
            });
        }
    }

    protected recreateAdditionalUI(): void {
        if (!this.advancedTexture) return;

        // Recreate hover country label - optional
        const showHoverLabel = (this.options as SoloGameOptions)?.showHoverLabel !== false; // Default true
        if (showHoverLabel) {
            this.hoverCountryLabel = new HoverCountryLabel(this.advancedTexture);
            const previewPin = this.pinManager.getPreviewPin();
            if (previewPin) {
                this.hoverCountryLabel.linkToNode(previewPin);
            }
        }

        // Rewire hover selection
        if (this.selectionEnabled) {
            this.pinManager.onCountryHover((country, latLon) => {
                handleHover(this.globe, country, latLon);

                // Update hover label
                if (country) {
                    this.hoverCountryLabel?.show(country.name);
                } else {
                    this.hoverCountryLabel?.hide();
                }
            });
        }
    }

    protected disposeAdditionalUI(): void {
        clearSelection(this.globe);

        // Dispose hover country label
        if (this.hoverCountryLabel) {
            this.hoverCountryLabel.dispose();
            this.hoverCountryLabel = null;
        }
    }

    // =========================================================================
    // Public API - Solo-Specific Methods
    // =========================================================================

    /**
     * Get the currently hovered country (from selection behavior).
     * Note: For raw country queries, use getGlobe().getCountryAtLatLon()
     */
    getHoveredCountry(): CountryPolygon | null {
        return this.hoveredCountry;
    }

    /**
     * Start a country quiz game
     */
    startQuizGame(config: QuizGameConfig): void {
        this.quizGame = new CountryQuizGame(this.globe, config);

        // Hook into pin placement to check quiz answers
        this.pinManager.onPinPlaced(async (country, latLon) => {
            if (this.quizGame && !this.quizGame.isComplete()) {
                const result = await this.quizGame.checkAnswer(country);

                // If result is null, it means a disabled country was clicked - ignore it
                if (result === null) {
                    return;
                }

                // Update label with current question
                const question = this.quizGame.getCurrentQuestion();
                if (question && this.countryLabelUI) {
                    this.countryLabelUI.show(question);
                }
            } else {
                // Normal click handling (not in quiz mode or quiz complete)
                this.onPinPlaced(country, latLon);
            }
        });

        this.quizGame.start();

        // Show first question
        const question = this.quizGame.getCurrentQuestion();
        if (question && this.countryLabelUI) {
            this.countryLabelUI.show(question);
        }
    }

    /**
     * Get the active quiz game
     */
    getQuizGame(): CountryQuizGame | null {
        return this.quizGame;
    }

    // =========================================================================
    // Public API - Callbacks
    // =========================================================================

    setCountrySelectedCallback(callback: ((country: CountryPolygon | null, latLon: LatLon) => void) | null): void {
        this.onCountrySelected = callback;
    }

    setCountryHoveredCallback(callback: ((country: CountryPolygon | null, latLon: LatLon) => void) | null): void {
        this.onCountryHovered = callback;
    }

    // =========================================================================
    // Private - Keyboard Shortcuts
    // =========================================================================

    private setupKeyboardShortcuts(): void {
        window.addEventListener('keydown', (e) => {
            // Inspector toggle (I key)
            if (e.key === 'i' || e.key === 'I') {
                this.toggleInspector();
            }
            // Toggle water shader controls (W key)
            if (e.key === 'w' || e.key === 'W') {
                this.toggleWaterShaderControls();
            }
            // Reload config (Z key)
            if (e.key === 'z' || e.key === 'Z') {
                this.reloadConfigShortcut();
            }
            // Log camera info (C key)
            if (e.key === 'c' || e.key === 'C') {
                this.logCameraInfo();
            }
        });
    }

    private async toggleInspector(): Promise<void> {
        if (!import.meta.env.DEV) {
            console.log('Inspector is only available in development mode');
            return;
        }

        const scene = this.globe.getScene();
        if (scene.debugLayer.isVisible()) {
            scene.debugLayer.hide();
        } else {
            scene.debugLayer.show({ embedMode: true });
        }
    }

    private toggleWaterShaderControls(): void {
        const waterMaterial = this.globe.getWaterMaterial();
        if (!waterMaterial) return;

        const existingPanel = document.getElementById('waterShaderPanel');
        if (existingPanel) {
            existingPanel.remove();
            return;
        }

        // Create control panel (simplified)
        const panel = document.createElement('div');
        panel.id = 'waterShaderPanel';
        panel.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            width: 300px;
            max-height: 80vh;
            overflow-y: auto;
            background: rgba(30, 30, 30, 0.95);
            color: white;
            padding: 20px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            font-size: 12px;
            z-index: 1000;
        `;

        const title = document.createElement('h3');
        title.textContent = 'Water Shader Controls (Press W to close)';
        title.style.cssText = 'margin: 0 0 15px 0; font-size: 14px;';
        panel.appendChild(title);

        // Add basic info
        const info = document.createElement('p');
        info.textContent = 'Water shader is active. Use Inspector (I key) for detailed material editing.';
        panel.appendChild(info);

        document.body.appendChild(panel);
    }

    private async reloadConfigShortcut(): Promise<void> {
        console.log('⚙️ Reloading configuration...');
        const config = await reloadConfig();
        console.log('✓ Configuration reloaded:', config);
    }

    private logCameraInfo(): void {
        const camera = this.globe.getCamera();
        const config = getConfig();
        const zoomScaler = new ZoomBasedValue(camera);
        const pinScale = zoomScaler.getValue(
            config.zoom.pinScale.closeValue,
            config.zoom.pinScale.farValue,
            config.zoom.pinScale.easing
        );

        console.log('📷 Camera Info:');
        console.log(`  Radius: ${camera.radius.toFixed(2)}`);
        console.log(`  Alpha: ${camera.alpha.toFixed(2)}`);
        console.log(`  Beta: ${camera.beta.toFixed(2)}`);
        console.log(`  Pin Scale: ${pinScale.toFixed(2)} (close=${config.zoom.pinScale.closeValue}, far=${config.zoom.pinScale.farValue}, threshold=${config.zoom.threshold})`);

        // Show pin altitude if hovering over a country
        const previewPin = this.pinManager.getPreviewPin();
        if (previewPin && previewPin.isEnabled()) {
            const pos = previewPin.position;
            const pinRadius = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
            console.log(`  Pin Position Radius: ${pinRadius.toFixed(4)} (EARTH_RADIUS=2.0, altitude=${(pinRadius - 2.0).toFixed(4)})`);
        }
    }
}
