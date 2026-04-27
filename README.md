# JordGlobe

Geography learning platform with interactive 3D globe quizzes.

## Prerequisites

- **Node.js** 20 or newer
- **pnpm** (`npm install -g pnpm`)
- **Firebase CLI** — only for deploying (`npm install -g firebase-tools`)

## Installation

```bash
git clone <repo-url> JordglobeWeb
cd JordglobeWeb
pnpm install
```

## Running Locally

```bash
pnpm dev:site      # Marketing site (port 4321)
pnpm dev:games     # Games dev server (port 4818)
pnpm dev:party     # Multiplayer WebSocket server (port 3003)
pnpm dev:logs      # Browser console log server (port 9999)
pnpm dev           # Site + games in parallel
```

## Building

```bash
pnpm build:site
pnpm build:games
pnpm build:functions
```

## Deployment

```bash
pnpm deploy:stage       # Deploy site to staging
pnpm deploy:prod        # Deploy site to production
pnpm deploy:functions   # Deploy Cloud Functions
pnpm deploy:rules       # Deploy Firestore rules
pnpm preview            # Build & preview production site locally
```

## Project Structure

```
packages/site/          Astro marketing site (Firebase Hosting)
packages/games/         Babylon.js quiz games (Astro)
packages/party-server/  WebSocket server for multiplayer
packages/functions/     Firebase Cloud Functions
shared/                 Shared config (e.g. games-seo.json)
```

See each package's `CLAUDE.md` for package-specific details.
