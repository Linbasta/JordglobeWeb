/**
 * Solo Game Entry Point
 *
 * Initializes the solo country guessing game
 */

import { SoloGameController } from './SoloGameController';

// Export for external use
export { SoloGameController } from './SoloGameController';
export type { SoloGameOptions } from './SoloGameController';

// Auto-initialize when loaded directly in browser
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', async () => {
        const controller = new SoloGameController('renderCanvas', {
            onReady: (controller) => {
                console.log('Solo game ready!');

                // Example: Access the globe
                const globe = controller.getGlobe();

                // Example: Access pin manager
                const pinManager = controller.getPinManager();
            }
        });

        // Make controller available for debugging in console
        (window as any).soloGame = controller;
    });
}
