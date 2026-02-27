/**
 * StreamFinity Platform Module
 * Core live streaming: TikTok LIVE connection, chat, gifts, overlays
 */

const { Logger } = require('../utils/logger');

class StreamFinityPlatform {
    constructor(eventBus, config) {
        this.log = new Logger('StreamFinity');
        this.eventBus = eventBus;
        this.config = config;
        this.name = 'StreamFinity';
        this.id = 'streamfinity';

        this.state = {
            active: false,
            connected: false,
            username: null,
            roomId: null,
            viewers: 0,
            gifts: [],
            messages: [],
            uptime: 0
        };

        this.features = [
            'live_connection',
            'chat_monitoring',
            'gift_tracking',
            'overlay_support',
            'real_time_stats',
            'tiktok_bridge'
        ];
    }

    async initialize() {
        this.log.start('Initializing StreamFinity platform...');

        this._registerEventHandlers();

        this.state.active = true;
        this.log.success('StreamFinity platform ready');
        return { success: true, platform: this.id };
    }

    async connect(username) {
        this.log.info(`Connecting to TikTok LIVE as @${username}...`);
        this.state.username = username;
        this.state.connected = true;

        this.eventBus.platformEmit(this.id, 'connected', {
            username,
            timestamp: Date.now()
        });

        return { success: true, username, connected: true };
    }

    async disconnect() {
        this.log.info('Disconnecting from TikTok LIVE...');
        this.state.connected = false;
        this.state.username = null;
        this.state.roomId = null;

        this.eventBus.platformEmit(this.id, 'disconnected', {
            timestamp: Date.now()
        });

        return { success: true };
    }

    onChat(message) {
        this.state.messages.push(message);
        if (this.state.messages.length > 500) this.state.messages.shift();

        this.eventBus.platformEmit(this.id, 'chat', message);
        this.eventBus.broadcast(this.id, 'chat:new', message);
    }

    onGift(gift) {
        this.state.gifts.push(gift);
        this.state.viewers = gift.viewerCount || this.state.viewers;

        this.eventBus.platformEmit(this.id, 'gift', gift);
        this.eventBus.broadcast(this.id, 'gift:received', gift);
    }

    getStats() {
        return {
            platform: this.id,
            connected: this.state.connected,
            username: this.state.username,
            viewers: this.state.viewers,
            totalGifts: this.state.gifts.length,
            totalMessages: this.state.messages.length,
            uptime: this.state.uptime
        };
    }

    getAPI() {
        return {
            connect: (username) => this.connect(username),
            disconnect: () => this.disconnect(),
            getStats: () => this.getStats(),
            getChat: () => [...this.state.messages],
            getGifts: () => [...this.state.gifts],
            isConnected: () => this.state.connected
        };
    }

    _registerEventHandlers() {
        this.eventBus.platformOn(this.id, 'request:stats', () => {
            this.eventBus.platformEmit(this.id, 'stats', this.getStats());
        });

        this.eventBus.platformOn(this.id, 'data:sync', (data) => {
            this.log.debug('Received sync data:', data.key);
        });
    }

    async shutdown() {
        this.log.info('Shutting down StreamFinity platform...');
        if (this.state.connected) await this.disconnect();
        this.state.active = false;
    }
}

module.exports = StreamFinityPlatform;
