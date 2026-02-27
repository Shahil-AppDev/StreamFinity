/**
 * StreamControl Loader
 * Handles loading and serving of StreamControl (CrowdControl) assets:
 * - Game templates (spin wheel, trivia, etc.)
 * - Poll UI components
 * - Reward system assets (badges, icons)
 * - Interaction animations
 */

const fs = require('fs');
const path = require('path');
const Logger = require('../lib/Logger');

class StreamControlLoader {
    constructor(assetProxy, config) {
        this.proxy = assetProxy;
        this.config = config;
        this.log = new Logger('StreamControlLoader');
        this.assetsDir = path.join(config.assetsDir, 'streamcontrol');
        this._initialized = false;

        const dirs = ['games', 'polls', 'rewards', 'animations'];
        for (const d of dirs) {
            fs.mkdirSync(path.join(this.assetsDir, d), { recursive: true });
        }
    }

    async initialize() {
        this.log.info('Initializing StreamControl loader...');
        await this._loadBuiltInGames();
        await this._loadBuiltInRewards();
        this._initialized = true;
        this.log.success('StreamControl loader ready');
        return { success: true };
    }

    /**
     * Load game templates
     */
    async loadGameTemplates() {
        return { success: true, games: this._getBuiltInGames(), source: 'built-in' };
    }

    /**
     * Get a specific game template
     */
    async getGameTemplate(gameId) {
        const localPath = path.join(this.assetsDir, 'games', `${gameId}.json`);
        if (fs.existsSync(localPath)) {
            try {
                return { success: true, game: JSON.parse(fs.readFileSync(localPath, 'utf8')), source: 'local' };
            } catch (_) {}
        }

        const games = this._getBuiltInGames();
        const game = games.find(g => g.id === gameId);
        if (game) return { success: true, game, source: 'built-in' };

        return { success: false, error: `Game not found: ${gameId}` };
    }

    /**
     * Load poll system UI config
     */
    async loadPollSystem() {
        return {
            success: true,
            polls: {
                types: ['yes_no', 'multiple_choice', 'rating', 'word_cloud', 'prediction'],
                maxOptions: 10,
                maxDuration: 600,
                themes: ['default', 'dark', 'neon', 'minimal', 'streamfinity'],
                animations: ['slide', 'fade', 'bounce', 'flip']
            },
            source: 'built-in'
        };
    }

    /**
     * Load reward assets (badges, icons)
     */
    async loadRewardAssets() {
        return { success: true, rewards: this._getBuiltInRewards(), source: 'built-in' };
    }

    /**
     * Get a specific reward asset
     */
    async getRewardAsset(rewardId) {
        const localPath = path.join(this.assetsDir, 'rewards', `${rewardId}.json`);
        if (fs.existsSync(localPath)) {
            try {
                return { success: true, reward: JSON.parse(fs.readFileSync(localPath, 'utf8')), source: 'local' };
            } catch (_) {}
        }

        const rewards = this._getBuiltInRewards();
        const reward = rewards.find(r => r.id === rewardId);
        if (reward) return { success: true, reward, source: 'built-in' };

        return { success: false, error: `Reward not found: ${rewardId}` };
    }

    async _loadBuiltInGames() {
        const games = this._getBuiltInGames();
        for (const game of games) {
            const filePath = path.join(this.assetsDir, 'games', `${game.id}.json`);
            if (!fs.existsSync(filePath)) {
                fs.writeFileSync(filePath, JSON.stringify(game, null, 2));
            }
        }
    }

    async _loadBuiltInRewards() {
        const rewards = this._getBuiltInRewards();
        for (const reward of rewards) {
            const filePath = path.join(this.assetsDir, 'rewards', `${reward.id}.json`);
            if (!fs.existsSync(filePath)) {
                fs.writeFileSync(filePath, JSON.stringify(reward, null, 2));
            }
        }
    }

    _getBuiltInGames() {
        return [
            { id: 'spin-wheel', name: 'Spin the Wheel', type: 'wheel', minPlayers: 1, maxPlayers: 100, config: { segments: 8, spinDuration: 5000 } },
            { id: 'trivia', name: 'Trivia Challenge', type: 'quiz', minPlayers: 2, maxPlayers: 1000, config: { questionTime: 30, rounds: 10 } },
            { id: 'word-chain', name: 'Word Chain', type: 'word', minPlayers: 2, maxPlayers: 50, config: { timePerTurn: 15, minWordLength: 3 } },
            { id: 'number-guess', name: 'Number Guess', type: 'guess', minPlayers: 1, maxPlayers: 1000, config: { minNumber: 1, maxNumber: 100, maxAttempts: 10 } },
            { id: 'chat-battle', name: 'Chat Battle', type: 'battle', minPlayers: 2, maxPlayers: 2, config: { duration: 60, voteType: 'chat' } },
            { id: 'bingo', name: 'Stream Bingo', type: 'bingo', minPlayers: 2, maxPlayers: 500, config: { gridSize: 5, autoCall: true } },
            { id: 'raffle', name: 'Raffle Draw', type: 'raffle', minPlayers: 2, maxPlayers: 10000, config: { entryKeyword: '!join', maxWinners: 5 } },
            { id: 'prediction', name: 'Prediction Market', type: 'prediction', minPlayers: 2, maxPlayers: 10000, config: { options: 2, duration: 300 } }
        ];
    }

    _getBuiltInRewards() {
        return [
            { id: 'vip-badge', name: 'VIP Badge', type: 'badge', icon: 'star', color: '#f59e0b', tier: 'gold' },
            { id: 'mod-badge', name: 'Moderator Badge', type: 'badge', icon: 'shield', color: '#10b981', tier: 'special' },
            { id: 'top-gifter', name: 'Top Gifter', type: 'badge', icon: 'gift', color: '#ec4899', tier: 'diamond' },
            { id: 'loyal-viewer', name: 'Loyal Viewer', type: 'badge', icon: 'heart', color: '#ef4444', tier: 'silver' },
            { id: 'first-chat', name: 'First Chat', type: 'badge', icon: 'message', color: '#6366f1', tier: 'bronze' },
            { id: 'custom-title', name: 'Custom Title', type: 'title', icon: 'crown', color: '#8b5cf6', tier: 'gold' },
            { id: 'highlight-msg', name: 'Highlighted Message', type: 'effect', icon: 'sparkles', color: '#f97316', tier: 'silver' },
            { id: 'sound-alert', name: 'Custom Sound Alert', type: 'sound', icon: 'volume', color: '#14b8a6', tier: 'gold' }
        ];
    }

    getStats() {
        return { initialized: this._initialized, assetsDir: this.assetsDir };
    }
}

module.exports = StreamControlLoader;
