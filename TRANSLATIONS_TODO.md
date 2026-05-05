# de/fr translation — remaining work

## Done

- Locale wiring: `astro.config.mjs`, `src/config/siteSettings.json.ts`, `src/config/translationData.json.ts` (locales, localeMap, languageSwitcherMap, supportedLangs, modulesMap, textTranslations, routeTranslations).
- Site data files: `src/config/de/{siteData,navData,faqData,gamesData,testimonialData}.json.ts` and same five for `fr/`.
- Quiz UI strings (de + fr blocks) in `packages/games/src/shared/i18n/shared-defaults.ts`.

## Pending

1. **`packages/games/src/shared/i18n/country-names.ts`** — add `de:` and `fr:` blocks. 247 ISO‑2 entries each. Largest single chunk of work; do in two passes (de, then fr).
2. **Per-game i18n bundles** — add `de` and `fr` strings + extend `availableLocales`:
   - `packages/games/src/games/euro-music-quiz/i18n.ts`
   - `packages/games/src/games/euro-winners-2000s/i18n.ts`
   - `packages/games/src/games/game-quiz/i18n.ts`
   - `packages/games/src/games/quiz/i18n.ts` (currently empty bodies — keep empty or add later)
3. **Per-game manifest `locales`** — add `de` + `fr` SEO blocks (title, description, ogTitle, ogDescription) in:
   - `euro-music-quiz/manifest.ts`
   - `euro-winners-2000s/manifest.ts`
   - `game-quiz/manifest.ts`
   - `quiz/quiz-manifests.ts` — add `DE_OVERRIDES` / `FR_OVERRIDES` next to existing `SV_OVERRIDES` and update `seoForQuiz` to read them; also translate `TYPE_LABEL_*` for the auto-generated description (`countries`/`capitals`/`provinces`/`flags`/`locations`).
4. **`shared/games-seo.json`** — add `de` and `fr` blocks for every game. Until done, `de`/`fr` `gamesData.json.ts` falls back to `game.en` (cards already pull from local `cardCopy`, but the JSON-LD on the game-selector uses `seoTitle`/`seoDescription` which falls back to English).
5. **Site page templates** — mirror `packages/site/src/pages/sv/` → `pages/de/` and `pages/fr/` (10 files each):
   - Thin wrappers (`index`, `about`, `gdpr`, `medal`, `download`, `downloadfromsite`, `[...page]`, `__catchall__`): copy as-is.
   - `404.astro`, `play.astro`, `duel.astro`: hardcoded English copy needs translating (the existing `sv/` versions still have English copy too — known gap).
6. **LanguageSelect dropdown verification** — `LanguageSelect.astro` and `MobileLanguageSelect.astro` iterate `locales` directly, so de/fr should appear automatically once routes exist. Visual check after step 5.
7. **HrefLang** — `Seo/HrefLang.astro` iterates `locales`, so hreflang tags emit automatically. Sanity-check sitemap output.

## Notes

- `routeTranslations.de.aboutKey` is `ueber-uns` and `fr.aboutKey` is `a-propos`. If those routes are added later under `pages/de/`/`pages/fr/`, the file/folder name must match (e.g. `pages/de/ueber-uns.astro`).
- `gamesData.json.ts` for de/fr uses `(game as any).de ?? game.en` to gracefully fall back until step 4 lands.
