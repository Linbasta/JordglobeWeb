/**
 * Centralized SEO Configuration
 *
 * All SEO metadata for public-facing pages in one place.
 * Edit this file to update titles, descriptions, etc.
 *
 * The inject-seo.ts script reads this config and injects
 * the meta tags into HTML files during build.
 *
 * GAME PAGES: SEO for game pages (eurovision, etc.) is loaded from the
 * shared games-seo.json at ../../shared/games-seo.json (single source of truth).
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

export interface PageSEO {
    title: string;
    description: string;
    // Optional overrides (defaults to title/description if not set)
    ogTitle?: string;
    ogDescription?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    // Per-page OG/Twitter image path. Falls back to seoConfig.defaultImage.
    image?: string;
    /**
     * Override the base URL for canonical / og:url / twitter:url and og:image.
     * Use for pages hosted on a different domain than seoConfig.baseUrl.
     * When set, the page is treated as the root (/) of the override URL —
     * the filename-derived path is NOT appended.
     */
    baseUrlOverride?: string;
}

export interface SEOConfig {
    // Base URL for canonical links and og:url
    baseUrl: string;
    // Default OG image path (relative to baseUrl)
    defaultImage: string;
    // Twitter card type
    twitterCard: 'summary' | 'summary_large_image';
    // SEO data for each page
    pages: Record<string, PageSEO>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Load game SEO from external config (single source of truth in JordglobeSite)
// ─────────────────────────────────────────────────────────────────────────────

interface ExternalGameSEO {
    siteUrl: string;
    siteName: string;
    defaultImage: string;
    twitterCard: string;
    games: Record<string, {
        baseUrlOverride?: string;
        image?: string;
        en: {
            title: string;
            description: string;
            ogTitle?: string;
            ogDescription?: string;
        };
    }>;
}

function loadGameSEO(): Record<string, PageSEO> {
    const configPath = resolve(
        dirname(fileURLToPath(import.meta.url)),
        '../../shared/games-seo.json'
    );
    const config: ExternalGameSEO = JSON.parse(readFileSync(configPath, 'utf-8'));
    const gameSEO: Record<string, PageSEO> = {};

    for (const [gameId, game] of Object.entries(config.games)) {
        const locale = game.en;
        gameSEO[`${gameId}.html`] = {
            title: locale.title,
            description: locale.description,
            ogTitle: locale.ogTitle,
            ogDescription: locale.ogDescription,
            image: game.image,
            baseUrlOverride: game.baseUrlOverride,
        };
    }

    console.log(`✓ Loaded game SEO from ${configPath}`);
    return gameSEO;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main SEO Config
// ─────────────────────────────────────────────────────────────────────────────

const gameSEO = loadGameSEO();

export const seoConfig: SEOConfig = {
    baseUrl: 'https://jordglobe.com',
    defaultImage: '/og-image.png',
    twitterCard: 'summary_large_image',

    pages: {
        // ─────────────────────────────────────────────────────────────
        // Homepage
        // ─────────────────────────────────────────────────────────────
        'index.html': {
            title: 'JordGlobe - Learn Geography with Interactive 3D Globe Quizzes',
            description: 'Test your geography knowledge with interactive 3D globe quizzes. Find countries, capitals, and flags on a beautiful rotating Earth.',
            ogTitle: 'JordGlobe - Interactive Geography Quizzes',
        },

        // ─────────────────────────────────────────────────────────────
        // Quiz Games (loaded from external config)
        // ─────────────────────────────────────────────────────────────
        ...gameSEO,
    },
};

// Export list of public pages (for validation and sitemap)
export const publicPages = Object.keys(seoConfig.pages);
