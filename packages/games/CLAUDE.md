# Development Strategy for Claude Code

## CRITICAL: Quiz vs Test Page

**Quiz/Game**: Uses pin placement UI, established presentation components, `/src/solo/start-quiz-game.ts`. See `capitals-quiz.html`, `country-quiz.html`.

**Test Page**: One-off pages for testing functionality. Any UI/interaction is fine.

**Rules:**
- NEVER create a quiz with direct click interaction (that's a test page)
- ALWAYS use pin placement UI for quizzes
- Check existing quiz files FIRST before creating new ones

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

## Server Architecture

**Claude must NEVER start/stop/restart servers.** User manages servers manually.

| Server | Port | Log File |
|--------|------|----------|
| Vite Dev | 4817 | stdout |
| WebSocket Game | 3003 | `game-server.log` |
| Browser Console | 9999 | `browser-console.log` |

All start with `npm run dev`. HMR auto-reloads on file changes.

## Babylon.js Pitfalls

**Vector mutation bug:**
```typescript
// WRONG - mutates vector
const normal = position.normalize();

// CORRECT - creates new vector
const normal = position.normalizeToNew();
```

Watch for: `scale()`, `add()`, `subtract()`, `multiply()` - use `*ToNew()` or `*InPlace` variants.

## File layout & dev/prod

Four buckets, each with a clear role. Dev/prod separation is **structural** — a file can only ship based on where it lives, not based on flags checked at runtime.

### 1. `public-prod/` — ships to prod

Configured as Astro's `publicDir`. Everything here is served at `/games/*` (under the Astro `base`) and gets rsynced into the site's deploy.

- `public-prod/[gameid]/*` — per-game assets (OG images, runtime data specific to that game).
- `public-prod/*` at root — site-wide statics shared by every game (favicons, globe runtime, shared UI).

### 2. `src/dev-tests/[name].astro` — test pages (primary)

One `.astro` per test page. Full Astro component so inline `<script>` is Vite-processed — bare specifiers (`@babylonjs/core/...`), `?url` imports, and relative TS imports all work. Enumerated by `src/pages/dev/test/[slug].astro` (DEV-gated dispatcher mirroring the experiments route); served at `/games/dev/test/[name]/` in `astro dev`. `getStaticPaths` returns `[]` in prod builds, so none of this ships.

### 3. `public-dev/` — dev-only scratch (fallback)

Mounted at `/games/dev/` during `astro dev` via `src/middleware.ts` (DEV-gated with `import.meta.env.DEV`). **Completely invisible to `astro build`** — files here cannot ship to prod, period. Not the primary test-page path — use `src/dev-tests/` for anything with module imports. Use `public-dev/` for: pure HTML with no imports, stable-URL assets referenced by experiments/dev-tests.

### 4. `src/games/[id]/` — game source

- `manifest.ts` — `id`, `published`, `image` (filename only), `i18n`, `locales`. `published: true` is the prod gate.
- `GameRoot.astro` — canvas + bootstrap script.
- `assets/` — `?url`-imported files (hashed, tracked, tree-shaken).

SEO URLs derive from `src/games/config.ts` helpers — **never hand-write an absolute URL in a manifest**. `src/layouts/GameLayout.astro` consumes the helpers.

## Promotion convention — co-located relative paths

**Rule:** a page/feature and its own assets live in the same folder, referenced with **relative paths**. Promotion becomes a folder move; HTML stays untouched.

```html
<!-- public-dev/my-feature/index.html -->
<img src="./chart.png">                     <!-- ✓ relative, survives moves -->
<img src="/games/dev/my-feature/chart.png"> <!-- ✗ absolute, breaks on promotion -->
```

Promoting `public-dev/my-feature/` → `public-prod/my-feature/`: URL prefix changes from `/games/dev/my-feature/` to `/games/my-feature/`, but `./chart.png` resolves correctly in both contexts. No HTML edits.

Same discipline applies to `src/games/[id]/` (co-located assets + `?url` imports) and to Astro pages under `src/pages/*.astro`.

**The only things that change on promotion are file locations — never paths inside files.**

## Legacy Vite flow (scheduled for retirement)

Non-migrated quizzes still live at the package root (e.g. `capitals-quiz.html`) with assets in `public/`, resolved via `asset()` from `src/shared/asset-path.ts`. This flow will be retired as each quiz migrates to the Astro structure above. Do not add new files to this flow.

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `quiz-debug-manager.ts` |
| Classes/Interfaces/Types | PascalCase | `QuizDebugManager` |
| Functions/Variables | camelCase | `startGame()` |
| Compile-time constants | SCREAMING_SNAKE | `EARTH_RADIUS` |

No "I" prefix for interfaces. No underscore prefix for private members.
