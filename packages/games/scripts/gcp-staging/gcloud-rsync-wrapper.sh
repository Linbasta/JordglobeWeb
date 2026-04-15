#!/bin/bash
# Wrapper script for rsync to work with gcloud compute ssh
# rsync calls: wrapper.sh INSTANCE rsync --server ...
# We need to call: gcloud compute ssh INSTANCE --project=X --zone=Y -- rsync --server ...

INSTANCE="$1"
shift  # Remove instance name from arguments

# Source config to get project and zone
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"

# Execute gcloud ssh with instance name in correct position
exec gcloud compute ssh "$INSTANCE" \
    --project="$GCP_PROJECT" \
    --zone="$GCP_ZONE" \
    -- "$@"
