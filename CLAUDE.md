# JordGlobe Monorepo

Geography learning platform with interactive 3D globe quizzes.

## Structure

- `packages/site/` - Marketing website (Astro + Firebase)
- `packages/games/` - Quiz games (Babylon.js + Astro). See its `CLAUDE.md` for file layout and dev/prod separation.
- `packages/party-server/` - WebSocket server for multiplayer games
- `shared/games-seo.json` - Game SEO metadata (legacy; site's game-card data still reads this)

## Commands

```bash
pnpm dev:site    # Dev site (port 4321)
pnpm dev:games   # Dev games (port 4818)
pnpm dev:party   # Dev multiplayer server (port 3003)
pnpm dev:logs    # Browser console log server (port 9999)
pnpm preview     # Build & preview full site
pnpm deploy:stage
pnpm deploy:prod
```

See package-specific CLAUDE.md files for details.
