#!/bin/bash
#
# SSH into the staging server
#
# Usage: ./ssh.sh
#        npm run deploy:ssh
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

echo "🔑 Connecting to $GCP_INSTANCE_NAME ($SERVER_IP)..."
echo ""

gcloud compute ssh "$GCP_INSTANCE_NAME" \
    --project="$GCP_PROJECT" \
    --zone="$GCP_ZONE"
