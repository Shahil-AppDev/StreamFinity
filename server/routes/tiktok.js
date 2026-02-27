/**
 * TikTok LIVE API Routes
 * Connect/disconnect/status for TikTok-Live-Connector integration
 */

const { Router } = require('express');

function createTikTokRoutes(tiktokService) {
    const router = Router();

    // POST /api/tiktok/connect — Connect to a TikTok LIVE stream
    router.post('/connect', async (req, res) => {
        const { username, profileId } = req.body;
        if (!username || typeof username !== 'string' || username.trim().length < 1) {
            return res.status(400).json({ success: false, error: 'Username is required' });
        }
        try {
            if (profileId) tiktokService.setActiveProfile(profileId);
            const result = await tiktokService.connect(username.trim());
            res.json({ success: true, ...result });
        } catch (err) {
            res.status(502).json({ success: false, error: err.message });
        }
    });

    // POST /api/tiktok/disconnect — Disconnect from TikTok LIVE
    router.post('/disconnect', async (_req, res) => {
        const result = await tiktokService.disconnect();
        res.json(result);
    });

    // GET /api/tiktok/status — Get current connection status + stats
    router.get('/status', (_req, res) => {
        res.json(tiktokService.getStatus());
    });

    // GET /api/tiktok/room-info/:username — Get room info for any user (even offline)
    router.get('/room-info/:username', async (req, res) => {
        try {
            const info = await tiktokService.getRoomInfo(req.params.username);
            res.json({ success: true, roomInfo: info });
        } catch (err) {
            res.status(404).json({ success: false, error: err.message });
        }
    });

    // GET /api/tiktok/gifts — Get available TikTok gifts list
    router.get('/gifts', async (_req, res) => {
        try {
            const gifts = await tiktokService.getAvailableGifts();
            res.json({ success: true, gifts, count: gifts.length });
        } catch (err) {
            res.status(400).json({ success: false, error: err.message });
        }
    });

    // GET /api/tiktok/events — Get recent events buffer
    router.get('/events', (req, res) => {
        const limit = parseInt(req.query.limit) || 50;
        const type = req.query.type; // optional filter
        let events = tiktokService.getRecentEvents(limit);
        if (type) events = events.filter(e => e.type === type);
        res.json({ success: true, events, count: events.length });
    });

    // ── Chatbot: Send message ──
    router.post('/chat/send', (req, res) => {
        const { message, botName, style } = req.body;
        if (!message || typeof message !== 'string' || !message.trim()) {
            return res.status(400).json({ success: false, error: 'Message is required' });
        }
        const ev = tiktokService.sendBotMessage(message.trim(), { botName, style, trigger: 'manual' });
        res.json({ success: true, event: ev });
    });

    // ── Chatbot: Auto-response rules ──
    let autoRules = [];

    router.get('/chat/rules', (_req, res) => {
        res.json({ success: true, rules: autoRules.map(r => ({ ...r, _lastUsed: undefined })) });
    });

    router.post('/chat/rules', (req, res) => {
        const { rules } = req.body;
        if (!Array.isArray(rules)) return res.status(400).json({ success: false, error: 'rules must be an array' });
        autoRules = rules.map(r => ({
            id: r.id || 'r_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 5),
            enabled: r.enabled !== false,
            pattern: (r.pattern || '').slice(0, 200),
            matchType: ['exact', 'contains', 'startsWith', 'regex'].includes(r.matchType) ? r.matchType : 'contains',
            response: (r.response || '').slice(0, 500),
            cooldown: Math.max(1, Math.min(300, parseInt(r.cooldown) || 5)),
            _lastUsed: 0,
        }));
        res.json({ success: true, count: autoRules.length });
    });

    router.post('/chat/rules/add', (req, res) => {
        const r = req.body;
        const rule = {
            id: 'r_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 5),
            enabled: r.enabled !== false,
            pattern: (r.pattern || '').slice(0, 200),
            matchType: ['exact', 'contains', 'startsWith', 'regex'].includes(r.matchType) ? r.matchType : 'contains',
            response: (r.response || '').slice(0, 500),
            cooldown: Math.max(1, Math.min(300, parseInt(r.cooldown) || 5)),
            _lastUsed: 0,
        };
        autoRules.push(rule);
        res.json({ success: true, rule: { ...rule, _lastUsed: undefined } });
    });

    router.delete('/chat/rules/:id', (req, res) => {
        const idx = autoRules.findIndex(r => r.id === req.params.id);
        if (idx < 0) return res.status(404).json({ success: false, error: 'Rule not found' });
        autoRules.splice(idx, 1);
        res.json({ success: true });
    });

    // Hook auto-responses into chat events
    tiktokService.on('chat', (chatEvent) => {
        // This event is emitted by _bindEvents, but we need to listen on the service
    });
    // Override: inject auto-response check into the chat broadcast
    const origBind = tiktokService._bindEvents.bind(tiktokService);
    tiktokService._bindEvents = function() {
        origBind();
        const c = this.connection;
        if (c) {
            c.on('chat', (data) => {
                this.checkAutoResponse({
                    comment: data.comment,
                    nickname: data.nickname,
                    uniqueId: data.uniqueId,
                }, autoRules);
            });
        }
    };

    return router;
}

module.exports = createTikTokRoutes;
