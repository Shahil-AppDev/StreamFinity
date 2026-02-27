#!/bin/bash
# StreamFinity Backup Script
# Usage: bash backup.sh (or via crontab: 0 2 * * * /var/www/tik.starline-agency.xyz/scripts/backup.sh)

set -e

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/streamfinity"
APP_DIR="/var/www/tik.starline-agency.xyz"

mkdir -p $BACKUP_DIR

echo "[${DATE}] Starting StreamFinity backup..."

# Backup MongoDB
echo "  Backing up MongoDB..."
mongodump --db streamfinity --out $BACKUP_DIR/mongodb_$DATE --quiet 2>/dev/null && \
    echo "  ✓ MongoDB backed up" || echo "  ✗ MongoDB backup failed"

# Backup Redis
echo "  Backing up Redis..."
redis-cli BGSAVE >/dev/null 2>&1
sleep 2
cp /var/lib/redis/dump.rdb $BACKUP_DIR/redis_$DATE.rdb 2>/dev/null && \
    echo "  ✓ Redis backed up" || echo "  ✗ Redis backup skipped"

# Backup application files (excluding node_modules, .cache, logs)
echo "  Backing up application..."
tar -czf $BACKUP_DIR/app_$DATE.tar.gz \
    --exclude='node_modules' \
    --exclude='.cache' \
    --exclude='logs' \
    -C $(dirname $APP_DIR) $(basename $APP_DIR) 2>/dev/null && \
    echo "  ✓ Application backed up" || echo "  ✗ App backup failed"

# Backup Nginx config
cp /etc/nginx/sites-available/tik.starline-agency.xyz $BACKUP_DIR/nginx_$DATE.conf 2>/dev/null

# Remove old backups (keep 7 days)
find $BACKUP_DIR -type f -mtime +7 -delete 2>/dev/null
find $BACKUP_DIR -type d -empty -mtime +7 -delete 2>/dev/null

# Summary
TOTAL_SIZE=$(du -sh $BACKUP_DIR 2>/dev/null | cut -f1)
echo "[${DATE}] Backup complete. Total size: ${TOTAL_SIZE}"
