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
import { CountrySelectionBehavior } from '../shared/behaviors/CountrySelectionBehavior';
import { CountryLabelUI } from '../shared/ui/CountryLabelUI';

export interface SoloGameOptions extends BaseGameOptions {
    onReady?: (controller: SoloGameController) => void;
    disableSelectionBehavior?: boolean;
    showCountryLabel?: boolean;
}

/**
 * Solo Game Controller
 *
 * Extends BaseGameController with solo game-specific features:
 * - CountrySelectionBehavior for hover/click animations
 * - CountryLabelUI for displaying country names
 * - Inspector and debug shortcuts
 */
export class SoloGameController extends BaseGameController {
    // Solo-specific modules
    private selectionBehavior: CountrySelectionBehavior | null = null;
    private countryLabelUI: CountryLabelUI | null = null;

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

        // Create selection behavior (unless disabled)
        if (!(this.options as SoloGameOptions).disableSelectionBehavior) {
            this.selectionBehavior = new CountrySelectionBehavior(
                this.globe.getScene(),
                this.advancedTexture,
                (countryIndex, altitude) => this.globe.setCountryAltitude(countryIndex, altitude),
                (countryIndex) => this.globe.getCountryAltitude(countryIndex),
                (countryIndex, saturation) => this.globe.setCountrySaturation(countryIndex, saturation),
                (countryIndex) => this.globe.getCountrySaturation(countryIndex)
            );

            // Wire PinManager to highlight countries
            this.pinManager.onCountryHover((country, latLon) => {
                this.selectionBehavior?.onCountrySelected(country, latLon);
            });
        }
    }

    protected recreateAdditionalUI(): void {
        if (!this.advancedTexture) return;

        // Recreate selection behavior
        if (!(this.options as SoloGameOptions).disableSelectionBehavior) {
            this.selectionBehavior = new CountrySelectionBehavior(
                this.globe.getScene(),
                this.advancedTexture,
                (countryIndex, altitude) => this.globe.setCountryAltitude(countryIndex, altitude),
                (countryIndex) => this.globe.getCountryAltitude(countryIndex),
                (countryIndex, saturation) => this.globe.setCountrySaturation(countryIndex, saturation),
                (countryIndex) => this.globe.getCountrySaturation(countryIndex)
            );
            this.pinManager.onCountryHover((country, latLon) => {
                this.selectionBehavior?.onCountrySelected(country, latLon);
            });
        }
    }

    protected disposeAdditionalUI(): void {
        // Dispose old selection behavior
        if (this.selectionBehavior) {
            this.selectionBehavior.dispose();
            this.selectionBehavior = null;
        }
    }

    // =========================================================================
    // Public API - Solo-Specific Methods
    // =========================================================================

    getSelectionBehavior(): CountrySelectionBehavior | null {
        return this.selectionBehavior;
    }

    /**
     * Get the currently hovered country (from selection behavior).
     * Note: For raw country queries, use getGlobe().getCountryAtLatLon()
     */
    getHoveredCountry(): CountryPolygon | null {
        return this.hoveredCountry;
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
}
