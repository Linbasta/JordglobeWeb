#!/bin/bash
set -euo pipefail

TARGET="${1:-}"
if [[ "$TARGET" != "prod" && "$TARGET" != "stage" && "$TARGET" != "preview" ]]; then
  echo "Usage: $0 <prod|stage|preview>" >&2
  exit 1
fi

SITE_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="$SITE_ROOT/dist"

# Each embedded game points directly at its built output dir (the one
# containing index.html). Override per game with <NAME>_BUILD_DIR, e.g.:
#   EUROVISION_BUILD_DIR=/abs/path ./scripts/deploy.sh stage
GAMES=("eurovision")
EUROVISION_BUILD_DIR_DEFAULT="$SITE_ROOT/../games/dist-eurovision-embedded"

resolve_build_dir() {
  local game="$1"
  local var_name="$(echo "$game" | tr '[:lower:]-' '[:upper:]_')_BUILD_DIR"
  local default_var="${var_name}_DEFAULT"
  echo "${!var_name:-${!default_var:-}}"
}

if [[ ! -d "$BUILD_DIR" ]]; then
  echo "ERROR: $BUILD_DIR missing. Run 'pnpm deploy:$TARGET' from the repo root (turbo orchestrates the builds)." >&2
  exit 1
fi

echo "==> Copying game builds"
for game in "${GAMES[@]}"; do
  src="$(resolve_build_dir "$game")"
  dest="$BUILD_DIR/games/$game"
  if [[ -z "$src" ]]; then
    echo "ERROR: no build dir configured for '$game'" >&2
    exit 1
  fi
  if [[ ! -d "$src" ]]; then
    echo "ERROR: $src does not exist. Export the game first or set $(echo "$game" | tr '[:lower:]-' '[:upper:]_')_BUILD_DIR." >&2
    exit 1
  fi
  if [[ ! -f "$src/index.html" ]]; then
    echo "ERROR: $src/index.html missing — expected a built game, not source." >&2
    exit 1
  fi
  mkdir -p "$dest"
  rsync -a --delete "$src/" "$dest/"
  echo "    $game: $src -> dist/games/$game"
done

if [[ "$TARGET" == "preview" ]]; then
  echo "==> Starting Firebase Hosting emulator (respects firebase.json rewrites)"
  firebase emulators:start --only hosting:stage
else
  echo "==> Deploying to Firebase Hosting ($TARGET)"
  firebase deploy --only "hosting:$TARGET"
fi

echo "==> Done"
