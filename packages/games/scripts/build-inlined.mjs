/**
 * Per-entry Vite build script.
 *
 * Builds each HTML entry point into a self-contained bundle with all
 * dependencies inlined. Selective rebuilds are handled by turbo at the
 * package level (see turbo.json); this script always builds what it's told.
 *
 * Usage:
 *   node scripts/build-inlined.mjs                      # build all pages
 *   node scripts/build-inlined.mjs --pages party,host   # build specific pages
 */

import { build } from 'vite';
import { writeFileSync, rmSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist');

// Dynamic import of shared config (TS via vite/tsx)
const { entryPoints, terserConfig, buildPlugins } = await import('../vite-shared.ts');
const { generateLandingPage } = await import('./generate-landing.ts');

// ---------------------------------------------------------------------------
// Parse CLI args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const pagesArgIndex = args.indexOf('--pages');
const explicitPages = pagesArgIndex >= 0 ? (args[pagesArgIndex + 1] || '').split(',').filter(Boolean) : [];

// ---------------------------------------------------------------------------
// Determine which pages to build
// ---------------------------------------------------------------------------
const targets = explicitPages.length > 0 ? explicitPages : entryPoints.map(e => e.name);
const buildAll = explicitPages.length === 0;

console.log(`\n📦 Building ${targets.length} page(s): ${targets.join(', ')}\n`);

// ---------------------------------------------------------------------------
// Generate index.html before building
// ---------------------------------------------------------------------------
const indexHtml = generateLandingPage(rootDir);
writeFileSync(join(rootDir, 'index.html'), indexHtml, 'utf-8');
console.log('✓ Generated index.html\n');

// ---------------------------------------------------------------------------
// Clean dist on full rebuild, otherwise keep existing bundles
// ---------------------------------------------------------------------------
if (buildAll && existsSync(distDir)) {
  rmSync(distDir, { recursive: true, force: true });
  console.log('✓ Cleaned dist/\n');
}

// Ensure dist exists
if (!existsSync(distDir)) mkdirSync(distDir, { recursive: true });

// ---------------------------------------------------------------------------
// Remove old assets for pages being rebuilt
// ---------------------------------------------------------------------------
function removeOldAssets(pageName) {
  const assetsDir = join(distDir, 'assets');
  if (!existsSync(assetsDir)) return;
  const files = readdirSync(assetsDir);
  for (const file of files) {
    if (file.startsWith(pageName + '-') || file.startsWith(pageName + '.')) {
      rmSync(join(assetsDir, file), { force: true });
    }
  }
}

// ---------------------------------------------------------------------------
// Build each entry
// ---------------------------------------------------------------------------
const plugins = buildPlugins(rootDir);
let isFirst = !existsSync(join(distDir, 'assets'));

for (const name of targets) {
  const entry = entryPoints.find(e => e.name === name);
  if (!entry) {
    console.warn(`⚠ Unknown page: ${name}, skipping`);
    continue;
  }

  console.log(`🔨 Building ${entry.file}...`);
  removeOldAssets(name);

  const inputPath = join(rootDir, entry.file);

  await build({
    root: rootDir,
    configFile: false,
    publicDir: isFirst ? 'public' : false,
    appType: 'mpa',
    base: process.env.BASE_PATH ?? '/',
    build: {
      target: 'es2020',
      outDir: 'dist',
      emptyOutDir: false,
      sourcemap: false,
      minify: 'terser',
      terserOptions: terserConfig,
      chunkSizeWarningLimit: 5000,
      rollupOptions: {
        input: { [name]: inputPath },
        output: {
          inlineDynamicImports: true,
        },
      },
    },
    plugins: [
      // Strip consoleLogger
      plugins[0],
      // Obfuscator
      plugins[1],
      // Gzip (skip remove-dev-folders, we do it once at the end)
      plugins[3],
    ],
    logLevel: 'warn',
  });

  isFirst = false;

  console.log(`   ✓ ${entry.file} built\n`);
}

// ---------------------------------------------------------------------------
// Remove dev folders once
// ---------------------------------------------------------------------------
for (const folder of ['edit', 'tests']) {
  const folderPath = join(distDir, folder);
  try {
    rmSync(folderPath, { recursive: true, force: true });
  } catch { /* ignore */ }
}

console.log(`\n✅ Done! Built ${targets.length} page(s).\n`);
