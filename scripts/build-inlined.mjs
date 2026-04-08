/**
 * Per-entry Vite build script.
 *
 * Builds each HTML entry point into a self-contained bundle with all
 * dependencies inlined. Supports selective rebuilding via build-manifest.json.
 *
 * Usage:
 *   node scripts/build-inlined.mjs              # build pages marked rebuild:true
 *   node scripts/build-inlined.mjs --all        # rebuild everything
 *   node scripts/build-inlined.mjs --pages party,host   # rebuild specific pages
 */

import { build } from 'vite';
import { readFileSync, writeFileSync, rmSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const manifestPath = join(rootDir, 'build-manifest.json');
const distDir = join(rootDir, 'dist');

// Dynamic import of shared config (TS via vite/tsx)
const { entryPoints, terserConfig, buildPlugins } = await import('../vite-shared.ts');
const { generateLandingPage } = await import('./generate-landing.ts');

// ---------------------------------------------------------------------------
// Parse CLI args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const buildAll = args.includes('--all');
const pagesFlag = args.find(a => a.startsWith('--pages'));
const pagesArgIndex = args.indexOf('--pages');
const explicitPages = pagesArgIndex >= 0 ? (args[pagesArgIndex + 1] || '').split(',').filter(Boolean) : [];

// ---------------------------------------------------------------------------
// Read or create manifest
// ---------------------------------------------------------------------------
let manifest = {};
if (existsSync(manifestPath)) {
  manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
}

// Get current git commit hash
function getCommitHash() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: rootDir, encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}

// ---------------------------------------------------------------------------
// Determine which pages to build
// ---------------------------------------------------------------------------
function pagesToBuild() {
  if (buildAll) return entryPoints.map(e => e.name);
  if (explicitPages.length > 0) return explicitPages;

  // Build pages marked rebuild:true, or pages not yet in manifest
  return entryPoints
    .filter(e => {
      const entry = manifest[e.name];
      return !entry || entry.rebuild;
    })
    .map(e => e.name);
}

const targets = pagesToBuild();

if (targets.length === 0) {
  console.log('No pages marked for rebuild. Use --all or --pages to force.');
  process.exit(0);
}

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
const commitHash = getCommitHash();
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

  // Update manifest
  manifest[name] = {
    commit: commitHash,
    builtAt: new Date().toISOString(),
    rebuild: false,
  };

  console.log(`   ✓ ${entry.file} built (commit: ${commitHash})\n`);
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

// ---------------------------------------------------------------------------
// Write updated manifest
// ---------------------------------------------------------------------------
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
console.log('✓ Updated build-manifest.json');
console.log(`\n✅ Done! Built ${targets.length} page(s).\n`);
