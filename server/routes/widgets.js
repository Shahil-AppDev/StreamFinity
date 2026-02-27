/**
 * StreamFinity Widget Router v3
 * Serves locally-built widget HTML files from /public/widgets/
 * No more TikFinity proxy — all widgets are our own.
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

const WIDGETS_DIR = path.join(__dirname, '..', 'public', 'widgets');

// All valid StreamFinity widget IDs
const VALID_WIDGETS = new Set([
    'chat', 'gifts', 'activity-feed', 'goal', 'gcounter',
    'lastx', 'myactions', 'firework', 'cannon', 'topgifter',
    'topliker', 'ranking', 'viewercount', 'wheel', 'streambuddies',
    'coinmatch', 'coinjar', 'wheelofactions', 'likefountain',
    'fallingsnow', 'socialmediarotator', 'emojify',
    'transactionviewer', 'userinfo', 'commandinfo',
    'carousel', 'coindrop', 'timer', 'songrequests', 'soundalert', 'tts',
    'webcamframe', 'lastchatter'
]);

function createWidgetRoutes(ctx) {
    const router = express.Router();

    // Serve local widget HTML files
    router.get('/:widgetId', (req, res) => {
        const widgetId = req.params.widgetId;

        if (!VALID_WIDGETS.has(widgetId)) {
            return res.status(404).send('Widget not found: ' + widgetId);
        }

        const filePath = path.join(WIDGETS_DIR, widgetId + '.html');

        if (!fs.existsSync(filePath)) {
            ctx.log.warn(`[Widget] File not found: ${filePath}`);
            return res.status(404).send('Widget file not found: ' + widgetId);
        }

        res.set('Content-Type', 'text/html; charset=utf-8');
        res.set('X-Widget-Source', 'streamfinity-local');
        res.set('Cache-Control', 'no-cache');
        res.sendFile(filePath);
    });

    // Serve shared widget assets (sf-bridge.js, etc.)
    router.get('/sf-bridge.js', (_req, res) => {
        res.sendFile(path.join(WIDGETS_DIR, 'sf-bridge.js'));
    });

    // Widget list API
    router.get('/api/list', (_req, res) => {
        const widgets = [];
        for (var id of VALID_WIDGETS) {
            const exists = fs.existsSync(path.join(WIDGETS_DIR, id + '.html'));
            widgets.push({ id, exists });
        }
        res.json({ widgets, total: widgets.length, ready: widgets.filter(w => w.exists).length });
    });

    return router;
}

module.exports = createWidgetRoutes;
