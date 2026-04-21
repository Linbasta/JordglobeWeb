# JordGlobe Website

## Project Overview

This is the marketing/landing website for JordGlobe, a geography learning app. Built with Astro 5.x and deployed to Firebase Hosting.

## Architecture

### Games (Monorepo Package)

Games are built by `@jordglobe/games` (Astro, base `/games/`) and copied into this site at deploy time.

### Build & Deploy Process

- `pnpm preview` (from repo root) — builds both packages via turbo, rsyncs games' `dist/` into `site/dist/games/`, starts Firebase emulator.
- `pnpm deploy:stage` / `pnpm deploy:prod` (from repo root) — same build + rsync, deploys to target.
- `scripts/deploy.sh <target>` — the workhorse; builds site, rsyncs (no `--delete`, preserves site's own `dist/games/index.html` landing), deploys.

### Adding a New Game

1. In `packages/games/src/games/[id]/`: add `manifest.ts` (id, `published: true`, `image` filename, i18n, locales), `GameRoot.astro`, `assets/`.
2. Add manifest to `packages/games/src/games/manifests.ts`.
3. Drop assets at stable URLs into `packages/games/public-prod/[id]/`.
4. Rebuild. Sitemap `customPages` + SEO + game card all auto-derive.

No edits to `astro.config.mjs`, `firebase.json`, `deploy.sh`, or `src/config/*/gamesData.json.ts`.

### Promotion convention

Assets used by a game (or dev page, or Astro page) **live in the same folder** as the HTML/code that references them, and are referenced via **relative paths** (`./chart.png`, never `/games/[id]/chart.png`). Promoting a feature = moving its folder. URL prefix changes (`/dev/foo/` → `/games/foo/`); paths inside the HTML do not. See `packages/games/CLAUDE.md` for the full three-bucket model (`public-prod/`, `public-dev/`, `src/games/`).

**SEO card on `/games/`:** `src/config/{en,sv}/gamesData.json.ts` still reads `shared/games-seo.json` — untouched legacy path. Migrating it to read from `@jordglobe/games` manifests is a separate follow-up.

## Key Files

- `astro.config.mjs` - Astro configuration, sitemap settings
- `firebase.json` - Firebase Hosting config, rewrites, redirects
- `scripts/deploy.sh` - Deployment script that integrates games
- `src/config/` - Site data, translations, game definitions
- `src/pages/` - Astro pages (en at root, sv in /sv/)

## Locales

- **English**: Default locale, pages at root (`/`, `/games/`, etc.)
- **Swedish**: Pages under `/sv/` prefix

## SEO Notes

- Sitemap excludes: 404 pages, example pages, redirect pages (play, medal, duel, download)
- Game pages are added to sitemap via `customPages` option
- All redirect/utility pages have `noindex` meta tags
