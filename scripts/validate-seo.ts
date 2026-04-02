#!/usr/bin/env tsx
/**
 * SEO Validation Script
 *
 * Validates that all public-facing HTML files have required SEO meta tags.
 * Run as pre-commit hook to ensure SEO requirements are met.
 *
 * Usage: npx tsx scripts/validate-seo.ts
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, basename } from 'path';

// ── Configuration ──

const ROOT_DIR = process.cwd();
const PUBLIC_DIR = join(ROOT_DIR, 'public');

// HTML files that should have SEO meta tags (public-facing pages)
const PUBLIC_PAGES = [
    'index.html',
    'country-quiz.html',
    'capitals-quiz.html',
    'flag-quiz.html',
    'us-states-quiz.html',
    'medals.html',
    'minigames.html',
];

// Files to exclude from SEO validation
const EXCLUDED_PATTERNS = [
    /^test-/,       // Test pages
    /^bot-panel/,   // Admin pages
    /^host\./,      // Host pages
    /^party\./,     // Party player pages
    /^eurovision/,  // Special event pages
    /^image-quiz/,  // Internal quiz pages
    /^video-quiz/,  // Internal quiz pages
    /^country-game/,// Internal game pages
];

// Required meta tags for SEO
const REQUIRED_META_TAGS = [
    { name: 'description', pattern: /<meta\s+name="description"\s+content="[^"]+"/i },
    { name: 'og:title', pattern: /<meta\s+property="og:title"\s+content="[^"]+"/i },
    { name: 'og:description', pattern: /<meta\s+property="og:description"\s+content="[^"]+"/i },
    { name: 'og:image', pattern: /<meta\s+property="og:image"\s+content="[^"]+"/i },
    { name: 'canonical', pattern: /<link\s+rel="canonical"\s+href="[^"]+"/i },
];

// Required files
const REQUIRED_FILES = [
    'public/robots.txt',
    'public/sitemap.xml',
];

// ── Validation Functions ──

interface ValidationError {
    file: string;
    errors: string[];
}

function validateHtmlFile(filePath: string): string[] {
    const errors: string[] = [];
    const content = readFileSync(filePath, 'utf-8');

    for (const tag of REQUIRED_META_TAGS) {
        if (!tag.pattern.test(content)) {
            errors.push(`Missing or invalid: ${tag.name}`);
        }
    }

    return errors;
}

function shouldValidateFile(filename: string): boolean {
    // Check if explicitly in public pages list
    if (PUBLIC_PAGES.includes(filename)) {
        return true;
    }
    return false;
}

function validateSitemap(): string[] {
    const errors: string[] = [];
    const sitemapPath = join(PUBLIC_DIR, 'sitemap.xml');

    if (!existsSync(sitemapPath)) {
        errors.push('sitemap.xml does not exist');
        return errors;
    }

    const content = readFileSync(sitemapPath, 'utf-8');

    // Check that all public pages are in sitemap
    for (const page of PUBLIC_PAGES) {
        const pageName = page.replace('.html', '');
        const urlPattern = pageName === 'index'
            ? /jordglobe\.com\/["'<]/
            : new RegExp(`jordglobe\\.com/${pageName}["'<]`);

        if (!urlPattern.test(content)) {
            errors.push(`Page not in sitemap: ${page}`);
        }
    }

    return errors;
}

// ── Main ──

function main(): void {
    console.log('=== SEO Validation ===\n');

    const allErrors: ValidationError[] = [];

    // Check required files exist
    console.log('Checking required files...');
    for (const file of REQUIRED_FILES) {
        const filePath = join(ROOT_DIR, file);
        if (!existsSync(filePath)) {
            allErrors.push({ file, errors: ['File does not exist'] });
            console.log(`  ✗ ${file} - MISSING`);
        } else {
            console.log(`  ✓ ${file}`);
        }
    }

    // Validate HTML files
    console.log('\nValidating HTML files...');
    for (const page of PUBLIC_PAGES) {
        const filePath = join(ROOT_DIR, page);

        if (!existsSync(filePath)) {
            allErrors.push({ file: page, errors: ['File does not exist'] });
            console.log(`  ✗ ${page} - MISSING`);
            continue;
        }

        const errors = validateHtmlFile(filePath);
        if (errors.length > 0) {
            allErrors.push({ file: page, errors });
            console.log(`  ✗ ${page}`);
            for (const error of errors) {
                console.log(`      - ${error}`);
            }
        } else {
            console.log(`  ✓ ${page}`);
        }
    }

    // Validate sitemap
    console.log('\nValidating sitemap...');
    const sitemapErrors = validateSitemap();
    if (sitemapErrors.length > 0) {
        allErrors.push({ file: 'public/sitemap.xml', errors: sitemapErrors });
        for (const error of sitemapErrors) {
            console.log(`  ✗ ${error}`);
        }
    } else {
        console.log('  ✓ All public pages are in sitemap');
    }

    // Summary
    console.log('\n' + '='.repeat(40));
    if (allErrors.length === 0) {
        console.log('✓ All SEO checks passed!\n');
        process.exit(0);
    } else {
        console.log(`✗ ${allErrors.length} file(s) have SEO issues:\n`);
        for (const { file, errors } of allErrors) {
            console.log(`  ${file}:`);
            for (const error of errors) {
                console.log(`    - ${error}`);
            }
        }
        console.log('\nFix these issues before committing.');
        process.exit(1);
    }
}

main();
