#!/usr/bin/env node
/**
 * Build Eurovision for embedded deployment under a base path (default
 * /games/eurovision/) on the main jordglobe.com site.
 *
 * Strategy: run the standalone build (which emits dist-eurovision/ with
 * absolute "/foo" asset paths), copy the result to dist-eurovision-embedded/,
 * and rewrite every allow-listed asset path to "<BASE_PATH>foo" in both the
 * HTML entry and the single JS bundle.
 *
 * Why post-process instead of Vite base: many assets are referenced as plain
 * string literals in .ts source (e.g. DEFAULT_ASSETS, BlueButton.png, etc.).
 * Vite only rewrites refs it discovers through the module graph; it won't
 * touch those literals. The allow-list in build-eurovision-deploy.mjs is
 * already the source of truth for "what Eurovision actually loads", so we
 * reuse it here.
 *
 * Env:
 *   BASE_PATH       Defaults to /games/eurovision/. Must start and end with /.
 *   EMBED_OUT_DIR   Output dir. Defaults to dist-eurovision-embedded/.
 */

import { execSync } from 'child_process';
import { cpSync, rmSync, mkdirSync, existsSync, readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const BASE_PATH = process.env.BASE_PATH ?? '/games/eurovision/';
if (!BASE_PATH.startsWith('/') || !BASE_PATH.endsWith('/')) {
    console.error(`✗ BASE_PATH must start and end with "/", got: ${BASE_PATH}`);
    process.exit(1);
}

const srcDir = join(rootDir, 'dist-eurovision');
const dstDir = join(rootDir, process.env.EMBED_OUT_DIR ?? 'dist-eurovision-embedded');

// ---------------------------------------------------------------------------
// 1. Run standalone build first. It produces dist-eurovision/ and is the
//    source of truth for which files Eurovision needs.
//
//    Set SKIP_BUILD=1 to reuse an existing dist-eurovision/ — useful when
//    iterating on path-rewrite logic.
// ---------------------------------------------------------------------------
if (process.env.SKIP_BUILD !== '1') {
    console.log('🔨 Running standalone eurovision build...');
    execSync('node scripts/build-eurovision-deploy.mjs', {
        cwd: rootDir,
        stdio: 'inherit',
    });
} else {
    console.log('⏭  SKIP_BUILD=1 — reusing existing dist-eurovision/');
}

// ---------------------------------------------------------------------------
// 2. Collect the flat list of files actually present in dist-eurovision/.
//    These are exactly what we need to rewrite paths for.
// ---------------------------------------------------------------------------
function walk(dir, out = [], prefix = '') {
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        const rel = prefix ? `${prefix}/${entry}` : entry;
        if (statSync(full).isDirectory()) walk(full, out, rel);
        else out.push(rel);
    }
    return out;
}

if (!existsSync(srcDir)) {
    console.error(`✗ ${srcDir} missing after standalone build`);
    process.exit(1);
}

const allFiles = walk(srcDir);

// ---------------------------------------------------------------------------
// 3. Copy dist-eurovision/ → dist-eurovision-embedded/
// ---------------------------------------------------------------------------
console.log(`🧹 Cleaning ${relative(rootDir, dstDir)}/...`);
rmSync(dstDir, { recursive: true, force: true });
mkdirSync(dstDir, { recursive: true });

console.log(`📦 Copying files to ${relative(rootDir, dstDir)}/...`);
cpSync(srcDir, dstDir, { recursive: true });

// ---------------------------------------------------------------------------
// 4. Drop standalone-subdomain artifacts that don't belong on the main site.
//    Sitemap/robots for eurovision.jordglobe.com would conflict with the
//    main site's own sitemap/robots.
// ---------------------------------------------------------------------------
for (const f of ['sitemap.xml', 'robots.txt']) {
    const p = join(dstDir, f);
    if (existsSync(p)) rmSync(p);
}

// ---------------------------------------------------------------------------
// 5. Rewrite asset paths.
//
//    For every file name that exists in the tree (including nested ones like
//    "eurovision/1.png" and "assets/eurovision-XYZ.js"), we rewrite any
//    occurrence of the absolute form "/<name>" to "<BASE_PATH><name>" inside
//    text files that can reference assets.
//
//    We do this against a sorted-by-length-desc list so that longer paths
//    (e.g. "eurovision/1.png") are replaced before shorter ones
//    ("eurovision/") that would otherwise match as substrings.
// ---------------------------------------------------------------------------
// Directory prefixes derived from nested file paths (e.g. "eurovision/"
// from "eurovision/1.png"). These catch runtime-built paths like
// `"/eurovision/" + i + ".png"` which no single-file match can cover.
// We skip "assets/" — it's the bundle's own directory, referenced only by
// the HTML entry's <script src>, which is already rewritten as a full path.
const dirPrefixes = new Set();
for (const rel of allFiles) {
    const parts = rel.split('/');
    for (let i = 1; i < parts.length; i++) {
        const prefix = parts.slice(0, i).join('/') + '/';
        if (prefix === 'assets/') continue;
        dirPrefixes.add(prefix);
    }
}

const assetPaths = [
    ...allFiles.filter((p) => !p.endsWith('.gz')),
    ...dirPrefixes,
]
    .slice()
    .sort((a, b) => b.length - a.length);

// Files where we do the rewrite. Don't touch binary assets.
const REWRITE_EXTS = new Set(['.html', '.js', '.css', '.json', '.svg', '.xml', '.txt', '.webmanifest']);
const rewriteTargets = walk(dstDir).filter((rel) => {
    const dot = rel.lastIndexOf('.');
    if (dot < 0) return false;
    return REWRITE_EXTS.has(rel.slice(dot).toLowerCase());
});

function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

let totalReplacements = 0;
for (const relPath of rewriteTargets) {
    const full = join(dstDir, relPath);
    let text = readFileSync(full, 'utf-8');
    const before = text;

    for (const asset of assetPaths) {
        // Match "/asset" with a non-word char before (or start) so we don't
        // hit "https://example.com/foo" or "something/foo". Must be preceded
        // by a quote, paren, =, whitespace, or angle-bracket — i.e. a URL
        // boundary in HTML/JS/CSS.
        const re = new RegExp(
            `(^|[\\s"'\`(=<>,;:])(\\/)${escapeRegex(asset)}(?![A-Za-z0-9._-])`,
            'g'
        );
        text = text.replace(re, (_m, pre) => pre + BASE_PATH + asset);
    }

    // Special case: BossPin is loaded via Babylon's ImportMeshAsync, which
    // splits rootUrl and filename across two args: ("", "/", "BossPin.glb").
    // The "/" rootUrl wasn't caught above because it isn't followed by the
    // filename in the same string. Rewrite this specific pattern.
    text = text.replace(
        /ImportMeshAsync\(("[^"]*"),\s*"\/",/g,
        (_m, firstArg) => `ImportMeshAsync(${firstArg},"${BASE_PATH}",`
    );

    // Canonical / og:url / twitter image pointed at eurovision.jordglobe.com
    // on the standalone build. On the main site they should reflect the real
    // URL. We don't know the public hostname for sure here, so strip the
    // subdomain form — leaving only the path — which is safer than guessing.
    if (relPath.endsWith('.html')) {
        text = text.replace(
            /https:\/\/eurovision\.jordglobe\.com\//g,
            `https://jordglobe.com${BASE_PATH}`
        );
    }

    if (text !== before) {
        writeFileSync(full, text, 'utf-8');
        totalReplacements++;
    }
}

console.log(`✓ Rewrote asset paths in ${totalReplacements} file(s) using base "${BASE_PATH}"`);

// ---------------------------------------------------------------------------
// 6. Sanity check: the rewritten JS bundle should no longer contain
//    "/<allow-listed-asset>" patterns, and HTML should have base-prefixed
//    hrefs.
// ---------------------------------------------------------------------------
const assetsDir = join(dstDir, 'assets');
if (existsSync(assetsDir)) {
    const bundles = readdirSync(assetsDir).filter((f) => f.endsWith('.js'));
    for (const b of bundles) {
        const src = readFileSync(join(assetsDir, b), 'utf-8');
        const stillAbsolute = [];
        for (const asset of assetPaths) {
            if (asset.startsWith('assets/')) continue; // self-reference
            const re = new RegExp(`["'\`]\\/${escapeRegex(asset)}(?![A-Za-z0-9._-])`);
            if (re.test(src)) stillAbsolute.push(asset);
        }
        if (stillAbsolute.length) {
            console.warn(`⚠ Bundle ${b} still has absolute refs to:`);
            for (const a of stillAbsolute) console.warn(`    /${a}`);
        }
    }
}

// Remove .gz twins — they were pre-compressed for the standalone site; the
// main site serves via its own hosting layer and regenerates compression as
// needed.
for (const rel of walk(dstDir)) {
    if (rel.endsWith('.gz')) rmSync(join(dstDir, rel));
}

// The main site's deploy pipeline (JordglobeSite/scripts/deploy.sh) looks
// for index.html in the source dir. Alias eurovision.html so both forms
// exist — keeps standalone URLs working and satisfies the main-site pull.
cpSync(join(dstDir, 'eurovision.html'), join(dstDir, 'index.html'));

console.log(`\n✅ ${relative(rootDir, dstDir)}/ ready for embedding at ${BASE_PATH}`);
