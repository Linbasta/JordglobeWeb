// Babylon.js Earth Globe Application
// Main entry point - initializes EarthGlobe

// Inspector - only include in development builds
if (import.meta.env.DEV) {
    import('@babylonjs/inspector');
}

import { EarthGlobe } from '../../earth-globe';
import { PinManager } from '../../shared/managers/PinManager';
import { CountrySelectionBehavior } from '../../shared/behaviors/CountrySelectionBehavior';
import { Game } from './game';

// Initialize the application when page loads
window.addEventListener('DOMContentLoaded', () => {
    let pinManager: PinManager;
    let selectionBehavior: CountrySelectionBehavior;

    const globe = new EarthGlobe({
        canvasId: 'renderCanvas',
        onReady: async (globeInstance) => {
            // Globe is now fully initialized, safe to wire up callbacks

            // Create PinManager
            pinManager = new PinManager(
                globeInstance.getScene(),
                globeInstance.getCamera(),
                globeInstance.getCanvas(),
                globeInstance.getCountryPicker(),
                globeInstance.getEarthSphere(),
                (material) => globeInstance.createUnlitMaterial(material)
            );
            await pinManager.init();

            // Create SelectionBehavior (for animateToCleared)
            const advancedTexture = (await import('@babylonjs/gui/2D/advancedDynamicTexture')).AdvancedDynamicTexture.CreateFullscreenUI("UI", true, globeInstance.getScene());
            selectionBehavior = new CountrySelectionBehavior(
                globeInstance.getScene(),
                advancedTexture,
                (countryIndex, altitude) => globeInstance.setCountryAltitude(countryIndex, altitude),
                (countryIndex) => globeInstance.getCountryAltitude(countryIndex),
                (countryIndex, state) => globeInstance.setCountryState(countryIndex, state),
                (countryIndex) => globeInstance.getCountryState(countryIndex),
                (countryIndex, blend) => globeInstance.setCountryBlend(countryIndex, blend),
                (countryIndex) => globeInstance.getCountryBlend(countryIndex)
            );

            // Create and start game (host-specific logic)
            const game = new Game();
            game.start();

            // Wire PinManager to Game for pin placement
            pinManager.onPinPlaced((country, latLon) => {
                game.handlePinPlaced(country, latLon);
            });

            // Wire Game to globe animations when country is cleared
            game.onCountryCleared((country) => {
                if (selectionBehavior) {
                    selectionBehavior.animateToCleared(country.countryIndex);
                    selectionBehavior.clearSelectionState();
                }
            });
        }
    });

    // Make the globe accessible globally for debugging and external use
    (window as unknown as { earthGlobe: EarthGlobe }).earthGlobe = globe;
});

// Export for external use
export { EarthGlobe };
export type { CountryPolygon, LatLon } from '../../earth-globe';
