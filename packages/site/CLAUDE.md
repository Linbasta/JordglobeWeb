# JordGlobe Website

## Project Overview

This is the marketing/landing website for JordGlobe, a geography learning app. Built with Astro 5.x and deployed to Firebase Hosting.

## Architecture

### Games (Monorepo Package)
Games are built in the sibling package (`../games`) using Babylon.js and copied into the site during deployment.

**Current games:**
- `eurovision` - Eurovision 2026 Quiz

### Build & Deploy Process

1. `npm run build` - Builds only the Astro site
2. `./scripts/deploy.sh <target>` - Full deployment:
   - Builds Astro site
   - Copies game builds from `../games/dist-*-embedded/` into `dist/games/`
   - Deploys to Firebase Hosting

**Deploy targets:**
- `prod` - Production deployment
- `stage` - Staging deployment
- `preview` - Local Firebase emulator

### Adding a New Game

1. Build the game in `packages/games` with output to `dist-<gamename>-embedded/`
2. Add game to `GAMES` array in `scripts/deploy.sh`
3. Add default build path: `<GAMENAME>_BUILD_DIR_DEFAULT="..."`
4. Add game data to `src/config/en/gamesData.json.ts` (and sv version)
5. Add game URL to sitemap in `astro.config.mjs` (customPages)
6. Add Firebase rewrite in `firebase.json` if needed

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
