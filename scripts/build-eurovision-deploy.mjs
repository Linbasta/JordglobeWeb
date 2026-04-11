#!/usr/bin/env node
/**
 * Build Eurovision quiz and stage a self-contained deploy folder.
 *
 * Output: dist-eurovision/ — populated from an explicit ALLOW_LIST.
 *
 * Drift detection: after copying, scans the eurovision JS bundle for
 * absolute /asset paths and warns if any reference a file not in ALLOW_LIST.
 */

import { execSync } from 'child_process';
import { cpSync, rmSync, mkdirSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const srcDist = join(rootDir, 'dist');
const dstDist = join(rootDir, 'dist-eurovision');

// ---------------------------------------------------------------------------
// Explicit allow-list. Every entry has a verified loader in src/.
// See plan file or commit message for citations.
// ---------------------------------------------------------------------------
const ALLOW_LIST = [
    // Eurovision page + manifest + icons
    'eurovision.html',
    'eurovision-manifest.json',
    'favicon-32.png',
    'JordglobeIconSquare.png',
    'apple-touch-icon.png',

    // Result-overlay sprites
    'eurovision/1.png',
    'eurovision/2.png',
    'eurovision/3.png',
    'eurovision/4.png',
    'eurovision/5.png',
    'eurovision/6.png',

    // Globe runtime data (DEFAULT_ASSETS in src/earth-globe/constants.ts)
    'countries-enriched.bin',
    'segments.json',
    'lofi-colliders.json',
    'OceanDepthMap.png',
    'SpaceMidTexture.png',
    'SpaceTop.png',
    'SpaceBottom.png',
    'WorldTexture.png',

    // Pin model + UI + tutorial
    'BossPin.glb',
    'DefaultPin.png',
    'PointWhite0006.png',

    // Answer feedback (preloaded at module init)
    'Checkmark.png',
    'RedX.png',

    // Score bar (Eurovision uses scoreBarType: 'simple')
    'BlueButton.png',

    // Always-shown UI from start-quiz-game + mobile-init
    'phone-icon.svg',
    'qr-download.png',
    'AppIcon.png',

    // App store badges (result overlay)
    'app-store-badge.svg',
    'google-play-badge.png',

    // SEO: og:image (sitemap.xml and robots.txt are written inline below
    // since the eurovision deploy lives on its own subdomain and shouldn't
    // share the jordglobe.com sitemap.)
    'og-image.png',
];

// Files matched by glob (the hashed bundle filename varies per build).
const ALLOW_GLOBS = [
    { dir: 'assets', prefix: 'eurovision-', suffix: '.js' },
];

// ---------------------------------------------------------------------------
// 1. Inject SEO meta tags into eurovision.html (from seo-config.ts)
// ---------------------------------------------------------------------------
console.log('🏷  Injecting SEO meta tags...');
execSync('npx tsx scripts/inject-seo.ts', {
    cwd: rootDir,
    stdio: 'inherit',
});

// ---------------------------------------------------------------------------
// 2. Build Eurovision (deterministic — ignores manifest rebuild flags)
// ---------------------------------------------------------------------------
console.log('🔨 Building eurovision page...');
execSync('npx tsx scripts/build-inlined.mjs --pages eurovision', {
    cwd: rootDir,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' },
});

if (!existsSync(srcDist)) {
    console.error('✗ dist/ does not exist after build');
    process.exit(1);
}

// ---------------------------------------------------------------------------
// 2. Resolve glob entries to concrete filenames
// ---------------------------------------------------------------------------
const resolvedGlobFiles = [];
for (const g of ALLOW_GLOBS) {
    const dirPath = join(srcDist, g.dir);
    if (!existsSync(dirPath)) {
        console.error(`✗ ${g.dir}/ missing in dist/`);
        process.exit(1);
    }
    const matches = readdirSync(dirPath).filter(
        (f) => f.startsWith(g.prefix) && f.endsWith(g.suffix)
    );
    if (matches.length === 0) {
        console.error(`✗ No match for ${g.dir}/${g.prefix}*${g.suffix}`);
        process.exit(1);
    }
    for (const m of matches) resolvedGlobFiles.push(`${g.dir}/${m}`);
}

const allFiles = [...ALLOW_LIST, ...resolvedGlobFiles];

// ---------------------------------------------------------------------------
// 3. Clean destination
// ---------------------------------------------------------------------------
console.log('🧹 Cleaning dist-eurovision/...');
rmSync(dstDist, { recursive: true, force: true });
mkdirSync(dstDist, { recursive: true });

// ---------------------------------------------------------------------------
// 4. Copy each allow-listed file (preserving subdirectories)
// ---------------------------------------------------------------------------
let missing = 0;
for (const rel of allFiles) {
    const srcPath = join(srcDist, rel);
    const dstPath = join(dstDist, rel);
    if (!existsSync(srcPath)) {
        console.error(`  ✗ MISSING in dist/: ${rel}`);
        missing++;
        continue;
    }
    mkdirSync(dirname(dstPath), { recursive: true });
    cpSync(srcPath, dstPath);
}
if (missing > 0) {
    console.error(`\n✗ ${missing} allow-listed file(s) missing from dist/. Did the build succeed?`);
    process.exit(1);
}
console.log(`✓ Copied ${allFiles.length} files to dist-eurovision/`);

// ---------------------------------------------------------------------------
// 5. Drift detection: scan the JS bundle for absolute /asset paths.
//    Warn (don't fail) if anything looks like an asset reference that we
//    didn't allow-list — likely indicates new code added an asset dependency.
// ---------------------------------------------------------------------------
const bundleFile = resolvedGlobFiles[0]; // e.g., assets/eurovision-XYZ.js
const bundleSource = readFileSync(join(srcDist, bundleFile), 'utf-8');

// Match absolute paths to common asset extensions
const ASSET_RE = /["'`](\/[A-Za-z0-9_./-]+\.(?:png|jpg|jpeg|svg|webp|woff2|wasm|bin|glb|gltf|hdr|env|dds|ktx|json))["'`]/g;
const discovered = new Set();
let m;
while ((m = ASSET_RE.exec(bundleSource)) !== null) {
    discovered.add(m[1].slice(1)); // strip leading "/"
}

// Filter out allow-listed entries and known-irrelevant patterns.
const allowedSet = new Set(allFiles);
const ignorePrefixes = [
    'provinces/',
    'province-segments/',
    '_flags/',
    'medals.json',
    'locations.json',
    'countries-enriched.json',
    'countries.json',
];
const unexplained = [...discovered].filter((p) => {
    if (allowedSet.has(p)) return false;
    if (ignorePrefixes.some((pre) => p === pre || p.startsWith(pre))) return false;
    return true;
});

if (unexplained.length > 0) {
    console.warn('\n⚠ Drift detected: the bundle references these paths but they are NOT in the allow-list:');
    for (const u of unexplained) console.warn(`    /${u}`);
    console.warn('  → Add them to ALLOW_LIST in scripts/build-eurovision-deploy.mjs if Eurovision actually needs them.');
} else {
    console.log('✓ No drift — bundle does not reference any non-allow-listed assets.');
}

// ---------------------------------------------------------------------------
// 6. Write eurovision-specific sitemap.xml and robots.txt.
//    These live on eurovision.jordglobe.com and must NOT be the shared
//    jordglobe.com versions (cross-domain sitemaps confuse Google).
// ---------------------------------------------------------------------------
const eurovisionSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://eurovision.jordglobe.com/</loc>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;
writeFileSync(join(dstDist, 'sitemap.xml'), eurovisionSitemap, 'utf-8');

const eurovisionRobots = `# Robots.txt for eurovision.jordglobe.com
User-agent: *
Allow: /

Sitemap: https://eurovision.jordglobe.com/sitemap.xml
`;
writeFileSync(join(dstDist, 'robots.txt'), eurovisionRobots, 'utf-8');

console.log('✓ Wrote eurovision-specific sitemap.xml and robots.txt');

console.log(`\n✅ dist-eurovision/ ready (${allFiles.length + 2} files).`);
