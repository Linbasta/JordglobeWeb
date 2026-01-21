/**
 * Party Game Controller
 *
 * Controller for the multiplayer party game client.
 * Wraps the EarthGlobe core with party-specific features:
 * - Pin placement and management
 * - Pin UI (button and bottom panel)
 * - Multiplayer game integration
 */

import { Scene } from '@babylonjs/core/scene';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture';

import {
    EarthGlobe,
    CountryPicker
} from '../../earth-globe';
import type { LatLon, CountryPolygon } from '../../earth-globe';

import { PinManager } from '../../shared/managers/PinManager';
import { PinUI } from '../../shared/ui/PinUI';

export interface PartyGameOptions {
    onReady?: (controller: PartyGameController) => void;
}

/**
 * Party Game Controller
 *
 * This controller wraps the EarthGlobe core for multiplayer party games:
 * - PinManager for pin placement
 * - PinUI for pin button and bottom panel
 * - Clean initialization order to ensure scene.pick() works correctly
 */
export class PartyGameController {
    private globe: EarthGlobe;
    private options: PartyGameOptions;

    // Modules
    private pinManager!: PinManager;
    private pinUI: PinUI | null = null;

    // GUI elements
    private advancedTexture: AdvancedDynamicTexture | null = null;

    constructor(canvasId: string = 'renderCanvas', options?: PartyGameOptions) {
        this.options = options || {};

        console.log('[PartyGameController] Initializing...');

        // Create the core globe
        this.globe = new EarthGlobe({
            canvasId,
            onReady: async (globe) => {
                console.log('[PartyGameController] Globe ready, creating modules...');

                // Create PinManager FIRST (before GUI)
                this.pinManager = new PinManager(
                    globe.getScene(),
                    globe.getCamera(),
                    globe.getCanvas(),
                    globe.getCountryPicker(),
                    globe.getEarthSphere(),
                    (material) => globe.createUnlitMaterial(material)
                );
                await this.pinManager.init();
                console.log('[PartyGameController] PinManager initialized');

                // Create GUI
                this.createGUI();
                console.log('[PartyGameController] GUI created');

                // Wire PinManager to hide/show pin button
                this.pinManager.onPlacingModeChange((isPlacing) => {
                    if (this.pinUI) {
                        this.pinUI.setPinButtonVisible(!isPlacing);
                    }
                });

                console.log('[PartyGameController] Ready!');

                // Call ready callback
                if (this.options.onReady) {
                    this.options.onReady(this);
                }
            }
        });
    }

    // =========================================================================
    // Public API - Core Access
    // =========================================================================

    /**
     * Get the underlying EarthGlobe instance.
     * Use this to access core globe functionality like:
     * - getScene(), getCamera(), getEngine(), getCanvas()
     * - getEarthSphere(), getCountryPicker()
     * - Material creation, coordinate conversion, country queries, etc.
     */
    getGlobe(): EarthGlobe {
        return this.globe;
    }

    // =========================================================================
    // Public API - Game-Specific Modules
    // =========================================================================

    getPinManager(): PinManager {
        return this.pinManager;
    }

    getPinUI(): PinUI | null {
        return this.pinUI;
    }

    // =========================================================================
    // Private - GUI
    // =========================================================================

    private createGUI(): void {
        // Create fullscreen UI texture
        this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, this.globe.getScene());
        this.advancedTexture.background = "";

        // Create pin UI
        this.pinUI = new PinUI(this.advancedTexture);
        this.pinUI.create({
            onPinButtonPress: () => {
                this.pinManager.enterPlacingMode();
            }
        });
    }
}
