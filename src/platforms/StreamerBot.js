/**
 * StreamerBot Platform Module
 * Integration with Streamer.bot via WebSocket API
 *
 * Streamer.bot is a powerful stream automation tool supporting
 * Twitch, YouTube, Kick, and Trovo. This module connects to its
 * local WebSocket server to execute actions, subscribe to events,
 * send chat messages, and retrieve viewer/broadcaster data.
 *
 * API Reference: https://docs.streamer.bot/api/websocket/requests
 */

const WebSocket = require('ws');
const { Logger } = require('../utils/logger');

const DEFAULT_RECONNECT_DELAY = 5000;
const DEFAULT_REQUEST_TIMEOUT = 10000;

class StreamerBotPlatform {
    constructor(eventBus, config) {
        this.log = new Logger('StreamerBot');
        this.eventBus = eventBus;
        this.config = config;
        this.name = 'StreamerBot';
        this.id = 'streamerbot';

        this.ws = null;
        this._requestId = 0;
        this._pending = new Map();
        this._reconnectTimer = null;
        this._shouldReconnect = true;
        this._useFallback = false;
        this._connectAttempts = 0;

        // Read config values
        const sbConfig = config.integrations?.streamerbot || {};
        this._primaryHost = sbConfig.host || '127.0.0.1';
        this._primaryPort = sbConfig.port || 8080;
        this._protocol = sbConfig.protocol || 'ws';
        this._path = sbConfig.path || '/';
        this._fallbackHost = sbConfig.fallbackHost || null;
        this._fallbackPort = sbConfig.fallbackPort || 8080;
        this._reconnectDelay = sbConfig.reconnectDelay || DEFAULT_RECONNECT_DELAY;
        this._requestTimeout = sbConfig.requestTimeout || DEFAULT_REQUEST_TIMEOUT;

        this.state = {
            active: false,
            connected: false,
            currentHost: null,
            currentPort: null,
            broadcaster: null,
            actions: [],
            commands: [],
            viewers: [],
            subscriptions: {}
        };

        this.features = [
            'action_execution',
            'event_subscription',
            'chat_messages',
            'viewer_tracking',
            'command_management',
            'code_triggers',
            'multi_platform_chat'
        ];
    }

    // ── Lifecycle ──

    async initialize() {
        this.log.start('Initializing StreamerBot platform...');
        this._registerEventHandlers();
        this.state.active = true;

        const sbConfig = this.config.integrations?.streamerbot || {};
        if (sbConfig.autoConnect !== false) {
            this.connect();
        }

        this.log.success('StreamerBot platform ready (auto-connect:', sbConfig.autoConnect !== false, ')');
        return { success: true, platform: this.id };
    }

    // ── WebSocket Connection ──

    /**
     * Connect to Streamer.bot WebSocket server.
     * Tries primary host first, falls back to fallbackHost on failure.
     * @param {string} [host] - Override host
     * @param {number} [port] - Override port
     */
    connect(host, port) {
        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
            this.log.warn('Already connected or connecting');
            return { success: false, error: 'Already connected' };
        }

        // Determine which host to use
        let targetHost, targetPort;
        if (host) {
            targetHost = host;
            targetPort = port || this._primaryPort;
        } else if (this._useFallback && this._fallbackHost) {
            targetHost = this._fallbackHost;
            targetPort = this._fallbackPort;
        } else {
            targetHost = this._primaryHost;
            targetPort = this._primaryPort;
        }

        const wsPath = (targetHost === this._primaryHost) ? this._path : '/';
        const url = `${this._protocol}://${targetHost}:${targetPort}${wsPath}`;

        this.log.info(`Connecting to Streamer.bot at ${url} (attempt ${this._connectAttempts + 1})...`);
        this._shouldReconnect = true;

        try {
            this.ws = new WebSocket(url, {
                handshakeTimeout: 8000,
                headers: { 'User-Agent': 'StreamFinity/1.0.0' }
            });
        } catch (err) {
            this.log.error('WebSocket creation failed:', err.message);
            this._handleConnectFailure();
            return { success: false, error: err.message };
        }

        this.ws.on('open', () => {
            this.log.success(`Connected to Streamer.bot at ${url}`);
            this.state.connected = true;
            this.state.currentHost = targetHost;
            this.state.currentPort = targetPort;
            this._connectAttempts = 0;
            this._useFallback = false;
            this.eventBus.platformEmit(this.id, 'connected', { host: targetHost, port: targetPort, url });

            this._onConnected();
        });

        this.ws.on('message', (raw) => {
            try {
                const data = JSON.parse(raw.toString());
                this._handleMessage(data);
            } catch (err) {
                this.log.error('Failed to parse message:', err.message);
            }
        });

        this.ws.on('close', (code) => {
            this.log.warn(`Disconnected from ${url} (code: ${code})`);
            this.state.connected = false;
            this.state.currentHost = null;
            this.state.currentPort = null;
            this.eventBus.platformEmit(this.id, 'disconnected', { code, host: targetHost });
            this._rejectAllPending('Connection closed');
            this._scheduleReconnect();
        });

        this.ws.on('error', (err) => {
            this.log.error(`WebSocket error (${targetHost}):`, err.message);
            // If primary fails, try fallback on next attempt
            if (targetHost === this._primaryHost && this._fallbackHost) {
                this._useFallback = true;
            }
        });

        return { success: true, connecting: true, url };
    }

    _handleConnectFailure() {
        this._connectAttempts++;
        // After 2 failed attempts on primary, switch to fallback
        if (this._connectAttempts >= 2 && this._fallbackHost && !this._useFallback) {
            this.log.warn(`Primary host failed ${this._connectAttempts} times, switching to fallback: ${this._fallbackHost}:${this._fallbackPort}`);
            this._useFallback = true;
            this._connectAttempts = 0;
        }
        this._scheduleReconnect();
    }

    disconnect() {
        this._shouldReconnect = false;
        if (this._reconnectTimer) {
            clearTimeout(this._reconnectTimer);
            this._reconnectTimer = null;
        }
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.state.connected = false;
        this.log.info('Disconnected from Streamer.bot');
        return { success: true };
    }

    _scheduleReconnect() {
        if (!this._shouldReconnect) return;
        if (this._reconnectTimer) return;

        this.log.info(`Reconnecting in ${this._reconnectDelay / 1000}s...`);
        this._reconnectTimer = setTimeout(() => {
            this._reconnectTimer = null;
            if (this._shouldReconnect) this.connect();
        }, this._reconnectDelay);
    }

    async _onConnected() {
        try {
            const [broadcaster, actions, commands] = await Promise.allSettled([
                this.getBroadcaster(),
                this.getActions(),
                this.getCommands()
            ]);

            if (broadcaster.status === 'fulfilled') this.state.broadcaster = broadcaster.value;
            if (actions.status === 'fulfilled') this.state.actions = actions.value.actions || [];
            if (commands.status === 'fulfilled') this.state.commands = commands.value.commands || [];

            // Subscribe to common events
            await this.subscribe({
                General: ['Custom'],
                Twitch: ['ChatMessage', 'Follow', 'Cheer', 'Sub', 'ReSub', 'GiftSub', 'GiftBomb', 'Raid'],
                YouTube: ['Message', 'SuperChat', 'NewSubscriber'],
                Command: ['Triggered']
            });

            this.log.success('Initial data loaded — actions:', this.state.actions.length, 'commands:', this.state.commands.length);
        } catch (err) {
            this.log.error('Post-connect init failed:', err.message);
        }
    }

    // ── Low-level request/response ──

    _send(request, payload = {}) {
        return new Promise((resolve, reject) => {
            if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                return reject(new Error('Not connected to Streamer.bot'));
            }

            const id = `sf:sb:${++this._requestId}:${Date.now()}`;
            const msg = JSON.stringify({ request, id, ...payload });

            const timeout = setTimeout(() => {
                this._pending.delete(id);
                reject(new Error(`Request ${request} timed out`));
            }, this._requestTimeout);

            this._pending.set(id, { resolve, reject, timeout });
            this.ws.send(msg);
        });
    }

    _handleMessage(data) {
        // Response to a pending request
        if (data.id && this._pending.has(data.id)) {
            const { resolve, reject, timeout } = this._pending.get(data.id);
            clearTimeout(timeout);
            this._pending.delete(data.id);

            if (data.status === 'error') {
                reject(new Error(data.error || 'Unknown error'));
            } else {
                resolve(data);
            }
            return;
        }

        // Incoming event
        if (data.event) {
            this._handleEvent(data);
        }
    }

    _handleEvent(data) {
        const { event, data: eventData } = data;
        const source = event?.source || 'Unknown';
        const type = event?.type || 'Unknown';
        const key = `${source}.${type}`;

        this.log.debug(`Event: ${key}`);
        this.eventBus.platformEmit(this.id, 'event', { key, source, type, data: eventData });

        // Broadcast specific events to other platforms
        if (source === 'Twitch' || source === 'YouTube') {
            if (type === 'ChatMessage' || type === 'Message') {
                this.eventBus.broadcast(this.id, 'chat:new', {
                    platform: source.toLowerCase(),
                    text: eventData?.message?.message || eventData?.message || '',
                    user: eventData?.message?.displayName || eventData?.user?.name || 'unknown',
                    raw: eventData
                });
            }
            if (type === 'Cheer' || type === 'SuperChat') {
                this.eventBus.broadcast(this.id, 'gift:received', {
                    platform: source.toLowerCase(),
                    amount: eventData?.bits || eventData?.amount || 0,
                    user: eventData?.user?.name || 'unknown',
                    raw: eventData
                });
            }
            if (type === 'Follow' || type === 'NewSubscriber') {
                this.eventBus.broadcast(this.id, 'follow:new', {
                    platform: source.toLowerCase(),
                    user: eventData?.user?.name || eventData?.userName || 'unknown',
                    raw: eventData
                });
            }
        }

        if (source === 'Command' && type === 'Triggered') {
            this.eventBus.platformEmit(this.id, 'command:triggered', eventData);
        }
    }


    // ── Streamer.bot API Methods ──

    async subscribe(events) {
        const result = await this._send('Subscribe', { events });
        Object.assign(this.state.subscriptions, events);
        return result;
    }

    async unsubscribe(events) {
        const result = await this._send('UnSubscribe', { events });
        for (const cat of Object.keys(events)) {
            if (this.state.subscriptions[cat]) {
                this.state.subscriptions[cat] = this.state.subscriptions[cat].filter(
                    e => !events[cat].includes(e)
                );
            }
        }
        return result;
    }

    async getActions() {
        return this._send('GetActions');
    }

    async doAction(actionIdOrName, args = {}) {
        const action = typeof actionIdOrName === 'string' && actionIdOrName.includes('-')
            ? { id: actionIdOrName }
            : { name: actionIdOrName };

        return this._send('DoAction', { action, args });
    }

    async getBroadcaster() {
        return this._send('GetBroadcaster');
    }

    async getActiveViewers() {
        const result = await this._send('GetActiveViewers');
        this.state.viewers = result.viewers || [];
        return result;
    }

    async getCommands() {
        return this._send('GetCommands');
    }

    async sendMessage(message, platform = 'twitch', options = {}) {
        return this._send('SendMessage', {
            message,
            platform,
            bot: options.bot !== false,
            internal: options.internal || false
        });
    }

    async getInfo() {
        return this._send('GetInfo');
    }

    async getCredits() {
        return this._send('GetCredits');
    }

    async getGlobals() {
        return this._send('GetGlobals');
    }

    async getGlobal(name) {
        return this._send('GetGlobal', { variable: name });
    }

    async executeCodeTrigger(triggerName, args = {}) {
        return this._send('ExecuteCodeTrigger', { triggerName, args });
    }

    // ── Stats & API ──

    getStats() {
        return {
            platform: this.id,
            connected: this.state.connected,
            broadcaster: this.state.broadcaster?.platforms || null,
            connectedPlatforms: this.state.broadcaster?.connected || [],
            actionsCount: this.state.actions.length,
            commandsCount: this.state.commands.length,
            viewersCount: this.state.viewers.length,
            subscriptions: Object.keys(this.state.subscriptions)
        };
    }

    getAPI() {
        return {
            connect: (host, port) => this.connect(host, port),
            disconnect: () => this.disconnect(),
            isConnected: () => this.state.connected,
            getStats: () => this.getStats(),

            // Actions
            getActions: () => this.getActions(),
            doAction: (id, args) => this.doAction(id, args),

            // Events
            subscribe: (events) => this.subscribe(events),
            unsubscribe: (events) => this.unsubscribe(events),

            // Chat
            sendMessage: (msg, platform, opts) => this.sendMessage(msg, platform, opts),

            // Data
            getBroadcaster: () => this.getBroadcaster(),
            getActiveViewers: () => this.getActiveViewers(),
            getCommands: () => this.getCommands(),
            getInfo: () => this.getInfo(),
            getCredits: () => this.getCredits(),
            getGlobals: () => this.getGlobals(),
            getGlobal: (name) => this.getGlobal(name),
            executeCodeTrigger: (name, args) => this.executeCodeTrigger(name, args)
        };
    }

    _registerEventHandlers() {
        // Listen for chat from other platforms → can relay to Streamer.bot
        this.eventBus.platformOn(this.id, 'chat:new', (msg) => {
            this.log.debug('Received cross-platform chat:', msg.user);
        });

        this.eventBus.platformOn(this.id, 'data:sync', (data) => {
            this.log.debug('Received sync data:', data.key);
        });
    }

    async shutdown() {
        this.log.info('Shutting down StreamerBot platform...');
        this.disconnect();
        this.state.active = false;
    }
}

module.exports = StreamerBotPlatform;
