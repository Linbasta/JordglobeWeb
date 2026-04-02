#!/usr/bin/env tsx
/**
 * SEO Validation Script
 *
 * Validates that:
 * 1. seo-config.ts has entries for all public pages
 * 2. All required fields are present and valid
 * 3. robots.txt and sitemap.xml exist
 * 4. sitemap.xml includes all public pages
 *
 * Run as pre-commit hook to ensure SEO requirements are met.
 *
 * Usage: npx tsx scripts/validate-seo.ts
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { seoConfig, publicPages, type PageSEO } from '../seo-config.ts';

const ROOT_DIR = process.cwd();
const PUBLIC_DIR = join(ROOT_DIR, 'public');

// ── Configuration ──

// Required files
const REQUIRED_FILES = [
    'public/robots.txt',
    'public/sitemap.xml',
];

// Minimum lengths for SEO fields
const MIN_TITLE_LENGTH = 20;
const MAX_TITLE_LENGTH = 70;
const MIN_DESCRIPTION_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 160;

// ── Validation Functions ──

interface ValidationError {
    source: string;
    errors: string[];
}

function validatePageSEO(page: string, seo: PageSEO): string[] {
    const errors: string[] = [];

    // Title validation
    if (!seo.title) {
        errors.push('Missing title');
    } else {
        if (seo.title.length < MIN_TITLE_LENGTH) {
            errors.push(`Title too short (${seo.title.length} chars, min ${MIN_TITLE_LENGTH})`);
        }
        if (seo.title.length > MAX_TITLE_LENGTH) {
            errors.push(`Title too long (${seo.title.length} chars, max ${MAX_TITLE_LENGTH})`);
        }
    }

    // Description validation
    if (!seo.description) {
        errors.push('Missing description');
    } else {
        if (seo.description.length < MIN_DESCRIPTION_LENGTH) {
            errors.push(`Description too short (${seo.description.length} chars, min ${MIN_DESCRIPTION_LENGTH})`);
        }
        if (seo.description.length > MAX_DESCRIPTION_LENGTH) {
            errors.push(`Description too long (${seo.description.length} chars, max ${MAX_DESCRIPTION_LENGTH})`);
        }
    }

    return errors;
}

function validateConfig(): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check baseUrl
    if (!seoConfig.baseUrl || !seoConfig.baseUrl.startsWith('https://')) {
        errors.push({
            source: 'seo-config.ts',
            errors: ['baseUrl must be a valid HTTPS URL'],
        });
    }

    // Check defaultImage
    if (!seoConfig.defaultImage) {
        errors.push({
            source: 'seo-config.ts',
            errors: ['defaultImage is required'],
        });
    }

    // Check each page
    for (const page of publicPages) {
        const seo = seoConfig.pages[page];
        if (!seo) {
            errors.push({
                source: page,
                errors: ['No SEO config entry'],
            });
            continue;
        }

        const pageErrors = validatePageSEO(page, seo);
        if (pageErrors.length > 0) {
            errors.push({
                source: page,
                errors: pageErrors,
            });
        }

        // Check HTML file exists
        const filePath = join(ROOT_DIR, page);
        if (!existsSync(filePath)) {
            errors.push({
                source: page,
                errors: ['HTML file does not exist'],
            });
        }
    }

    return errors;
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
    for (const page of publicPages) {
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
            allErrors.push({ source: file, errors: ['File does not exist'] });
            console.log(`  ✗ ${file} - MISSING`);
        } else {
            console.log(`  ✓ ${file}`);
        }
    }

    // Validate seo-config.ts
    console.log('\nValidating seo-config.ts...');
    const configErrors = validateConfig();
    if (configErrors.length === 0) {
        console.log(`  ✓ All ${publicPages.length} pages have valid SEO config`);
    } else {
        allErrors.push(...configErrors);
        for (const { source, errors } of configErrors) {
            console.log(`  ✗ ${source}`);
            for (const error of errors) {
                console.log(`      - ${error}`);
            }
        }
    }

    // Validate sitemap
    console.log('\nValidating sitemap...');
    const sitemapErrors = validateSitemap();
    if (sitemapErrors.length > 0) {
        allErrors.push({ source: 'public/sitemap.xml', errors: sitemapErrors });
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
        console.log(`✗ ${allErrors.length} issue(s) found:\n`);
        for (const { source, errors } of allErrors) {
            console.log(`  ${source}:`);
            for (const error of errors) {
                console.log(`    - ${error}`);
            }
        }
        console.log('\nFix these issues in seo-config.ts before committing.');
        process.exit(1);
    }
}

main();
