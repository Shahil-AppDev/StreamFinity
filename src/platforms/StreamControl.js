/**
 * StreamControl Platform Module
 * Audience interaction: polls, mini-games, rewards, moderation
 */

const { Logger } = require('../utils/logger');

class StreamControlPlatform {
    constructor(eventBus, config) {
        this.log = new Logger('StreamControl');
        this.eventBus = eventBus;
        this.config = config;
        this.name = 'StreamControl';
        this.id = 'streamcontrol';

        this.state = {
            active: false,
            polls: [],
            games: [],
            rewards: [],
            users: new Map(),
            moderation: {
                bannedWords: [],
                slowMode: false,
                slowModeDelay: 5000
            }
        };

        this.features = [
            'audience_interaction',
            'poll_system',
            'mini_games',
            'reward_system',
            'moderation_tools',
            'community_features'
        ];
    }

    async initialize() {
        this.log.start('Initializing StreamControl platform...');

        this._registerEventHandlers();

        this.state.active = true;
        this.log.success('StreamControl platform ready');
        return { success: true, platform: this.id };
    }

    // ── Polls ──

    createPoll(options) {
        const poll = {
            id: 'poll_' + Date.now(),
            question: options.question,
            options: options.options.map((opt, i) => ({
                id: i,
                text: opt,
                votes: 0
            })),
            duration: options.duration || 60000,
            active: true,
            createdAt: Date.now(),
            voters: new Set()
        };

        this.state.polls.push(poll);
        this.log.info(`Poll created: "${poll.question}" (${poll.options.length} options)`);

        this.eventBus.platformEmit(this.id, 'poll:created', {
            id: poll.id,
            question: poll.question,
            options: poll.options
        });
        this.eventBus.broadcast(this.id, 'poll:started', poll);

        // Auto-close after duration
        if (poll.duration > 0) {
            setTimeout(() => this.closePoll(poll.id), poll.duration);
        }

        return { success: true, pollId: poll.id };
    }

    votePoll(pollId, optionId, userId) {
        const poll = this.state.polls.find(p => p.id === pollId && p.active);
        if (!poll) return { success: false, error: 'Poll not found or closed' };
        if (poll.voters.has(userId)) return { success: false, error: 'Already voted' };

        const option = poll.options.find(o => o.id === optionId);
        if (!option) return { success: false, error: 'Option not found' };

        option.votes++;
        poll.voters.add(userId);

        this.eventBus.platformEmit(this.id, 'poll:vote', { pollId, optionId, userId });
        return { success: true, votes: option.votes };
    }

    closePoll(pollId) {
        const poll = this.state.polls.find(p => p.id === pollId);
        if (!poll || !poll.active) return null;

        poll.active = false;
        const results = {
            id: poll.id,
            question: poll.question,
            results: poll.options.sort((a, b) => b.votes - a.votes),
            totalVotes: poll.options.reduce((sum, o) => sum + o.votes, 0)
        };

        this.eventBus.platformEmit(this.id, 'poll:closed', results);
        this.eventBus.broadcast(this.id, 'poll:results', results);
        return results;
    }

    // ── Games ──

    startGame(gameType, options = {}) {
        const game = {
            id: 'game_' + Date.now(),
            type: gameType,
            options,
            active: true,
            players: [],
            scores: new Map(),
            createdAt: Date.now()
        };

        this.state.games.push(game);
        this.log.info(`Game started: ${gameType} (${game.id})`);

        this.eventBus.platformEmit(this.id, 'game:started', {
            id: game.id,
            type: gameType
        });
        this.eventBus.broadcast(this.id, 'game:started', game);

        return { success: true, gameId: game.id };
    }

    endGame(gameId) {
        const game = this.state.games.find(g => g.id === gameId);
        if (!game || !game.active) return null;

        game.active = false;
        const results = {
            id: game.id,
            type: game.type,
            scores: Object.fromEntries(game.scores),
            playerCount: game.players.length
        };

        this.eventBus.platformEmit(this.id, 'game:ended', results);
        return results;
    }

    // ── Rewards ──

    giveReward(userId, reward) {
        const entry = {
            id: 'reward_' + Date.now(),
            userId,
            reward,
            grantedAt: Date.now()
        };

        this.state.rewards.push(entry);

        // Track user points
        const user = this.state.users.get(userId) || { points: 0, rewards: [] };
        user.points += reward.points || 0;
        user.rewards.push(entry.id);
        this.state.users.set(userId, user);

        this.eventBus.platformEmit(this.id, 'reward:given', entry);
        return { success: true, rewardId: entry.id };
    }

    getUserProfile(userId) {
        return this.state.users.get(userId) || { points: 0, rewards: [] };
    }

    // ── Moderation ──

    setSlowMode(enabled, delay = 5000) {
        this.state.moderation.slowMode = enabled;
        this.state.moderation.slowModeDelay = delay;
        this.eventBus.broadcast(this.id, 'moderation:slowmode', { enabled, delay });
        return { success: true };
    }

    addBannedWord(word) {
        if (!this.state.moderation.bannedWords.includes(word.toLowerCase())) {
            this.state.moderation.bannedWords.push(word.toLowerCase());
        }
        return { success: true };
    }

    // ── Stats & API ──

    getStats() {
        return {
            platform: this.id,
            activePolls: this.state.polls.filter(p => p.active).length,
            totalPolls: this.state.polls.length,
            activeGames: this.state.games.filter(g => g.active).length,
            totalGames: this.state.games.length,
            totalRewards: this.state.rewards.length,
            uniqueUsers: this.state.users.size
        };
    }

    getAPI() {
        return {
            createPoll: (opts) => this.createPoll(opts),
            votePoll: (pollId, optionId, userId) => this.votePoll(pollId, optionId, userId),
            closePoll: (pollId) => this.closePoll(pollId),
            getPolls: () => this.state.polls.filter(p => p.active),
            startGame: (type, opts) => this.startGame(type, opts),
            endGame: (id) => this.endGame(id),
            giveReward: (userId, reward) => this.giveReward(userId, reward),
            getUserProfile: (userId) => this.getUserProfile(userId),
            setSlowMode: (enabled, delay) => this.setSlowMode(enabled, delay),
            getStats: () => this.getStats()
        };
    }

    _registerEventHandlers() {
        // React to chat messages for moderation
        this.eventBus.platformOn(this.id, 'chat:new', (message) => {
            const text = (message.text || '').toLowerCase();
            const isBanned = this.state.moderation.bannedWords.some(w => text.includes(w));
            if (isBanned) {
                this.eventBus.platformEmit(this.id, 'moderation:blocked', message);
            }
        });

        this.eventBus.platformOn(this.id, 'data:sync', (data) => {
            this.log.debug('Received sync data:', data.key);
        });
    }

    async shutdown() {
        this.log.info('Shutting down StreamControl platform...');
        // Close all active polls and games
        this.state.polls.filter(p => p.active).forEach(p => this.closePoll(p.id));
        this.state.games.filter(g => g.active).forEach(g => this.endGame(g.id));
        this.state.active = false;
    }
}

module.exports = StreamControlPlatform;
