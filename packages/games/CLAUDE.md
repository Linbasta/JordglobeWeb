# Development Strategy for Claude Code

## CRITICAL: Quiz vs Test Page

**Quiz/Game**: Uses pin placement UI, established presentation components, `/src/solo/start-quiz-game.ts`.

**Test Page**: One-off pages for testing functionality. Any UI/interaction is fine.

**Rules:**
- NEVER create a quiz with direct click interaction (that's a test page)
- ALWAYS use pin placement UI for quizzes
- Check existing game files FIRST before creating new ones

## CRITICAL: Wait for User Verification

**STOP after implementing each feature.** Wait for user to test and confirm before continuing.

Workflow: Implement -> STOP -> User tests -> User confirms -> Next feature

## Testing Approach

**Prefer CLI tests** (`scripts/test-*.ts`) over browser tests when possible.
- CLI: Data loading, algorithms, transformations
- Browser: 3D rendering, visual checks, user interaction

Run CLI tests with `npm run test:*` scripts.

## ts-morph for Refactoring

For large-scale renames across 10+ files, use ts-morph scripts in `scripts/` instead of manual editing.

## Code Philosophy

Write simple, direct code (Handmade Philosophy). Prefer:
- Plain functions over classes
- Direct data access over getters/setters
- Explicit code over "magic"
- Minimal dependencies
- Avoid abstraction layers
- Data-oriented design

## Development Servers

**Claude must NEVER start/stop/restart servers.** User manages servers manually.

| Server | Port | Package | Command |
|--------|------|---------|---------|
| Astro Dev | 4818 | games | `pnpm dev:games` |
| Party Server | 3003 | party-server | `pnpm dev:party-server` |
| Browser Console | 9999 | games | `npm run log-server` |

The WebSocket party server is in `packages/party-server/` (separate package).

## Babylon.js Pitfalls

**Vector mutation bug:**
```typescript
// WRONG - mutates vector
const normal = position.normalize();

// CORRECT - creates new vector
const normal = position.normalizeToNew();
```

Watch for: `scale()`, `add()`, `subtract()`, `multiply()` - use `*ToNew()` or `*InPlace` variants.

## File Layout & Dev/Prod Separation

Dev/prod separation is **structural** — files ship based on where they live, not runtime flags.

### 1. `public-prod/` — ships to production

Configured as Astro's `publicDir`. Everything here is served at `/games/*` and gets rsynced into the site's deploy.

- `public-prod/[gameid]/*` — per-game assets (OG images, runtime data).
- `public-prod/*` at root — shared statics (favicons, globe runtime, shared UI).

### 2. `src/games/[id]/` — production games

- `manifest.ts` — `id`, `published`, `image`, `i18n`, `locales`. `published: true` is the prod gate.
- `GameRoot.astro` — canvas + bootstrap script.
- `assets/` — `?url`-imported files (hashed, tracked, tree-shaken).

### 3. `src/experiments/[id]/` — WIP games (dev-only)

Same structure as `src/games/`, but `getStaticPaths` returns `[]` in prod builds. Served at `/games/experiments/[id]/` during dev.

### 4. `src/dev-tests/[name].astro` — test pages (dev-only)

One `.astro` per test page. Enumerated by `src/pages/dev/test/[slug].astro`. Served at `/games/dev/test/[name]/` during dev. `getStaticPaths` returns `[]` in prod builds.

### 5. `public-dev/` — dev-only assets

Mounted at `/games/dev/` during `astro dev` via middleware. Invisible to `astro build`.

## Production Build

The production build uses `scripts/build-prod.sh` which:
1. Moves dev pages (`src/pages/dev/`, `src/pages/experiments/`, `src/pages/[...devindex].astro`) out temporarily
2. Runs `astro build` (only production games remain)
3. Restores dev pages after build

This ensures no dev code leaks to production.

## Promotion Convention — Co-located Relative Paths

**Rule:** A page/feature and its assets live in the same folder, referenced with **relative paths**.

```html
<img src="./chart.png">                     <!-- correct - survives moves -->
<img src="/games/dev/my-feature/chart.png"> <!-- wrong - breaks on promotion -->
```

Promoting a feature = moving its folder. URL prefix changes, but internal paths stay the same.

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `quiz-debug-manager.ts` |
| Classes/Interfaces/Types | PascalCase | `QuizDebugManager` |
| Functions/Variables | camelCase | `startGame()` |
| Compile-time constants | SCREAMING_SNAKE | `EARTH_RADIUS` |

No "I" prefix for interfaces. No underscore prefix for private members.
