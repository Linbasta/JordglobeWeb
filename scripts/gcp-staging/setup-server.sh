#!/bin/bash
#
# Set up the GCP staging server with Node.js, PM2, and app directory
#
# Usage: ./setup-server.sh
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Load configuration
if [ ! -f config.sh ]; then
    echo "❌ config.sh not found! Run ./create-server.sh first."
    exit 1
fi

source config.sh

if [ -z "$SERVER_IP" ]; then
    echo "❌ SERVER_IP not set in config.sh!"
    echo "Update config.sh with the IP from create-server.sh"
    exit 1
fi

echo "🔧 Setting up server: $SERVER_IP"
echo "   User: $SERVER_USER"
echo "   App dir: $APP_DIR"
echo ""

# Test SSH connection
echo "🔑 Testing SSH connection..."
if ! gcloud compute ssh "$GCP_INSTANCE_NAME" \
    --project="$GCP_PROJECT" \
    --zone="$GCP_ZONE" \
    --command="echo 'SSH connection successful'" &>/dev/null; then
    echo "❌ Cannot connect to server via SSH!"
    echo "Try running: gcloud compute ssh $GCP_INSTANCE_NAME --project=$GCP_PROJECT --zone=$GCP_ZONE"
    exit 1
fi
echo "✅ SSH connection OK"
echo ""

# Run setup commands on server
echo "📦 Installing Node.js $NODE_VERSION and PM2..."
gcloud compute ssh "$GCP_INSTANCE_NAME" \
    --project="$GCP_PROJECT" \
    --zone="$GCP_ZONE" \
    --command="bash -s" << EOF
set -e

echo "Updating system packages..."
sudo apt-get update -qq

echo "Installing Node.js $NODE_VERSION..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi

echo "Setting up PM2 startup script..."
sudo env PATH=\$PATH:/usr/bin pm2 startup systemd -u $SERVER_USER --hp /home/$SERVER_USER
pm2 save

echo "Creating app directory..."
mkdir -p $APP_DIR
mkdir -p $APP_DIR/dist
mkdir -p $APP_DIR/server
mkdir -p $APP_DIR/public
mkdir -p $APP_DIR/node_modules

echo ""
echo "✅ Setup complete!"
echo "   Node version: \$(node --version)"
echo "   npm version: \$(npm --version)"
echo "   PM2 version: \$(pm2 --version)"

EOF

echo ""
echo "✅ Server setup complete!"
echo ""
echo "📋 Server Info:"
echo "   IP: $SERVER_IP"
echo "   User: $SERVER_USER"
echo "   App directory: $APP_DIR"
echo "   Port: $APP_PORT"
echo ""
echo "🔐 Basic Auth Credentials:"
echo "   Username: $BASIC_AUTH_USER"
echo "   Password: $BASIC_AUTH_PASSWORD"
echo ""
echo "Next step: Run 'npm run deploy' to deploy your app"
