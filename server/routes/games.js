/**
 * CrowdControl Games API — /api/crowdcontrol/games/*
 * Per-game endpoints, sessions, rewards, advanced stats
 */

const express = require('express');
const GameEngine = require('../lib/crowdcontrol/GameEngine');
const ccConfig = require('../config/crowdcontrol');

// In-memory stores for active game state (volatile, per-process)
const activeSessions = new Map();
const triviaCache = new Map();
const reactionCache = new Map();
const dailyClaimCache = new Map();

module.exports = function createGameRoutes(ccDb) {
    const router = express.Router();

    // ── ROULETTE ──
    router.post('/roulette/spin', async (req, res) => {
        try {
            const { userId, betAmount } = req.body;
            if (!userId) return res.status(400).json({ error: 'userId required' });
            const bet = Math.max(ccConfig.games.roulette.config.minBet, Math.min(betAmount || 10, ccConfig.games.roulette.config.maxBet));
            const spent = await ccDb.spendCoins(userId, bet, 'Roulette bet');
            if (!spent) return res.status(400).json({ error: 'Insufficient coins' });
            const result = GameEngine.rouletteSpin(bet);
            if (result.won) await ccDb.addCoins(userId, result.prize, 'Roulette win');
            await ccDb.addXP(userId, ccConfig.games.roulette.xpReward);
            const user = await ccDb.getUser(userId);
            res.json({ success: true, result: { ...result, newBalance: user?.coins || 0 } });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ── DICE ──
    router.post('/dice/roll', async (req, res) => {
        try {
            const { userId, betAmount, prediction } = req.body;
            if (!userId || !prediction) return res.status(400).json({ error: 'userId and prediction required' });
            const bet = Math.max(5, Math.min(betAmount || 10, 500));
            const spent = await ccDb.spendCoins(userId, bet, 'Dice bet');
            if (!spent) return res.status(400).json({ error: 'Insufficient coins' });
            const result = GameEngine.diceRoll(prediction, bet);
            if (result.won) await ccDb.addCoins(userId, result.prize, 'Dice win');
            await ccDb.addXP(userId, ccConfig.games.dice.xpReward);
            const user = await ccDb.getUser(userId);
            res.json({ success: true, result: { ...result, newBalance: user?.coins || 0 } });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ── SLOTS ──
    router.post('/slots/spin', async (req, res) => {
        try {
            const { userId, betAmount } = req.body;
            if (!userId) return res.status(400).json({ error: 'userId required' });
            const bet = Math.max(ccConfig.games.slots.config.minBet, Math.min(betAmount || 5, ccConfig.games.slots.config.maxBet));
            const spent = await ccDb.spendCoins(userId, bet, 'Slots bet');
            if (!spent) return res.status(400).json({ error: 'Insufficient coins' });
            const result = GameEngine.slotsSpin(bet);
            if (result.won) await ccDb.addCoins(userId, result.prize, 'Slots win');
            await ccDb.addXP(userId, ccConfig.games.slots.xpReward);
            const user = await ccDb.getUser(userId);
            res.json({ success: true, result: { ...result, newBalance: user?.coins || 0 } });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ── CARD DRAW ──
    router.post('/card-draw/draw', async (req, res) => {
        try {
            const { userId } = req.body;
            if (!userId) return res.status(400).json({ error: 'userId required' });
            const result = GameEngine.cardDraw();
            await ccDb.addXP(userId, ccConfig.games.cardDraw.xpReward);
            if (result.points >= 100) await ccDb.addCoins(userId, result.points, `Card Draw: ${result.handRank}`);
            res.json({ success: true, result });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ── COIN FLIP ──
    router.post('/coin-flip/flip', async (req, res) => {
        try {
            const { userId, choice, betAmount } = req.body;
            if (!userId || !choice) return res.status(400).json({ error: 'userId and choice required' });
            const bet = Math.max(5, Math.min(betAmount || 10, 500));
            const spent = await ccDb.spendCoins(userId, bet, 'Coin Flip bet');
            if (!spent) return res.status(400).json({ error: 'Insufficient coins' });
            const result = GameEngine.coinFlip(choice);
            const prize = result.won ? Math.round(bet * result.multiplier) : 0;
            if (result.won) await ccDb.addCoins(userId, prize, 'Coin Flip win');
            await ccDb.addXP(userId, ccConfig.games.coinFlip.xpReward);
            const user = await ccDb.getUser(userId);
            res.json({ success: true, result: { ...result, prize, newBalance: user?.coins || 0 } });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ── TRIVIA ──
    router.get('/trivia/categories', (_req, res) => {
        res.json({ categories: Object.keys(GameEngine.triviaQuestions) });
    });

    router.post('/trivia/next-question', (req, res) => {
        const { category, difficulty } = req.body;
        const q = GameEngine.getTrivia(category, difficulty);
        const id = q.id;
        triviaCache.set(id, { ...q, createdAt: Date.now() });
        // Don't send _answer to client
        const { _answer, ...safe } = q;
        res.json({ question: safe });
    });

    router.post('/trivia/answer', async (req, res) => {
        try {
            const { userId, questionId, answer, timeTaken } = req.body;
            if (!userId || !questionId || answer === undefined) return res.status(400).json({ error: 'userId, questionId, answer required' });
            const q = triviaCache.get(questionId);
            if (!q) return res.status(404).json({ error: 'Question not found or expired' });
            triviaCache.delete(questionId);
            const result = GameEngine.checkTriviaAnswer(q, answer, timeTaken || 20000);
            if (result.correct) {
                await ccDb.addXP(userId, result.points);
                await ccDb.addCoins(userId, Math.round(result.points / 2), 'Trivia correct answer');
            }
            res.json({ success: true, ...result, explanation: q.question });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ── REACTION TIME ──
    router.post('/reaction/start', (_req, res) => {
        const session = GameEngine.reactionStart();
        reactionCache.set(session.sessionId, session);
        setTimeout(() => reactionCache.delete(session.sessionId), 30000);
        res.json({ sessionId: session.sessionId, waitTime: session.waitTime, targetColor: session.targetColor });
    });

    router.post('/reaction/click', async (req, res) => {
        try {
            const { userId, sessionId, clickTime } = req.body;
            if (!sessionId) return res.status(400).json({ error: 'sessionId required' });
            const session = reactionCache.get(sessionId);
            if (!session) return res.status(404).json({ error: 'Session expired' });
            reactionCache.delete(sessionId);
            const result = GameEngine.reactionClick(session.startedAt, session.waitTime, clickTime || Date.now());
            if (userId && result.valid) {
                await ccDb.addXP(userId, result.points);
                if (result.rank === 'excellent') {
                    await ccDb.addAchievement(userId, 'speed_demon');
                }
            }
            res.json({ success: true, ...result });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ── TARGET CLICK ──
    router.post('/target-click/start', (_req, res) => {
        const data = GameEngine.targetClickGenerate();
        res.json({ success: true, ...data });
    });

    router.post('/target-click/result', async (req, res) => {
        try {
            const { userId, hits, totalTargets, timeMs } = req.body;
            if (!userId) return res.status(400).json({ error: 'userId required' });
            const accuracy = totalTargets > 0 ? Math.round((hits / totalTargets) * 100) : 0;
            const points = hits * 5 + (accuracy > 80 ? 50 : 0);
            await ccDb.addXP(userId, Math.min(points, 100));
            if (points > 50) await ccDb.addCoins(userId, points, 'Target Click score');
            res.json({ success: true, hits, accuracy, points });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ── WORD GUESS ──
    router.post('/word-guess/new', (req, res) => {
        const { category } = req.body;
        const game = GameEngine.wordGuessNew(category);
        const id = 'wg_' + Date.now();
        activeSessions.set(id, { ...game, guessesLeft: game.maxGuesses });
        res.json({ sessionId: id, hint: game.hint, category: game.category, maxGuesses: game.maxGuesses });
    });

    router.post('/word-guess/guess', async (req, res) => {
        try {
            const { userId, sessionId, guess } = req.body;
            if (!sessionId || !guess) return res.status(400).json({ error: 'sessionId and guess required' });
            const session = activeSessions.get(sessionId);
            if (!session) return res.status(404).json({ error: 'Session not found' });
            const result = GameEngine.wordGuessCheck(session.word, guess);
            if (result.correct) {
                activeSessions.delete(sessionId);
                if (userId) {
                    await ccDb.addXP(userId, 15);
                    await ccDb.addCoins(userId, result.points, 'Word Guess win');
                }
            } else {
                session.guessesLeft--;
                if (session.guessesLeft <= 0) { activeSessions.delete(sessionId); result.gameOver = true; result.word = session.word; }
            }
            res.json({ success: true, ...result, guessesLeft: session.guessesLeft });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    router.get('/word-guess/hint', (req, res) => {
        const { sessionId } = req.query;
        const session = activeSessions.get(sessionId);
        if (!session) return res.status(404).json({ error: 'Session not found' });
        // Reveal one more letter
        const hint = session.word.split('').map((c, i) => (session.hint[i] !== '_' || Math.random() < 0.3) ? c : '_').join('');
        session.hint = hint;
        res.json({ hint, cost: 25, category: session.category });
    });

    // ── SCRAMBLE ──
    router.post('/scramble/new', (_req, res) => {
        const game = GameEngine.scrambleNew();
        const id = 'sc_' + Date.now();
        activeSessions.set(id, game);
        setTimeout(() => activeSessions.delete(id), 60000);
        res.json({ sessionId: id, scrambled: game.scrambled, timeLimit: game.timeLimit });
    });

    router.post('/scramble/solve', async (req, res) => {
        try {
            const { userId, sessionId, answer } = req.body;
            const session = activeSessions.get(sessionId);
            if (!session) return res.status(404).json({ error: 'Session expired' });
            const correct = answer?.toUpperCase() === session.word;
            activeSessions.delete(sessionId);
            const points = correct ? 150 : 0;
            if (userId && correct) {
                await ccDb.addXP(userId, 15);
                await ccDb.addCoins(userId, points, 'Scramble solved');
            }
            res.json({ success: true, correct, word: session.word, points });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ── RACE GAME ──
    router.post('/race/tap', (req, res) => {
        const { currentPos } = req.body;
        const result = GameEngine.raceTap(currentPos || 0);
        res.json({ success: true, ...result, finished: result.newPos >= 100 });
    });

    // ── CLICK BATTLE ──
    router.post('/click-battle/result', async (req, res) => {
        try {
            const { userId, opponentId, myClicks, opponentClicks } = req.body;
            const result = GameEngine.clickBattleResult(myClicks || 0, opponentClicks || 0);
            if (userId && result.winner === 1) {
                await ccDb.addCoins(userId, 50, 'Click Battle win');
                await ccDb.addXP(userId, 8);
            }
            res.json({ success: true, ...result });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ── SESSIONS ──

    router.post('/sessions/create', async (req, res) => {
        try {
            const { gameType, name, maxPlayers, buyIn, prizes, isPrivate } = req.body;
            if (!gameType || !ccConfig.games[gameType]) return res.status(400).json({ error: 'Invalid game type' });
            const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();
            const session = await ccDb.createGameSession(gameType, req.body.userId || 'system', {
                name: name || `${ccConfig.games[gameType].name} Session`,
                maxPlayers: maxPlayers || ccConfig.games[gameType].players.max,
                buyIn: buyIn || 0, prizes: prizes || {}, isPrivate: !!isPrivate, inviteCode
            });
            activeSessions.set(inviteCode, session.game_id);
            res.json({
                success: true, sessionId: session.game_id, inviteCode,
                shareableLink: `https://tik.starline-agency.xyz/join/${inviteCode}`
            });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    router.get('/sessions/active', async (_req, res) => {
        try {
            if (!ccDb.pool) return res.json({ sessions: [] });
            const sessions = await ccDb.getActiveGames();
            res.json({
                sessions: sessions.map(s => ({
                    id: s.game_id, game: s.game_type, status: s.status,
                    players: (s.players || []).length,
                    maxPlayers: s.config?.maxPlayers || 50,
                    name: s.config?.name || s.game_type,
                    buyIn: s.config?.buyIn || 0,
                    inviteCode: s.config?.inviteCode || null
                }))
            });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    router.post('/sessions/join/:code', async (req, res) => {
        try {
            const code = req.params.code.toUpperCase();
            const { userId, username } = req.body;
            if (!userId || !username) return res.status(400).json({ error: 'userId and username required' });
            // Find session by invite code
            const gameId = activeSessions.get(code);
            if (!gameId) {
                // Search DB
                const active = await ccDb.getActiveGames();
                const found = active.find(s => s.config?.inviteCode === code);
                if (!found) return res.status(404).json({ error: 'Session not found' });
                const session = await ccDb.joinGame(found.game_id, userId, username);
                return res.json({ success: true, sessionInfo: { name: found.config?.name, game: found.game_type, yourPosition: (session?.players || []).length } });
            }
            const session = await ccDb.joinGame(gameId, userId, username);
            if (!session) return res.status(404).json({ error: 'Session full or already started' });
            res.json({ success: true, sessionInfo: { game: session.game_type, yourPosition: (session.players || []).length } });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ── REWARDS ──

    router.post('/rewards/daily', async (req, res) => {
        try {
            const { userId } = req.body;
            if (!userId) return res.status(400).json({ error: 'userId required' });
            const key = `daily_${userId}`;
            const lastClaim = dailyClaimCache.get(key);
            const now = Date.now();
            if (lastClaim && now - lastClaim < 24 * 60 * 60 * 1000) {
                const next = new Date(lastClaim + 24 * 60 * 60 * 1000);
                return res.status(429).json({ error: 'Already claimed today', nextClaim: next.toISOString() });
            }
            const user = await ccDb.getUser(userId);
            if (!user) return res.status(404).json({ error: 'User not found' });
            const streak = user.stats?.dailyStreak || 0;
            const reward = GameEngine.dailyReward(streak);
            await ccDb.addCoins(userId, reward.coins, 'Daily reward');
            await ccDb.addGems(userId, reward.gems, 'Daily reward');
            await ccDb.addXP(userId, reward.xp);
            await ccDb.updateStats(userId, { dailyStreak: reward.streak });
            await ccDb.addNotification(userId, 'reward', 'rewards', '🎁 Daily Reward!', `You received ${reward.coins} 🪙 + ${reward.gems} 💎 + ${reward.xp} XP`);
            dailyClaimCache.set(key, now);
            const nextClaim = new Date(now + 24 * 60 * 60 * 1000);
            res.json({ success: true, rewards: reward, nextClaim: nextClaim.toISOString() });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    router.post('/rewards/mystery-box/open', async (req, res) => {
        try {
            const { userId, tier } = req.body;
            if (!userId) return res.status(400).json({ error: 'userId required' });
            const cost = tier === 'gold' ? 500 : 100;
            const spent = await ccDb.spendCoins(userId, cost, `Mystery Box (${tier || 'standard'})`);
            if (!spent) return res.status(400).json({ error: 'Insufficient coins' });
            const box = GameEngine.openMysteryBox(tier || 'standard');
            for (const r of box.rewards) {
                if (r.type === 'coins') await ccDb.addCoins(userId, r.amount, 'Mystery Box');
                else if (r.type === 'gems') await ccDb.addGems(userId, r.amount, 'Mystery Box');
                else if (r.type === 'xp') await ccDb.addXP(userId, r.amount);
                else if (r.type === 'item') await ccDb.addInventoryItem(userId, 'effect', r.itemId);
            }
            res.json({ success: true, ...box });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ── ADVANCED STATS ──

    router.get('/stats/user/:userId', async (req, res) => {
        try {
            const user = await ccDb.getUser(req.params.userId);
            if (!user) return res.status(404).json({ error: 'User not found' });
            const inventory = await ccDb.getUserInventory(req.params.userId);
            const txs = await ccDb.getTransactions(req.params.userId, 10);
            res.json({
                overall: {
                    level: user.level, xp: user.xp, coins: user.coins, gems: user.gems,
                    gamesPlayed: user.stats?.gamesPlayed || 0, winRate: user.stats?.winRate || 0,
                    gamesWon: user.stats?.gamesWon || 0, totalWinnings: user.stats?.totalWinnings || 0,
                    streak: user.stats?.streak || 0, bestStreak: user.stats?.bestStreak || 0
                },
                achievements: user.achievements || [],
                inventory,
                recentTransactions: txs
            });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    router.get('/leaderboard/global', async (req, res) => {
        try {
            const limit = Math.min(parseInt(req.query.limit) || 50, 100);
            const offset = parseInt(req.query.offset) || 0;
            const board = await ccDb.getLeaderboard(null, limit);
            const total = await ccDb.pool.query('SELECT COUNT(*) as count FROM cc_users');
            res.json({
                leaderboard: board.map((p, i) => ({ rank: offset + i + 1, ...p })),
                totalPlayers: parseInt(total.rows[0].count),
                limit, offset
            });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    router.get('/leaderboard/game/:gameId', async (req, res) => {
        try {
            const { gameId } = req.params;
            const period = req.query.period || 'alltime';
            const limit = Math.min(parseInt(req.query.limit) || 20, 50);
            const games = await ccDb.getGameLeaderboard(gameId, limit);
            res.json({ game: gameId, period, leaderboard: games });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ── SPECIAL LINKS ──

    router.get('/random', (_req, res) => {
        try {
            const gameIds = Object.keys(ccConfig.games);
            const random = gameIds[Math.floor(Math.random() * gameIds.length)];
            const game = ccConfig.games[random];
            res.json({ game: { id: game.id, name: game.name, icon: game.icon, category: game.category, description: game.description } });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    router.get('/trending', async (_req, res) => {
        try {
            let trending = [];
            if (ccDb.pool) {
                const result = await ccDb.pool.query(
                    "SELECT game_type, COUNT(*) as cnt FROM cc_game_sessions WHERE started_at > NOW() - INTERVAL '7 days' GROUP BY game_type ORDER BY cnt DESC LIMIT 5"
                );
                trending = result.rows.map(r => {
                    const g = ccConfig.games[r.game_type];
                    return g ? { id: g.id, name: g.name, icon: g.icon, playCount: parseInt(r.cnt) } : null;
                }).filter(Boolean);
            }
            if (trending.length === 0) {
                const defaults = ['roulette', 'trivia', 'reactionTime', 'slots', 'dice'];
                trending = defaults.map(id => {
                    const g = ccConfig.games[id];
                    return g ? { id: g.id, name: g.name, icon: g.icon, playCount: 0 } : null;
                }).filter(Boolean);
            }
            res.json({ trending });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    router.get('/featured', (_req, res) => {
        try {
            const featured = ccConfig.games.battleRoyale || ccConfig.games.roulette;
            res.json({ featured: { id: featured.id, name: featured.name, icon: featured.icon, description: featured.description, category: featured.category } });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    return router;
};
