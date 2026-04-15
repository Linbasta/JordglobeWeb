#!/bin/bash
#
# Fetch analytics from production server
#
# Usage: ./analytics.sh
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

echo "📊 Fetching analytics from $DOMAIN..."
echo ""

# SSH into server and run analytics
gcloud compute ssh "$GCP_INSTANCE_NAME" \
    --project="$GCP_PROJECT" \
    --zone="$GCP_ZONE" \
    --command='bash -s' << 'EOF'

LOG="/var/log/caddy/access.log"

if [ ! -f "$LOG" ]; then
    echo "❌ No access log found at $LOG"
    exit 1
fi

# Calculate timestamp for 24 hours ago (Unix epoch)
YESTERDAY=$(date -d '24 hours ago' +%s 2>/dev/null || date -v-24H +%s)

echo "=== JordGlobe Analytics (Last 24 Hours) ==="
echo ""

# Filter logs from last 24 hours and extract stats
# Caddy JSON log format has "ts" field as Unix timestamp
FILTERED=$(sudo cat "$LOG" | jq -c "select(.ts >= $YESTERDAY)" 2>/dev/null)

if [ -z "$FILTERED" ]; then
    echo "No requests in the last 24 hours"
    exit 0
fi

TOTAL=$(echo "$FILTERED" | wc -l)
UNIQUE_IPS=$(echo "$FILTERED" | jq -r '.request.remote_ip' | sort -u | wc -l)

echo "📈 Summary"
echo "   Total requests:  $TOTAL"
echo "   Unique IPs:      $UNIQUE_IPS"
echo ""

echo "🌍 Unique IPs:"
echo "$FILTERED" | jq -r '.request.remote_ip' | sort | uniq -c | sort -rn | while read count ip; do
    printf "   %4d  %s\n" "$count" "$ip"
done
echo ""

echo "📄 Visitors per URL:"
echo "$FILTERED" | jq -r '.request.uri' | grep -v '^\(/assets/\|/textures/\|\.js\|\.css\|\.png\|\.jpg\|\.ico\|\.woff\|\.gz\)' | sort | uniq -c | sort -rn | head -20 | while read count url; do
    printf "   %4d  %s\n" "$count" "$url"
done

EOF
