#!/bin/bash
#
# Update Caddy configuration with new domain (enables/disables HTTPS)
#
# Usage: ./update-caddy.sh
#
# Updates the Caddyfile on the server based on the DOMAIN setting in config.sh
# Use this when you:
# - Add a domain to enable HTTPS
# - Remove a domain to disable HTTPS
# - Change to a different domain

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Load configuration
if [ ! -f config.sh ]; then
    echo "❌ config.sh not found!"
    exit 1
fi

source config.sh

if [ -z "$SERVER_IP" ]; then
    echo "❌ SERVER_IP not set in config.sh!"
    exit 1
fi

echo "🔧 Updating Caddy configuration on $SERVER_IP"
echo ""

if [ -n "$DOMAIN" ]; then
    echo "🔒 Enabling HTTPS with domain: $DOMAIN"
    echo ""
    echo "⚠️  IMPORTANT: Ensure your DNS is configured first!"
    echo "   A record: $DOMAIN → $SERVER_IP"
    echo ""
    read -p "Is your DNS configured and propagated? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Please configure DNS first, then run this script again"
        exit 1
    fi
else
    echo "📖 Disabling HTTPS (no domain configured)"
fi

# Update Caddyfile on server
echo "📝 Updating Caddyfile..."
gcloud compute ssh "$GCP_INSTANCE_NAME" \
    --project="$GCP_PROJECT" \
    --zone="$GCP_ZONE" \
    --command="bash -s" << EOF
set -e

# Backup existing Caddyfile
sudo cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.backup

# Create new Caddyfile
if [ -n "$DOMAIN" ]; then
    echo "Creating HTTPS configuration..."
    sudo tee /etc/caddy/Caddyfile > /dev/null << 'CADDY'
# HTTPS configuration with automatic Let's Encrypt certificate
$DOMAIN {
    reverse_proxy localhost:$APP_PORT

    # Optional: Enable compression
    encode gzip

    # Optional: Access logging
    log {
        output file /var/log/caddy/access.log
    }
}
CADDY
else
    echo "Creating HTTP-only configuration..."
    sudo tee /etc/caddy/Caddyfile > /dev/null << 'CADDY'
# HTTP only configuration (no domain)
:80 {
    reverse_proxy localhost:$APP_PORT

    # Optional: Enable compression
    encode gzip

    # Optional: Access logging
    log {
        output file /var/log/caddy/access.log
    }
}
CADDY
fi

# Replace variables
sudo sed -i "s/\\\$DOMAIN/$DOMAIN/g" /etc/caddy/Caddyfile
sudo sed -i "s/\\\$APP_PORT/$APP_PORT/g" /etc/caddy/Caddyfile

# Validate new configuration
echo "Validating configuration..."
if sudo caddy validate --config /etc/caddy/Caddyfile; then
    echo "✅ Configuration valid"

    # Reload Caddy with new config
    echo "Reloading Caddy..."
    sudo systemctl reload caddy

    echo "✅ Caddy reloaded successfully"

    # Show status
    sudo systemctl status caddy --no-pager -l
else
    echo "❌ Configuration invalid! Restoring backup..."
    sudo cp /etc/caddy/Caddyfile.backup /etc/caddy/Caddyfile
    exit 1
fi

EOF

echo ""
echo "✅ Caddy configuration updated!"
echo ""

if [ -n "$DOMAIN" ]; then
    echo "🌍 Your app is now available at:"
    echo "   https://$DOMAIN"
    echo ""
    echo "⏳ Note: First HTTPS request may take a few seconds while"
    echo "   Let's Encrypt certificate is obtained automatically."
    echo ""
    echo "📋 Check certificate status:"
    echo "   npm run deploy:ssh"
    echo "   sudo caddy list-certificates"
else
    echo "🌍 Your app is available at:"
    echo "   http://$SERVER_IP"
fi

echo ""
echo "📋 View Caddy logs:"
echo "   npm run deploy:ssh"
echo "   sudo journalctl -u caddy -f"
