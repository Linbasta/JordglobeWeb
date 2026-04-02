#!/usr/bin/env tsx
/**
 * SEO Injection Script
 *
 * Reads seo-config.ts and injects meta tags into HTML files.
 * Run during build: npm run inject-seo
 *
 * Usage: npx tsx scripts/inject-seo.ts
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { seoConfig, publicPages, type PageSEO } from '../seo-config.ts';

const ROOT_DIR = process.cwd();

// ── Generate meta tags for a page ──

function generateMetaTags(page: string, seo: PageSEO): string {
    const pagePath = page === 'index.html' ? '/' : `/${page.replace('.html', '')}`;
    const fullUrl = `${seoConfig.baseUrl}${pagePath}`;
    const imageUrl = `${seoConfig.baseUrl}${seoConfig.defaultImage}`;

    const ogTitle = seo.ogTitle || seo.title;
    const ogDescription = seo.ogDescription || seo.description;
    const twitterTitle = seo.twitterTitle || ogTitle;
    const twitterDescription = seo.twitterDescription || ogDescription;

    return `<!-- SEO - Generated from seo-config.ts -->
    <meta name="description" content="${escapeHtml(seo.description)}">
    <link rel="canonical" href="${fullUrl}">
    <!-- Open Graph -->
    <meta property="og:title" content="${escapeHtml(ogTitle)}">
    <meta property="og:description" content="${escapeHtml(ogDescription)}">
    <meta property="og:image" content="${imageUrl}">
    <meta property="og:url" content="${fullUrl}">
    <meta property="og:type" content="website">
    <!-- Twitter Card -->
    <meta name="twitter:card" content="${seoConfig.twitterCard}">
    <meta name="twitter:title" content="${escapeHtml(twitterTitle)}">
    <meta name="twitter:description" content="${escapeHtml(twitterDescription)}">
    <meta name="twitter:image" content="${imageUrl}">
    <!-- /SEO -->`;
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// ── Inject or update SEO tags in HTML file ──

function injectSEO(filePath: string, page: string, seo: PageSEO): boolean {
    if (!existsSync(filePath)) {
        console.log(`  ⚠ File not found: ${page}`);
        return false;
    }

    let content = readFileSync(filePath, 'utf-8');
    const metaTags = generateMetaTags(page, seo);

    // Pattern to match existing SEO block
    const seoBlockPattern = /<!-- SEO - Generated from seo-config\.ts -->[\s\S]*?<!-- \/SEO -->/;

    // Pattern to match old-style manual SEO tags (for migration)
    const oldSeoPattern = /<meta name="description"[\s\S]*?<meta name="twitter:image"[^>]*>/;

    if (seoBlockPattern.test(content)) {
        // Replace existing SEO block
        content = content.replace(seoBlockPattern, metaTags);
    } else if (oldSeoPattern.test(content)) {
        // Migrate from old manual SEO tags
        content = content.replace(oldSeoPattern, metaTags);
    } else {
        // Insert after <title> tag
        const titleMatch = content.match(/<title>[^<]*<\/title>/);
        if (titleMatch) {
            content = content.replace(
                titleMatch[0],
                `${titleMatch[0]}\n    ${metaTags}`
            );
        } else {
            console.log(`  ⚠ No <title> tag found in: ${page}`);
            return false;
        }
    }

    // Also update the <title> tag to match config
    const titlePattern = /<title>[^<]*<\/title>/;
    content = content.replace(titlePattern, `<title>${escapeHtml(seo.title)}</title>`);

    writeFileSync(filePath, content, 'utf-8');
    return true;
}

// ── Main ──

function main(): void {
    console.log('=== Injecting SEO Meta Tags ===\n');

    let successCount = 0;
    let errorCount = 0;

    for (const page of publicPages) {
        const filePath = join(ROOT_DIR, page);
        const seo = seoConfig.pages[page];

        if (!seo) {
            console.log(`  ⚠ No SEO config for: ${page}`);
            errorCount++;
            continue;
        }

        const success = injectSEO(filePath, page, seo);
        if (success) {
            console.log(`  ✓ ${page}`);
            successCount++;
        } else {
            errorCount++;
        }
    }

    console.log(`\n${successCount} files updated, ${errorCount} errors`);

    if (errorCount > 0) {
        process.exit(1);
    }
}

main();
