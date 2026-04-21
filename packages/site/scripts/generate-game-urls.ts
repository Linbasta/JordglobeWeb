#!/usr/bin/env tsx
/**
 * Generates the list of published-game URLs for Astro's sitemap.
 *
 * Reads packages/games/src/games/manifests.ts (single source of truth),
 * filters to `published: true`, expands locales, writes JSON consumed by
 * customPages in astro.config.mjs.
 *
 * Wired as `prebuild` in package.json — runs automatically before `astro build`.
 */

import { manifests } from '../../games/src/games/manifests';
import { gameCanonicalUrl } from '../../games/src/games/config';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const urls: string[] = [];
for (const m of manifests) {
    if (!m.published) continue;
    for (const lang of Object.keys(m.locales)) {
        urls.push(gameCanonicalUrl(m, lang));
    }
}

const outPath = resolve(__dirname, '../src/data/game-urls.json');
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(urls, null, 2) + '\n', 'utf-8');
console.log(`✓ Wrote ${urls.length} game URL(s) to src/data/game-urls.json`);
