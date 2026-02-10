# GCP Staging Deployment

Fast deployment setup for JordGlobe on Google Cloud Platform using e2-small instance and rsync.

## Features

- **Fast deployments:** 10-20 seconds via rsync
- **Simple setup:** One-time configuration, then deploy with one command
- **Basic Auth:** Password-protected access for team members
- **Cost-effective:** ~$12/month for e2-small (2 vCPU, 2 GB RAM)

## Quick Start

### 1. Initial Setup (15 minutes, one-time)

#### Configure GCP settings

```bash
cd scripts/gcp-staging
cp config.sh.example config.sh
```

Edit `config.sh` and set:
- `GCP_PROJECT` - Your GCP project ID
- `GCP_ZONE` - Preferred zone (e.g., `us-central1-a`)
- `SERVER_USER` - Your username (from `whoami`)
- `BASIC_AUTH_USER` / `BASIC_AUTH_PASSWORD` - Team credentials

#### Create and set up server

```bash
# Create GCP instance
./create-server.sh

# Update config.sh with the SERVER_IP from output

# Set up Node.js, PM2 on server
./setup-server.sh
```

### 2. Deploy Your App

```bash
# From project root
npm install              # Install express-basic-auth
npm run deploy          # Build + deploy (10-20 seconds)
```

That's it! Your app is now running at `http://SERVER_IP:8080`

## Daily Workflow

### Deploy Changes

```bash
npm run deploy          # Build + rsync + restart
```

### View Logs

```bash
npm run deploy:logs     # View last 50 lines
./scripts/gcp-staging/logs.sh 100  # View last 100 lines
```

### SSH Into Server

```bash
npm run deploy:ssh
# or
./scripts/gcp-staging/ssh.sh
```

## File Structure

```
scripts/gcp-staging/
├── config.sh.example    # Configuration template
├── config.sh            # Your config (gitignored)
├── create-server.sh     # Create GCP instance
├── setup-server.sh      # Install Node.js, PM2
├── deploy.sh            # Fast deployment (rsync)
├── ssh.sh               # SSH helper
├── logs.sh              # View logs
└── README.md            # This file
```

## How Deployment Works

1. **Build locally** - Runs `npm run build` to create production bundle
2. **Rsync files** - Syncs `dist/`, `server/`, `public/` to server (only changed files)
3. **Install dependencies** - Runs `npm install --production` on server
4. **Restart PM2** - Restarts the app with zero-downtime

**Time:** ~10-20 seconds depending on changes

## Server Details

**Instance Type:** e2-small
- 2 vCPU (50% baseline, burstable)
- 2 GB RAM
- 10 GB disk
- ~$12/month

**Software:**
- Ubuntu 22.04 LTS
- Node.js 20 LTS
- PM2 (process manager with auto-restart)

**Ports:**
- 8080 - HTTP (app)

## Security

**Basic Auth:**
- All routes protected with username/password
- Credentials set in `config.sh`
- Browser prompts for login

**Firewall:**
- Only port 8080 open (HTTP)
- SSH via GCP IAP tunnel (no direct SSH port)

## Troubleshooting

### Deployment fails with "cannot connect to server"

Check SSH access:
```bash
gcloud compute ssh jordglobe-staging --project=YOUR_PROJECT --zone=YOUR_ZONE
```

### App not responding after deployment

Check PM2 status:
```bash
npm run deploy:ssh
pm2 status
pm2 logs jordglobe --lines 50
```

Restart manually:
```bash
npm run deploy:ssh
cd ~/jordglobe
pm2 restart jordglobe
```

### "Permission denied" on scripts

Make scripts executable:
```bash
chmod +x scripts/gcp-staging/*.sh
```

### Want to start fresh

Delete and recreate:
```bash
./create-server.sh  # Will prompt to delete existing instance
./setup-server.sh
npm run deploy
```

## Cost Management

**Estimated costs:**
- e2-small instance: ~$12/month
- Network egress: ~$1-5/month (internal testing)
- **Total: ~$13-17/month**

**To reduce costs:**
- Stop instance when not in use: `gcloud compute instances stop jordglobe-staging`
- Start when needed: `gcloud compute instances start jordglobe-staging`
- Billing is per-second, so stopping saves money

**To delete everything:**
```bash
gcloud compute instances delete jordglobe-staging --zone=YOUR_ZONE
gcloud compute firewall-rules delete allow-jordglobe-8080
```

## Advanced

### Change instance type

Edit `config.sh`:
```bash
GCP_MACHINE_TYPE="e2-medium"  # 2 vCPU, 4 GB RAM (~$24/month)
```

Then recreate:
```bash
./create-server.sh  # Delete and recreate
./setup-server.sh
npm run deploy
```

### Custom domain with HTTPS

Install Caddy on server for automatic HTTPS:
```bash
npm run deploy:ssh
curl https://getcaddy.com | bash
# Configure Caddyfile
```

### Monitor server resources

```bash
npm run deploy:ssh
htop           # CPU/RAM usage
pm2 monit      # PM2 monitoring
```

## Support

For issues, check:
1. Server logs: `npm run deploy:logs`
2. PM2 status: `npm run deploy:ssh` then `pm2 status`
3. GCP console for instance health
