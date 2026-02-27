const express = require('express');

// ═══════════════════════════════════════════
// VIEWER POINTS & USER DATABASE
// ═══════════════════════════════════════════
// Persistent viewer tracking: points, levels, gifts, follows, etc.
// Table: sf_viewers (auto-created on first use)

function createViewerRoutes(db) {
    const router = express.Router();
    const pool = db?.pool || null;

    // ── Ensure table exists ──
    async function ensureTable() {
        if (!pool) return;
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS sf_viewers (
                    id SERIAL PRIMARY KEY,
                    unique_id VARCHAR(128) UNIQUE NOT NULL,
                    nickname VARCHAR(255) DEFAULT '',
                    profile_picture_url TEXT DEFAULT '',
                    channel_id VARCHAR(64) DEFAULT 'default',
                    points INT DEFAULT 0,
                    level INT DEFAULT 1,
                    xp INT DEFAULT 0,
                    total_gifts INT DEFAULT 0,
                    total_gift_diamonds INT DEFAULT 0,
                    total_likes INT DEFAULT 0,
                    total_chats INT DEFAULT 0,
                    total_shares INT DEFAULT 0,
                    is_follower BOOLEAN DEFAULT false,
                    is_subscriber BOOLEAN DEFAULT false,
                    is_moderator BOOLEAN DEFAULT false,
                    first_seen TIMESTAMPTZ DEFAULT NOW(),
                    last_seen TIMESTAMPTZ DEFAULT NOW(),
                    metadata JSONB DEFAULT '{}'
                );
                CREATE INDEX IF NOT EXISTS idx_sf_viewers_unique ON sf_viewers(unique_id);
                CREATE INDEX IF NOT EXISTS idx_sf_viewers_channel ON sf_viewers(channel_id);
                CREATE INDEX IF NOT EXISTS idx_sf_viewers_points ON sf_viewers(points DESC);
                CREATE INDEX IF NOT EXISTS idx_sf_viewers_level ON sf_viewers(level DESC);
            `);
        } catch (_) {}
    }
    ensureTable();

    // ── Helpers ──
    function calcLevel(xp) {
        let level = 1, req = 100;
        while (xp >= req) { xp -= req; level++; req = Math.floor(req * 1.5); }
        return level;
    }

    // ── Upsert viewer (called on every event) ──
    async function upsertViewer(data) {
        if (!pool || !data.uniqueId) return null;
        try {
            const res = await pool.query(`
                INSERT INTO sf_viewers (unique_id, nickname, profile_picture_url, channel_id, last_seen)
                VALUES ($1, $2, $3, $4, NOW())
                ON CONFLICT (unique_id) DO UPDATE SET
                    nickname = COALESCE(NULLIF($2, ''), sf_viewers.nickname),
                    profile_picture_url = COALESCE(NULLIF($3, ''), sf_viewers.profile_picture_url),
                    last_seen = NOW()
                RETURNING *
            `, [data.uniqueId, data.nickname || '', data.profilePictureUrl || '', data.channelId || 'default']);
            return res.rows[0];
        } catch (err) { return null; }
    }

    // ── Track event (increment counters + award points) ──
    router.post('/track', async (req, res) => {
        const { uniqueId, nickname, profilePictureUrl, channelId, eventType, giftDiamonds, giftCount } = req.body;
        if (!uniqueId) return res.status(400).json({ error: 'uniqueId required' });
        try {
            await upsertViewer({ uniqueId, nickname, profilePictureUrl, channelId });
            let pointsAwarded = 0;
            let updates = [];
            let params = [uniqueId];
            let idx = 2;

            switch (eventType) {
                case 'chat':
                    updates.push(`total_chats = total_chats + 1`);
                    pointsAwarded = 1;
                    break;
                case 'gift':
                    updates.push(`total_gifts = total_gifts + $${idx}`);
                    params.push(giftCount || 1); idx++;
                    updates.push(`total_gift_diamonds = total_gift_diamonds + $${idx}`);
                    params.push(giftDiamonds || 0); idx++;
                    pointsAwarded = Math.max(1, Math.floor((giftDiamonds || 0) / 2));
                    break;
                case 'like':
                    updates.push(`total_likes = total_likes + 1`);
                    pointsAwarded = 1;
                    break;
                case 'follow':
                    updates.push(`is_follower = true`);
                    pointsAwarded = 10;
                    break;
                case 'share':
                    updates.push(`total_shares = total_shares + 1`);
                    pointsAwarded = 5;
                    break;
                case 'subscribe':
                    updates.push(`is_subscriber = true`);
                    pointsAwarded = 50;
                    break;
            }

            if (pointsAwarded > 0) {
                updates.push(`points = points + $${idx}`);
                params.push(pointsAwarded); idx++;
                updates.push(`xp = xp + $${idx}`);
                params.push(pointsAwarded); idx++;
            }

            if (updates.length > 0) {
                await pool.query(`UPDATE sf_viewers SET ${updates.join(', ')}, last_seen = NOW() WHERE unique_id = $1`, params);
            }

            // Recalculate level
            const viewer = await pool.query('SELECT xp, level FROM sf_viewers WHERE unique_id = $1', [uniqueId]);
            if (viewer.rows[0]) {
                const newLevel = calcLevel(viewer.rows[0].xp);
                if (newLevel !== viewer.rows[0].level) {
                    await pool.query('UPDATE sf_viewers SET level = $1 WHERE unique_id = $2', [newLevel, uniqueId]);
                }
            }

            res.json({ success: true, pointsAwarded });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ── Get all viewers (paginated) ──
    router.get('/', async (req, res) => {
        if (!pool) return res.json({ viewers: [], total: 0 });
        try {
            const page = Math.max(1, parseInt(req.query.page) || 1);
            const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
            const offset = (page - 1) * limit;
            const sort = req.query.sort || 'points';
            const order = req.query.order === 'asc' ? 'ASC' : 'DESC';
            const search = req.query.search || '';
            const channelId = req.query.cid || '';

            const validSorts = ['points', 'level', 'total_gifts', 'total_gift_diamonds', 'total_likes', 'total_chats', 'last_seen', 'nickname'];
            const sortCol = validSorts.includes(sort) ? sort : 'points';

            let where = [];
            let params = [];
            if (search) { where.push(`(nickname ILIKE $${params.length + 1} OR unique_id ILIKE $${params.length + 1})`); params.push('%' + search + '%'); }
            if (channelId) { where.push(`channel_id = $${params.length + 1}`); params.push(channelId); }
            const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

            const countRes = await pool.query(`SELECT COUNT(*) FROM sf_viewers ${whereClause}`, params);
            const total = parseInt(countRes.rows[0].count);

            const dataParams = [...params, limit, offset];
            const dataRes = await pool.query(`SELECT * FROM sf_viewers ${whereClause} ORDER BY ${sortCol} ${order} LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`, dataParams);

            res.json({ viewers: dataRes.rows, total, page, limit, pages: Math.ceil(total / limit) });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ── Get single viewer ──
    router.get('/:uniqueId', async (req, res) => {
        if (!pool) return res.status(404).json({ error: 'DB not available' });
        try {
            const r = await pool.query('SELECT * FROM sf_viewers WHERE unique_id = $1', [req.params.uniqueId]);
            if (!r.rows[0]) return res.status(404).json({ error: 'Viewer not found' });
            res.json(r.rows[0]);
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ── Update viewer points (manual adjustment) ──
    router.post('/:uniqueId/points', async (req, res) => {
        if (!pool) return res.status(500).json({ error: 'DB not available' });
        const { amount, reason } = req.body;
        if (amount === undefined) return res.status(400).json({ error: 'amount required' });
        try {
            const r = await pool.query('UPDATE sf_viewers SET points = GREATEST(0, points + $1) WHERE unique_id = $2 RETURNING points', [parseInt(amount), req.params.uniqueId]);
            if (!r.rows[0]) return res.status(404).json({ error: 'Viewer not found' });
            res.json({ success: true, newPoints: r.rows[0].points, reason: reason || 'manual' });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ── Transfer points between viewers ──
    router.post('/transfer', async (req, res) => {
        if (!pool) return res.status(500).json({ error: 'DB not available' });
        const { from, to, amount } = req.body;
        if (!from || !to || !amount || amount <= 0) return res.status(400).json({ error: 'from, to, amount required' });
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const sender = await client.query('SELECT points FROM sf_viewers WHERE unique_id = $1 FOR UPDATE', [from]);
            if (!sender.rows[0] || sender.rows[0].points < amount) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Insufficient points' }); }
            await client.query('UPDATE sf_viewers SET points = points - $1 WHERE unique_id = $2', [amount, from]);
            await client.query('UPDATE sf_viewers SET points = points + $1 WHERE unique_id = $2', [amount, to]);
            await client.query('COMMIT');
            res.json({ success: true, transferred: amount });
        } catch (err) { await client.query('ROLLBACK'); res.status(500).json({ error: err.message }); }
        finally { client.release(); }
    });

    // ── Reset all points ──
    router.post('/reset-all', async (req, res) => {
        if (!pool) return res.status(500).json({ error: 'DB not available' });
        try {
            const r = await pool.query('UPDATE sf_viewers SET points = 0, xp = 0, level = 1');
            res.json({ success: true, affected: r.rowCount });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ── Stats ──
    router.get('/stats/summary', async (req, res) => {
        if (!pool) return res.json({ total: 0 });
        try {
            const r = await pool.query(`
                SELECT
                    COUNT(*) as total_viewers,
                    SUM(points) as total_points,
                    SUM(total_gifts) as total_gifts,
                    SUM(total_gift_diamonds) as total_diamonds,
                    SUM(total_likes) as total_likes,
                    SUM(total_chats) as total_chats,
                    AVG(level) as avg_level,
                    MAX(points) as max_points,
                    COUNT(*) FILTER (WHERE last_seen > NOW() - INTERVAL '1 hour') as active_last_hour
                FROM sf_viewers
            `);
            res.json(r.rows[0] || {});
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ── Top viewers (leaderboard) ──
    router.get('/top/:metric', async (req, res) => {
        if (!pool) return res.json({ top: [] });
        const validMetrics = ['points', 'total_gifts', 'total_gift_diamonds', 'total_likes', 'total_chats', 'level'];
        const metric = validMetrics.includes(req.params.metric) ? req.params.metric : 'points';
        const limit = Math.min(50, parseInt(req.query.limit) || 10);
        try {
            const r = await pool.query(`SELECT unique_id, nickname, profile_picture_url, ${metric}, level, points FROM sf_viewers ORDER BY ${metric} DESC LIMIT $1`, [limit]);
            res.json({ top: r.rows, metric });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    return router;
}

module.exports = createViewerRoutes;
