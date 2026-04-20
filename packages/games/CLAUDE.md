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

## Asset Paths

Always resolve local assets through `asset()` from `src/shared/asset-path.ts` (TS/JS) or `${import.meta.env.BASE_URL}file.png` (inline HTML scripts). Never hardcode `/file.png` — embedded deploys prefix `BASE_URL` (e.g. `/games/eurovision/`) and raw slashes 404.

Every new file under `public/` that a quiz references must also be added to `ALLOW_LIST` in `scripts/build-eurovision-deploy.mjs`, or the Eurovision standalone/embedded build will silently drop it.

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `quiz-debug-manager.ts` |
| Classes/Interfaces/Types | PascalCase | `QuizDebugManager` |
| Functions/Variables | camelCase | `startGame()` |
| Compile-time constants | SCREAMING_SNAKE | `EARTH_RADIUS` |

No "I" prefix for interfaces. No underscore prefix for private members.
