#!/usr/bin/env bash
# Run the games dev server alongside the browser-log server it depends on.
# Ctrl+C cleans up both.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

LOG_PORT=9999
LOG_PID=""

cleanup() {
    if [[ -n "$LOG_PID" ]] && kill -0 "$LOG_PID" 2>/dev/null; then
        kill "$LOG_PID" 2>/dev/null || true
        wait "$LOG_PID" 2>/dev/null || true
    fi
}
trap cleanup EXIT INT TERM

echo "→ Starting log server (pnpm dev:logs)..."
pnpm dev:logs &
LOG_PID=$!

echo "→ Waiting for log server on :$LOG_PORT..."
for _ in $(seq 1 30); do
    if nc -z localhost "$LOG_PORT" 2>/dev/null; then
        break
    fi
    sleep 0.5
done

if ! nc -z localhost "$LOG_PORT" 2>/dev/null; then
    echo "✗ Log server did not start within 15s" >&2
    exit 1
fi

echo "→ Starting games dev server (pnpm dev:games)..."
pnpm dev:games
