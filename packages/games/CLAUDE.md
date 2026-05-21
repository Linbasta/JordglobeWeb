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

## Non-Quiz Games

Some games bypass `startQuizGame` entirely and instantiate `EarthGlobe` directly (e.g. `earth-on-stream`). These games have no questions, no score, and no quiz adapter — they use the globe as a standalone rendering component. User camera interaction is disabled; the camera is driven programmatically.

### Earth on Stream (`src/games/earth-on-stream/`)

Twitch-style geography guessing game (like "Words on Stream" but for locations). Players collaborate via Twitch chat to guess locations and earn points together.

**Page layout:** Two-column flex layout. Left: `#globe-area` (canvas, timer, Twitch status). Right: `#side-panel` (sidebar content, collapses to `width:0` when no round is active, animates open via CSS transition). Globe background is a solid dark navy (`#0a0a1a`), skybox disabled.

**Lobby & Twitch gate:** Game does not auto-start. On load, a lobby overlay appears requiring Twitch connection before play. The lobby shows a "Connect to Twitch" button (triggers OAuth flow) when disconnected — continent chips and Start button are disabled. Once connected, the host chooses a continent filter (World, Europe, Asia, Africa, N. America, S. America, Oceania) and clicks "Start Game". The lobby also displays the highest round reached per continent (persisted in localStorage). Disconnecting mid-game immediately ends the round and returns to the lobby.

**Continent filtering:** `filterByContinent()` in `locations.ts` uses lat/lon bounding boxes to narrow the location pool. Each continent has one or more bounding boxes. "World" returns all locations unfiltered. Some boundary overlap exists (e.g. Turkey appears in both Europe and Asia boxes) which is intentional.

**Session/Round system:** A session is a series of rounds. Each round picks 8–12 locations (randomized); players guess to earn points (Easy=100, Medium=200, Hard=300). Points go to the guessing player and a global pool. The round goal is 60% of the max possible score for that round's actual locations. If the goal is met when the round ends (timer or all guessed), players advance to a harder round. If not, the session ends (returns to lobby) and scores reset.

**Difficulty progression:** Round 1 = difficulty 1 only, round 2 = difficulty 1 & 2 mix, round 3 = difficulty 2 only, round 4 = difficulty 2 & 3 mix, round 5+ = difficulty 3 only. Sidebar hints scale with difficulty: rounds 1–4 show all letters scrambled in the squares, rounds 5–10 reveal 10% of letters (min 1) in correct position, rounds 11+ show no hints (all blank squares).

**Between-round leaderboard:** After each round, a popup shows player rankings (round points + session total) and either "Next Round" (goal met) or "New Session" (session over → returns to lobby).

**Highest round tracking:** `getHighestRound(continent)` / `updateHighestRound(continent, round)` in `game-state.ts` persist per-continent best round in localStorage (`eos-high-round` key). Updated at the start of each round; displayed in the lobby, updating live as the host switches continent chips.

**Location data:** 2,241 locations (1,266 cities + 975 landmarks) sourced from `data/legacy/locations_en.json`, pre-processed into `public-prod/stream-locations.json` (134KB). Difficulty ratings come from the legacy data for cities; landmarks have manual overrides for well-known ones. Capital cities (202) are flagged with `cap: 1` in the JSON and `capital: boolean` on `StreamLocation`, sourced from the legacy data's `tags` array. Loaded at runtime via `fetch()`.

**Camera behavior:** No user interaction (`detachControl()`). Camera cycles through a pre-shuffled queue of all locations, skipping guessed ones and advancing forward (never revisiting). Uses `animateToLocation()` (default 3s fly, 3.5s dwell — adjustable via settings menu). Uses a generation counter to prevent stale animation callbacks. Pauses during correct-guess effects, then resumes from the next unguessed location in the queue.

**Sound effects:** Uses the shared `sfx-player.ts` system. Correct guesses play `playCorrectSfx()` (cycles through 7 variants). Round end plays `playFanfareSuccess()` (goal met) or `playFanfareFail()` (goal not met). Audio files: `public-prod/sfx/correct_*.ogg`, `FanfareSuccess.mp3`, `FanfareFail.mp3`.

**Music system:** `round-music.ts` manages background music with a shared volume control (default 50%). Menu music (`EarthOnStreamMenu.mp3`) loops in the lobby, crossfading into round music on game start. Round music uses 3 speed variants of the same song (`Cartography Countdown.mp3`, `2.mp3`, `3.mp3`): normal speed for the first 60s, crossfade to faster variant at 60s, crossfade to fastest at 15s remaining. Crossfades match the fractional song position so the transition is seamless. Volume slider appears in both the lobby and the in-game settings menu, synced via `onVolumeChange` listeners. Autoplay is gated behind a user gesture listener.

**Settings menu:** Gear icon button in top-left of globe area toggles a panel with sliders for Music Volume, Dwell Time (camera hold duration), and Fly Duration (camera movement speed). Changes take effect on the next camera move.

**Dev cheat:** In dev mode (`import.meta.env.DEV`), pressing `0` instantly clears the round — reveals all locations, credits points, triggers round end.

**File layout:**
- `locations.ts` — `StreamLocation` (with `difficulty: 1|2|3`, `type: 'city'|'landmark'`, `capital: boolean`), `LocationSet`, `Continent` types, `loadAllLocations()` fetches from `stream-locations.json`, alias map for alternative names, `pickRoundForSession()` difficulty-based picking, `filterByContinent()` lat/lon bounding box filter, `POINTS_BY_DIFFICULTY`
- `game-state.ts` — Session + round state, player score tracking (`Map<username, {roundPoints, totalPoints}>`), `processGuess()` with accent-stripping + alias matching + scoring, `startSession()`/`advanceRound()`/`getLeaderboard()`, round goal = 60% of max possible score, `getHighestRound()`/`updateHighestRound()` localStorage persistence, `cheatClearRound()` dev helper, `getRoundLocation()` index-based access
- `lobby-ui.ts` — Lobby overlay: Twitch connection gate (connect button or connected pill), continent selector chips, best round display, music volume slider, Start Game button. Disables game controls when Twitch not connected
- `sidebar-ui.ts` — Renders into `#side-panel` container (not a fixed overlay). Round number, score/goal display, "City"/"Landmark" type label per row, letter squares sorted short→long with hint modes (scrambled/partial/none by round), staggered reveal animation with username. Active camera target row is highlighted with border accent and auto-scrolls into view. Focus display clones current location's letter squares into a large centered overlay below the timer bar. Sets panel width dynamically; collapses to 0 on dispose
- `round-music.ts` — Menu music (lobby loop) and round music (3-speed crossfading tracks), shared volume control with getter/setter/listener pattern, browser autoplay gesture gate
- `leaderboard-ui.ts` — Between-round popup: player rankings table, score vs goal, "Next Round" or "New Session" button
- `input-ui.ts` — Bottom text input with green/red flash feedback
- `globe-effects.ts` — Particle burst + marker scale pulse → release on correct guess
- `timer-ui.ts` — Centered pill bar at top of `#globe-area` (position:absolute), 28px tall, max 800px wide, rounded with 3px border frame, 25%/50%/75% divider marks, green→orange→red color shift (120s default)
- `twitch-auth.ts` — OAuth auth code flow, token storage/refresh via stream-server
- `twitch-chat.ts` — WebSocket IRC connection to Twitch chat, message parsing, reconnection with backoff
- `twitch-ui.ts` — Connect/disconnect button UI on globe area (during gameplay), exports `TWITCH_ICON` SVG
- `GameRoot.astro` — Two-column HTML layout (`#globe-area` + `#side-panel`), wires everything: lobby → Twitch gate → session lifecycle, camera cycling (shuffled queue-based), round timer, guess→effect→reveal→score flow, leaderboard between rounds, settings menu (top-left gear icon), mid-game disconnect handling, dev cheat key

## Development Servers

**Claude must NEVER start/stop/restart servers.** User manages servers manually.

**The log server (`pnpm dev:logs`) must be started before `pnpm dev:games`.**

| Server | Port | Package | Command |
|--------|------|---------|---------|
| Astro Dev | 4818 | games | `pnpm dev:games` |
| Party Server | 3003 | party-server | `pnpm dev:party` |
| Browser Console | 9999 | games | `pnpm dev:logs` |

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
