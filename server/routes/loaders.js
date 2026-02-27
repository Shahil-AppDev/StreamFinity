/**
 * Loader API Routes
 * Dynamic loading endpoints with initialization and status
 *
 * POST /api/loaders/:platform/initialize
 * GET  /api/loaders/:platform/status
 * GET  /api/loaders/status
 */

const { Router } = require('express');

function createLoaderRoutes(ctx) {
    const router = Router();
    const { loaders, log } = ctx;

    // Initialize a specific platform loader
    router.post('/:platform/initialize', async (req, res) => {
        const { platform } = req.params;
        const loader = loaders[platform];

        if (!loader) {
            return res.status(404).json({ success: false, error: `Unknown platform: ${platform}` });
        }

        try {
            const result = await loader.initialize();
            res.json({ success: true, platform, ...result });
        } catch (err) {
            log.error(`Loader init failed for ${platform}:`, err.message);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // Get status of a specific loader
    router.get('/:platform/status', (req, res) => {
        const { platform } = req.params;
        const loader = loaders[platform];

        if (!loader) {
            return res.status(404).json({ success: false, error: `Unknown platform: ${platform}` });
        }

        res.json({ success: true, platform, stats: loader.getStats() });
    });

    // Get status of all loaders
    router.get('/status', (req, res) => {
        const stats = {};
        for (const [name, loader] of Object.entries(loaders)) {
            stats[name] = loader.getStats();
        }
        res.json({ success: true, loaders: stats });
    });

    // ── TikFinity-specific loader endpoints ──

    router.get('/tikfinity/overlays', async (req, res) => {
        const result = await loaders.tikfinity.loadOverlays();
        res.json(result);
    });

    router.get('/tikfinity/gifts/:giftId', async (req, res) => {
        const result = await loaders.tikfinity.getGiftAsset(req.params.giftId);
        if (result.success) {
            res.set('Content-Type', result.contentType);
            res.set('Cache-Control', 'public, max-age=86400');
            return res.send(result.data);
        }
        res.status(404).json(result);
    });

    router.get('/tikfinity/sounds/:soundId', async (req, res) => {
        const result = await loaders.tikfinity.getSoundEffect(req.params.soundId);
        if (result.success) {
            res.set('Content-Type', result.contentType);
            res.set('Cache-Control', 'public, max-age=86400');
            return res.send(result.data);
        }
        res.status(404).json(result);
    });

    // ── StreamTory-specific loader endpoints ──

    router.get('/streamtory/templates', async (req, res) => {
        const result = await loaders.streamtory.loadAnalyticsTemplates();
        res.json(result);
    });

    router.get('/streamtory/overlays/:overlayId', async (req, res) => {
        const result = await loaders.streamtory.loadCustomOverlay(req.params.overlayId);
        res.json(result);
    });

    router.get('/streamtory/analytics/:type', async (req, res) => {
        const result = await loaders.streamtory.getAnalyticsData(req.params.type, req.query);
        res.json(result);
    });

    router.get('/streamtory/exports/:format', async (req, res) => {
        const result = await loaders.streamtory.loadDataExport(req.params.format);
        if (result.success) {
            res.set('Content-Type', result.contentType);
            return res.send(result.data);
        }
        res.status(404).json(result);
    });

    // ── StreamControl-specific loader endpoints ──

    router.get('/streamcontrol/games', async (req, res) => {
        const result = await loaders.streamcontrol.loadGameTemplates();
        res.json(result);
    });

    router.get('/streamcontrol/games/:gameId', async (req, res) => {
        const result = await loaders.streamcontrol.getGameTemplate(req.params.gameId);
        res.json(result);
    });

    router.get('/streamcontrol/polls', async (req, res) => {
        const result = await loaders.streamcontrol.loadPollSystem();
        res.json(result);
    });

    router.get('/streamcontrol/rewards', async (req, res) => {
        const result = await loaders.streamcontrol.loadRewardAssets();
        res.json(result);
    });

    router.get('/streamcontrol/rewards/:rewardId', async (req, res) => {
        const result = await loaders.streamcontrol.getRewardAsset(req.params.rewardId);
        res.json(result);
    });

    return router;
}

module.exports = createLoaderRoutes;
