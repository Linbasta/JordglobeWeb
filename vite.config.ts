import { defineConfig } from 'vite';
import { writeFileSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { routes } from './routes.config';
import { generateLandingPage } from './scripts/generate-landing';
import Obfuscator from 'javascript-obfuscator';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  server: {
    port: 4817,
    open: true,
    allowedHosts: true,
    proxy: {
      '/api': { target: 'http://localhost:3003', changeOrigin: true }
    }
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 2,
      },
      mangle: true,
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      input: {
        main: join(__dirname, 'index.html'),
        party: join(__dirname, 'party.html'),
        host: join(__dirname, 'host.html'),
        'bot-panel': join(__dirname, 'bot-panel.html'),
        'country-quiz': join(__dirname, 'country-quiz.html'),
        'capitals-quiz': join(__dirname, 'capitals-quiz.html'),
        'country-game': join(__dirname, 'country-game.html'),
        'medals': join(__dirname, 'medals.html'),
        'video-quiz': join(__dirname, 'video-quiz.html'),
        'eurovision': join(__dirname, 'eurovision.html'),
        'minigames': join(__dirname, 'minigames.html')
      }
    }
  },
  publicDir: 'public',
  appType: 'mpa',
  plugins: [
    {
      name: 'routes-plugin',
      configureServer(server) {
        // Generate landing page on startup
        const html = generateLandingPage(__dirname);
        const indexPath = join(__dirname, 'index.html');
        writeFileSync(indexPath, html, 'utf-8');
        console.log('✓ Generated index.html from routes.config.ts');

        // Watch routes.config.ts and test files for changes
        const routesConfigPath = join(__dirname, 'routes.config.ts');
        server.watcher.add(routesConfigPath);

        const regenerate = () => {
          const updatedHtml = generateLandingPage(__dirname);
          writeFileSync(indexPath, updatedHtml, 'utf-8');
          server.ws.send({ type: 'full-reload', path: '/' });
          console.log('✓ Index.html regenerated and page reloaded');
        };

        const isTestFile = (file: string) =>
          dirname(file) === __dirname && file.endsWith('.html') && file.includes('/test-');

        server.watcher.on('change', (file) => {
          if (file === routesConfigPath) {
            console.log('🔄 Routes config changed, regenerating index.html...');
            regenerate();
          }
        });

        server.watcher.on('add', (file) => {
          if (isTestFile(file)) {
            console.log('🔄 New test file detected, regenerating index.html...');
            regenerate();
          }
        });

        server.watcher.on('unlink', (file) => {
          if (isTestFile(file)) {
            console.log('🔄 Test file removed, regenerating index.html...');
            regenerate();
          }
        });

        // Auto-generate route rewrites from config
        server.middlewares.use((req, res, next) => {
          routes.main.forEach(route => {
            if (route.file && (req.url === route.path || req.url === route.path + '/')) {
              req.url = '/' + route.file;
            }
          });
          next();
        });
      },

      // Also generate during build
      buildStart() {
        const html = generateLandingPage(__dirname);
        const indexPath = join(__dirname, 'index.html');
        writeFileSync(indexPath, html, 'utf-8');
        console.log('✓ Generated index.html for build');
      }
    },
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
    // Obfuscate user code chunks only (runs after Vite resolves all imports)
    {
      name: 'obfuscate-user-chunks',
      apply: 'build' as const,
      renderChunk(code, chunk) {
        const userChunks = [
          'eurovision', 'host', 'party', 'bot-panel',
          'country-quiz', 'capitals-quiz', 'country-game',
          'medals', 'video-quiz', 'minigames', 'flag-quiz', 'image-quiz',
          'base-game-controller', 'solo-game-controller', 'start-quiz-game',
          'result-overlay', 'end-game-overlay', 'mobile-app-ad',
        ];
        const isUserChunk = userChunks.some(name => chunk.fileName.includes(name));
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
          const folderPath = join(__dirname, 'dist', folder);
          try {
            rmSync(folderPath, { recursive: true, force: true });
            console.log(`✓ Removed dev folder from build: ${folder}/`);
          } catch {
            // Folder doesn't exist, that's fine
          }
        }
      }
    }
  ]
});
