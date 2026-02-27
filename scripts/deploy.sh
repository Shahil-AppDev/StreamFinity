#!/bin/bash
# StreamFinity Production Deploy Script
# Usage: bash scripts/deploy.sh

set -e

SERVER="root@77.42.34.90"
REMOTE_DIR="/var/www/tik.starline-agency.xyz"
LOCAL_SERVER="server"

echo "🚀 Deploying StreamFinity to production..."

# 1. Upload server files (excluding node_modules, .cache, logs)
echo "📦 Uploading server files..."
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.cache' \
    --exclude 'logs' \
    --exclude '.env' \
    ${LOCAL_SERVER}/ ${SERVER}:${REMOTE_DIR}/

# 2. Upload Nginx config
echo "🔧 Uploading Nginx config..."
scp scripts/tik.starline-agency.xyz.nginx ${SERVER}:/etc/nginx/sites-available/tik.starline-agency.xyz

# 3. Install dependencies on server
echo "📥 Installing dependencies..."
ssh ${SERVER} "cd ${REMOTE_DIR} && npm install --production --silent"

# 4. Create log directory
ssh ${SERVER} "mkdir -p /var/log/streamfinity && chmod 755 /var/log/streamfinity"

# 5. Test Nginx config and reload
echo "🔄 Reloading Nginx..."
ssh ${SERVER} "nginx -t && systemctl reload nginx"

# 6. Restart PM2 with ecosystem config
echo "♻️ Restarting application..."
ssh ${SERVER} "cd ${REMOTE_DIR} && pm2 delete streamfinity-pro 2>/dev/null; pm2 start ecosystem.config.js && pm2 save"

# 7. Wait and verify
echo "⏳ Waiting for startup..."
sleep 3

echo "✅ Verifying deployment..."
HTTP_CODE=$(ssh ${SERVER} "curl -s -o /dev/null -w '%{http_code}' http://localhost:3010/health")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Health check: OK (HTTP 200)"
else
    echo "⚠️ Health check: HTTP ${HTTP_CODE}"
fi

HTTPS_CODE=$(curl -s -o /dev/null -w '%{http_code}' https://tik.starline-agency.xyz/health 2>/dev/null || echo "000")
if [ "$HTTPS_CODE" = "200" ]; then
    echo "✅ HTTPS check: OK (HTTP 200)"
else
    echo "⚠️ HTTPS check: HTTP ${HTTPS_CODE}"
fi

echo ""
echo "🎉 StreamFinity deployed successfully!"
echo "   Dashboard: https://tik.starline-agency.xyz/"
echo "   Health:    https://tik.starline-agency.xyz/health"
echo "   API:       https://tik.starline-agency.xyz/api/unified/status"
echo "   Monitor:   https://tik.starline-agency.xyz/api/monitoring/dashboard"
