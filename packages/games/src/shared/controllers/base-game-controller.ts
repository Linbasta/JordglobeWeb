/**
 * Base Game Controller
 *
 * Abstract base class for all game controllers.
 * Provides common functionality for:
 * - Loading screen management
 * - EarthGlobe initialization
 * - PinManager setup
 * - PinUI creation and lifecycle
 * - Window resize handling
 *
 * Subclasses provide game-specific behavior via hooks.
 */

import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture';

import {
    EarthGlobe,
    REGION_ALTITUDE
} from '../../earth-globe';
import type { LatLon, RegionPolygon, EarthGlobeAPI } from '../../earth-globe';

import { initPinManager, onPlacingModeChange, onCancelZoneChange, onPinPlaced as onPinPlacedCb, enterPlacingMode, updatePinScaleIfPlacing } from '../managers/pin-manager';
import { PinUI } from '../ui/pin-ui';
import { GlobeState } from '../state';
import { dismissPinTutorial } from '../ui/pin-tutorial';
import { getBannerHeight, onBannerVisibilityChange } from '../ui/app-banner';
import { setScoreBarBannerOffset } from '../ui/score-bar';
import { setSimpleScoreBarBannerOffset } from '../ui/score-bar-simple';
import { setTextCardBannerOffset } from '../ui/text-card-overlay';
import { setVideoBannerOffset } from '../ui/video-overlay';
import { setImageBannerOffset } from '../ui/image-overlay';

export interface BaseGameOptions {
    onReady?: (controller: any) => void;
    showPinUI?: boolean;  // Show pin button and bottom panel (default: true)
}

/**
 * Base Game Controller
 *
 * This abstract class provides the common foundation for all game controllers:
 * - Loading screen with progress tracking
 * - EarthGlobe initialization
 * - PinManager setup
 * - PinUI creation and management
 * - Automatic resize handling
 *
 * Subclasses override hooks to provide game-specific behavior.
 */
export abstract class BaseGameController {
    protected globe!: EarthGlobe;
    protected options: BaseGameOptions;

    // State management
    protected stateManager: GlobeState;

    // Modules
    protected pinUI: PinUI | null = null;

    // GUI elements
    protected advancedTexture: AdvancedDynamicTexture | null = null;

    // Banner visibility subscription
    private unsubscribeBanner: (() => void) | null = null;

    // Loading screen elements
    private loadingProgress: HTMLElement | null;
    private loadingText: HTMLElement | null;
    private loadingScreen: HTMLElement | null;

    constructor(canvasId: string = 'renderCanvas', options?: BaseGameOptions) {
        this.options = options || {};

        // Initialize state manager
        this.stateManager = new GlobeState();

        // Get loading screen elements
        this.loadingProgress = document.getElementById('loadingProgress');
        this.loadingText = document.getElementById('loadingText');
        this.loadingScreen = document.getElementById('loadingScreen');

        this.updateLoadingProgress(5, 'Initializing scene...');

        // Create the core globe
        this.globe = new EarthGlobe({
            canvasId,
            onReady: async (globe) => {
                this.updateLoadingProgress(75, 'Creating modules...');

                // Initialize PinManager with callback to get active picker (routes to provinces in region mode)
                await initPinManager(
                    globe.getScene(),
                    globe.getCamera(),
                    globe.getCanvas(),
                    () => globe.getActivePicker(),
                    globe.getEarthSphere(),
                    (material) => globe.createUnlitMaterial(material),
                    (countryIndex) => globe.getCountryController().getAltitude(countryIndex),
                    (regionIndex) => globe.getActiveController().getState(regionIndex)
                );

                // Let subclass set up game-specific modules
                await this.onGlobeReady(globe);

                // Set up state sync loop (runs once per frame before render)
                let lastFrameTime = performance.now();
                globe.getScene().onBeforeRenderObservable.add(() => {
                    const now = performance.now();
                    const deltaTime = now - lastFrameTime;
                    lastFrameTime = now;
                    this.stateManager.sync(globe, deltaTime);

                    // Update pin scale continuously during placement (for smooth zoom scaling)
                    updatePinScaleIfPlacing();
                });

                // Expose state manager for debugging
                (window as any).__globeState = this.stateManager;

                this.updateLoadingProgress(90, 'Setting up UI...');

                // Create GUI
                this.createGUI();

                // Wire PinManager to hide/show pin button
                onPlacingModeChange((placing) => {
                    if (this.pinUI) {
                        this.pinUI.setPinButtonVisible(!placing);
                    }
                });

                // Wire cancel zone to preview pin UI toggle during drag
                onCancelZoneChange((inZone) => {
                    if (this.pinUI) {
                        this.pinUI.setPinButtonVisible(inZone);
                    }
                });

                // Wire PinManager placement callback
                onPinPlacedCb((country, latLon) => {
                    this.onPinPlaced(country, latLon);
                });

                this.updateLoadingProgress(100, 'Complete!');

                // Call ready callback
                if (this.options.onReady) {
                    this.options.onReady(this);
                }

                // Hide loading screen
                setTimeout(() => this.hideLoadingScreen(), 300);
            }
        });

        // Handle resize
        window.addEventListener('resize', () => {
            this.recreateGUI();
        });
    }

    // =========================================================================
    // Abstract Methods - Subclasses MUST implement these
    // =========================================================================

    /**
     * Called when the globe is ready and PinManager has been initialized.
     * Subclasses should create their game-specific modules here.
     *
     * @param globe - The initialized EarthGlobe API instance
     */
    protected abstract onGlobeReady(globe: EarthGlobeAPI): Promise<void>;

    /**
     * Called when a pin is placed by the user.
     * Subclasses should handle the placement logic (e.g., send to server, update state).
     *
     * @param country - The country the pin was placed on (or null if not on a country)
     * @param latLon - The latitude/longitude of the pin
     */
    protected abstract onPinPlaced(country: RegionPolygon | null, latLon: LatLon): void;

    // =========================================================================
    // Optional Hook Methods - Subclasses MAY override these
    // =========================================================================

    /**
     * Called after GUI is created. Override to add additional UI elements.
     */
    protected setupAdditionalUI?(): void;

    /**
     * Called after GUI is recreated (e.g., on resize). Override to recreate additional UI.
     */
    protected recreateAdditionalUI?(): void;

    /**
     * Called before GUI is disposed (e.g., on resize). Override to clean up additional UI.
     */
    protected disposeAdditionalUI?(): void;

    // =========================================================================
    // Public API - Core Access
    // =========================================================================

    /**
     * Get the underlying EarthGlobe instance.
     * Use this to access core globe functionality like:
     * - getScene(), getCamera(), getEngine(), getCanvas()
     * - getEarthSphere(), getCountryPicker()
     * - Material creation, coordinate conversion, etc.
     */
    getGlobe(): EarthGlobe {
        return this.globe;
    }

    // =========================================================================
    // Public API - State Management
    // =========================================================================

    /**
     * Get the centralized state manager.
     * Use this to read/write globe state in a controlled manner.
     */
    getStateManager(): GlobeState {
        return this.stateManager;
    }

    // =========================================================================
    // Public API - Game-Specific Modules
    // =========================================================================

    getPinUI(): PinUI | null {
        return this.pinUI;
    }

    // =========================================================================
    // Public API - Helper Methods
    // =========================================================================

    /**
     * Enhanced positionAtLatLon with game-specific altitude logic.
     * Use this instead of globe.positionAtLatLon() for game features like pins.
     *
     * @param aboveCountry - If true, positions above country polygons (default: true)
     */
    positionAtLatLon(lat: number, lon: number, altitude?: number, aboveCountry: boolean = true): {
        position: import('@babylonjs/core/Maths/math').Vector3;
        normal: import('@babylonjs/core/Maths/math').Vector3;
    } {
        const defaultAltitude = aboveCountry ? REGION_ALTITUDE + 0.01 : 0.01;
        const finalAltitude = altitude !== undefined ? altitude : defaultAltitude;
        return this.globe.positionAtLatLon(lat, lon, finalAltitude);
    }

    // =========================================================================
    // Protected - Loading Screen
    // =========================================================================

    protected updateLoadingProgress(percent: number, text: string): void {
        if (this.loadingProgress) {
            this.loadingProgress.style.width = `${percent}%`;
        }
        if (this.loadingText) {
            this.loadingText.textContent = text;
        }
    }

    protected hideLoadingScreen(): void {
        if (this.loadingScreen) {
            this.loadingScreen.classList.add('hidden');
        }
    }

    // =========================================================================
    // Protected - GUI
    // =========================================================================

    protected createGUI(): void {
        this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, this.globe.getScene());
        this.advancedTexture.background = "";

        // Conditionally create pin UI
        if (this.options.showPinUI !== false) {
            this.pinUI = new PinUI(this.advancedTexture);
            this.pinUI.create({
                onPinButtonPress: () => {
                    dismissPinTutorial();
                    enterPlacingMode();
                }
            });
        }

        // Set initial banner offset (if banner is already visible)
        const initialOffset = getBannerHeight();
        this.applyBannerOffset(initialOffset);

        // Subscribe to banner visibility changes
        this.unsubscribeBanner = onBannerVisibilityChange((visible, heightPx) => {
            this.applyBannerOffset(visible ? heightPx : 0);
        });

        // Let subclass add additional UI
        if (this.setupAdditionalUI) {
            this.setupAdditionalUI();
        }
    }

    protected recreateGUI(): void {
        // Let subclass dispose additional UI
        if (this.disposeAdditionalUI) {
            this.disposeAdditionalUI();
        }

        // Unsubscribe from banner changes
        if (this.unsubscribeBanner) {
            this.unsubscribeBanner();
            this.unsubscribeBanner = null;
        }

        // Dispose old PinUI
        if (this.pinUI) {
            this.pinUI.dispose();
            this.pinUI = null;
        }

        // Dispose old GUI
        if (this.advancedTexture) {
            this.advancedTexture.dispose();
            this.advancedTexture = null;
        }

        // Recreate GUI (will re-subscribe to banner changes)
        this.createGUI();

        // Let subclass recreate additional UI
        if (this.recreateAdditionalUI) {
            this.recreateAdditionalUI();
        }
    }

    /**
     * Apply banner offset to all UI components.
     * Called on init and when banner visibility changes.
     *
     * Note: Only TOP elements need adjustment. Bottom elements (PinUI) stay in place
     * because the banner is at the TOP of the screen and doesn't affect the bottom.
     */
    private applyBannerOffset(offsetPx: number): void {
        // Score bars (HTML-based, top of screen)
        setScoreBarBannerOffset(offsetPx);
        setSimpleScoreBarBannerOffset(offsetPx);

        // Question overlays (HTML-based, below score bar)
        setTextCardBannerOffset(offsetPx);
        setVideoBannerOffset(offsetPx);
        setImageBannerOffset(offsetPx);

        // Note: CountryLabelUI is created by subclasses and they should call
        // countryLabelUI.setBannerOffset() in their own banner handling if needed.
        //
        // PinUI is NOT adjusted because it's anchored to the BOTTOM of the screen,
        // and a TOP banner doesn't affect bottom positioning.
    }
}
