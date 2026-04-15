/**
 * Party Game Controller
 *
 * Extends BaseGameController for multiplayer party games.
 * - Multiplayer game integration
 * - Network communication for pin placement
 */

import type { LatLon, RegionPolygon, EarthGlobeAPI } from '../../earth-globe';

import { BaseGameController, BaseGameOptions } from '../../shared/controllers/base-game-controller';

export interface PartyGameOptions extends BaseGameOptions {
    onReady?: (controller: PartyGameController) => void;
    onPinPlaced?: (country: RegionPolygon | null, latLon: LatLon) => void;
}

/**
 * Party Game Controller
 *
 * Extends BaseGameController for multiplayer party games.
 * Currently minimal - just forwards pin placement events to the caller.
 */
export class PartyGameController extends BaseGameController {
    constructor(canvasId: string = 'renderCanvas', options?: PartyGameOptions) {
        super(canvasId, options);
        console.log('[PartyGameController] Initializing...');
    }

    // =========================================================================
    // BaseGameController Hooks
    // =========================================================================

    protected async onGlobeReady(globe: EarthGlobeAPI): Promise<void> {
        // Base class has already created PinManager at this point

        // Hide small country markers - party game only uses location-guess questions
        globe.getCountryController().hideAllSmallRegionMarkers();
    }

    protected onPinPlaced(country: RegionPolygon | null, latLon: LatLon): void {
        console.log('[PartyGameController] Pin placed:', country?.name || 'ocean', latLon);

        // Delegate to user callback if provided
        const options = this.options as PartyGameOptions;
        if (options.onPinPlaced) {
            options.onPinPlaced(country, latLon);
        }
    }

    // All public API methods are inherited from BaseGameController:
    // - getGlobe()
    // - getPinUI()
    // - positionAtLatLon()
}
