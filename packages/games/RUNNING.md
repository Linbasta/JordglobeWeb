# Running JordGlobe Games

## Development

### Games Dev Server (Port 4818)

```bash
pnpm dev:games
```

Serves all game pages with hot reload at http://localhost:4818/games/

### Party Server (Port 3003)

For multiplayer games, run in a separate terminal:

```bash
pnpm dev:party-server
```

### Log Server (Port 9999)

Captures browser console logs to `browser-console.log`:

```bash
npm run log-server
```

## Accessing Games

### Production Games
- http://localhost:4818/games/eurovision/

### Experiments (dev-only)
- http://localhost:4818/games/experiments/party/
- http://localhost:4818/games/experiments/host/
- http://localhost:4818/games/experiments/country-quiz/
- http://localhost:4818/games/experiments/capitals-quiz/

### Test Pages (dev-only)
- http://localhost:4818/games/dev/test/bot-panel/
- http://localhost:4818/games/dev/test/camera-animation/
- (and other test pages in `src/dev-tests/`)

## Production Build & Preview

Build and preview the full site (from repo root):

```bash
pnpm preview
```

This builds both `@jordglobe/site` and `@jordglobe/games`, merges them, and starts a Firebase emulator.

## Logs

- **Browser Console**: `browser-console.log` (when log-server is running)
- **Build output**: Terminal
