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
import { STATE_DISABLED } from '../earth-globe';

import { BaseGameController, BaseGameOptions } from '../shared/controllers/base-game-controller';
import { getPreviewPin, onCountryHover, onPinPlaced } from '../shared/managers/pin-manager';
import { handleHover, clearSelection } from '../shared/behaviors/country-selection';
import { CountryLabelUI } from '../shared/ui/country-label-ui';
import { HoverCountryLabel } from '../shared/ui/hover-country-label';
import { reloadConfig, getConfig } from '../shared/config/global-config';
import { getZoomValue } from '../shared/animation/camera-utils';

// New quiz pipeline
import { QuizUIAdapter, type QuizConfig } from '../shared/quiz/quiz-ui-adapter';
import { QuizDebugManager } from '../shared/quiz/quiz-debug-manager';
import { getDebugState } from '../shared/quiz/quiz-runner';

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

    // Quiz adapters
    private quizAdapter: QuizUIAdapter | null = null;
    private quizDebugManager: QuizDebugManager | null = null;

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

        // Wire the quiz tick loop into the render loop
        globe.getScene().onBeforeRenderObservable.add(() => {
            if (this.quizAdapter) {
                const now = performance.now();
                this.quizAdapter.tick(now);

                // Update debug panel if visible
                if (this.quizDebugManager && import.meta.env.DEV) {
                    this.quizDebugManager.update(getDebugState());
                }
            }
        });
    }

    protected onPinPlaced(country: CountryPolygon | null, latLon: LatLon): void {
        // Check if we're in quiz mode
        if (this.quizAdapter && country) {
            // Don't submit answer if country is disabled
            const state = this.globe.getCountryState(country.countryIndex);
            if (state === STATE_DISABLED) {
                return;  // Ignore disabled countries
            }

            // Submit answer to quiz adapter
            this.quizAdapter.submitAnswer(country.countryIndex);
        } else {
            // Normal mode - delegate to user callback if set
            if (this.onCountrySelected) {
                this.onCountrySelected(country, latLon);
            }
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
            const previewPin = getPreviewPin();
            if (previewPin) {
                this.hoverCountryLabel.linkToNode(previewPin);
            }
        }

        // Wire hover selection (unless disabled)
        if (!(this.options as SoloGameOptions).disableSelectionBehavior) {
            this.selectionEnabled = true;
            onCountryHover((country, latLon) => {
                handleHover(this.globe, country, latLon);

                // Update hover label
                if (country) {
                    this.hoverCountryLabel?.show(country.name);
                } else {
                    this.hoverCountryLabel?.hide();
                }
            });
        }

        // Create debug manager in dev mode
        if (import.meta.env.DEV) {
            this.quizDebugManager = new QuizDebugManager();
            // Hidden by default (constructor sets display: none)
        }
    }

    protected recreateAdditionalUI(): void {
        if (!this.advancedTexture) return;

        // Recreate hover country label - optional
        const showHoverLabel = (this.options as SoloGameOptions)?.showHoverLabel !== false; // Default true
        if (showHoverLabel) {
            this.hoverCountryLabel = new HoverCountryLabel(this.advancedTexture);
            const previewPin = getPreviewPin();
            if (previewPin) {
                this.hoverCountryLabel.linkToNode(previewPin);
            }
        }

        // Rewire hover selection
        if (this.selectionEnabled) {
            onCountryHover((country, latLon) => {
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

        // Dispose debug manager
        if (this.quizDebugManager) {
            this.quizDebugManager.dispose();
            this.quizDebugManager = null;
        }

        // Dispose quiz adapter
        if (this.quizAdapter) {
            this.quizAdapter.dispose();
            this.quizAdapter = null;
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
     * Start a country quiz game (new pipeline)
     */
    startQuizGame(config: QuizConfig): void {
        // Create quiz adapter
        this.quizAdapter = new QuizUIAdapter(this.globe, this.countryLabelUI);
        this.quizAdapter.startQuiz(config);

        // Show debug panel in dev mode
        if (this.quizDebugManager && import.meta.env.DEV) {
            this.quizDebugManager.show();
        }
    }

    /**
     * Get quiz state
     */
    getQuizState() {
        return this.quizAdapter?.getState() || {
            active: false,
            score: 0,
            total: 0,
            done: false,
            waiting: false
        };
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
            // Toggle debug panel (D key) - dev only
            if ((e.key === 'd' || e.key === 'D') && import.meta.env.DEV) {
                this.toggleDebugPanel();
            }
        });
    }

    private toggleDebugPanel(): void {
        this.quizDebugManager?.toggle();
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
        const pinScale = getZoomValue(
            camera,
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
        const previewPin = getPreviewPin();
        if (previewPin && previewPin.isEnabled()) {
            const pos = previewPin.position;
            const pinRadius = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
            console.log(`  Pin Position Radius: ${pinRadius.toFixed(4)} (EARTH_RADIUS=2.0, altitude=${(pinRadius - 2.0).toFixed(4)})`);
        }
    }
}
