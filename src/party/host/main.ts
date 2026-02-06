// Babylon.js Earth Globe Application
// Main entry point - initializes EarthGlobe

// Inspector - only include in development builds
if (import.meta.env.DEV) {
    import('@babylonjs/inspector');
}

import { EarthGlobe } from '../../earth-globe';
import { initPinManager, onPinPlaced } from '../../shared/managers/PinManager';
import { animateToCleared } from '../../shared/animations/CountryAnimations';
import { Game } from './game';

// Initialize the application when page loads
window.addEventListener('DOMContentLoaded', () => {
    const globe = new EarthGlobe({
        canvasId: 'renderCanvas',
        onReady: async (globeInstance) => {
            // Globe is now fully initialized, safe to wire up callbacks

            // Initialize PinManager
            await initPinManager(
                globeInstance.getScene(),
                globeInstance.getCamera(),
                globeInstance.getCanvas(),
                globeInstance.getCountryPicker(),
                globeInstance.getEarthSphere(),
                (material) => globeInstance.createUnlitMaterial(material),
                (countryIndex) => globeInstance.getCountryAltitude(countryIndex)
            );

            // Create and start game (host-specific logic)
            const game = new Game();
            game.start();

            // Wire PinManager to Game for pin placement
            onPinPlaced((country, latLon) => {
                game.handlePinPlaced(country, latLon);
            });

            // Wire Game to globe animations when country is cleared
            game.onCountryCleared((country) => {
                animateToCleared(globeInstance, country.countryIndex);
            });
        }
    });

    // Make the globe accessible globally for debugging and external use
    (window as unknown as { earthGlobe: EarthGlobe }).earthGlobe = globe;
});

// Export for external use
export { EarthGlobe };
export type { CountryPolygon, LatLon } from '../../earth-globe';
