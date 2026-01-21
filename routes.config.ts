/**
 * Centralized Route Configuration
 * Single source of truth for all application routes
 * Used to generate both landing page and Vite rewrites
 */

export interface Route {
  path: string;
  file?: string;  // Target file (if different from path)
  title: string;
  description: string;
}

export interface RoutesConfig {
  main: Route[];
  dev: Route[];
}

export const routes: RoutesConfig = {
  // Main application routes
  main: [
    {
      path: '/country-game',
      file: 'country-game.html',
      title: 'Country Guessing Game',
      description: 'Solo mode - Explore and interact with the 3D globe'
    },
    {
      path: '/host',
      file: 'host.html',
      title: 'JordGlobe Party (Host)',
      description: 'Host a multiplayer game with leaderboard'
    },
    {
      path: '/party',
      file: 'party.html',
      title: 'JordGlobe Party (Player)',
      description: 'Join a multiplayer game on mobile'
    }
  ],

  // Development and testing pages
  dev: [
    {
      path: '/bot-panel.html',
      title: 'Bot Control Panel',
      description: 'Simulate multiple players for testing'
    },
    {
      path: '/tests/test-arcs.html',
      title: 'Arc Drawer Test',
      description: 'Test geodesic arc animations'
    },
    {
      path: '/tests/test-water-shader.html',
      title: 'Water Shader Test',
      description: 'Test ocean rendering effects'
    },
    {
      path: '/tests/test-pin-replay.html',
      title: 'Pin Replay Animation',
      description: 'Test pin movement recording/replay'
    },
    {
      path: '/test-multi-pin.html',
      title: 'Multi-Pin Test',
      description: 'Test multiple pin placement'
    }
  ]
};
