# Legacy Vite Retirement Plan

Target state: the `@jordglobe/games` package runs entirely on Astro (the Shape B structure that Eurovision already uses). The legacy Vite flow — HTML entry points at the package root, `public/` as a shared dumping ground, `vite.config.ts` with obfuscator + custom plugins, `build-inlined.mjs` — is retired.

## Decisions locked in

1. **WIP trio deleted, not migrated** — `flag-quiz`, `image-quiz`, `us-states-quiz` are removed outright. They're not built today and have no active callers.
2. **All games move to `/games/[id]/`** — no per-quiz URL exceptions. A 301 from the old `/[id]` path ships in the same deploy that flips `published: true`.
3. **Landing retires with Vite** — `index.html`, `generate-landing.ts`, and `routes.config.ts` all go in Phase 5. The site owns the landing page going forward.

## Why

- Single build pipeline (Astro), not two.
- Structural dev/prod split (`public-prod/` ships, `public-dev/` doesn't) instead of an `ALLOW_LIST` firewall.
- Per-game SEO derived from `manifest.ts` helpers, not hand-edited HTML.
- Adding a game = drop a folder; no `vite-shared.ts`, `firebase.json`, `deploy.sh`, or `gamesData.json.ts` edits.

## Target structure

Four sibling buckets under `packages/games/`, each with a clear purpose:

- **`src/games/[id]/`** — real, shippable games. Full Astro manifest, `published: true`, served at `/games/[id]/` in both dev and prod.
- **`src/experiments/[id]/`** — WIP / half-working quizzes. Same Astro structure as `src/games/`, but dev-only: a hard DEV-gated `getStaticPaths` (returns `[]` in prod builds). Served at `/games/experiments/[id]/` in `astro dev` (under the package's `base: '/games/'`), never built for prod.
- **`src/dev-tests/[name].astro`** — test pages (debugging, one-offs, throwaway prototypes). Full Astro components so inline `<script>` gets Vite-processed (bare specifiers, `?url` imports, relative TS all work). Enumerated by the DEV-gated dispatcher `src/pages/dev/test/[slug].astro` and served at `/games/dev/test/[name]/` in `astro dev`. `getStaticPaths` returns `[]` in prod builds, so nothing ships.
- **`public-dev/`** — dev-only scratch for stable-URL dev assets (experiment-asset-at-a-stable-URL, bundler-free pure HTML like `bot-panel.html`). Served at `/games/dev/` in `astro dev` via `src/middleware.ts`. Invisible to `astro build`. Not the primary test-page path — use `src/dev-tests/` for anything that needs a bundler.

An experiment graduates to a game by moving its folder from `src/experiments/[id]/` to `src/games/[id]/` and flipping `published: true` — same promotion pattern as `public-dev/` → `public-prod/`, or `src/dev-tests/foo.astro` → `src/games/foo/GameRoot.astro`. Paths inside the folder stay relative, so the move is a rename plus a 301 redirect.

## What's still on legacy Vite today

### Production quiz HTML (at package root, in `vite-shared.ts:entryPoints`)

| File | Current URL | Destination | Notes |
|---|---|---|---|
| `index.html` | `/` (landing) | (site) | Auto-generated from `routes.config.ts` via `generate-landing.ts`. Landing itself retires with the Vite flow. |
| `country-quiz.html` | `/country-quiz` | `src/experiments/` | Solo quiz — treated as WIP pending polish. |
| `capitals-quiz.html` | `/capitals-quiz` | `src/experiments/` | Solo quiz — treated as WIP pending polish. |
| `country-game.html` | `/country-game` | `src/experiments/` | Solo "game" (no UI pins). |
| `medals.html` | `/medals` | `src/games/` | Menu → launches quizzes; ~200+ dynamic data files. |
| `minigames.html` | `/minigames` | `src/games/` | Menu → launches minigames. |
| `video-quiz.html` | `/video-quiz` | `src/games/` | Video-based quiz. |
| `party.html` | `/party` | `src/games/` | **Multiplayer client** — talks to WebSocket game server. |
| `host.html` | `/host` | `src/games/` | **Multiplayer host** — same. |
| `bot-panel.html` | `/bot-panel.html` | `public-dev/` | Dev tool for multiplayer testing. |

### Test / debug pages (22 HTML files)

- **Package root (13):** `test-arcs.html`, `test-camera-animation.html`, `test-country-easing.html`, `test-e2e.html`, `test-location-markers.html`, `test-marker-particles.html`, `test-mixed-quiz.html`, `test-multi-pin.html`, `test-parameter-sweep.html`, `test-party-pick.html`, `test-pin-replay.html`, `test-textcard.html`, `test-wide-framing.html`
- **`public/` (9):** `debug-records.html`, `test-confetti.html`, `test-islands-frame.html`, `test-long-text.html`, `test-province-quiz.html`, `test-region-mode.html`, `test-result-popup.html`, `test-static-border-overlay.html`, `test-triangulation-debug.html`

### WIP quizzes (NOT built today, not deployed)

`flag-quiz.html`, `image-quiz.html`, `us-states-quiz.html` at package root. **Decision: delete.** Not built today, no active callers. Remove the HTML, any `foo.i18n.ts`, quiz-exclusive assets under `public/`, and the entries in `vite-shared.ts:userChunkNames`.

### Vite-specific infrastructure

- `vite.config.ts`
- `vite-shared.ts` (entryPoints + obfuscator plugins)
- `scripts/build-inlined.mjs`
- `scripts/generate-landing.ts`
- `routes.config.ts`
- `package.json` scripts: `dev`, `frontend`, `build`, `build:legacy`, `build:production`, `preview`, `deploy:stage`
- `public/` — shared dumping ground for all legacy assets

## The migration template (one quiz = one folder move)

For each legacy quiz `foo`, first decide its destination — `src/games/[id]/` (real), `src/experiments/[id]/` (WIP), or `public-dev/` (pure test). The steps below cover games/experiments; pure test pages use the simpler flow in [Test-page migration](#test-page-migration).

1. **Create `src/games/foo/`** (or `src/experiments/foo/`) with:
   - `manifest.ts` — `id: 'foo'`, `published: false` initially (dev-only), `image: 'og-foo.jpg'` (filename only), `i18n`, `locales` (en + sv strings moved from `shared/games-seo.json` + old SEO meta).
   - `i18n.ts` — quiz-specific translations (moved from root `foo.i18n.ts` if one exists, or split out from `foo.html`'s inline script).
   - `GameRoot.astro` — the `<canvas>` + bootstrap script. Lift verbatim from `foo.html`'s inline `<script>`, converting `/src/...` imports to relative `../../shared/...` paths.
   - `assets/` — any quiz-exclusive files, referenced via `?url` imports from `GameRoot.astro`.
2. **Register the manifest** in `src/games/manifests.ts` (or `src/experiments/manifests.ts`).
3. **Migrate runtime assets:**
   - Assets used only by this quiz → `src/games/foo/assets/` (or `src/experiments/foo/assets/`) + `?url` imports.
   - Assets used at a stable URL (OG image, fixed-name files loaded by URL string):
     - Games → `public-prod/foo/` (ships to prod).
     - Experiments → `public-dev/foo/` (dev-only; URL-loaded experiment assets must not ship).
4. **Verify in dev.** `pnpm --filter @jordglobe/games dev:astro`. Visit `http://localhost:4818/games/foo/` (or `http://localhost:4818/games/experiments/foo/`). Game runs end-to-end.
5. **Gate for prod:**
   - Games → flip `published: true`. Next site build auto-adds to sitemap via `generate-game-urls.ts`, auto-emits route, auto-ships.
   - Experiments → stay `published: false`. They exist only in dev; `astro build` skips them. No sitemap entry, no prod route.
6. **Add redirect** from old URL to new (games only — experiments don't need one since they're dev-only; see next section).
7. **Delete legacy bits:** remove `foo.html` at package root; remove entry from `vite-shared.ts:entryPoints`; remove from `seo-config.ts` if still referenced; remove eurovision-style entry from `shared/games-seo.json` (if that quiz had one).

### URL changes and redirects

Most legacy quizzes live at `/foo` (e.g. `/medals`, `/country-quiz`). After migration:

- **Games** move to `/games/foo/`. Add Firebase redirect in `packages/site/firebase.json`:

  ```json
  { "source": "/foo", "destination": "/games/foo/", "type": 301 }
  ```

  Preserves bookmarks, SEO link equity. Do this when the migration goes live (flip `published: true` + redirect in same deploy).

- **Experiments** live at `/games/experiments/foo/` in dev only (under the package's `base: '/games/'`). No prod URL, no redirect needed. The old `/foo` URL goes 404 in prod once the legacy entry is deleted — intentional, since we don't want half-working quizzes indexed.

### Game URL policy

**Decision: all games move to `/games/[id]/`**, with a 301 from the old `/[id]` path in the same deploy that flips `published: true`. No per-quiz exceptions.

## Test-page migration

Test pages are the simplest bucket — pure HTML, no manifest. Primary destination: **`src/dev-tests/[name].astro`** (one `.astro` file per test page). Fallback: **`public-dev/[name]/`** for pure-HTML test pages that need no bundler.

### Why `src/dev-tests/` is primary

Plain HTML served from `public-dev/` is not processed by Vite, so inline `<script type="module">` cannot resolve bare specifiers (`@babylonjs/core/...`, etc.). Every such page would otherwise require its script to be extracted into a separate `.ts` file and referenced via `<script type="module" src="/src/tests/foo.ts">`. `.astro` files, by contrast, have Vite-processed `<script>` tags — bare specifiers, `?url` imports, and relative TS imports all just work. One file, not two.

### Dispatcher

`src/pages/dev/test/[slug].astro` globs `../../../dev-tests/*.astro` eagerly and returns `[]` from `getStaticPaths` when `!import.meta.env.DEV`. Mirrors the pattern in `src/pages/experiments/[id]/[...lang].astro`. The landing page at `/games/` auto-discovers dev-test files via a matching `import.meta.glob` over `src/dev-tests/`.

### Per-page steps

1. Create `src/dev-tests/foo.astro` (drop the `test-` prefix — the URL already contains `/test/`). Empty frontmatter fence.
2. Copy `<style>` and `<body>` contents verbatim. Astro hoists `<style>` and `<script>` into `<head>`.
3. Move the script:
   - Inline `<script type="module">` → Astro `<script>` (no `type` attr; Astro processes as TS).
   - External `<script src="/src/tests/foo.ts">` → `<script>import '../tests/foo.ts';</script>`.
4. Rewrite imports inside `<script>`:
   - `/src/foo/bar.ts` → `'../foo/bar.ts'` (`src/dev-tests/` is sibling to `src/foo/` — one `..`).
   - `/src/games/eurovision/assets/1.png?url` → `'../games/eurovision/assets/1.png?url'`.
   - Bare specifiers stay as-is.
5. Co-located assets: stable-URL scratch → `public-dev/foo/`, referenced as `/games/dev/foo/asset.png` (middleware still serves them); shippable → `public-prod/foo/`; tree-shakable data → `?url` import.
6. Delete the legacy `test-foo.html` + (if the inline script was already extracted in an earlier migration attempt) the orphaned `src/tests/test-foo.ts`.
7. Verify at `http://localhost:4818/games/dev/test/foo/`.

Use relative paths internally (`./asset.png`, not `/games/dev/foo/asset.png`) so promoting a test page to a real feature is a folder move with no edits.

### When to use `public-dev/` instead

- Pure HTML with no module imports (e.g. `bot-panel.html` dev tool — may move here in Phase 4).
- Stable-URL assets referenced by experiments or dev-tests (URL-loaded, not `?url`-imported).

Infrastructure: `packages/games/src/middleware.ts` intercepts `/games/dev/*` in DEV only and streams files from `public-dev/`. One-time setup; already in place.

## Ordering (suggested)

1. **Set up `public-dev/` + middleware** (`src/middleware.ts`). Unblocks stable-URL asset hosting for experiments/dev-tests. Done.
2. **Set up `src/experiments/` scaffolding.** Mirror `src/games/` structure: `manifests.ts`, a DEV-gated `src/pages/experiments/[id]/[...lang].astro` that enumerates unpublished experiment manifests. Done.
3. **Set up `src/dev-tests/` + dispatcher** (`src/pages/dev/test/[slug].astro`). Primary path for all test-page migrations. Done.
4. **Migrate test pages.** Each into `src/dev-tests/[name].astro` per template above. `public/` + package root stragglers (`bot-panel.html`) stay in Phase 4 unless they need a bundler. ~1-2 hrs total.
5. **Migrate experiment candidates.** `country-game`, `country-quiz`, `capitals-quiz` → `src/experiments/` with `published: false`. No prod redirects, so the cost of deferring a polish pass is low. ~1-2 hrs each. (The WIP trio — `flag-quiz`, `image-quiz`, `us-states-quiz` — gets deleted outright, not migrated.)
6. **Migrate real games one at a time.** Start with the simplest — whichever currently-shipping game most closely resembles Eurovision structurally. Each is its own 1-3 hour chunk. Confirm working before moving to next.
7. **Migrate `medals` + `minigames`.** Both are menu-style (DOM menu → quiz launch). Treat the menu as the game's root; bundle data (`medals.json`, `_flags/`, `provinces/`) into `public-prod/medals/`.
8. **Migrate `video-quiz`.** Standalone but uses video-specific UI.
9. **Migrate `party` + `host` last.** These talk to the multiplayer WebSocket server (`server/index.mjs`). The client migration is standard, but verify against live server behavior.
10. **Retire Vite infrastructure.** Once zero quizzes live at the package root, delete in one pass:
   - `vite.config.ts`, `vite-shared.ts`
   - `scripts/build-inlined.mjs`, `scripts/generate-landing.ts`
   - `routes.config.ts`
   - `public/` (move any remaining active files to `public-dev/` or `public-prod/` first)
   - `package.json`: `build`, `build:legacy`, `build:production`, `preview`, `deploy:stage`, `frontend`, `dev` (replaced by `dev:astro`)
   - Devdeps no longer needed: `javascript-obfuscator`, `rollup-obfuscator`, `terser`, `vite-plugin-compression`, (`vite` stays — Astro uses it under the hood, but it becomes a transitive dep only)

## What stays (scoped out of this plan)

- Globe engine (`src/earth-globe/`), shared UI (`src/shared/`), solo quiz runner (`src/solo/`) — the library itself. Every Astro-migrated quiz reuses these unchanged.
- WebSocket game server (`server/index.mjs`) and its dependencies — multiplayer needs server-side code, not handled by Astro.
- `shared/games-seo.json` + `packages/site/src/config/{en,sv}/gamesData.json.ts` — the site's game-card data still reads this. A follow-up migrates the site to read from `@jordglobe/games` manifests directly; once done, `games-seo.json` can retire.

## Risks and mitigations

- **Risk:** Shared asset referenced from multiple quizzes (e.g. `src/shared/ui/mobile-app-ad.ts` currently hardcodes `eurovision/blue_gradient.png`). Migration forces a refactor to pass asset URLs as config rather than hardcode paths.
  **Mitigation:** catch these during each quiz's migration; refactor the shared module to take asset URLs as params, pass them from each game's `GameRoot.astro`.
- **Risk:** SEO regression during URL transition.
  **Mitigation:** 301 redirects from old paths; sitemap auto-updates via `generate-game-urls.ts`; hreflang covered by `GameLayout.astro`.
- **Risk:** Multiplayer server integration (party/host) breaks in Astro build.
  **Mitigation:** leave party/host last; they're the most different beast; a follow-up plan may keep them on a slim Vite entry if Astro doesn't fit.

## Verification at each stage

After each quiz migration:
- `pnpm --filter @jordglobe/games build:astro` succeeds.
- `pnpm --filter @jordglobe/site preview` + visit `/games/[id]/`: game runs end-to-end (load, play, finish).
- View source: canonical, hreflang, og:image point at URLs that resolve to actual files in `dist/`.
- For URL-changing migrations: old URL returns 301 to new URL.

After Vite retirement:
- `pnpm --filter @jordglobe/games build` no longer exists (or is aliased to `build:astro`).
- `packages/games/public/` and `packages/games/vite.config.ts` do not exist.
- `pnpm preview` from repo root still builds everything + emulator works.
- Deploy to stage, smoke-test each game, then deploy to prod.
