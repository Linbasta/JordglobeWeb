#!/bin/bash
#
# Create GCP e2-small instance for staging deployment
#
# Usage: ./create-server.sh
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Load configuration
if [ ! -f config.sh ]; then
    echo "❌ config.sh not found!"
    echo "Copy config.sh.example to config.sh and fill in your values:"
    echo "  cp config.sh.example config.sh"
    exit 1
fi

source config.sh

echo "🚀 Creating GCP Instance: $GCP_INSTANCE_NAME"
echo "   Project: $GCP_PROJECT"
echo "   Zone: $GCP_ZONE"
echo "   Type: $GCP_MACHINE_TYPE"
echo ""

# Check if instance already exists
if gcloud compute instances describe "$GCP_INSTANCE_NAME" \
    --project="$GCP_PROJECT" \
    --zone="$GCP_ZONE" &>/dev/null; then
    echo "⚠️  Instance $GCP_INSTANCE_NAME already exists!"
    echo ""
    read -p "Delete and recreate? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🗑️  Deleting existing instance..."
        gcloud compute instances delete "$GCP_INSTANCE_NAME" \
            --project="$GCP_PROJECT" \
            --zone="$GCP_ZONE" \
            --quiet
    else
        echo "Keeping existing instance."
        exit 0
    fi
fi

# Create firewall rule for app port
echo "🔥 Creating firewall rule for port $APP_PORT..."
if ! gcloud compute firewall-rules describe "allow-jordglobe-$APP_PORT" \
    --project="$GCP_PROJECT" &>/dev/null; then
    gcloud compute firewall-rules create "allow-jordglobe-$APP_PORT" \
        --project="$GCP_PROJECT" \
        --allow="tcp:$APP_PORT" \
        --description="Allow JordGlobe staging app traffic" \
        --direction=INGRESS \
        --priority=1000 \
        --source-ranges=0.0.0.0/0
    echo "✅ Firewall rule created"
else
    echo "✅ Firewall rule already exists"
fi

# Create instance
echo ""
echo "🖥️  Creating compute instance..."
gcloud compute instances create "$GCP_INSTANCE_NAME" \
    --project="$GCP_PROJECT" \
    --zone="$GCP_ZONE" \
    --machine-type="$GCP_MACHINE_TYPE" \
    --boot-disk-size="$GCP_DISK_SIZE" \
    --boot-disk-type=pd-standard \
    --image-family=ubuntu-2204-lts \
    --image-project=ubuntu-os-cloud \
    --metadata=enable-oslogin=FALSE \
    --tags=http-server,https-server

echo ""
echo "⏳ Waiting for instance to be ready..."
sleep 10

# Get external IP
SERVER_IP=$(gcloud compute instances describe "$GCP_INSTANCE_NAME" \
    --project="$GCP_PROJECT" \
    --zone="$GCP_ZONE" \
    --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

echo ""
echo "✅ Instance created successfully!"
echo ""
echo "   Name: $GCP_INSTANCE_NAME"
echo "   IP:   $SERVER_IP"
echo "   Type: $GCP_MACHINE_TYPE (2 vCPU, 2 GB RAM)"
echo ""
echo "📝 Update config.sh with the server IP:"
echo "   SERVER_IP=\"$SERVER_IP\""
echo ""
echo "🔑 Add your SSH key to the instance:"
echo "   gcloud compute ssh $GCP_INSTANCE_NAME --project=$GCP_PROJECT --zone=$GCP_ZONE"
echo ""
echo "Next step: Run ./setup-server.sh to configure the server"
