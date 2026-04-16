# JordGlobe Monorepo

Geography learning platform with interactive 3D globe quizzes.

## Structure

```
jordglobe/
├── packages/
│   ├── site/     # Marketing website (Astro + Firebase Hosting)
│   └── games/    # Quiz games (Babylon.js + TypeScript)
├── shared/
│   └── games-seo.json   # Single source of truth for game SEO
└── package.json  # pnpm workspace root
```

## Quick Start

```bash
# Install all dependencies
pnpm install

# Development
pnpm dev:site     # Start marketing site (Astro)
pnpm dev:games    # Start games dev server (Vite)

# Build
pnpm build:site   # Build marketing site
pnpm build:games  # Build all games

# Deploy
pnpm deploy:stage  # Build games + site, deploy to staging
pnpm deploy:prod   # Build games + site, deploy to production
```

## Packages

### @jordglobe/site (packages/site)
Marketing website built with Astro 5.x, deployed to Firebase Hosting.
See `packages/site/CLAUDE.md` for details.

### @jordglobe/games (packages/games)
Interactive 3D globe quiz games built with Babylon.js.
See `packages/games/CLAUDE.md` for details.

## Shared Configuration

### games-seo.json
Single source of truth for game SEO metadata (titles, descriptions, OG tags).
- Used by `packages/site` for game listing pages
- Used by `packages/games` for meta tag injection during build

## Adding a New Game

1. Build the game in `packages/games` with output to `dist-<gamename>-embedded/`
2. Add game to `GAMES` array in `packages/site/scripts/deploy.sh`
3. Add default build path: `<GAMENAME>_BUILD_DIR_DEFAULT="..."`
4. Add game data to `shared/games-seo.json`
5. Add game URL to sitemap in `packages/site/astro.config.mjs` (customPages)
6. Add Firebase rewrite in `packages/site/firebase.json` if needed

## Deploy Process

The deploy script (`packages/site/scripts/deploy.sh`):
1. Builds the Astro site
2. Copies game builds from `packages/games/dist-*-embedded/` into `dist/games/`
3. Deploys to Firebase Hosting

Deploy targets:
- `prod` - Production (jordglobe.com)
- `stage` - Staging
- `preview` - Local Firebase emulator
