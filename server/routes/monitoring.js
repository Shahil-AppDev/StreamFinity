/**
 * Monitoring Dashboard Routes
 * /api/monitoring/*
 */

const express = require('express');
const os = require('os');

module.exports = function createMonitoringRoutes(ctx) {
    const router = express.Router();
    const { db, redis, metrics, startTime, wsClients, config, log } = ctx;

    // Full dashboard data
    router.get('/dashboard', async (req, res) => {
        try {
            const uptime = Math.floor((Date.now() - startTime) / 1000);
            const mem = process.memoryUsage();

            const [mongoStats, redisStats, metricsData] = await Promise.allSettled([
                db ? db.getStats() : { connected: false },
                redis ? redis.getStats() : { connected: false },
                Promise.resolve(metrics ? metrics.getMetrics() : {})
            ]);

            res.json({
                success: true,
                server: {
                    uptime,
                    uptimeHuman: formatUptime(uptime),
                    nodeVersion: process.version,
                    platform: process.platform,
                    pid: process.pid,
                    env: process.env.NODE_ENV || 'development'
                },
                memory: {
                    rss: formatBytes(mem.rss),
                    heapUsed: formatBytes(mem.heapUsed),
                    heapTotal: formatBytes(mem.heapTotal),
                    external: formatBytes(mem.external)
                },
                system: {
                    hostname: os.hostname(),
                    cpus: os.cpus().length,
                    loadAvg: os.loadavg().map(l => l.toFixed(2)),
                    totalMemory: formatBytes(os.totalmem()),
                    freeMemory: formatBytes(os.freemem()),
                    memoryUsagePercent: ((1 - os.freemem() / os.totalmem()) * 100).toFixed(1) + '%'
                },
                database: {
                    mongodb: mongoStats.status === 'fulfilled' ? mongoStats.value : { error: 'unavailable' },
                    redis: redisStats.status === 'fulfilled' ? redisStats.value : { error: 'unavailable' }
                },
                websocket: {
                    connectedClients: wsClients ? wsClients.size : 0
                },
                metrics: metricsData.status === 'fulfilled' ? metricsData.value : {},
                timestamp: new Date().toISOString()
            });
        } catch (err) {
            log.error('Monitoring dashboard error:', err.message);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // Quick health check
    router.get('/health', async (req, res) => {
        const checks = {
            server: true,
            mongodb: db ? db.connected : false,
            redis: redis ? redis.connected : false
        };
        const healthy = Object.values(checks).every(Boolean);
        res.status(healthy ? 200 : 503).json({
            status: healthy ? 'healthy' : 'degraded',
            checks,
            uptime: Math.floor((Date.now() - startTime) / 1000),
            timestamp: new Date().toISOString()
        });
    });

    // Recent events
    router.get('/events', async (req, res) => {
        if (!db || !db.connected) return res.json({ events: [] });
        const type = req.query.type || null;
        const limit = Math.min(parseInt(req.query.limit) || 50, 200);
        const events = await db.getRecentEvents(type, limit);
        res.json({ success: true, events });
    });

    // Usage stats
    router.get('/usage', async (req, res) => {
        if (!db || !db.connected) return res.json({ usage: [] });
        const days = Math.min(parseInt(req.query.days) || 7, 90);
        const usage = await db.getUsageStats(days);
        res.json({ success: true, usage });
    });

    return router;
};

function formatBytes(bytes) {
    if (bytes < 1024) return bytes + 'B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + 'KB';
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + 'MB';
    return (bytes / 1073741824).toFixed(2) + 'GB';
}

function formatUptime(seconds) {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const parts = [];
    if (d) parts.push(d + 'd');
    if (h) parts.push(h + 'h');
    if (m) parts.push(m + 'm');
    parts.push(s + 's');
    return parts.join(' ');
}
