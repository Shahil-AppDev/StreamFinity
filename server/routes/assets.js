/**
 * Asset API Routes
 * Serves assets from all platforms with caching and fallback
 *
 * GET /api/assets/:platform/:category/:id
 * GET /api/assets/:platform/:category
 * GET /api/assets/all
 */

const { Router } = require('express');
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');

function createAssetRoutes(ctx) {
    const router = Router();
    const { assetProxy, loaders, config, log } = ctx;

    // List all available asset categories
    router.get('/all', (req, res) => {
        res.json({
            success: true,
            platforms: {
                tikfinity: { categories: ['overlays', 'sounds', 'gifts', 'ui', 'electron'] },
                streamtory: { categories: ['analytics', 'overlays', 'exports', 'templates'] },
                streamcontrol: { categories: ['games', 'polls', 'rewards', 'animations'] },
                streamfinity: { categories: ['branding', 'enhanced', 'exclusive'] }
            }
        });
    });

    // Serve static asset files from local disk
    router.get('/:platform/:category/:id', async (req, res) => {
        const { platform, category, id } = req.params;
        const safePlatform = path.basename(platform);
        const safeCategory = path.basename(category);
        const safeId = path.basename(id);

        // Try local file first
        const localDir = path.join(config.assetsDir, safePlatform, safeCategory);
        const localPath = path.join(localDir, safeId);

        if (fs.existsSync(localPath)) {
            const contentType = mime.lookup(localPath) || 'application/octet-stream';
            res.set('Content-Type', contentType);
            res.set('Cache-Control', 'public, max-age=86400');
            res.set('X-Asset-Source', 'local');
            return res.sendFile(localPath);
        }

        // Try proxy from upstream
        const assetPath = `/assets/${safeCategory}/${safeId}`;
        const result = await assetProxy.fetch(safePlatform, assetPath, {
            ttl: config.cache.staticTTL
        });

        if (result.success) {
            res.set('Content-Type', result.contentType);
            res.set('Cache-Control', 'public, max-age=86400');
            res.set('X-Asset-Source', result.source);
            return res.send(result.data);
        }

        res.status(404).json({ success: false, error: `Asset not found: ${platform}/${category}/${id}` });
    });

    // List assets in a category
    router.get('/:platform/:category', (req, res) => {
        const { platform, category } = req.params;
        const dir = path.join(config.assetsDir, path.basename(platform), path.basename(category));

        if (!fs.existsSync(dir)) {
            return res.json({ success: true, assets: [], source: 'empty' });
        }

        try {
            const files = fs.readdirSync(dir).map(f => ({
                name: f,
                size: fs.statSync(path.join(dir, f)).size,
                type: mime.lookup(f) || 'unknown'
            }));
            res.json({ success: true, assets: files, count: files.length });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    return router;
}

module.exports = createAssetRoutes;
