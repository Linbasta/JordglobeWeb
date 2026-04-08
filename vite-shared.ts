import { rmSync } from 'fs';
import { join } from 'path';
import Obfuscator from 'javascript-obfuscator';
import viteCompression from 'vite-plugin-compression';
import type { Plugin } from 'vite';

export const entryPoints = [
  { name: 'main', file: 'index.html' },
  { name: 'party', file: 'party.html' },
  { name: 'host', file: 'host.html' },
  { name: 'bot-panel', file: 'bot-panel.html' },
  { name: 'country-quiz', file: 'country-quiz.html' },
  { name: 'capitals-quiz', file: 'capitals-quiz.html' },
  { name: 'country-game', file: 'country-game.html' },
  { name: 'medals', file: 'medals.html' },
  { name: 'video-quiz', file: 'video-quiz.html' },
  { name: 'eurovision', file: 'eurovision.html' },
  { name: 'minigames', file: 'minigames.html' },
];

export const terserConfig = {
  compress: {
    drop_console: true,
    drop_debugger: true,
    passes: 2,
  },
  mangle: true,
  format: {
    comments: false,
  },
};

const userChunkNames = [
  'eurovision', 'host', 'party', 'bot-panel',
  'country-quiz', 'capitals-quiz', 'country-game',
  'medals', 'video-quiz', 'minigames', 'flag-quiz', 'image-quiz',
  'base-game-controller', 'solo-game-controller', 'start-quiz-game',
  'result-overlay', 'end-game-overlay', 'mobile-app-ad',
];

export function buildPlugins(rootDir: string): Plugin[] {
  return [
    // Strip consoleLogger from production builds
    {
      name: 'strip-console-logger',
      apply: 'build',
      enforce: 'pre',
      resolveId(source) {
        if (source.includes('consoleLogger')) {
          return '\0empty-console-logger';
        }
      },
      load(id) {
        if (id === '\0empty-console-logger') {
          return 'export default {}';
        }
      }
    },
    // Obfuscate user code chunks only
    {
      name: 'obfuscate-user-chunks',
      apply: 'build' as const,
      renderChunk(code, chunk) {
        const isUserChunk = userChunkNames.some(name => chunk.fileName.includes(name));
        if (!isUserChunk) return null;
        const result = Obfuscator.obfuscate(code, {
          compact: true,
          controlFlowFlattening: true,
          controlFlowFlatteningThreshold: 0.75,
          numbersToExpressions: true,
          simplify: true,
          stringArray: false,
          splitStrings: false,
          reservedNames: ['onYouTubeIframeAPIReady'],
          sourceMap: false,
        });
        return { code: result.getObfuscatedCode(), map: null };
      },
    },
    // Remove dev-only folders from production build
    {
      name: 'remove-dev-folders',
      closeBundle() {
        const devFolders = ['edit', 'tests'];
        for (const folder of devFolders) {
          const folderPath = join(rootDir, 'dist', folder);
          try {
            rmSync(folderPath, { recursive: true, force: true });
            console.log(`✓ Removed dev folder from build: ${folder}/`);
          } catch {
            // Folder doesn't exist, that's fine
          }
        }
      }
    },
    // Pre-compress static assets with gzip
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024,
      deleteOriginFile: false,
    }) as Plugin,
  ];
}
