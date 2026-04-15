import { defineConfig } from 'vite';
import { writeFileSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { routes } from './routes.config';
import { generateLandingPage } from './scripts/generate-landing';
import { buildPlugins, entryPoints } from './vite-shared.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // Allow embedded builds (e.g. under /games/eurovision/ on the main site) to
  // rewrite asset URLs at build time. Defaults to root for standalone deploys
  // and local dev.
  base: process.env.BASE_PATH ?? '/',
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
      input: Object.fromEntries(
        entryPoints.map(e => [e.name, join(__dirname, e.file)])
      ),
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

      // Same route rewrites for preview mode
      configurePreviewServer(server) {
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
    ...buildPlugins(__dirname),
  ]
});
