# Party Platform Roadmap

The party/host system is fundamentally different from solo quiz games. It's an expandable multiplayer platform that will eventually live on its own domain.

## Current State

```
packages/games/
  src/
    party/
      client/        # Player mobile client
      host/          # Host big-screen display
    earth-globe/     # Shared 3D rendering (used by both party and solo games)
    shared/          # Shared utilities
  server/            # WebSocket server (port 3003)
```

## Phase 1: Astro Migration (COMPLETE)

Migrate party/host from legacy Vite HTML to Astro experiments structure.

**Goal:** Unblock Vite retirement while keeping party functional.

**Result:**
- Party player: `/games/experiments/party/`
- Host display: `/games/experiments/host/`
- Bot panel: `/games/dev/test/bot-panel/`
- Server: unchanged on port 3003

**Completed:**
- Created `src/experiments/party/` (manifest.ts, i18n.ts, GameRoot.astro)
- Created `src/experiments/host/` (manifest.ts, i18n.ts, GameRoot.astro)
- Created `src/dev-tests/bot-panel.astro`
- Deleted `party.html`, `host.html`, `bot-panel.html`
- Updated `vite-shared.ts` (entryPoints now empty)
- Updated `routes.config.ts`, `RUNNING.md`, `manifest.json`
- Updated `server/production.mjs` (redirects to new paths)

## Phase 2: Extract to Separate Package

When ready to launch party on its own domain.

**Goal:** `packages/party/` as independent deployable unit.

**Structure:**
```
packages/party/
  src/
    player/          # Mobile client (from src/party/client/)
    host/            # Display (from src/party/host/)
    modes/           # Different game modes (countries, capitals, flags, etc.)
    shared/          # Party-specific shared code
  server/            # WebSocket server
  astro.config.mjs   # Separate Astro config for party domain
```

**Questions to resolve:**
- Does party import globe rendering from `@jordglobe/games`, or do we extract `@jordglobe/globe`?
- Does party share quiz UI components (overlays, score bars), or build its own?
- How do we handle the WebSocket server deployment?

## Phase 3: Extract Globe Library (Optional)

If the boundary between "globe rendering" and "quiz logic" becomes clear.

**Potential structure:**
```
packages/
  globe/            # Pure 3D rendering engine
    src/
      engine/       # Babylon.js setup, camera, rendering
      geography/    # Country data, borders, polygons
      interaction/  # Pin placement, hover, markers

  games/            # Solo quiz games (uses @jordglobe/globe)
  party/            # Multiplayer platform (uses @jordglobe/globe)
```

**When to do this:**
- When party needs globe features that solo games don't
- When we want to version globe independently
- When the shared code boundary is well understood

## Architecture Decisions

### Naming

| Package | Name | Purpose |
|---------|------|---------|
| Globe engine | `@jordglobe/globe` | 3D rendering, geography, interaction |
| Solo games | `@jordglobe/games` | Self-contained quiz experiences |
| Party platform | `@jordglobe/party` | Multiplayer host/player system |

### Domain Strategy

- Solo games: `jordglobe.com/games/[id]/`
- Party platform: `party.jordglobe.com` or `play.jordglobe.com`

### Server Architecture

The WebSocket server (`server/index.mjs`) currently:
- Runs on port 3003
- Handles game sessions, player connections, scoring
- Stateful (in-memory game state)

For production:
- Consider Redis for state
- Consider horizontal scaling
- Consider serverless WebSocket (e.g., Cloudflare Durable Objects)

## Open Questions

1. **Shared UI:** Does party reuse quiz result overlays, or does it have custom UI for the big-screen experience?

2. **Game modes:** Party could have many game modes (countries, capitals, flags, landmarks). How do these relate to medals?

3. **Mobile experience:** The player client is mobile-first. Does it share code with solo mobile games?

4. **Offline support:** Solo games could work offline. Party requires server connection. How does this affect the globe lib split?
