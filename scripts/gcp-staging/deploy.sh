#!/bin/bash
#
# Fast deployment script using rsync
#
# Usage: ./deploy.sh
#        npm run deploy
#
# This script:
# 1. Builds the app locally
# 2. Rsyncs dist/, server/, and public/ to the server
# 3. Installs/updates dependencies on server
# 4. Restarts PM2
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$SCRIPT_DIR"

# Load configuration
if [ ! -f config.sh ]; then
    echo "❌ config.sh not found!"
    echo "Run ./create-server.sh and ./setup-server.sh first"
    exit 1
fi

source config.sh

if [ -z "$SERVER_IP" ]; then
    echo "❌ SERVER_IP not set in config.sh!"
    exit 1
fi

echo "🚀 Deploying to staging server..."
echo "   Server: $SERVER_IP"
echo "   App: $APP_DIR"
echo ""

# Step 1: Build locally
echo "📦 Building application..."
cd "$PROJECT_ROOT"
npm run build
echo "✅ Build complete"
echo ""

# Step 2: Sync files to server using gcloud compute scp
echo "📤 Syncing files to server..."

echo "   → dist/"
gcloud compute scp --recurse \
    "$PROJECT_ROOT/dist" \
    "$GCP_INSTANCE_NAME:$APP_DIR/" \
    --project="$GCP_PROJECT" \
    --zone="$GCP_ZONE" &>/dev/null

echo "   → server/"
gcloud compute scp --recurse \
    "$PROJECT_ROOT/server" \
    "$GCP_INSTANCE_NAME:$APP_DIR/" \
    --project="$GCP_PROJECT" \
    --zone="$GCP_ZONE" &>/dev/null

echo "   → public/"
gcloud compute scp --recurse \
    "$PROJECT_ROOT/public" \
    "$GCP_INSTANCE_NAME:$APP_DIR/" \
    --project="$GCP_PROJECT" \
    --zone="$GCP_ZONE" &>/dev/null

echo "   → package.json"
gcloud compute scp \
    "$PROJECT_ROOT/package.json" \
    "$GCP_INSTANCE_NAME:$APP_DIR/" \
    --project="$GCP_PROJECT" \
    --zone="$GCP_ZONE" &>/dev/null

if [ -f "$PROJECT_ROOT/package-lock.json" ]; then
    gcloud compute scp \
        "$PROJECT_ROOT/package-lock.json" \
        "$GCP_INSTANCE_NAME:$APP_DIR/" \
        --project="$GCP_PROJECT" \
        --zone="$GCP_ZONE" &>/dev/null || true
fi

echo "✅ Files synced"
echo ""

# Step 3: Install dependencies and restart on server
echo "🔄 Installing dependencies and restarting app..."
gcloud compute ssh "$GCP_INSTANCE_NAME" \
    --project="$GCP_PROJECT" \
    --zone="$GCP_ZONE" \
    --command="bash -s" << EOF
set -e
cd $APP_DIR

# Install/update dependencies (only production)
echo "Installing dependencies..."
npm install --production --quiet

# Set environment variables for PM2
export PORT=$APP_PORT
export NODE_ENV=production
export BASIC_AUTH_USER="$BASIC_AUTH_USER"
export BASIC_AUTH_PASSWORD="$BASIC_AUTH_PASSWORD"

# Check if PM2 process exists
if pm2 describe jordglobe &>/dev/null; then
    echo "Restarting PM2 process..."
    pm2 restart jordglobe --update-env
else
    echo "Starting new PM2 process..."
    pm2 start server/production.mjs --name jordglobe
    pm2 save
fi

echo ""
echo "✅ App restarted successfully"
pm2 status jordglobe

EOF

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌍 Your app is running at:"

if [ -n "$DOMAIN" ]; then
    echo "   https://$DOMAIN (HTTPS)"
    echo "   http://$DOMAIN (redirects to HTTPS)"
    echo ""
    echo "   Alternative: http://$SERVER_IP:$APP_PORT (direct, HTTP only)"
else
    echo "   http://$SERVER_IP (via Caddy)"
    echo "   http://$SERVER_IP:$APP_PORT (direct)"
fi

echo ""
echo "🔐 Login with:"
echo "   Username: $BASIC_AUTH_USER"
echo "   Password: $BASIC_AUTH_PASSWORD"
echo ""
echo "📋 Useful commands:"
echo "   npm run deploy:logs  - View server logs"
echo "   npm run deploy:ssh   - SSH into server"
