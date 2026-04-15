/**
 * Solo Game Entry Point
 *
 * Initializes the solo country guessing game
 */

import { SoloGameController } from './solo-game-controller';

// Export for external use
export { SoloGameController } from './solo-game-controller';
export type { SoloGameOptions } from './solo-game-controller';

// Auto-initialize when loaded directly in browser
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', async () => {
        const controller = new SoloGameController('renderCanvas', {
            onReady: () => {
                console.log('Solo game ready!');
            }
        });

        // Make controller available for debugging in console
        (window as any).soloGame = controller;
    });
}
