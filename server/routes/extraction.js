/**
 * Extraction API Routes
 * Triggers and monitors asset extraction pipeline
 *
 * POST /api/extraction/run           — Run full extraction
 * POST /api/extraction/run/:platform — Run single platform extraction
 * GET  /api/extraction/status        — Last extraction results
 */

const { Router } = require('express');

function createExtractionRoutes(ctx) {
    const router = Router();
    const { extractor, metrics, log } = ctx;

    let _running = false;

    router.post('/run', async (req, res) => {
        if (_running) {
            return res.status(409).json({ success: false, error: 'Extraction already in progress' });
        }

        _running = true;
        log.info('Full extraction triggered via API');

        try {
            const results = await extractor.extractAll();
            if (metrics) metrics.trackExtraction(results);
            _running = false;
            res.json({ success: true, ...results });
        } catch (err) {
            _running = false;
            log.error('Extraction failed:', err.message);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    router.post('/run/:platform', async (req, res) => {
        const { platform } = req.params;
        if (_running) {
            return res.status(409).json({ success: false, error: 'Extraction already in progress' });
        }

        _running = true;
        log.info(`Extraction triggered for platform: ${platform}`);

        try {
            const results = await extractor.extractPlatform(platform);
            _running = false;
            res.json({ success: true, platform, ...results });
        } catch (err) {
            _running = false;
            log.error(`Extraction failed for ${platform}:`, err.message);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    router.get('/status', (req, res) => {
        const last = extractor.getLastResults();
        res.json({
            success: true,
            running: _running,
            lastRun: last || null
        });
    });

    return router;
}

module.exports = createExtractionRoutes;
