# JordGlobe Monorepo

Geography learning platform with interactive 3D globe quizzes.

## Structure

- `packages/site/` - Marketing website (Astro + Firebase)
- `packages/games/` - Quiz games (Babylon.js)
- `shared/games-seo.json` - Game SEO metadata

## Commands

```bash
pnpm dev:site      # Dev site
pnpm dev:games     # Dev games
pnpm deploy:stage  # Deploy to staging
pnpm deploy:prod   # Deploy to production
```

See package-specific CLAUDE.md files for details.
