/**
 * Unified API Routes
 * Cross-platform functionality, status, sync, and pro bypass
 *
 * GET  /api/unified/status
 * GET  /api/unified/health
 * POST /api/unified/sync
 * GET  /api/unified/assets/all
 */

const { Router } = require('express');

function createUnifiedRoutes(ctx) {
    const router = Router();
    const { loaders, assetProxy, config, startTime, wsClients, metrics } = ctx;

    // System status
    router.get('/status', (req, res) => {
        const uptime = Math.floor((Date.now() - startTime) / 1000);
        res.json({
            success: true,
            server: 'StreamFinity Unified Server',
            version: '1.0.0',
            uptime,
            uptimeHuman: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`,
            platforms: {
                tikfinity: loaders.tikfinity.getStats(),
                streamtory: loaders.streamtory.getStats(),
                streamcontrol: loaders.streamcontrol.getStats()
            },
            cache: assetProxy.getStats(),
            wsClients: wsClients ? wsClients.size : 0,
            pro: config.pro
        });
    });

    // Detailed metrics (performance, requests, system)
    router.get('/metrics', (req, res) => {
        res.json({ success: true, ...(metrics ? metrics.getMetrics() : {}) });
    });

    // Health check (for monitoring / load balancers)
    router.get('/health', (req, res) => {
        res.json({ status: 'ok', timestamp: Date.now() });
    });

    // Sync state across platforms
    router.post('/sync', (req, res) => {
        const { platforms, data } = req.body || {};
        // Broadcast sync event to all WS clients
        if (wsClients && data) {
            const msg = JSON.stringify({ event: { type: 'Sync', source: 'unified' }, data: { platforms, ...data } });
            for (const client of wsClients) {
                if (client.readyState === 1) client.send(msg);
            }
        }
        res.json({ success: true, synced: platforms || 'all' });
    });

    // Get all assets across all platforms
    router.get('/assets/all', async (req, res) => {
        const [overlays, templates, games, rewards] = await Promise.allSettled([
            loaders.tikfinity.loadOverlays(),
            loaders.streamtory.loadAnalyticsTemplates(),
            loaders.streamcontrol.loadGameTemplates(),
            loaders.streamcontrol.loadRewardAssets()
        ]);

        res.json({
            success: true,
            tikfinity: { overlays: overlays.status === 'fulfilled' ? overlays.value : null },
            streamtory: { templates: templates.status === 'fulfilled' ? templates.value : null },
            streamcontrol: {
                games: games.status === 'fulfilled' ? games.value : null,
                rewards: rewards.status === 'fulfilled' ? rewards.value : null
            }
        });
    });

    // Cache management
    router.get('/cache/stats', (req, res) => {
        res.json({ success: true, ...assetProxy.getStats() });
    });

    router.post('/cache/clear', (req, res) => {
        assetProxy.cache.clear();
        res.json({ success: true, message: 'Cache cleared' });
    });

    return router;
}

module.exports = createUnifiedRoutes;
