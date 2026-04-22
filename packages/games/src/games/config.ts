import type { GameManifest } from './types';

export const SITE_URL = 'https://jordglobe.com';
export const GAMES_BASE = '/games';

export function gameCanonicalUrl(manifest: GameManifest, locale: string): string {
    const defaultLocale = manifest.i18n.defaultLocale;
    const slug = locale === defaultLocale ? '' : `${locale}/`;
    return `${SITE_URL}${GAMES_BASE}/${manifest.id}/${slug}`;
}

export function gameOgImageUrl(manifest: GameManifest): string {
    if (manifest.image.startsWith('/')) {
        return `${SITE_URL}${manifest.image}`;
    }
    return `${SITE_URL}${GAMES_BASE}/${manifest.id}/${manifest.image}`;
}
