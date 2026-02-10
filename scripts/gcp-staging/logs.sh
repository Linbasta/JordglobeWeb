#!/bin/bash
#
# View PM2 logs from the staging server
#
# Usage: ./logs.sh [lines]
#        npm run deploy:logs
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Load configuration
if [ ! -f config.sh ]; then
    echo "❌ config.sh not found!"
    exit 1
fi

source config.sh

LINES="${1:-50}"

echo "📋 Viewing last $LINES lines of logs from $GCP_INSTANCE_NAME..."
echo "   Press Ctrl+C to exit"
echo ""

gcloud compute ssh "$GCP_INSTANCE_NAME" \
    --project="$GCP_PROJECT" \
    --zone="$GCP_ZONE" \
    --command="pm2 logs jordglobe --lines $LINES --nostream"
