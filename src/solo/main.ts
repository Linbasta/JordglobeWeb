/**
 * Solo Game Entry Point
 *
 * Initializes the solo country guessing game
 */

import { SoloGameController } from './SoloGameController';
import { loadConfig } from '../shared/config/GlobalConfig';

// Export for external use
export { SoloGameController } from './SoloGameController';
export type { SoloGameOptions } from './SoloGameController';

// Auto-initialize when loaded directly in browser
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', async () => {
        // Load configuration first
        await loadConfig();

        const controller = new SoloGameController('renderCanvas', {
            onReady: () => {
                console.log('Solo game ready!');
            }
        });

        // Make controller available for debugging in console
        (window as any).soloGame = controller;
    });
}
