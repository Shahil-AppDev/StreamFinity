/**
 * CrowdControl Database Layer (PostgreSQL)
 * Tables: cc_users, cc_game_sessions, cc_polls, cc_poll_votes, cc_leaderboards, cc_inventory, cc_transactions
 */

class CrowdControlDB {
    constructor(pool) {
        this.pool = pool;
    }

    async ensureTables() {
        await this.pool.query(`
            CREATE TABLE IF NOT EXISTS cc_users (
                id SERIAL PRIMARY KEY,
                user_id TEXT UNIQUE NOT NULL,
                username TEXT NOT NULL,
                email TEXT DEFAULT NULL,
                password_hash TEXT DEFAULT NULL,
                display_name TEXT DEFAULT NULL,
                bio TEXT DEFAULT '',
                timezone TEXT DEFAULT 'Europe/Paris',
                email_verified BOOLEAN DEFAULT FALSE,
                verification_token TEXT DEFAULT NULL,
                reset_token TEXT DEFAULT NULL,
                reset_token_expires TIMESTAMPTZ DEFAULT NULL,
                status TEXT DEFAULT 'active',
                last_login TIMESTAMPTZ DEFAULT NULL,
                level INTEGER DEFAULT 1,
                xp INTEGER DEFAULT 0,
                coins INTEGER DEFAULT 100,
                gems INTEGER DEFAULT 5,
                avatar TEXT DEFAULT 'default',
                frame TEXT DEFAULT 'basic',
                effect TEXT DEFAULT NULL,
                badge TEXT DEFAULT NULL,
                achievements JSONB DEFAULT '["welcome_bonus"]',
                stats JSONB DEFAULT '{"gamesPlayed":0,"gamesWon":0,"totalWinnings":0,"winRate":0,"streak":0,"bestStreak":0,"favoriteGame":null}',
                settings JSONB DEFAULT '{"autoJoin":true,"notifications":true,"soundEffects":true,"language":"fr","showStats":true,"allowInvites":true,"publicProfile":true,"gameInvites":true,"rewards":true,"leaderboard":true,"friendRequests":true}',
                last_active TIMESTAMPTZ DEFAULT NOW(),
                created_at TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS cc_notifications (
                id SERIAL PRIMARY KEY,
                user_id TEXT NOT NULL,
                type TEXT NOT NULL,
                category TEXT DEFAULT 'system',
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                data JSONB DEFAULT '{}',
                read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS cc_game_sessions (
                id SERIAL PRIMARY KEY,
                game_id TEXT NOT NULL,
                game_type TEXT NOT NULL,
                status TEXT DEFAULT 'waiting',
                host_user_id TEXT,
                players JSONB DEFAULT '[]',
                config JSONB DEFAULT '{}',
                result JSONB DEFAULT NULL,
                started_at TIMESTAMPTZ DEFAULT NOW(),
                ended_at TIMESTAMPTZ DEFAULT NULL
            );

            CREATE TABLE IF NOT EXISTS cc_polls (
                id SERIAL PRIMARY KEY,
                poll_id TEXT UNIQUE NOT NULL,
                type TEXT DEFAULT 'standard',
                question TEXT NOT NULL,
                options JSONB NOT NULL,
                results JSONB DEFAULT '{}',
                created_by TEXT,
                status TEXT DEFAULT 'active',
                duration INTEGER DEFAULT 60000,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                ends_at TIMESTAMPTZ
            );

            CREATE TABLE IF NOT EXISTS cc_poll_votes (
                id SERIAL PRIMARY KEY,
                poll_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                option_index INTEGER NOT NULL,
                weight INTEGER DEFAULT 1,
                voted_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(poll_id, user_id)
            );

            CREATE TABLE IF NOT EXISTS cc_inventory (
                id SERIAL PRIMARY KEY,
                user_id TEXT NOT NULL,
                item_type TEXT NOT NULL,
                item_id TEXT NOT NULL,
                acquired_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(user_id, item_type, item_id)
            );

            CREATE TABLE IF NOT EXISTS cc_transactions (
                id SERIAL PRIMARY KEY,
                user_id TEXT NOT NULL,
                type TEXT NOT NULL,
                amount INTEGER NOT NULL,
                currency TEXT DEFAULT 'coins',
                description TEXT,
                game_session_id INTEGER DEFAULT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS idx_cc_users_user_id ON cc_users(user_id);
            CREATE INDEX IF NOT EXISTS idx_cc_users_email ON cc_users(email);
            CREATE INDEX IF NOT EXISTS idx_cc_users_username ON cc_users(username);
            CREATE INDEX IF NOT EXISTS idx_cc_game_sessions_status ON cc_game_sessions(status);
            CREATE INDEX IF NOT EXISTS idx_cc_game_sessions_game_type ON cc_game_sessions(game_type);
            CREATE INDEX IF NOT EXISTS idx_cc_polls_status ON cc_polls(status);
            CREATE INDEX IF NOT EXISTS idx_cc_poll_votes_poll ON cc_poll_votes(poll_id);
            CREATE INDEX IF NOT EXISTS idx_cc_inventory_user ON cc_inventory(user_id);
            CREATE INDEX IF NOT EXISTS idx_cc_transactions_user ON cc_transactions(user_id);
            CREATE INDEX IF NOT EXISTS idx_cc_transactions_created ON cc_transactions(created_at);
            CREATE INDEX IF NOT EXISTS idx_cc_notifications_user ON cc_notifications(user_id);
            CREATE INDEX IF NOT EXISTS idx_cc_notifications_read ON cc_notifications(user_id, read);
        `);

        // Migrate existing cc_users table — add auth columns one by one
        const migrations = [
            "ALTER TABLE cc_users ADD COLUMN IF NOT EXISTS email TEXT DEFAULT NULL",
            "ALTER TABLE cc_users ADD COLUMN IF NOT EXISTS password_hash TEXT DEFAULT NULL",
            "ALTER TABLE cc_users ADD COLUMN IF NOT EXISTS display_name TEXT DEFAULT NULL",
            "ALTER TABLE cc_users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT ''",
            "ALTER TABLE cc_users ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Europe/Paris'",
            "ALTER TABLE cc_users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE",
            "ALTER TABLE cc_users ADD COLUMN IF NOT EXISTS verification_token TEXT DEFAULT NULL",
            "ALTER TABLE cc_users ADD COLUMN IF NOT EXISTS reset_token TEXT DEFAULT NULL",
            "ALTER TABLE cc_users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMPTZ DEFAULT NULL",
            "ALTER TABLE cc_users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'",
            "ALTER TABLE cc_users ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ DEFAULT NULL",
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_cc_users_email_uniq ON cc_users(email) WHERE email IS NOT NULL",
        ];
        for (const sql of migrations) {
            try { await this.pool.query(sql); } catch (e) { /* column already exists or index exists */ }
        }
    }

    // ── User Methods ──

    async getOrCreateUser(userId, username) {
        const existing = await this.pool.query('SELECT * FROM cc_users WHERE user_id = $1', [userId]);
        if (existing.rows.length > 0) {
            await this.pool.query('UPDATE cc_users SET last_active = NOW() WHERE user_id = $1', [userId]);
            return existing.rows[0];
        }
        const res = await this.pool.query(
            'INSERT INTO cc_users (user_id, username) VALUES ($1, $2) RETURNING *',
            [userId, username]
        );
        // Give default inventory items
        await this.addInventoryItem(userId, 'avatar', 'default');
        await this.addInventoryItem(userId, 'frame', 'basic');
        return res.rows[0];
    }

    async getUser(userId) {
        const res = await this.pool.query('SELECT * FROM cc_users WHERE user_id = $1', [userId]);
        return res.rows[0] || null;
    }

    async updateUser(userId, updates) {
        const fields = [];
        const values = [];
        let i = 1;
        for (const [key, val] of Object.entries(updates)) {
            if (['level', 'xp', 'coins', 'gems', 'avatar', 'frame', 'effect', 'badge', 'achievements', 'stats', 'settings'].includes(key)) {
                fields.push(`${key} = $${i}`);
                values.push(typeof val === 'object' ? JSON.stringify(val) : val);
                i++;
            }
        }
        if (fields.length === 0) return null;
        values.push(userId);
        const res = await this.pool.query(
            `UPDATE cc_users SET ${fields.join(', ')}, last_active = NOW() WHERE user_id = $${i} RETURNING *`,
            values
        );
        return res.rows[0] || null;
    }

    async addXP(userId, amount) {
        const res = await this.pool.query(
            'UPDATE cc_users SET xp = xp + $1, last_active = NOW() WHERE user_id = $2 RETURNING *',
            [amount, userId]
        );
        return res.rows[0] || null;
    }

    async addCoins(userId, amount, description, gameSessionId) {
        await this.pool.query('UPDATE cc_users SET coins = LEAST(coins + $1, 999999) WHERE user_id = $2', [amount, userId]);
        await this.pool.query(
            'INSERT INTO cc_transactions (user_id, type, amount, currency, description, game_session_id) VALUES ($1, $2, $3, $4, $5, $6)',
            [userId, amount >= 0 ? 'earn' : 'spend', amount, 'coins', description || '', gameSessionId || null]
        );
    }

    async addGems(userId, amount, description) {
        await this.pool.query('UPDATE cc_users SET gems = LEAST(gems + $1, 99999) WHERE user_id = $2', [amount, userId]);
        await this.pool.query(
            'INSERT INTO cc_transactions (user_id, type, amount, currency, description) VALUES ($1, $2, $3, $4, $5)',
            [userId, amount >= 0 ? 'earn' : 'spend', amount, 'gems', description || '']
        );
    }

    async spendCoins(userId, amount, description) {
        const user = await this.getUser(userId);
        if (!user || user.coins < amount) return false;
        await this.addCoins(userId, -amount, description);
        return true;
    }

    async spendGems(userId, amount, description) {
        const user = await this.getUser(userId);
        if (!user || user.gems < amount) return false;
        await this.addGems(userId, -amount, description);
        return true;
    }

    async addAchievement(userId, achievementId) {
        const user = await this.getUser(userId);
        if (!user) return false;
        const achievements = user.achievements || [];
        if (achievements.includes(achievementId)) return false;
        achievements.push(achievementId);
        await this.updateUser(userId, { achievements });
        return true;
    }

    async updateStats(userId, statUpdates) {
        const user = await this.getUser(userId);
        if (!user) return null;
        const stats = { ...user.stats, ...statUpdates };
        if (stats.gamesPlayed > 0) stats.winRate = Math.round((stats.gamesWon / stats.gamesPlayed) * 1000) / 10;
        return this.updateUser(userId, { stats });
    }

    // ── Inventory Methods ──

    async addInventoryItem(userId, itemType, itemId) {
        try {
            await this.pool.query(
                'INSERT INTO cc_inventory (user_id, item_type, item_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
                [userId, itemType, itemId]
            );
            return true;
        } catch { return false; }
    }

    async getUserInventory(userId) {
        const res = await this.pool.query(
            'SELECT item_type, item_id, acquired_at FROM cc_inventory WHERE user_id = $1 ORDER BY acquired_at',
            [userId]
        );
        const inv = { avatars: [], frames: [], effects: [], badges: [] };
        res.rows.forEach(r => {
            const key = r.item_type + 's';
            if (inv[key]) inv[key].push(r.item_id);
        });
        return inv;
    }

    async hasItem(userId, itemType, itemId) {
        const res = await this.pool.query(
            'SELECT 1 FROM cc_inventory WHERE user_id = $1 AND item_type = $2 AND item_id = $3',
            [userId, itemType, itemId]
        );
        return res.rows.length > 0;
    }

    // ── Game Session Methods ──

    async createGameSession(gameType, hostUserId, config) {
        const gameId = `game_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const res = await this.pool.query(
            'INSERT INTO cc_game_sessions (game_id, game_type, host_user_id, config) VALUES ($1, $2, $3, $4) RETURNING *',
            [gameId, gameType, hostUserId, JSON.stringify(config || {})]
        );
        return res.rows[0];
    }

    async getGameSession(gameId) {
        const res = await this.pool.query('SELECT * FROM cc_game_sessions WHERE game_id = $1', [gameId]);
        return res.rows[0] || null;
    }

    async joinGame(gameId, userId, username) {
        const session = await this.getGameSession(gameId);
        if (!session || session.status !== 'waiting') return null;
        const players = session.players || [];
        if (players.find(p => p.userId === userId)) return session;
        players.push({ userId, username, joinedAt: new Date().toISOString(), score: 0 });
        await this.pool.query('UPDATE cc_game_sessions SET players = $1 WHERE game_id = $2', [JSON.stringify(players), gameId]);
        return { ...session, players };
    }

    async startGame(gameId) {
        await this.pool.query("UPDATE cc_game_sessions SET status = 'active', started_at = NOW() WHERE game_id = $1", [gameId]);
    }

    async endGame(gameId, result) {
        await this.pool.query(
            "UPDATE cc_game_sessions SET status = 'completed', result = $1, ended_at = NOW() WHERE game_id = $2",
            [JSON.stringify(result), gameId]
        );
    }

    async getActiveGames() {
        const res = await this.pool.query(
            "SELECT * FROM cc_game_sessions WHERE status IN ('waiting', 'active') ORDER BY started_at DESC LIMIT 50"
        );
        return res.rows;
    }

    async getRecentGames(limit = 20) {
        const res = await this.pool.query(
            'SELECT * FROM cc_game_sessions ORDER BY started_at DESC LIMIT $1', [limit]
        );
        return res.rows;
    }

    // ── Poll Methods ──

    async createPoll(pollData) {
        const pollId = `poll_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const endsAt = new Date(Date.now() + (pollData.duration || 60000));
        const res = await this.pool.query(
            'INSERT INTO cc_polls (poll_id, type, question, options, created_by, duration, ends_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [pollId, pollData.type || 'standard', pollData.question, JSON.stringify(pollData.options), pollData.createdBy || null, pollData.duration || 60000, endsAt]
        );
        return res.rows[0];
    }

    async votePoll(pollId, userId, optionIndex, weight = 1) {
        try {
            await this.pool.query(
                'INSERT INTO cc_poll_votes (poll_id, user_id, option_index, weight) VALUES ($1, $2, $3, $4)',
                [pollId, userId, optionIndex, weight]
            );
            return true;
        } catch { return false; } // duplicate vote
    }

    async getPollResults(pollId) {
        const poll = await this.pool.query('SELECT * FROM cc_polls WHERE poll_id = $1', [pollId]);
        if (poll.rows.length === 0) return null;
        const votes = await this.pool.query(
            'SELECT option_index, COUNT(*) as count, SUM(weight) as weighted FROM cc_poll_votes WHERE poll_id = $1 GROUP BY option_index',
            [pollId]
        );
        const totalVotes = votes.rows.reduce((s, r) => s + parseInt(r.count), 0);
        const results = {};
        votes.rows.forEach(r => {
            results[r.option_index] = { votes: parseInt(r.count), weighted: parseInt(r.weighted) };
        });
        return { ...poll.rows[0], results, totalVotes };
    }

    async getActivePolls() {
        const res = await this.pool.query(
            "SELECT * FROM cc_polls WHERE status = 'active' AND ends_at > NOW() ORDER BY created_at DESC"
        );
        return res.rows;
    }

    async closePoll(pollId) {
        await this.pool.query("UPDATE cc_polls SET status = 'closed' WHERE poll_id = $1", [pollId]);
    }

    // ── Leaderboard Methods ──

    async getLeaderboard(limit = 20) {
        const res = await this.pool.query(
            `SELECT u.user_id, u.username, u.level, u.avatar, u.frame,
                    (u.stats->>'gamesWon')::int as wins,
                    (u.stats->>'gamesPlayed')::int as played,
                    (u.stats->>'totalWinnings')::int as winnings,
                    (u.stats->>'winRate')::float as win_rate
             FROM cc_users u
             ORDER BY (u.stats->>'totalWinnings')::int DESC NULLS LAST
             LIMIT $1`,
            [limit]
        );
        return res.rows;
    }

    async getGameLeaderboard(gameType, limit = 20) {
        const res = await this.pool.query(
            `SELECT gs.players, gs.result, gs.game_type, gs.ended_at
             FROM cc_game_sessions gs
             WHERE gs.game_type = $1 AND gs.status = 'completed'
             ORDER BY gs.ended_at DESC LIMIT $2`,
            [gameType, limit]
        );
        return res.rows;
    }

    // ── Transaction History ──

    async getTransactions(userId, limit = 50) {
        const res = await this.pool.query(
            'SELECT * FROM cc_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
            [userId, limit]
        );
        return res.rows;
    }

    // ── Stats ──

    // ── Auth Methods ──

    async registerUser(username, email, passwordHash, profile = {}) {
        const userId = 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
        const verificationToken = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
        const res = await this.pool.query(
            `INSERT INTO cc_users (user_id, username, email, password_hash, display_name, bio, timezone, verification_token)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [userId, username.toLowerCase(), email.toLowerCase(), passwordHash,
             profile.displayName || username, profile.bio || '', profile.timezone || 'Europe/Paris', verificationToken]
        );
        const user = res.rows[0];
        await this.addInventoryItem(userId, 'avatar', 'default');
        await this.addInventoryItem(userId, 'frame', 'basic');
        await this.addNotification(userId, 'reward', 'system', 'Bienvenue!', 'Vous recevez 100 🪙 et 5 💎 en cadeau de bienvenue.');
        return user;
    }

    async findByEmail(email) {
        const res = await this.pool.query('SELECT * FROM cc_users WHERE email = $1', [email.toLowerCase()]);
        return res.rows[0] || null;
    }

    async findByUsername(username) {
        const res = await this.pool.query('SELECT * FROM cc_users WHERE username = $1', [username.toLowerCase()]);
        return res.rows[0] || null;
    }

    async findByIdentifier(identifier) {
        const lower = identifier.toLowerCase();
        const res = await this.pool.query(
            'SELECT * FROM cc_users WHERE email = $1 OR username = $1', [lower]
        );
        return res.rows[0] || null;
    }

    async updateLastLogin(userId) {
        await this.pool.query('UPDATE cc_users SET last_login = NOW(), last_active = NOW() WHERE user_id = $1', [userId]);
    }

    async verifyEmail(token) {
        const res = await this.pool.query(
            "UPDATE cc_users SET email_verified = TRUE, verification_token = NULL WHERE verification_token = $1 AND email_verified = FALSE RETURNING *",
            [token]
        );
        return res.rows[0] || null;
    }

    async setResetToken(email) {
        const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
        const expires = new Date(Date.now() + 3600000); // 1 hour
        const res = await this.pool.query(
            'UPDATE cc_users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3 RETURNING user_id',
            [token, expires, email.toLowerCase()]
        );
        return res.rows[0] ? token : null;
    }

    async resetPassword(token, newPasswordHash) {
        const res = await this.pool.query(
            "UPDATE cc_users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE reset_token = $2 AND reset_token_expires > NOW() RETURNING user_id",
            [newPasswordHash, token]
        );
        return res.rows[0] || null;
    }

    async updateProfile(userId, profile) {
        const allowed = ['display_name', 'bio', 'timezone'];
        const fields = []; const values = []; let i = 1;
        for (const [key, val] of Object.entries(profile)) {
            if (allowed.includes(key)) { fields.push(`${key} = $${i}`); values.push(val); i++; }
        }
        if (fields.length === 0) return null;
        values.push(userId);
        const res = await this.pool.query(
            `UPDATE cc_users SET ${fields.join(', ')}, last_active = NOW() WHERE user_id = $${i} RETURNING *`, values
        );
        return res.rows[0] || null;
    }

    async updateSettings(userId, settings) {
        const user = await this.getUser(userId);
        if (!user) return null;
        const merged = { ...user.settings, ...settings };
        const res = await this.pool.query(
            'UPDATE cc_users SET settings = $1, last_active = NOW() WHERE user_id = $2 RETURNING *',
            [JSON.stringify(merged), userId]
        );
        return res.rows[0] || null;
    }

    async changePassword(userId, newPasswordHash) {
        await this.pool.query('UPDATE cc_users SET password_hash = $1 WHERE user_id = $2', [newPasswordHash, userId]);
    }

    // ── Notification Methods ──

    async addNotification(userId, type, category, title, message, data = {}) {
        const res = await this.pool.query(
            'INSERT INTO cc_notifications (user_id, type, category, title, message, data) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [userId, type, category, title, message, JSON.stringify(data)]
        );
        return res.rows[0];
    }

    async getNotifications(userId, limit = 30, unreadOnly = false) {
        const where = unreadOnly ? 'AND read = FALSE' : '';
        const res = await this.pool.query(
            `SELECT * FROM cc_notifications WHERE user_id = $1 ${where} ORDER BY created_at DESC LIMIT $2`,
            [userId, limit]
        );
        return res.rows;
    }

    async markNotificationRead(notifId, userId) {
        await this.pool.query('UPDATE cc_notifications SET read = TRUE WHERE id = $1 AND user_id = $2', [notifId, userId]);
    }

    async markAllNotificationsRead(userId) {
        await this.pool.query('UPDATE cc_notifications SET read = TRUE WHERE user_id = $1 AND read = FALSE', [userId]);
    }

    async getUnreadCount(userId) {
        const res = await this.pool.query('SELECT COUNT(*) as count FROM cc_notifications WHERE user_id = $1 AND read = FALSE', [userId]);
        return parseInt(res.rows[0].count);
    }

    // ── Stats ──

    async getGlobalStats() {
        const users = await this.pool.query('SELECT COUNT(*) as count FROM cc_users');
        const games = await this.pool.query("SELECT COUNT(*) as count FROM cc_game_sessions WHERE status = 'completed'");
        const active = await this.pool.query("SELECT COUNT(*) as count FROM cc_game_sessions WHERE status IN ('waiting', 'active')");
        const polls = await this.pool.query('SELECT COUNT(*) as count FROM cc_polls');
        const topGame = await this.pool.query(
            "SELECT game_type, COUNT(*) as cnt FROM cc_game_sessions WHERE status = 'completed' GROUP BY game_type ORDER BY cnt DESC LIMIT 1"
        );
        return {
            totalUsers: parseInt(users.rows[0].count),
            totalGames: parseInt(games.rows[0].count),
            activeGames: parseInt(active.rows[0].count),
            totalPolls: parseInt(polls.rows[0].count),
            mostPlayedGame: topGame.rows[0]?.game_type || null
        };
    }
}

module.exports = CrowdControlDB;
