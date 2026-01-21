/**
 * Solo Game Controller
 *
 * Wraps the EarthGlobe core with solo game-specific features:
 * - Pin placement and management
 * - Country selection visual feedback
 * - Pin UI (button and bottom panel)
 * - Country label display
 */

import { Scene } from '@babylonjs/core/scene';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { Material } from '@babylonjs/core/Materials/material';
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';
import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture';

import {
    EarthGlobe,
    CountryPicker,
    COUNTRY_ALTITUDE
} from '../earth-globe';
import type { LatLon, CountryPolygon, CountryData } from '../earth-globe';

import { CountrySelectionBehavior } from '../shared/behaviors/CountrySelectionBehavior';
import { PinManager } from '../shared/managers/PinManager';
import { CountryLabelUI } from '../shared/ui/CountryLabelUI';
import { PinUI } from '../shared/ui/PinUI';

export interface SoloGameOptions {
    onReady?: (controller: SoloGameController) => void;
    disableSelectionBehavior?: boolean;
    showCountryLabel?: boolean;
    showPinUI?: boolean;  // Show pin button and bottom panel (default: true)
}

/**
 * Solo Game Controller
 *
 * This controller wraps the EarthGlobe core and adds solo game-specific features:
 * - PinManager for pin placement
 * - CountrySelectionBehavior for hover/click animations
 * - PinUI for pin button and bottom panel
 * - CountryLabelUI for displaying country names
 * - Inspector and debug shortcuts
 */
export class SoloGameController {
    private globe: EarthGlobe;
    private options: SoloGameOptions;

    // Modules
    private pinManager!: PinManager;
    private selectionBehavior: CountrySelectionBehavior | null = null;
    private countryLabelUI: CountryLabelUI | null = null;
    private pinUI: PinUI | null = null;

    // GUI elements
    private advancedTexture: AdvancedDynamicTexture | null = null;

    // Loading screen elements
    private loadingProgress: HTMLElement | null;
    private loadingText: HTMLElement | null;
    private loadingScreen: HTMLElement | null;

    // Callbacks
    private onCountrySelected: ((country: CountryPolygon | null, latLon: LatLon) => void) | null = null;
    private onCountryHovered: ((country: CountryPolygon | null, latLon: LatLon) => void) | null = null;
    private hoveredCountry: CountryPolygon | null = null;

    constructor(canvasId: string = 'renderCanvas', options?: SoloGameOptions) {
        this.options = options || {};

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

                // Create PinManager
                this.pinManager = new PinManager(
                    globe.getScene(),
                    globe.getCamera(),
                    globe.getCanvas(),
                    globe.getCountryPicker(),
                    globe.getEarthSphere(),
                    (material) => globe.createUnlitMaterial(material)
                );
                await this.pinManager.init();

                this.updateLoadingProgress(90, 'Setting up UI...');

                // Create GUI
                this.createGUI();

                // Create country label UI (optional)
                if (this.options?.showCountryLabel && this.advancedTexture) {
                    this.countryLabelUI = new CountryLabelUI(this.advancedTexture);
                    this.countryLabelUI.show('Sweden');
                }

                // Create selection behavior (unless disabled)
                if (this.advancedTexture && !this.options.disableSelectionBehavior) {
                    this.selectionBehavior = new CountrySelectionBehavior(
                        globe.getScene(),
                        this.advancedTexture,
                        (countryIndex, altitude) => globe.setCountryAltitude(countryIndex, altitude),
                        (countryIndex) => globe.getCountryAltitude(countryIndex),
                        (countryIndex, saturation) => globe.setCountrySaturation(countryIndex, saturation),
                        (countryIndex) => globe.getCountrySaturation(countryIndex)
                    );

                    // Wire PinManager to highlight countries
                    this.pinManager.onCountryHover((country, latLon) => {
                        this.selectionBehavior?.onCountrySelected(country, latLon);
                    });
                }

                // Wire PinManager to hide/show pin button
                this.pinManager.onPlacingModeChange((isPlacing) => {
                    if (this.pinUI) {
                        this.pinUI.setPinButtonVisible(!isPlacing);
                    }
                });

                // Setup keyboard shortcuts
                this.setupKeyboardShortcuts();

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
    // Public API - Core Access
    // =========================================================================

    getScene(): Scene {
        return this.globe.getScene();
    }

    getCamera(): ArcRotateCamera {
        return this.globe.getCamera();
    }

    getEngine(): Engine {
        return this.globe.getEngine();
    }

    getCanvas(): HTMLCanvasElement {
        return this.globe.getCanvas();
    }

    getEarthSphere(): Mesh {
        return this.globe.getEarthSphere();
    }

    getCountryPicker(): CountryPicker {
        return this.globe.getCountryPicker();
    }

    getGlobe(): EarthGlobe {
        return this.globe;
    }

    // =========================================================================
    // Public API - Game-Specific Modules
    // =========================================================================

    getPinManager(): PinManager {
        return this.pinManager;
    }

    getSelectionBehavior(): CountrySelectionBehavior | null {
        return this.selectionBehavior;
    }

    // =========================================================================
    // Public API - Materials
    // =========================================================================

    createUnlitMaterial(originalMaterial: Material | null): ShaderMaterial {
        return this.globe.createUnlitMaterial(originalMaterial);
    }

    // =========================================================================
    // Public API - Coordinates
    // =========================================================================

    positionAtLatLon(lat: number, lon: number, altitude?: number, aboveCountry: boolean = true): {
        position: import('@babylonjs/core/Maths/math').Vector3;
        normal: import('@babylonjs/core/Maths/math').Vector3;
    } {
        const defaultAltitude = aboveCountry ? COUNTRY_ALTITUDE + 0.01 : 0.01;
        const finalAltitude = altitude !== undefined ? altitude : defaultAltitude;
        return this.globe.positionAtLatLon(lat, lon, finalAltitude);
    }

    // =========================================================================
    // Public API - Country Queries
    // =========================================================================

    getCountryAtLatLon(lat: number, lon: number): CountryPolygon | null {
        return this.globe.getCountryAtLatLon(lat, lon);
    }

    getAltitudeAtLatLon(lat: number, lon: number): number {
        return this.globe.getAltitudeAtLatLon(lat, lon);
    }

    getHoveredCountry(): CountryPolygon | null {
        return this.hoveredCountry;
    }

    getCountryByISO2(iso2: string): CountryData | undefined {
        return this.globe.getCountryByISO2(iso2);
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
    // Public API - Animation
    // =========================================================================

    setCountryAltitude(countryIndex: number, altitude: number): void {
        this.globe.setCountryAltitude(countryIndex, altitude);
    }

    getCountryAltitude(countryIndex: number): number {
        return this.globe.getCountryAltitude(countryIndex);
    }

    setCountrySaturation(countryIndex: number, saturation: number): void {
        this.globe.setCountrySaturation(countryIndex, saturation);
    }

    getCountrySaturation(countryIndex: number): number {
        return this.globe.getCountrySaturation(countryIndex);
    }

    // =========================================================================
    // Private - Loading Screen
    // =========================================================================

    private updateLoadingProgress(percent: number, text: string): void {
        if (this.loadingProgress) {
            this.loadingProgress.style.width = `${percent}%`;
        }
        if (this.loadingText) {
            this.loadingText.textContent = text;
        }
    }

    private hideLoadingScreen(): void {
        if (this.loadingScreen) {
            this.loadingScreen.classList.add('hidden');
        }
    }

    // =========================================================================
    // Private - GUI
    // =========================================================================

    private createGUI(): void {
        this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, this.globe.getScene());
        this.advancedTexture.background = "";

        // Conditionally create pin UI
        if (this.options.showPinUI !== false) {
            this.pinUI = new PinUI(this.advancedTexture);
            this.pinUI.create({
                onPinButtonPress: () => {
                    this.pinManager.enterPlacingMode();
                }
            });
        }
    }

    private recreateGUI(): void {
        // Dispose old selection behavior
        if (this.selectionBehavior) {
            this.selectionBehavior.dispose();
            this.selectionBehavior = null;
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

        // Recreate GUI
        this.createGUI();

        // Recreate selection behavior
        if (this.advancedTexture && !this.options.disableSelectionBehavior) {
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
