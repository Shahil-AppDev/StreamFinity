/**
 * CrowdControl API Routes
 * /api/crowdcontrol/*
 */

const express = require('express');
const ccConfig = require('../config/crowdcontrol');

module.exports = function createCrowdControlRoutes(ccDb) {
    const router = express.Router();

    // ── GAMES ──

    // GET /api/crowdcontrol/games — list all available games
    router.get('/games', (req, res) => {
        const games = Object.values(ccConfig.games).map(g => ({
            id: g.id, name: g.name, icon: g.icon, category: g.category,
            description: g.description, players: g.players, difficulty: g.difficulty,
            xpReward: g.xpReward
        }));
        const category = req.query.category;
        res.json({
            games: category ? games.filter(g => g.category === category) : games,
            categories: ccConfig.categories
        });
    });

    // GET /api/crowdcontrol/games/active — active game sessions
    router.get('/games/active', async (req, res) => {
        try {
            const sessions = await ccDb.getActiveGames();
            res.json({ sessions });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // POST /api/crowdcontrol/games/start — start a new game session
    router.post('/games/start', async (req, res) => {
        try {
            const { gameType, userId, username, config } = req.body;
            if (!gameType || !ccConfig.games[gameType]) return res.status(400).json({ error: 'Invalid game type' });
            if (!userId || !username) return res.status(400).json({ error: 'userId and username required' });

            await ccDb.getOrCreateUser(userId, username);
            const session = await ccDb.createGameSession(gameType, userId, config || {});
            await ccDb.joinGame(session.game_id, userId, username);
            res.json({ session });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // POST /api/crowdcontrol/games/:gameId/join — join a game
    router.post('/games/:gameId/join', async (req, res) => {
        try {
            const { userId, username } = req.body;
            if (!userId || !username) return res.status(400).json({ error: 'userId and username required' });

            await ccDb.getOrCreateUser(userId, username);
            const session = await ccDb.joinGame(req.params.gameId, userId, username);
            if (!session) return res.status(404).json({ error: 'Game not found or already started' });
            res.json({ session });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // POST /api/crowdcontrol/games/:gameId/action — perform game action
    router.post('/games/:gameId/action', async (req, res) => {
        try {
            const { userId, action, data } = req.body;
            const session = await ccDb.getGameSession(req.params.gameId);
            if (!session) return res.status(404).json({ error: 'Game not found' });

            // Process action based on game type
            const gameDef = ccConfig.games[session.game_type];
            if (!gameDef) return res.status(400).json({ error: 'Unknown game type' });

            // Generic action processing — specific game logic would go in game engine modules
            const result = { action, userId, processed: true, timestamp: new Date().toISOString() };

            // Handle bet actions
            if (action === 'bet' && data?.amount) {
                const spent = await ccDb.spendCoins(userId, data.amount, `Bet on ${gameDef.name}`);
                if (!spent) return res.status(400).json({ error: 'Insufficient coins' });
                result.betPlaced = true;
                result.amount = data.amount;
            }

            res.json({ result });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // POST /api/crowdcontrol/games/:gameId/end — end a game and distribute rewards
    router.post('/games/:gameId/end', async (req, res) => {
        try {
            const { winnerId, results } = req.body;
            const session = await ccDb.getGameSession(req.params.gameId);
            if (!session) return res.status(404).json({ error: 'Game not found' });

            const gameDef = ccConfig.games[session.game_type];

            // Award XP to all players
            const players = session.players || [];
            for (const p of players) {
                await ccDb.addXP(p.userId, gameDef?.xpReward || 10);
                const user = await ccDb.getUser(p.userId);
                if (user) {
                    const newStats = {
                        gamesPlayed: (user.stats?.gamesPlayed || 0) + 1,
                        gamesWon: (user.stats?.gamesWon || 0) + (p.userId === winnerId ? 1 : 0),
                        totalWinnings: user.stats?.totalWinnings || 0
                    };
                    await ccDb.updateStats(p.userId, newStats);
                }
            }

            // Award winner bonus
            if (winnerId) {
                const winCoins = (gameDef?.xpReward || 10) * 5;
                await ccDb.addCoins(winnerId, winCoins, `Won ${gameDef?.name || 'game'}`);

                // Check first_win achievement
                const winner = await ccDb.getUser(winnerId);
                if (winner && winner.stats?.gamesWon === 1) {
                    await ccDb.addAchievement(winnerId, 'first_win');
                }
            }

            // Check level ups
            for (const p of players) {
                await checkLevelUp(ccDb, p.userId);
            }

            await ccDb.endGame(req.params.gameId, results || { winnerId });
            res.json({ success: true, winnerId });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // GET /api/crowdcontrol/games/:gameId — get game session status
    router.get('/games/:gameId', async (req, res) => {
        try {
            const session = await ccDb.getGameSession(req.params.gameId);
            if (!session) return res.status(404).json({ error: 'Game not found' });
            res.json({ session });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ── USERS ──

    // GET /api/crowdcontrol/user/:userId — get user profile
    router.get('/user/:userId', async (req, res) => {
        try {
            const user = await ccDb.getUser(req.params.userId);
            if (!user) return res.status(404).json({ error: 'User not found' });
            const inventory = await ccDb.getUserInventory(req.params.userId);
            res.json({ user, inventory });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // POST /api/crowdcontrol/user/register — register/get user
    router.post('/user/register', async (req, res) => {
        try {
            const { userId, username } = req.body;
            if (!userId || !username) return res.status(400).json({ error: 'userId and username required' });
            const user = await ccDb.getOrCreateUser(userId, username);
            const inventory = await ccDb.getUserInventory(userId);
            res.json({ user, inventory });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // POST /api/crowdcontrol/user/:userId/equip — equip item
    router.post('/user/:userId/equip', async (req, res) => {
        try {
            const { itemType, itemId } = req.body;
            const userId = req.params.userId;
            if (!['avatar', 'frame', 'effect', 'badge'].includes(itemType)) return res.status(400).json({ error: 'Invalid item type' });
            const has = await ccDb.hasItem(userId, itemType, itemId);
            if (!has) return res.status(400).json({ error: 'Item not owned' });
            const user = await ccDb.updateUser(userId, { [itemType]: itemId });
            res.json({ user });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // GET /api/crowdcontrol/user/:userId/transactions — transaction history
    router.get('/user/:userId/transactions', async (req, res) => {
        try {
            const txs = await ccDb.getTransactions(req.params.userId, parseInt(req.query.limit) || 50);
            res.json({ transactions: txs });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ── SHOP ──

    // GET /api/crowdcontrol/shop — get shop items
    router.get('/shop', async (req, res) => {
        const userId = req.query.userId;
        let owned = { avatars: [], frames: [], effects: [], badges: [] };
        if (userId) owned = await ccDb.getUserInventory(userId);

        const sections = {};
        for (const [type, items] of Object.entries(ccConfig.shop)) {
            sections[type] = items.map(item => ({
                ...item,
                owned: owned[type]?.includes(item.id) || false,
                rarityColor: ccConfig.rarityColors[item.rarity] || '#9ca3af'
            }));
        }
        res.json({ shop: sections, rarityColors: ccConfig.rarityColors });
    });

    // POST /api/crowdcontrol/shop/buy — purchase an item
    router.post('/shop/buy', async (req, res) => {
        try {
            const { userId, itemType, itemId } = req.body;
            if (!userId || !itemType || !itemId) return res.status(400).json({ error: 'Missing fields' });

            const shopItems = ccConfig.shop[itemType + 's'];
            if (!shopItems) return res.status(400).json({ error: 'Invalid item type' });
            const item = shopItems.find(i => i.id === itemId);
            if (!item) return res.status(404).json({ error: 'Item not found' });
            if (item.special) return res.status(400).json({ error: 'This item cannot be purchased' });

            const has = await ccDb.hasItem(userId, itemType, itemId);
            if (has) return res.status(400).json({ error: 'Already owned' });

            let spent;
            if (item.currency === 'gems') {
                spent = await ccDb.spendGems(userId, item.cost, `Bought ${item.name}`);
            } else {
                spent = await ccDb.spendCoins(userId, item.cost, `Bought ${item.name}`);
            }
            if (!spent) return res.status(400).json({ error: `Insufficient ${item.currency}` });

            await ccDb.addInventoryItem(userId, itemType, itemId);

            // Check collector achievement
            const inv = await ccDb.getUserInventory(userId);
            const totalItems = Object.values(inv).reduce((s, arr) => s + arr.length, 0);
            if (totalItems >= 10) await ccDb.addAchievement(userId, 'collector');

            const user = await ccDb.getUser(userId);
            res.json({ success: true, user, item });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ── POLLS ──

    // GET /api/crowdcontrol/polls — active polls
    router.get('/polls', async (req, res) => {
        try {
            const polls = await ccDb.getActivePolls();
            res.json({ polls, types: ccConfig.polls });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // POST /api/crowdcontrol/polls/create — create a poll
    router.post('/polls/create', async (req, res) => {
        try {
            const { question, options, type, duration, createdBy } = req.body;
            if (!question || !options || options.length < 2) return res.status(400).json({ error: 'Question and at least 2 options required' });
            const pollType = ccConfig.polls[type] ? type : 'standard';
            const dur = duration || ccConfig.polls[pollType].duration;
            const poll = await ccDb.createPoll({ question, options, type: pollType, duration: dur, createdBy });
            res.json({ poll });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // POST /api/crowdcontrol/polls/:pollId/vote — vote on a poll
    router.post('/polls/:pollId/vote', async (req, res) => {
        try {
            const { userId, optionIndex, weight } = req.body;
            if (!userId || optionIndex === undefined) return res.status(400).json({ error: 'userId and optionIndex required' });
            const voted = await ccDb.votePoll(req.params.pollId, userId, optionIndex, weight || 1);
            if (!voted) return res.status(400).json({ error: 'Already voted' });
            const results = await ccDb.getPollResults(req.params.pollId);
            res.json({ success: true, results });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // GET /api/crowdcontrol/polls/:pollId/results — poll results
    router.get('/polls/:pollId/results', async (req, res) => {
        try {
            const results = await ccDb.getPollResults(req.params.pollId);
            if (!results) return res.status(404).json({ error: 'Poll not found' });
            res.json({ results });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ── LEADERBOARD ──

    // GET /api/crowdcontrol/leaderboard — global leaderboard
    router.get('/leaderboard', async (req, res) => {
        try {
            const limit = Math.min(parseInt(req.query.limit) || 20, 100);
            const board = await ccDb.getLeaderboard(null, limit);
            res.json({ leaderboard: board });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ── STATS ──

    // GET /api/crowdcontrol/stats — global stats
    router.get('/stats', async (req, res) => {
        try {
            const stats = await ccDb.getGlobalStats();
            res.json({ stats, config: { games: Object.keys(ccConfig.games).length, achievements: ccConfig.achievements.length } });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // GET /api/crowdcontrol/config — public config (games, categories, achievements, shop, progression)
    router.get('/config', (req, res) => {
        res.json({
            categories: ccConfig.categories,
            progression: ccConfig.progression,
            achievements: ccConfig.achievements,
            currency: ccConfig.currency,
            rarityColors: ccConfig.rarityColors,
            pollTypes: ccConfig.polls
        });
    });

    return router;
};

// ── Helper: Check and apply level up ──
async function checkLevelUp(ccDb, userId) {
    const user = await ccDb.getUser(userId);
    if (!user) return;
    const prog = ccConfig.progression;
    let { level, xp } = user;
    let leveled = false;

    while (level < prog.maxLevel) {
        const needed = Math.floor(prog.xpPerLevel * Math.pow(prog.xpMultiplier, level - 1));
        if (xp < needed) break;
        xp -= needed;
        level++;
        leveled = true;

        // Apply level bonus if exists
        const bonus = prog.levelBonuses[level];
        if (bonus) {
            if (bonus.coins) await ccDb.addCoins(userId, bonus.coins, `Level ${level} bonus`);
            if (bonus.gems) await ccDb.addGems(userId, bonus.gems, `Level ${level} bonus`);
            if (bonus.item) {
                const [type, id] = bonus.item.split('_');
                if (type && id) await ccDb.addInventoryItem(userId, type, id);
            }
        }
    }

    if (leveled) {
        await ccDb.updateUser(userId, { level, xp });
    }
}
