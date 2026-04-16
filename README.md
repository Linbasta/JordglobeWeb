# JordGlobe

Geography learning platform with interactive 3D globe quizzes.

## Prerequisites

- **Node.js** 20 or newer
- **pnpm** (install with `npm install -g pnpm`)
- **Python 3** (used by the games build pipeline)
- **Firebase CLI** (only required for deploying the site — `npm install -g firebase-tools`)

## Installation

Clone the repo and install all workspace dependencies from the root:

```bash
git clone <repo-url> JordglobeWeb
cd JordglobeWeb
pnpm install
```

This installs dependencies for both workspace packages:

- `packages/site` — Marketing website (Astro + Firebase Hosting)
- `packages/games` — Quiz games (Babylon.js)

## Running Locally

From the repo root:

```bash
pnpm dev:site      # Run the marketing site
pnpm dev:games     # Run the games dev server
pnpm dev           # Run both in parallel
```

## Building

```bash
pnpm build:site                   # Build the Astro site
pnpm build:games                  # Build the games
pnpm build:eurovision-embedded    # Build the Eurovision game for site embedding
```

## Deployment

```bash
pnpm deploy:stage   # Deploy to staging
pnpm deploy:prod    # Deploy to production
pnpm preview        # Build and preview the production bundle locally
```

## Project Structure

```
packages/site/      Astro marketing site
packages/games/     Babylon.js quiz games
shared/             Shared config (e.g. games-seo.json)
```

See each package's `CLAUDE.md` for package-specific details.
