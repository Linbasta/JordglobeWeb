/**
 * Solo Game Controller
 *
 * Extends BaseGameController with solo game-specific features:
 * - Country selection visual feedback
 * - Country label display
 * - Keyboard shortcuts (Inspector, Water shader controls)
 */

import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';

import type { LatLon, RegionPolygon, EarthGlobeAPI } from '../earth-globe';
import { STATE_DISABLED, STATE_CLEARED } from '../earth-globe';

import { BaseGameController, BaseGameOptions } from '../shared/controllers/base-game-controller';
import { getPreviewPin, onCountryHover, onPinPlaced, onPinMove } from '../shared/managers/pin-manager';
import { handleHover, clearSelection } from '../shared/behaviors/region-selection';
import { CountryLabelUI } from '../shared/ui/country-label-ui';
import { HoverCountryLabelHTML } from '../shared/ui/hover-country-label-html';
import { getZoomValue } from '../shared/animation/camera-utils';
import { zoom } from '../earth-globe';

// New quiz pipeline
import { QuizUIAdapter, type QuizConfig } from '../shared/quiz/quiz-ui-adapter';
import { QuizDebugManager } from '../shared/quiz/quiz-debug-manager';
import { getDebugState, getCurrentQuestionIndex, getQuestion, updateLocationHover } from '../shared/quiz/quiz-runner';
import { togglePerfOverlay } from '../shared/dev/perf-overlay';
import { showPinTutorial, resetPinTutorial, dismissPinTutorial } from '../shared/ui/pin-tutorial';

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
    private hoverCountryLabel: HoverCountryLabelHTML | null = null;

    // Quiz adapters
    private quizAdapter: QuizUIAdapter | null = null;
    private quizDebugManager: QuizDebugManager | null = null;

    // Solo-specific callbacks
    private onCountrySelected: ((country: RegionPolygon | null, latLon: LatLon) => void) | null = null;
    private onCountryHovered: ((country: RegionPolygon | null, latLon: LatLon) => void) | null = null;
    private hoveredCountry: RegionPolygon | null = null;
    private smallMarkersHidden = false;

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

                // Auto-toggle selection & small markers based on current answer type
                const qi = getCurrentQuestionIndex();
                const q = getQuestion(qi);
                const wantSelection = q?.answer === 'country' || q?.answer === 'province';
                if (wantSelection && !this.selectionEnabled) {
                    this.enableSelectionBehavior();
                } else if (!wantSelection && this.selectionEnabled) {
                    this.disableSelectionBehavior();
                }
                const wantSmallMarkers = q?.answer === 'country';
                if (!wantSmallMarkers && !this.smallMarkersHidden) {
                    this.smallMarkersHidden = true;
                    globe.getCountryController().hideAllSmallRegionMarkers();
                } else if (wantSmallMarkers && this.smallMarkersHidden) {
                    this.smallMarkersHidden = false;
                    // Only show markers for enabled (active) countries, not disabled ones
                    globe.getCountryController().showEnabledSmallRegionMarkers();
                }

                // Update debug panel if visible
                if (this.quizDebugManager && import.meta.env.DEV) {
                    this.quizDebugManager.update(getDebugState());
                }

                // Update marker debug radius based on current zoom (dev only)
                if (import.meta.env.DEV) {
                    const camera = globe.getCamera();
                    const hitRadius = getZoomValue(camera, zoom.markerHitRadiusClose, zoom.markerHitRadiusFar);
                    globe.updateMarkerDebugRadius(hitRadius);
                }
            }
        });
    }

    protected onPinPlaced(country: RegionPolygon | null, latLon: LatLon): void {
        // Check if we're in quiz mode
        if (this.quizAdapter) {
            // Hide hover label immediately when answering
            this.hoverCountryLabel?.hide();

            // For location questions, we allow clicking anywhere (country can be null)
            // For country/province questions, we need a valid region and check if disabled
            if (country) {
                // Don't submit answer if region is disabled or already cleared
                const controller = this.globe.getActiveController();
                const state = controller.getState(country.regionIndex);
                if (state === STATE_DISABLED || state === STATE_CLEARED) {
                    return;  // Ignore disabled/cleared regions
                }
                // Submit answer with region and location (convert .lon → .lng at boundary)
                this.quizAdapter.submitAnswer(country.regionIndex, { lat: latLon.lat, lng: latLon.lon });
                // Clear selection (outline + raised altitude) after submitting answer
                clearSelection(this.globe);
            } else {
                // No region clicked - use a placeholder index (-1) and pass the latLon
                // The quiz runner will use latLon for distance-based hit detection
                this.quizAdapter.submitAnswer(-1, { lat: latLon.lat, lng: latLon.lon });
            }
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

            // Only show label if quiz is already running with a text question
            // (handles GUI recreation during resize)
            // Otherwise leave hidden until quiz starts
            if (this.quizAdapter) {
                const qi = getCurrentQuestionIndex();
                const q = getQuestion(qi);
                if (q && q.present === 'text') {
                    this.countryLabelUI.show(q.prompt);
                }
            }
        }

        // Create hover country label (shows at pin location) - optional
        const showHoverLabel = (this.options as SoloGameOptions)?.showHoverLabel !== false; // Default true
        if (showHoverLabel) {
            const scene = this.globe.getScene();
            const camera = this.globe.getCamera();
            this.hoverCountryLabel = new HoverCountryLabelHTML(scene, camera);
            const previewPin = getPreviewPin();
            if (previewPin) {
                this.hoverCountryLabel.linkToNode(previewPin);
            }
        }

        // Wire hover selection (unless disabled)
        // Don't re-enable if a quiz already disabled it
        if (!(this.options as SoloGameOptions).disableSelectionBehavior && !this.quizAdapter) {
            this.selectionEnabled = true;
        }

        // Always register hover callback, but check selectionEnabled inside
        onCountryHover((country, latLon) => {
            // Only handle hover if selection is enabled
            if (this.selectionEnabled) {
                handleHover(this.globe, country, latLon);
            }

            // Update hover label (this should still work even when selection is disabled)
            if (country) {
                this.hoverCountryLabel?.show(country.name);
            } else {
                this.hoverCountryLabel?.hide();
            }
        });

        // Wire pin move → location marker hover detection + label position update
        onPinMove((latLon) => {
            if (this.quizAdapter) {
                updateLocationHover(latLon.lat, latLon.lon);
            }
            // Update HTML label position to follow the pin
            this.hoverCountryLabel?.updatePosition();
        });

        // Reconnect quiz adapter to the new countryLabelUI after GUI recreation
        if (this.quizAdapter) {
            this.quizAdapter.setCountryLabelUI(this.countryLabelUI);
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
        // Note: HTML label doesn't need recreation, but we keep this for consistency
        const showHoverLabel = (this.options as SoloGameOptions)?.showHoverLabel !== false; // Default true
        if (showHoverLabel && !this.hoverCountryLabel) {
            const scene = this.globe.getScene();
            const camera = this.globe.getCamera();
            this.hoverCountryLabel = new HoverCountryLabelHTML(scene, camera);
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

        // NOTE: Don't dispose quiz adapter here — it survives GUI recreation (resize).
        // It will get reconnected to the new countryLabelUI in setupAdditionalUI().
        // The countryLabelUI reference is nulled since the old GUI is gone.
        this.countryLabelUI = null;
    }

    // =========================================================================
    // Public API - Solo-Specific Methods
    // =========================================================================

    /**
     * Get the currently hovered country (from selection behavior).
     * Note: For raw country queries, use getGlobe().getCountryAtLatLon()
     */
    getHoveredCountry(): RegionPolygon | null {
        return this.hoveredCountry;
    }

    /**
     * Start a country quiz game (new pipeline)
     */
    startQuizGame(config: QuizConfig): void {
        // Create quiz adapter
        this.quizAdapter = new QuizUIAdapter(this.globe, this.countryLabelUI);
        this.quizAdapter.setHoverLabel(this.hoverCountryLabel);
        this.quizAdapter.startQuiz(config);

        // Show pin tutorial for first-time users (after quiz starts)
        showPinTutorial();
    }

    /**
     * Enable country selection/hover behavior
     */
    enableSelectionBehavior(): void {
        if (!this.selectionEnabled) {
            this.selectionEnabled = true;
            console.log('[SoloGameController] Selection behavior enabled');
        }
    }

    /**
     * Disable country selection/hover behavior and clear any active selection
     */
    disableSelectionBehavior(): void {
        if (this.selectionEnabled) {
            this.selectionEnabled = false;
            clearSelection(this.globe);
            this.hoveredCountry = null;
            console.log('[SoloGameController] Selection behavior disabled');
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

    setCountrySelectedCallback(callback: ((country: RegionPolygon | null, latLon: LatLon) => void) | null): void {
        this.onCountrySelected = callback;
    }

    setCountryHoveredCallback(callback: ((country: RegionPolygon | null, latLon: LatLon) => void) | null): void {
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
            // Toggle collision/hit area debug visualization (C key)
            if (e.key === 'c' || e.key === 'C') {
                console.log('[SoloGameController] C key detected - toggling collision debug visualization');
                this.toggleMarkerDebugVisualization();
            }
            // Toggle debug panel (D key) - dev only
            if ((e.key === 'd' || e.key === 'D') && import.meta.env.DEV) {
                this.toggleDebugPanel();
            }
            // Toggle collider debug visualization (V key) - dev only
            if ((e.key === 'v' || e.key === 'V') && import.meta.env.DEV) {
                this.globe.toggleColliderDebugVisualization();
            }
            // Toggle performance overlay (P key) - dev only
            if ((e.key === 'p' || e.key === 'P') && import.meta.env.DEV) {
                togglePerfOverlay();
            }
            // Toggle zoom tweaker panel (Z key) - dev only
            if ((e.key === 'z' || e.key === 'Z') && import.meta.env.DEV) {
                import('../shared/dev/zoom-tweaker').then(m => m.toggleZoomPanel());
            }
            // Show pin tutorial (T key) - dev only
            if ((e.key === 't' || e.key === 'T') && import.meta.env.DEV) {
                dismissPinTutorial();  // Remove existing first
                resetPinTutorial();
                showPinTutorial(true);
            }
        });
    }

    private toggleDebugPanel(): void {
        this.quizDebugManager?.toggle();
    }

    private toggleMarkerDebugVisualization(): void {
        this.globe.toggleMarkerDebugVisualization();
        console.log('[SoloGameController] Toggled marker debug visualization');
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

}
