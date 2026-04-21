# JordGlobe Monorepo

Geography learning platform with interactive 3D globe quizzes.

## Structure

- `packages/site/` - Marketing website (Astro + Firebase)
- `packages/games/` - Quiz games (Babylon.js + Astro). See its `CLAUDE.md` for the `public-prod/` / `public-dev/` / `src/games/` file layout and promotion convention (co-located assets + relative paths).
- `shared/games-seo.json` - Game SEO metadata (legacy; site's game-card data still reads this)

## Commands

```bash
pnpm dev:site      # Dev site
pnpm dev:games     # Dev games
pnpm deploy:stage  # Deploy to staging
pnpm deploy:prod   # Deploy to production
```

See package-specific CLAUDE.md files for details.
