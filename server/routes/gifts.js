/**
 * Gifts API Routes
 * Serves the TikTok gift catalog with filtering, search, and individual gift lookup
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

module.exports = function createGiftRoutes() {
    const router = express.Router();

    // Load catalog once at startup
    const catalogPath = path.join(__dirname, '..', 'data', 'gifts.json');
    let catalog = { gifts: [], count: 0 };
    try {
        catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
    } catch (err) {
        console.warn('[Gifts] Could not load gifts.json:', err.message);
    }

    // Build lookup maps
    const byId = new Map();
    const byTier = new Map();
    catalog.gifts.forEach(g => {
        byId.set(g.id, g);
        if (!byTier.has(g.tier)) byTier.set(g.tier, []);
        byTier.get(g.tier).push(g);
    });

    // GET /api/gifts — full catalog with optional filters
    // ?tier=epic&search=rose&creator=0&limit=50&offset=0
    router.get('/', (req, res) => {
        let results = catalog.gifts;

        if (req.query.tier) {
            results = results.filter(g => g.tier === req.query.tier);
        }
        if (req.query.creator !== undefined) {
            const wantCreator = req.query.creator === '1' || req.query.creator === 'true';
            results = results.filter(g => g.isCreator === wantCreator);
        }
        if (req.query.search) {
            const q = req.query.search.toLowerCase();
            results = results.filter(g => g.name.toLowerCase().includes(q));
        }
        if (req.query.minCoins) {
            results = results.filter(g => g.coins >= parseInt(req.query.minCoins));
        }
        if (req.query.maxCoins) {
            results = results.filter(g => g.coins <= parseInt(req.query.maxCoins));
        }

        const total = results.length;
        const offset = parseInt(req.query.offset) || 0;
        const limit = Math.min(parseInt(req.query.limit) || 100, 500);
        results = results.slice(offset, offset + limit);

        res.json({
            total,
            offset,
            limit,
            tiers: [...byTier.keys()],
            gifts: results
        });
    });

    // GET /api/gifts/stats — tier distribution and totals
    router.get('/stats', (req, res) => {
        const tiers = {};
        byTier.forEach((gifts, tier) => {
            tiers[tier] = {
                count: gifts.length,
                totalCoins: gifts.reduce((s, g) => s + g.coins, 0),
                avgCoins: Math.round(gifts.reduce((s, g) => s + g.coins, 0) / gifts.length)
            };
        });
        res.json({
            total: catalog.count,
            creatorGifts: catalog.gifts.filter(g => g.isCreator).length,
            standardGifts: catalog.gifts.filter(g => !g.isCreator).length,
            tiers
        });
    });

    // GET /api/gifts/random — random gift(s)
    router.get('/random', (req, res) => {
        const count = Math.min(parseInt(req.query.count) || 1, 20);
        const pool = req.query.tier ? (byTier.get(req.query.tier) || []) : catalog.gifts;
        const results = [];
        for (let i = 0; i < count && pool.length > 0; i++) {
            results.push(pool[Math.floor(Math.random() * pool.length)]);
        }
        res.json(results);
    });

    // GET /api/gifts/:id — single gift by ID
    router.get('/:id', (req, res) => {
        const gift = byId.get(parseInt(req.params.id));
        if (!gift) return res.status(404).json({ error: 'Gift not found' });
        res.json(gift);
    });

    return router;
};
