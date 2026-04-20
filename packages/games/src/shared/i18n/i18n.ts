import type { LocaleDef, LocaleStrings, QuizTranslations } from './types'
import { SHARED_DEFAULTS } from './shared-defaults'
import { COUNTRY_NAMES } from './country-names'

const STORAGE_KEY = 'jg_locale'

let current: QuizTranslations = SHARED_DEFAULTS
let activeLocale: string = SHARED_DEFAULTS.defaultLocale

export function initI18n(bundle: QuizTranslations | undefined): void {
    current = bundle ? mergeUnder(SHARED_DEFAULTS, bundle) : SHARED_DEFAULTS
    activeLocale = resolveLocale(current)
}

export function t(key: string): string {
    const fromActive = current.strings[activeLocale]?.[key]
    if (fromActive !== undefined) return fromActive
    const fromDefault = current.strings[current.defaultLocale]?.[key]
    if (fromDefault !== undefined) return fromDefault
    return key
}

export function getLocale(): string {
    return activeLocale
}

export function getAvailableLocales(): LocaleDef[] {
    return current.availableLocales
}

export function setLocale(code: string): void {
    localStorage.setItem(STORAGE_KEY, code)
    location.reload()
}

export function getCountryName(iso2: string): string {
    return COUNTRY_NAMES[activeLocale]?.[iso2]
        ?? COUNTRY_NAMES[current.defaultLocale]?.[iso2]
        ?? iso2
}

function mergeUnder(base: QuizTranslations, override: QuizTranslations): QuizTranslations {
    const strings: Record<string, LocaleStrings> = {}
    const locales = new Set([...Object.keys(base.strings), ...Object.keys(override.strings)])
    for (const code of locales) {
        strings[code] = { ...base.strings[code], ...override.strings[code] }
    }
    return {
        defaultLocale: override.defaultLocale,
        availableLocales: override.availableLocales,
        strings,
    }
}

function resolveLocale(bundle: QuizTranslations): string {
    const codes = bundle.availableLocales.map(l => l.code)
    if (codes.length === 0) return bundle.defaultLocale

    const stored = safeRead(STORAGE_KEY)
    if (stored && codes.includes(stored)) return stored

    // <html lang="…"> set by per-locale pre-rendered HTML (e.g. /games/eurovision/sv/).
    // Stronger signal than navigator language because it reflects the server's URL routing.
    const fromHtml = matchHtmlLangLocale(codes)
    if (fromHtml) return fromHtml

    const fromPath = matchPathLocale(codes)
    if (fromPath) return fromPath

    const fromNav = matchNavigatorLocale(codes)
    if (fromNav) return fromNav

    return bundle.defaultLocale
}

function safeRead(key: string): string | null {
    try { return localStorage.getItem(key) } catch { return null }
}

function matchHtmlLangLocale(codes: string[]): string | null {
    const lang = document.documentElement.lang
    if (!lang) return null
    if (codes.includes(lang)) return lang
    const primary = lang.split('-')[0]
    return codes.includes(primary) ? primary : null
}

function matchPathLocale(codes: string[]): string | null {
    const first = location.pathname.split('/').filter(Boolean)[0]
    return first && codes.includes(first) ? first : null
}

function matchNavigatorLocale(codes: string[]): string | null {
    const langs = navigator.languages ?? [navigator.language]
    for (const lang of langs) {
        if (!lang) continue
        if (codes.includes(lang)) return lang
        const primary = lang.split('-')[0]
        if (codes.includes(primary)) return primary
    }
    return null
}
