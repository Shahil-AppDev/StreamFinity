/**
 * StreamControl (CrowdControl) Asset Extractor
 * Extracts assets from local crowdcontrol/streamcontrol directory and generates built-in content
 *
 * Local sources:
 * - streamcontrol/ (Electron runtime data only — Preferences, LevelDB, Session Storage)
 * - vendor/legacy/ (feature configs)
 *
 * No upstream server available — all content is generated as built-in StreamFinity assets
 */

const fs = require('fs');
const path = require('path');
const Logger = require('../lib/Logger');

class StreamControlExtractor {
    constructor(config) {
        this.config = config;
        this.log = new Logger('StreamControlExtractor');
        this.legacyDir = path.resolve(config.assetsDir, '..', '..', 'vendor', 'legacy');
        this.runtimeDir = path.resolve(config.assetsDir, '..', '..', 'streamcontrol');
        this.outputDir = path.join(config.assetsDir, 'streamcontrol');
        this._results = { local: 0, upstream: 0, failed: 0, assets: [] };
    }

    async extract() {
        this.log.info('Starting StreamControl asset extraction...');
        this._results = { local: 0, upstream: 0, failed: 0, assets: [] };

        const dirs = ['games', 'polls', 'rewards', 'animations', 'config'];
        for (const d of dirs) {
            fs.mkdirSync(path.join(this.outputDir, d), { recursive: true });
        }

        await this._extractRuntimeData();
        await this._extractLegacyFeatures();
        await this._generateGameTemplates();
        await this._generatePollTemplates();
        await this._generateRewardTemplates();
        await this._generateAnimationConfigs();

        this.log.success(`Extraction complete: ${this._results.local} local, ${this._results.upstream} upstream, ${this._results.failed} failed`);
        return this._results;
    }

    async _extractRuntimeData() {
        // Extract Preferences if available
        const prefsFile = path.join(this.runtimeDir, 'Preferences');
        if (fs.existsSync(prefsFile)) {
            try {
                const prefs = JSON.parse(fs.readFileSync(prefsFile, 'utf8'));
                const dest = path.join(this.outputDir, 'config', 'runtime-preferences.json');
                fs.writeFileSync(dest, JSON.stringify({ extractedAt: new Date().toISOString(), preferences: prefs }, null, 2));
                this._results.local++;
                this._results.assets.push({ name: 'runtime-preferences.json', type: 'config', source: 'runtime' });
            } catch (_) {}
        }

        // Extract .updaterId for version tracking
        const updaterFile = path.join(this.runtimeDir, '.updaterId');
        if (fs.existsSync(updaterFile)) {
            const updaterId = fs.readFileSync(updaterFile, 'utf8').trim();
            const dest = path.join(this.outputDir, 'config', 'updater-id.json');
            fs.writeFileSync(dest, JSON.stringify({ updaterId, extractedAt: new Date().toISOString() }, null, 2));
            this._results.local++;
            this._results.assets.push({ name: 'updater-id.json', type: 'metadata', source: 'runtime' });
        }
    }

    async _extractLegacyFeatures() {
        const configFile = path.join(this.legacyDir, 'streamfinity-config.json');
        if (!fs.existsSync(configFile)) return;

        try {
            const data = JSON.parse(fs.readFileSync(configFile, 'utf8'));
            if (data.platforms?.streamcontrol) {
                const dest = path.join(this.outputDir, 'config', 'streamcontrol-features.json');
                fs.writeFileSync(dest, JSON.stringify({
                    extractedFrom: 'streamfinity-config.json',
                    extractedAt: new Date().toISOString(),
                    platform: data.platforms.streamcontrol,
                    bypass: data.bypass || {}
                }, null, 2));
                this._results.local++;
                this._results.assets.push({ name: 'streamcontrol-features.json', type: 'metadata', source: 'legacy' });
            }
        } catch (_) {}
    }

    async _generateGameTemplates() {
        const games = [
            {
                id: 'spin-wheel',
                name: 'Spin the Wheel',
                type: 'wheel',
                description: 'Interactive spin wheel with customizable segments',
                minPlayers: 1, maxPlayers: 100,
                config: {
                    segments: 8,
                    spinDuration: 5000,
                    customSegments: true,
                    segmentColors: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f43f5e', '#84cc16'],
                    soundOnSpin: true,
                    showWinnerAnimation: true
                },
                triggers: [{ event: 'gift', minValue: 10 }, { event: 'command', keyword: '!spin' }]
            },
            {
                id: 'trivia',
                name: 'Trivia Challenge',
                type: 'quiz',
                description: 'Multi-round trivia with leaderboard',
                minPlayers: 2, maxPlayers: 1000,
                config: {
                    questionTime: 30,
                    rounds: 10,
                    categories: ['general', 'gaming', 'music', 'movies', 'science', 'sports'],
                    pointsPerCorrect: 10,
                    bonusForSpeed: true,
                    showLeaderboard: true
                },
                triggers: [{ event: 'command', keyword: '!trivia' }]
            },
            {
                id: 'word-chain',
                name: 'Word Chain',
                type: 'word',
                description: 'Chain words starting with the last letter',
                minPlayers: 2, maxPlayers: 50,
                config: { timePerTurn: 15, minWordLength: 3, language: 'en', allowRepeats: false }
            },
            {
                id: 'number-guess',
                name: 'Number Guess',
                type: 'guess',
                description: 'Guess the secret number with hot/cold hints',
                minPlayers: 1, maxPlayers: 1000,
                config: { minNumber: 1, maxNumber: 100, maxAttempts: 10, showHints: true, hintType: 'hot-cold' }
            },
            {
                id: 'chat-battle',
                name: 'Chat Battle',
                type: 'battle',
                description: 'Two teams compete by typing keywords',
                minPlayers: 2, maxPlayers: 10000,
                config: { duration: 60, teams: 2, voteType: 'chat', showProgress: true, teamColors: ['#6366f1', '#ec4899'] }
            },
            {
                id: 'bingo',
                name: 'Stream Bingo',
                type: 'bingo',
                description: 'Bingo cards with stream-related events',
                minPlayers: 2, maxPlayers: 500,
                config: { gridSize: 5, autoCall: true, callInterval: 30, categories: ['stream-events', 'chat-phrases', 'viewer-actions'] }
            },
            {
                id: 'raffle',
                name: 'Raffle Draw',
                type: 'raffle',
                description: 'Random winner selection with animation',
                minPlayers: 2, maxPlayers: 10000,
                config: { entryKeyword: '!join', maxWinners: 5, allowMultipleEntries: false, giftBonusEntries: true, animation: 'slot-machine' }
            },
            {
                id: 'prediction',
                name: 'Prediction Market',
                type: 'prediction',
                description: 'Viewers predict outcomes and earn points',
                minPlayers: 2, maxPlayers: 10000,
                config: { options: 2, duration: 300, pointsToWager: true, maxWager: 1000, showOdds: true }
            }
        ];

        for (const game of games) {
            const dest = path.join(this.outputDir, 'games', `${game.id}.json`);
            fs.writeFileSync(dest, JSON.stringify(game, null, 2));
            this._results.local++;
            this._results.assets.push({ name: `${game.id}.json`, type: 'game', source: 'generated' });
        }

        const indexFile = path.join(this.outputDir, 'games', '_index.json');
        fs.writeFileSync(indexFile, JSON.stringify({ games: games.map(g => ({ id: g.id, name: g.name, type: g.type })), count: games.length }, null, 2));
    }

    async _generatePollTemplates() {
        const polls = [
            {
                id: 'yes-no',
                name: 'Yes/No Poll',
                type: 'yes_no',
                config: { options: ['Yes', 'No'], duration: 60, showResults: 'live', theme: 'default' }
            },
            {
                id: 'multiple-choice',
                name: 'Multiple Choice',
                type: 'multiple_choice',
                config: { maxOptions: 6, duration: 120, showResults: 'live', allowChange: false, theme: 'default' }
            },
            {
                id: 'rating',
                name: 'Rating Poll',
                type: 'rating',
                config: { scale: 5, duration: 60, showAverage: true, theme: 'stars' }
            },
            {
                id: 'word-cloud',
                name: 'Word Cloud',
                type: 'word_cloud',
                config: { maxWords: 100, duration: 120, minWordLength: 2, filterProfanity: true, theme: 'colorful' }
            },
            {
                id: 'versus',
                name: 'Versus Poll',
                type: 'versus',
                config: { options: 2, duration: 90, showPercentage: true, animation: 'tug-of-war', theme: 'neon' }
            }
        ];

        for (const poll of polls) {
            const dest = path.join(this.outputDir, 'polls', `${poll.id}.json`);
            fs.writeFileSync(dest, JSON.stringify(poll, null, 2));
            this._results.local++;
            this._results.assets.push({ name: `${poll.id}.json`, type: 'poll', source: 'generated' });
        }
    }

    async _generateRewardTemplates() {
        const rewards = [
            { id: 'vip-badge', name: 'VIP Badge', type: 'badge', icon: 'star', color: '#f59e0b', tier: 'gold', requirement: { type: 'gift_total', value: 100 } },
            { id: 'mod-badge', name: 'Moderator Badge', type: 'badge', icon: 'shield', color: '#10b981', tier: 'special', requirement: { type: 'manual', value: null } },
            { id: 'top-gifter', name: 'Top Gifter', type: 'badge', icon: 'gift', color: '#ec4899', tier: 'diamond', requirement: { type: 'gift_rank', value: 1 } },
            { id: 'loyal-viewer', name: 'Loyal Viewer', type: 'badge', icon: 'heart', color: '#ef4444', tier: 'silver', requirement: { type: 'watch_hours', value: 10 } },
            { id: 'first-chat', name: 'First Chat', type: 'badge', icon: 'message', color: '#6366f1', tier: 'bronze', requirement: { type: 'first_message', value: null } },
            { id: 'custom-title', name: 'Custom Title', type: 'title', icon: 'crown', color: '#8b5cf6', tier: 'gold', requirement: { type: 'points', value: 5000 } },
            { id: 'highlight-msg', name: 'Highlighted Message', type: 'effect', icon: 'sparkles', color: '#f97316', tier: 'silver', requirement: { type: 'points', value: 1000 } },
            { id: 'sound-alert', name: 'Custom Sound Alert', type: 'sound', icon: 'volume', color: '#14b8a6', tier: 'gold', requirement: { type: 'points', value: 3000 } }
        ];

        for (const reward of rewards) {
            const dest = path.join(this.outputDir, 'rewards', `${reward.id}.json`);
            fs.writeFileSync(dest, JSON.stringify(reward, null, 2));
            this._results.local++;
            this._results.assets.push({ name: `${reward.id}.json`, type: 'reward', source: 'generated' });
        }
    }

    async _generateAnimationConfigs() {
        const animations = {
            transitions: ['fade', 'slide-up', 'slide-down', 'slide-left', 'slide-right', 'bounce', 'flip', 'zoom'],
            effects: ['confetti', 'fireworks', 'sparkle', 'rain', 'snow', 'hearts', 'stars'],
            durations: { fast: 200, normal: 400, slow: 800 },
            easings: ['ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear', 'bounce']
        };

        const dest = path.join(this.outputDir, 'animations', 'config.json');
        fs.writeFileSync(dest, JSON.stringify(animations, null, 2));
        this._results.local++;
        this._results.assets.push({ name: 'animations/config.json', type: 'animation-config', source: 'generated' });
    }

    getResults() {
        return this._results;
    }
}

module.exports = StreamControlExtractor;
