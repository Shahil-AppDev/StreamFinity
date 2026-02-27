#!/bin/bash
# StreamFinity Health Check Script
# Usage: crontab -e → */5 * * * * /var/www/tik.starline-agency.xyz/scripts/healthcheck.sh

APP_NAME="streamfinity-pro"
HEALTH_URL="http://localhost:3010/health"
LOG_FILE="/var/log/streamfinity/healthcheck.log"
MAX_RETRIES=2

check_health() {
    local response
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$HEALTH_URL" 2>/dev/null)
    echo "$response"
}

restart_app() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ALERT: Restarting $APP_NAME" >> "$LOG_FILE"
    pm2 restart "$APP_NAME" >> "$LOG_FILE" 2>&1
    sleep 5
    local code
    code=$(check_health)
    if [ "$code" = "200" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] RECOVERED: $APP_NAME is healthy after restart" >> "$LOG_FILE"
    else
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] CRITICAL: $APP_NAME still unhealthy after restart (HTTP $code)" >> "$LOG_FILE"
    fi
}

# Main check
HTTP_CODE=$(check_health)

if [ "$HTTP_CODE" = "200" ]; then
    exit 0
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: Health check failed (HTTP $HTTP_CODE), retrying..." >> "$LOG_FILE"
sleep 5

# Retry
HTTP_CODE=$(check_health)
if [ "$HTTP_CODE" = "200" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] OK: Recovered on retry" >> "$LOG_FILE"
    exit 0
fi

# Restart
restart_app
