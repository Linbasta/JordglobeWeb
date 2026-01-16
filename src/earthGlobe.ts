/**
 * EarthGlobe - Main Application Class (Backward Compatible Wrapper)
 *
 * This file wraps the new earth-globe rendering module and adds game-specific
 * features like PinManager, CountrySelectionBehavior, and GUI elements.
 *
 * For pure rendering without game logic, use the earth-globe module directly:
 * import { EarthGlobe } from './earth-globe';
 */

// Re-export from new module for direct access
export { EarthGlobe as EarthGlobeCore } from './earth-globe';
export type { LatLon, CountryPolygon, CountryData, EarthGlobeOptions as EarthGlobeCoreOptions } from './earth-globe';
export { EARTH_RADIUS, COUNTRY_ALTITUDE } from './earth-globe';

import { Scene } from '@babylonjs/core/scene';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { Material } from '@babylonjs/core/Materials/material';
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';

// GUI imports
import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture';
import { Control } from '@babylonjs/gui/2D/controls/control';
import { Image } from '@babylonjs/gui/2D/controls/image';
import { Rectangle } from '@babylonjs/gui/2D/controls/rectangle';

// Import from earth-globe module
import {
    EarthGlobe as EarthGlobeCore,
    CountryPicker,
    COUNTRY_ALTITUDE,
    ANIMATION_AMPLITUDE
} from './earth-globe';
import type { LatLon, CountryPolygon, CountryData } from './earth-globe';

// Game-specific imports (these stay outside the module)
import { CountrySelectionBehavior } from './countrySelectionBehavior';
import { PinManager } from './pinManager';
import { CountryLabelUI } from './countryLabelUI';

// ============================================================================
// OPTIONS
// ============================================================================

export interface EarthGlobeOptions {
    onReady?: (globe: EarthGlobe) => void;
    disableSelectionBehavior?: boolean;
    showCountryLabel?: boolean;
    showPinUI?: boolean;  // Show pin button and bottom panel (default: true)
}

// ============================================================================
// EARTH GLOBE CLASS (Backward Compatible)
// ============================================================================

/**
 * EarthGlobe - Full application class with game-specific features
 *
 * This wraps the earth-globe rendering module and adds:
 * - PinManager for pin placement
 * - CountrySelectionBehavior for hover/click animations
 * - GUI elements (pin button, bottom panel)
 * - Inspector and debug shortcuts
 */
export class EarthGlobe {
    private core: EarthGlobeCore;
    private options: EarthGlobeOptions;

    // Game-specific modules
    private pinManager!: PinManager;
    private selectionBehavior: CountrySelectionBehavior | null = null;
    private countryLabelUI: CountryLabelUI | null = null;

    // GUI elements
    private advancedTexture: AdvancedDynamicTexture | null = null;
    private pinButtonImage: Image | null = null;
    private bottomPanel: Rectangle | null = null;

    // Loading screen elements
    private loadingProgress: HTMLElement | null;
    private loadingText: HTMLElement | null;
    private loadingScreen: HTMLElement | null;

    // Callbacks
    private onCountrySelected: ((country: CountryPolygon | null, latLon: LatLon) => void) | null = null;
    private onCountryHovered: ((country: CountryPolygon | null, latLon: LatLon) => void) | null = null;
    private hoveredCountry: CountryPolygon | null = null;

    constructor(canvasId: string = 'renderCanvas', options?: EarthGlobeOptions) {
        this.options = options || {};

        // Get loading screen elements
        this.loadingProgress = document.getElementById('loadingProgress');
        this.loadingText = document.getElementById('loadingText');
        this.loadingScreen = document.getElementById('loadingScreen');

        this.updateLoadingProgress(5, 'Initializing scene...');

        // Create the core globe
        this.core = new EarthGlobeCore({
            canvasId,
            onReady: async (core) => {
                this.updateLoadingProgress(75, 'Creating modules...');

                // Create PinManager
                this.pinManager = new PinManager(
                    core.getScene(),
                    core.getCamera(),
                    core.getCanvas(),
                    core.getCountryPicker(),
                    core.getEarthSphere(),
                    (material) => core.createUnlitMaterial(material)
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
                        core.getScene(),
                        this.advancedTexture,
                        (countryIndex, altitude) => core.setCountryAltitude(countryIndex, altitude),
                        (countryIndex) => core.getCountryAltitude(countryIndex),
                        (countryIndex, saturation) => core.setCountrySaturation(countryIndex, saturation),
                        (countryIndex) => core.getCountrySaturation(countryIndex)
                    );

                    // Wire PinManager to highlight countries
                    this.pinManager.onCountryHover((country, latLon) => {
                        this.selectionBehavior?.onCountrySelected(country, latLon);
                    });
                }

                // Setup pin button
                this.setupPinButton();

                // Wire PinManager to hide/show pin button
                this.pinManager.onPlacingModeChange((isPlacing) => {
                    if (this.pinButtonImage) {
                        this.pinButtonImage.isVisible = !isPlacing;
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
        return this.core.getScene();
    }

    getCamera(): ArcRotateCamera {
        return this.core.getCamera();
    }

    getEngine(): Engine {
        return this.core.getEngine();
    }

    getCanvas(): HTMLCanvasElement {
        return this.core.getCanvas();
    }

    getEarthSphere(): Mesh {
        return this.core.getEarthSphere();
    }

    getCountryPicker(): CountryPicker {
        return this.core.getCountryPicker();
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
        return this.core.createUnlitMaterial(originalMaterial);
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
        return this.core.positionAtLatLon(lat, lon, finalAltitude);
    }

    // =========================================================================
    // Public API - Country Queries
    // =========================================================================

    getCountryAtLatLon(lat: number, lon: number): CountryPolygon | null {
        return this.core.getCountryAtLatLon(lat, lon);
    }

    getAltitudeAtLatLon(lat: number, lon: number): number {
        return this.core.getAltitudeAtLatLon(lat, lon);
    }

    getHoveredCountry(): CountryPolygon | null {
        return this.hoveredCountry;
    }

    getCountryByISO2(iso2: string): CountryData | undefined {
        return this.core.getCountryByISO2(iso2);
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
        this.core.setCountryAltitude(countryIndex, altitude);
    }

    getCountryAltitude(countryIndex: number): number {
        return this.core.getCountryAltitude(countryIndex);
    }

    setCountrySaturation(countryIndex: number, saturation: number): void {
        this.core.setCountrySaturation(countryIndex, saturation);
    }

    getCountrySaturation(countryIndex: number): number {
        return this.core.getCountrySaturation(countryIndex);
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
        this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, this.core.getScene());
        this.advancedTexture.background = "";

        // Conditionally create pin UI
        if (this.options.showPinUI !== false) {
            // Pin button
            const pinScale = 0.5;
            this.pinButtonImage = new Image("pinButton", "/DefaultPin.png");
            this.pinButtonImage.width = `${196 * pinScale}px`;
            this.pinButtonImage.height = `${900 * pinScale}px`;
            this.pinButtonImage.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
            this.pinButtonImage.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
            this.pinButtonImage.top = "170px";
            this.pinButtonImage.left = "50px";
            this.pinButtonImage.rotation = 0.14;
            this.pinButtonImage.isPointerBlocker = true;
            this.advancedTexture.addControl(this.pinButtonImage);

            // Bottom panel
            this.bottomPanel = new Rectangle("bottomPanel");
            this.bottomPanel.width = "600px";
            this.bottomPanel.height = "150px";
            this.bottomPanel.thickness = 0;
            this.bottomPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
            this.bottomPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
            this.bottomPanel.top = "30px";
            this.bottomPanel.background = "#6496DC";
            this.bottomPanel.alpha = 1.0;
            this.bottomPanel.cornerRadius = 60;
            this.advancedTexture.addControl(this.bottomPanel);
        }
    }

    private setupPinButton(): void {
        if (!this.pinButtonImage) return;

        this.pinButtonImage.onPointerDownObservable.add(() => {
            this.pinButtonImage!.scaleX = 0.95;
            this.pinButtonImage!.scaleY = 0.95;
            this.pinManager.enterPlacingMode();
        });

        this.pinButtonImage.onPointerUpObservable.add(() => {
            this.pinButtonImage!.scaleX = 1.0;
            this.pinButtonImage!.scaleY = 1.0;
        });
    }

    private recreateGUI(): void {
        // Dispose old selection behavior
        if (this.selectionBehavior) {
            this.selectionBehavior.dispose();
            this.selectionBehavior = null;
        }

        // Dispose old GUI
        if (this.advancedTexture) {
            this.advancedTexture.dispose();
            this.advancedTexture = null;
        }
        this.pinButtonImage = null;
        this.bottomPanel = null;

        // Recreate GUI
        this.createGUI();

        // Recreate selection behavior
        if (this.advancedTexture && !this.options.disableSelectionBehavior) {
            this.selectionBehavior = new CountrySelectionBehavior(
                this.core.getScene(),
                this.advancedTexture,
                (countryIndex, altitude) => this.core.setCountryAltitude(countryIndex, altitude),
                (countryIndex) => this.core.getCountryAltitude(countryIndex),
                (countryIndex, saturation) => this.core.setCountrySaturation(countryIndex, saturation),
                (countryIndex) => this.core.getCountrySaturation(countryIndex)
            );
            this.pinManager.onCountryHover((country, latLon) => {
                this.selectionBehavior?.onCountrySelected(country, latLon);
            });
        }

        this.setupPinButton();
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

        const scene = this.core.getScene();
        if (scene.debugLayer.isVisible()) {
            scene.debugLayer.hide();
        } else {
            scene.debugLayer.show({ embedMode: true });
        }
    }

    private toggleWaterShaderControls(): void {
        const waterMaterial = this.core.getWaterMaterial();
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
