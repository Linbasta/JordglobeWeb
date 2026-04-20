#!/usr/bin/env node
/**
 * Build Eurovision quiz and stage a self-contained deploy folder.
 *
 * Two modes, selected by BASE_PATH env var:
 *
 *   BASE_PATH unset (or "/")  — Standalone deploy for eurovision.jordglobe.com.
 *                               Output: dist-eurovision/. Includes sitemap.xml
 *                               and robots.txt scoped to that subdomain.
 *
 *   BASE_PATH="/games/foo/"   — Embedded deploy for a subpath on the main
 *                               site. Output: dist-eurovision-embedded/.
 *                               Aliases eurovision.html → index.html. No
 *                               sitemap/robots (main site owns those). Asset
 *                               URLs are already rewritten at Vite build time
 *                               via the base config + asset() helper.
 *
 * Output directory can be overridden with OUT_DIR.
 */

import { execSync } from 'child_process';
import { cpSync, rmSync, mkdirSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const srcDist = join(rootDir, 'dist');

const BASE_PATH = process.env.BASE_PATH ?? '/';
if (!BASE_PATH.startsWith('/') || !BASE_PATH.endsWith('/')) {
    console.error(`✗ BASE_PATH must start and end with "/", got: ${BASE_PATH}`);
    process.exit(1);
}
const isEmbedded = BASE_PATH !== '/';
const dstDist = join(rootDir, process.env.OUT_DIR ?? (isEmbedded ? 'dist-eurovision-embedded' : 'dist-eurovision'));

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

    // Mobile-app-ad banner (shown during gameplay on desktop)
    'eurovision/blue_gradient.png',
    'eurovision/4_phones.png',

    // Start panel (showStartPanel in eurovision.html)
    'green_btn.png',
    'eurovision/eurovision_avatar_triplets.png',

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
    'qr-download.png',
    'AppIcon.png',

    // App store badges (result overlay)
    'app-store-badge.svg',
    'google-play-badge.png',

    // SEO: og:image (sitemap.xml and robots.txt are written inline below
    // since the eurovision deploy lives on its own subdomain and shouldn't
    // share the jordglobe.com sitemap.)
    'og-eurovision.jpg',

    // Answer SFX (preloaded by src/shared/sfx/sfx-player.ts)
    'sfx/correct_1.ogg',
    'sfx/correct_2.ogg',
    'sfx/correct_3.ogg',
    'sfx/correct_4.ogg',
    'sfx/correct_5.ogg',
    'sfx/correct_6.ogg',
    'sfx/correct_7.ogg',
    'sfx/incorrect.ogg',
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
console.log(`🔨 Building eurovision page (base=${BASE_PATH})...`);
execSync('npx tsx scripts/build-inlined.mjs --pages eurovision', {
    cwd: rootDir,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production', BASE_PATH },
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
console.log(`🧹 Cleaning ${relative(rootDir, dstDist)}/...`);
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
console.log(`✓ Copied ${allFiles.length} files to ${relative(rootDir, dstDist)}/`);

// ---------------------------------------------------------------------------
// 5. Drift detection: scan the JS bundle for absolute /asset paths.
//    Warn (don't fail) if anything looks like an asset reference that we
//    didn't allow-list — likely indicates new code added an asset dependency.
// ---------------------------------------------------------------------------
const bundleFile = resolvedGlobFiles[0]; // e.g., assets/eurovision-XYZ.js
const bundleSource = readFileSync(join(srcDist, bundleFile), 'utf-8');

// Match absolute paths to common asset extensions. In embedded mode all app
// assets are prefixed with BASE_PATH; in standalone mode with "/". Pull refs
// matching our configured base (plus the raw "/" form to catch any asset
// literal that wasn't routed through asset()).
const BASE_RE_PART = BASE_PATH.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ASSET_RE = new RegExp(
    `["'\`](?:${BASE_RE_PART}|\\/)([A-Za-z0-9_./-]+\\.(?:png|jpg|jpeg|svg|webp|woff2|wasm|bin|glb|gltf|hdr|env|dds|ktx|json))["'\`]`,
    'g'
);
const discovered = new Set();
let m;
while ((m = ASSET_RE.exec(bundleSource)) !== null) {
    discovered.add(m[1]);
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
    for (const u of unexplained) console.warn(`    ${BASE_PATH}${u}`);
    console.warn('  → Add them to ALLOW_LIST in scripts/build-eurovision-deploy.mjs if Eurovision actually needs them.');
} else {
    console.log('✓ No drift — bundle does not reference any non-allow-listed assets.');
}

// ---------------------------------------------------------------------------
// 6. Mode-specific finishing touches.
// ---------------------------------------------------------------------------
let extraCount = 0;
if (isEmbedded) {
    // The main site's deploy pipeline (JordglobeSite/scripts/deploy.sh) looks
    // for index.html in the source dir. Alias eurovision.html to satisfy it.
    cpSync(join(dstDist, 'eurovision.html'), join(dstDist, 'index.html'));
    extraCount = 1;
    console.log('✓ Aliased eurovision.html → index.html for embedded deploy');

    // Emit per-locale variants so each language has its own indexable URL
    // with localized <title>/description/OG/canonical plus reciprocal hreflang.
    // All variants share the same JS bundle; locale is picked at runtime from
    // <html lang>. See docs/TODO in scripts or games-seo.json for new locales.
    extraCount += emitLocaleVariants(dstDist);
} else {
    // Standalone subdomain gets its own sitemap/robots. Cross-domain sitemaps
    // confuse Google, so these must NOT be shared with jordglobe.com.
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
    extraCount = 2;
    console.log('✓ Wrote eurovision-specific sitemap.xml and robots.txt');
}

console.log(`\n✅ ${relative(rootDir, dstDist)}/ ready (${allFiles.length + extraCount} files, base="${BASE_PATH}").`);

// ---------------------------------------------------------------------------
// Per-locale HTML emission (embedded deploy only).
//
// Reads locale metadata from ../../shared/games-seo.json and, for every
// non-default locale with a full SEO entry, writes <locale>/index.html
// alongside the English index.html. Also injects reciprocal hreflang
// <link rel="alternate"> tags into every variant (including English).
//
// Only the HTML shell differs between locales — JS, assets, and bundle are
// all shared via a common BASE_PATH.
// ---------------------------------------------------------------------------
function emitLocaleVariants(dstDir) {
    const seoPath = join(rootDir, '../../shared/games-seo.json');
    const seo = JSON.parse(readFileSync(seoPath, 'utf-8'));
    const game = seo.games.eurovision;
    if (!game) {
        console.warn('⚠ No eurovision entry in games-seo.json — skipping locale variants');
        return 0;
    }

    const siteBase = game.baseUrlOverride || `${seo.siteUrl}/games/eurovision`;
    const enUrl = `${siteBase}/`;

    // Collect (code, strings) pairs for every locale defined on the game.
    // Keys other than 'en'/'sv' are tolerated — anything with {title, description}.
    const localeEntries = Object.entries(game).filter(
        ([, v]) => v && typeof v === 'object' && 'title' in v && 'description' in v
    );
    if (localeEntries.length <= 1) return 0; // Only English — nothing to emit.

    const urls = Object.fromEntries(
        localeEntries.map(([code]) => [code, code === 'en' ? enUrl : `${siteBase}/${code}/`])
    );

    // hreflang block referenced by every variant. x-default points to English.
    const hreflangBlock = [
        ...localeEntries.map(
            ([code]) => `<link rel="alternate" hreflang="${code}" href="${urls[code]}">`
        ),
        `<link rel="alternate" hreflang="x-default" href="${enUrl}">`,
    ].join('\n    ');

    // Source: the English index.html already generated by inject-seo + Vite.
    const enIndexPath = join(dstDir, 'index.html');
    const enHtml = readFileSync(enIndexPath, 'utf-8');

    let wrote = 0;
    for (const [code, strings] of localeEntries) {
        const html = transformHtmlForLocale(enHtml, code, strings, urls[code], game.image, seo, hreflangBlock);
        if (code === 'en') {
            writeFileSync(enIndexPath, html, 'utf-8');
            console.log('✓ Injected hreflang into index.html (en)');
        } else {
            const outPath = join(dstDir, code, 'index.html');
            mkdirSync(dirname(outPath), { recursive: true });
            writeFileSync(outPath, html, 'utf-8');
            console.log(`✓ Wrote ${code}/index.html`);
            wrote++;
        }
    }
    return wrote;
}

function transformHtmlForLocale(html, code, strings, pageUrl, image, seo, hreflangBlock) {
    const esc = (s) =>
        s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const ogTitle = strings.ogTitle || strings.title;
    const ogDescription = strings.ogDescription || strings.description;
    const imageUrl = `${seo.siteUrl}${image || seo.defaultImage}`;
    const twitterCard = seo.twitterCard || 'summary_large_image';

    const seoBlock = `<!-- SEO - Generated from build-eurovision-deploy.mjs (locale=${code}) -->
    <meta name="description" content="${esc(strings.description)}">
    <link rel="canonical" href="${pageUrl}">
    ${hreflangBlock}
    <!-- Open Graph -->
    <meta property="og:title" content="${esc(ogTitle)}">
    <meta property="og:description" content="${esc(ogDescription)}">
    <meta property="og:image" content="${imageUrl}">
    <meta property="og:url" content="${pageUrl}">
    <meta property="og:type" content="website">
    <meta property="og:locale" content="${code}">
    <!-- Twitter Card -->
    <meta name="twitter:card" content="${twitterCard}">
    <meta name="twitter:title" content="${esc(ogTitle)}">
    <meta name="twitter:description" content="${esc(ogDescription)}">
    <meta name="twitter:image" content="${imageUrl}">
    <!-- /SEO -->`;

    // Replace the SEO block (inject-seo.ts's marker, OR our own previous marker if re-running).
    const seoBlockPattern = /<!-- SEO - Generated from [^>]*-->[\s\S]*?<!-- \/SEO -->/;
    let out = html.replace(seoBlockPattern, seoBlock);

    // <title> and <html lang>
    out = out.replace(/<title>[^<]*<\/title>/, `<title>${esc(strings.title)}</title>`);
    out = out.replace(/<html\s+lang="[^"]*">/, `<html lang="${code}">`);

    return out;
}
