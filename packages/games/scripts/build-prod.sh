#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
GAMES_ROOT="$SCRIPT_DIR/.."

cd "$GAMES_ROOT"

# Temporarily move dev pages out before production build
mkdir -p .dev-pages-temp
mv src/pages/dev .dev-pages-temp/ 2>/dev/null || true
mv src/pages/experiments .dev-pages-temp/ 2>/dev/null || true
mv "src/pages/[...devindex].astro" .dev-pages-temp/ 2>/dev/null || true

echo "==> Building production games (dev pages temporarily moved out)"

# Build - only production pages remain in src/pages/
astro build

# Move dev pages back
mv .dev-pages-temp/* src/pages/ 2>/dev/null || true
rmdir .dev-pages-temp 2>/dev/null || true

echo "==> Production build complete, dev pages restored"
