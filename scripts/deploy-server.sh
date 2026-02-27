#!/bin/bash
# ============================================================
# StreamFinity - Server Deployment Script
# Deploy StreamFinity to live.starline-agency.xyz (77.42.34.90)
#
# Prerequisites:
#   - SSH access to the server
#   - Node.js >= 16 installed on server
#   - Streamer.bot running with WebSocket Server enabled
#
# Usage: bash deploy-server.sh
# ============================================================

set -e

SERVER="77.42.34.90"
SERVER_DOMAIN="live.starline-agency.xyz"
SSH_USER="${SSH_USER:-root}"
DEPLOY_DIR="/opt/streamfinity"
SB_PORT=8090

echo "=========================================="
echo "  StreamFinity Deployment"
echo "  Target: $SSH_USER@$SERVER ($SERVER_DOMAIN)"
echo "  Deploy dir: $DEPLOY_DIR"
echo "=========================================="
echo ""

# ── 1. Check SSH connectivity ──
echo "[1/6] Testing SSH connection..."
ssh -o ConnectTimeout=5 "$SSH_USER@$SERVER" "echo 'SSH OK'" || {
    echo "ERROR: Cannot connect to $SERVER via SSH"
    echo "Make sure your SSH key is configured"
    exit 1
}

# ── 2. Check port availability ──
echo "[2/6] Checking port $SB_PORT availability..."
PORT_CHECK=$(ssh "$SSH_USER@$SERVER" "ss -tlnp sport = :$SB_PORT 2>/dev/null | grep -v State")
if [ -n "$PORT_CHECK" ]; then
    echo "WARNING: Port $SB_PORT is already in use!"
    echo "$PORT_CHECK"
    echo "Update config.json with a different port before deploying."
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then exit 1; fi
fi

# ── 3. Create deployment directory ──
echo "[3/6] Setting up deployment directory..."
ssh "$SSH_USER@$SERVER" "mkdir -p $DEPLOY_DIR"

# ── 4. Sync files (excluding vendor binaries and node_modules) ──
echo "[4/6] Syncing project files..."
rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude 'vendor/streamfinity-source' \
    --exclude 'vendor/app-1.1.24' \
    --exclude 'vendor/legacy' \
    --exclude 'dist' \
    --exclude '.git' \
    --exclude 'DIPS*' \
    --exclude 'SharedStorage*' \
    --exclude 'Local Storage' \
    --exclude 'Session Storage' \
    --exclude 'Network' \
    --exclude 'Partitions' \
    --exclude 'Shared Dictionary' \
    --exclude '*.exe' \
    --exclude '*.nupkg' \
    --exclude 'packages' \
    --exclude 'streamcontrol' \
    --exclude 'logs' \
    --exclude 'data' \
    ./ "$SSH_USER@$SERVER:$DEPLOY_DIR/"

# ── 5. Install dependencies on server ──
echo "[5/6] Installing dependencies on server..."
ssh "$SSH_USER@$SERVER" "cd $DEPLOY_DIR && npm install --production"

# ── 6. Setup PM2 process (if available) ──
echo "[6/6] Setting up process manager..."
ssh "$SSH_USER@$SERVER" "
    cd $DEPLOY_DIR
    if command -v pm2 &> /dev/null; then
        pm2 delete streamfinity 2>/dev/null || true
        pm2 start main.js --name streamfinity --node-args='--experimental-modules'
        pm2 save
        echo 'StreamFinity started with PM2'
    else
        echo 'PM2 not found. Install with: npm install -g pm2'
        echo 'Then run: pm2 start main.js --name streamfinity'
    fi
"

echo ""
echo "=========================================="
echo "  Deployment complete!"
echo "  StreamFinity running at: $SERVER_DOMAIN"
echo "  StreamerBot WS: ws://$SERVER_DOMAIN:$SB_PORT/"
echo "=========================================="
