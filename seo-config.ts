/**
 * Centralized SEO Configuration
 *
 * All SEO metadata for public-facing pages in one place.
 * Edit this file to update titles, descriptions, etc.
 *
 * The inject-seo.ts script reads this config and injects
 * the meta tags into HTML files during build.
 */

export interface PageSEO {
    title: string;
    description: string;
    // Optional overrides (defaults to title/description if not set)
    ogTitle?: string;
    ogDescription?: string;
    twitterTitle?: string;
    twitterDescription?: string;
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
        // Quiz Games
        // ─────────────────────────────────────────────────────────────
        'country-quiz.html': {
            title: 'Country Quiz - Find Countries on the Globe | JordGlobe',
            description: 'Can you find countries on a 3D globe? Test your geography skills by locating countries around the world in this interactive quiz game.',
            ogTitle: 'Country Quiz - Find Countries on the Globe',
            ogDescription: 'Can you find countries on a 3D globe? Test your geography skills in this interactive quiz.',
        },

        'capitals-quiz.html': {
            title: 'World Capitals Quiz - Find Capital Cities on the Globe | JordGlobe',
            description: 'Can you locate world capitals on a 3D globe? Test your knowledge of capital cities in this interactive geography quiz game.',
            ogTitle: 'World Capitals Quiz - Find Capital Cities',
            ogDescription: 'Can you locate world capitals on a 3D globe? Test your knowledge in this interactive quiz.',
        },

        'flag-quiz.html': {
            title: 'Flag Quiz - Match Flags to Countries on the Globe | JordGlobe',
            description: 'Can you match flags to their countries on a 3D globe? Learn world flags while testing your geography knowledge in this fun quiz game.',
            ogTitle: 'Flag Quiz - Match Flags to Countries',
            ogDescription: 'Can you match flags to their countries on a 3D globe? Test your knowledge in this quiz.',
        },

        'us-states-quiz.html': {
            title: 'US States Quiz - Find All 50 States on the Globe | JordGlobe',
            description: 'Can you find all 50 US states on a 3D globe? Test your American geography knowledge in this interactive quiz game.',
            ogTitle: 'US States Quiz - Find All 50 States',
            ogDescription: 'Can you find all 50 US states on a 3D globe? Test your American geography knowledge.',
        },

        'eurovision.html': {
            title: 'Eurovision Quiz - Guess Songs from Eurovision 2026 | JordGlobe',
            description: 'Watch Eurovision Song Contest 2026 entries and guess which country each performance is from on an interactive 3D globe. Test your Eurovision knowledge!',
            ogTitle: 'Eurovision 2026 Quiz - Guess the Country from the Song',
            ogDescription: 'Watch Eurovision 2026 performances and guess which country each one is from in this interactive 3D globe quiz.',
            // Eurovision lives on its own subdomain, served from a separate
            // Firebase Hosting site (jordglobegl-dev) with a custom domain.
            baseUrlOverride: 'https://eurovision.jordglobe.com',
        },

        // ─────────────────────────────────────────────────────────────
        // Browse Pages
        // ─────────────────────────────────────────────────────────────
        'medals.html': {
            title: 'Geography Medals - Master Countries & Earn Achievements | JordGlobe',
            description: 'Earn bronze, silver, and gold medals by mastering countries on the 3D globe. Track your progress and become a geography expert.',
            ogTitle: 'Geography Medals - Earn Achievements',
            ogDescription: 'Earn bronze, silver, and gold medals by mastering countries on the 3D globe.',
        },

        'minigames.html': {
            title: 'Geography Minigames - Quick Geography Challenges | JordGlobe',
            description: 'Play quick geography minigames and challenges. Test your knowledge with bite-sized quizzes on the interactive 3D globe.',
            ogTitle: 'Geography Minigames - Quick Challenges',
            ogDescription: 'Play quick geography minigames and challenges on the interactive 3D globe.',
        },
    },
};

// Export list of public pages (for validation and sitemap)
export const publicPages = Object.keys(seoConfig.pages);
