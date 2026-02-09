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
    },
    {
      path: '/country-quiz',
      file: 'country-quiz.html',
      title: 'Country Quiz',
      description: 'Test your geography knowledge'
    },
    {
      path: '/capitals-quiz',
      file: 'capitals-quiz.html',
      title: 'Capitals Quiz',
      description: 'Find capital cities on the globe'
    }
  ],

  // Development and testing pages
  // Note: files in public/tests/*.html are auto-discovered
  // Note: test-*.html files in project root are auto-discovered
  dev: [
    {
      path: '/bot-panel.html',
      title: 'Bot Control Panel',
      description: 'Simulate multiple players for testing'
    }
  ]
};
