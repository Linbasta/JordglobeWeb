#!/bin/bash
set -euo pipefail

TARGET="${1:-}"
if [[ "$TARGET" != "prod" && "$TARGET" != "stage" && "$TARGET" != "preview" ]]; then
  echo "Usage: $0 <prod|stage|preview>" >&2
  exit 1
fi

SITE_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="$SITE_ROOT/dist"
GAMES_DIST="$SITE_ROOT/../games/dist"

if [[ ! -d "$BUILD_DIR" ]]; then
  echo "ERROR: $BUILD_DIR missing. Run 'pnpm deploy:$TARGET' from the repo root (turbo orchestrates the builds)." >&2
  exit 1
fi

# Games are built by @jordglobe/games via astro build. Single dist output at
# ../games/dist/ contains all published games' HTML + shared _astro chunks +
# public-prod assets, all namespaced under /games/ via astro.config.mjs base.
if [[ ! -d "$GAMES_DIST" ]]; then
  echo "ERROR: $GAMES_DIST missing. Run 'pnpm build:games' first." >&2
  exit 1
fi
if [[ ! -f "$GAMES_DIST/eurovision/index.html" ]]; then
  echo "ERROR: $GAMES_DIST/eurovision/index.html missing — games build did not produce eurovision." >&2
  exit 1
fi

echo "==> Copying games dist -> site dist/games/"
mkdir -p "$BUILD_DIR/games"
# No --delete: site's astro build recreates dist/ each run, so nothing is
# stale. Using --delete would clobber site-owned files like the localized
# /games/ landing page (src/components/pages/GamesPage.astro).
rsync -a "$GAMES_DIST/" "$BUILD_DIR/games/"

if [[ "$TARGET" == "preview" ]]; then
  echo "==> Starting Firebase Hosting emulator (respects firebase.json rewrites)"
  firebase emulators:start --only hosting:stage
elif [[ "$TARGET" == "stage" ]]; then
  echo "==> Deploying to Cloudflare Pages (staging)"
  pnpm wrangler pages deploy "$BUILD_DIR" --project-name=jordglobe-staging
else
  echo "==> Deploying to Firebase Hosting ($TARGET)"
  firebase deploy --only "hosting:$TARGET"
fi

echo "==> Done"
