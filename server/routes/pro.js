/**
 * Pro Bypass API Routes
 * Serves license validation, user info, payment status, and features
 * All responses indicate PRO status — replaces original TikFinity/StreamTory payment checks
 *
 * GET /api/user/license
 * GET /api/user/info
 * GET /api/payment/status
 * GET /api/features/list
 * GET /api/logError (POST also accepted)
 */

const { Router } = require('express');

function createProRoutes(ctx) {
    const router = Router();
    const { config, log } = ctx;

    const proResponse = {
        success: true,
        isPro: true,
        isPremium: true,
        plan: config.pro.plan,
        maxUsers: config.pro.maxUsers,
        features: config.pro.features,
        licenseValid: true,
        expired: false,
        trial: false,
        needsUpgrade: false,
        paid: true,
        subscription: 'pro',
        server: 'tik.starline-agency.xyz',
        unlimited: true
    };

    router.get('/user/license', (req, res) => {
        log.debug('License API called from:', req.ip);
        res.json(proResponse);
    });

    router.get('/user/info', (req, res) => {
        res.json({
            ...proResponse,
            user: { id: 'PRO_USER', username: 'StreamFinityPro', plan: 'pro', features: ['all'] }
        });
    });

    router.get('/payment/status', (req, res) => {
        res.json({ ...proResponse, paid: true, subscription: 'pro', nextBilling: null, cancelled: false });
    });

    router.get('/features/list', (req, res) => {
        res.json({
            success: true,
            features: [
                'multi_accounts', 'premium_overlays', 'ai_voices', 'tts_unlimited',
                'sound_alerts', 'actions_events', 'custom_commands', 'analytics',
                'no_watermarks', 'priority_support', 'streamfinity', 'streamtory',
                'streamcontrol', 'streamerbot', 'beta_features', 'api_access'
            ],
            all: true
        });
    });

    // Error logging endpoint (TikFinity sends errors here)
    router.all('/logError', (req, res) => {
        const body = req.body || {};
        if (body.message || body.component) {
            log.debug(`[ClientError] ${body.component || 'unknown'}: ${typeof body.message === 'string' ? body.message : JSON.stringify(body.message)}`);
        }
        res.json({ success: true });
    });

    // Catch-all for any /api/* route — return pro response
    router.all('/*', (req, res) => {
        res.json(proResponse);
    });

    return router;
}

module.exports = createProRoutes;
