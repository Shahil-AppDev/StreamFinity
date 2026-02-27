/**
 * TikTokLiveService — Wrapper around tiktok-live-connector
 * Manages TikTok LIVE connections and broadcasts events to WebSocket clients
 */

const { WebcastPushConnection } = require('tiktok-live-connector');
const EventEmitter = require('events');

class TikTokLiveService extends EventEmitter {
    constructor({ log, wsClients, db, metrics, rulesEngine }) {
        super();
        this.log = log;
        this.wsClients = wsClients;
        this.db = db;
        this.metrics = metrics;
        this.rulesEngine = rulesEngine || null;
        this.activeProfileId = null; // Set by SPA when connecting
        this.connection = null;
        this.username = null;
        this.roomInfo = null;
        this.state = 'disconnected'; // disconnected | connecting | connected | error
        this.stats = { viewerCount: 0, likeCount: 0, totalGifts: 0, totalDiamonds: 0, followers: 0, shares: 0, chatMessages: 0, connectedAt: null };
        this.recentEvents = [];
        this.maxRecentEvents = 100;
    }

    /**
     * Connect to a TikTok LIVE stream
     */
    async connect(username) {
        if (this.state === 'connected' || this.state === 'connecting') {
            await this.disconnect();
        }

        this.username = username.replace('@', '').trim();
        this.state = 'connecting';
        this.stats = { viewerCount: 0, likeCount: 0, totalGifts: 0, totalDiamonds: 0, followers: 0, shares: 0, chatMessages: 0, connectedAt: null };
        this.recentEvents = [];

        this.log.info(`[TikTok] Connecting to @${this.username}...`);

        this.connection = new WebcastPushConnection(this.username, {
            processInitialData: true,
            enableExtendedGiftInfo: true,
            enableWebsocketUpgrade: true,
            requestPollingIntervalMs: 1000,
        });

        this._bindEvents();

        try {
            const state = await this.connection.connect();
            this.state = 'connected';
            this.roomInfo = state.roomInfo || state;
            this.stats.connectedAt = Date.now();
            this.log.success(`[TikTok] Connected to @${this.username} (roomId: ${state.roomId})`);

            this._broadcast('tiktok', 'connected', {
                username: this.username,
                roomId: state.roomId,
                roomInfo: this.roomInfo,
            });

            // Auto-start action timers
            if (this.rulesEngine && this.activeProfileId) {
                this.rulesEngine.startTimers(this.activeProfileId, true).catch(err => {
                    this.log.error('[TikTok] Failed to start action timers:', err.message);
                });
            }

            return { success: true, roomId: state.roomId, roomInfo: this.roomInfo };
        } catch (err) {
            this.state = 'error';
            this.log.error(`[TikTok] Connection failed:`, err.message);
            this._broadcast('tiktok', 'error', { message: err.message });
            throw err;
        }
    }

    /**
     * Disconnect from TikTok LIVE
     */
    async disconnect() {
        if (this.connection) {
            try { this.connection.disconnect(); } catch (_) {}
            this.connection = null;
        }
        const wasConnected = this.state === 'connected';
        this.state = 'disconnected';
        this.roomInfo = null;

        if (wasConnected) {
            this.log.info(`[TikTok] Disconnected from @${this.username}`);
            this._broadcast('tiktok', 'disconnected', { username: this.username });
            if (this.rulesEngine) this.rulesEngine.stopAllTimers();
        }

        return { success: true };
    }

    /**
     * Get current connection state
     */
    getStatus() {
        return {
            state: this.state,
            username: this.username,
            stats: this.stats,
            roomInfo: this.roomInfo,
            connectedAt: this.stats.connectedAt,
            uptime: this.stats.connectedAt ? Math.floor((Date.now() - this.stats.connectedAt) / 1000) : 0,
        };
    }

    /**
     * Get room info (can be called even when disconnected)
     */
    async getRoomInfo(username) {
        const target = username || this.username;
        if (!target) throw new Error('No username specified');
        const tmp = new WebcastPushConnection(target.replace('@', ''), { fetchRoomInfoOnConnect: true });
        return tmp.getRoomInfo();
    }

    /**
     * Get available gifts list
     */
    async getAvailableGifts() {
        if (!this.connection) throw new Error('Not connected');
        return this.connection.getAvailableGifts();
    }

    /**
     * Get recent events
     */
    getRecentEvents(limit = 50) {
        return this.recentEvents.slice(-limit);
    }

    // ── Private: Bind all TikTok events ──

    _bindEvents() {
        const c = this.connection;

        c.on('chat', (data) => {
            this.stats.chatMessages++;
            const ev = {
                type: 'chat',
                userId: data.userId,
                uniqueId: data.uniqueId,
                nickname: data.nickname,
                comment: data.comment,
                profilePictureUrl: data.profilePictureUrl,
                followRole: data.followRole,
                isModerator: data.isModerator,
                isSubscriber: data.isSubscriber,
                userBadges: data.userBadges,
                timestamp: Date.now(),
            };
            this._pushEvent(ev);
            this._broadcast('tiktok', 'chat', ev);
            this._processRules(ev);
        });

        c.on('gift', (data) => {
            if (data.giftType === 1 && !data.repeatEnd) {
                // Streak in progress — broadcast temporary update + rules
                const streakEv = {
                    type: 'giftStreak',
                    userId: data.userId,
                    uniqueId: data.uniqueId,
                    nickname: data.nickname,
                    giftId: data.giftId,
                    giftName: data.giftName,
                    giftPictureUrl: data.giftPictureUrl,
                    diamondCount: data.diamondCount,
                    repeatCount: data.repeatCount,
                    profilePictureUrl: data.profilePictureUrl,
                    followRole: data.followRole || 0,
                    isModerator: !!data.isModerator,
                    isSubscriber: !!data.isSubscriber,
                    teamMemberLevel: data.teamMemberLevel || 0,
                    timestamp: Date.now(),
                };
                this._broadcast('tiktok', 'giftStreak', streakEv);
                this._processRules(streakEv);
                return;
            }
            // Final gift event (streak ended or non-streakable)
            const diamonds = (data.diamondCount || 0) * (data.repeatCount || 1);
            this.stats.totalGifts++;
            this.stats.totalDiamonds += diamonds;
            const ev = {
                type: 'gift',
                userId: data.userId,
                uniqueId: data.uniqueId,
                nickname: data.nickname,
                giftId: data.giftId,
                giftName: data.giftName || 'Unknown Gift',
                giftPictureUrl: data.giftPictureUrl,
                diamondCount: data.diamondCount,
                repeatCount: data.repeatCount,
                repeatEnd: data.repeatEnd,
                giftType: data.giftType,
                profilePictureUrl: data.profilePictureUrl,
                totalDiamonds: diamonds,
                extendedGiftInfo: data.extendedGiftInfo,
                followRole: data.followRole || 0,
                isModerator: !!data.isModerator,
                isSubscriber: !!data.isSubscriber,
                teamMemberLevel: data.teamMemberLevel || 0,
                userBadges: data.userBadges,
                timestamp: Date.now(),
            };
            this._pushEvent(ev);
            this._broadcast('tiktok', 'gift', ev);
            this._processRules(ev);

            // Log to DB if available
            if (this.db?.logEvent) {
                this.db.logEvent('tiktok_gift', { username: this.username, ...ev }).catch(() => {});
            }
        });

        c.on('like', (data) => {
            this.stats.likeCount = data.totalLikeCount || this.stats.likeCount + (data.likeCount || 1);
            const ev = {
                type: 'like',
                userId: data.userId,
                uniqueId: data.uniqueId,
                nickname: data.nickname,
                likeCount: data.likeCount,
                totalLikeCount: data.totalLikeCount,
                profilePictureUrl: data.profilePictureUrl,
                followRole: data.followRole || 0,
                isModerator: !!data.isModerator,
                isSubscriber: !!data.isSubscriber,
                teamMemberLevel: data.teamMemberLevel || 0,
                timestamp: Date.now(),
            };
            this._broadcast('tiktok', 'like', ev);
            this._processRules(ev);
        });

        c.on('member', (data) => {
            const ev = {
                type: 'member',
                userId: data.userId,
                uniqueId: data.uniqueId,
                nickname: data.nickname,
                profilePictureUrl: data.profilePictureUrl,
                followRole: data.followRole || 0,
                isModerator: !!data.isModerator,
                isSubscriber: !!data.isSubscriber,
                teamMemberLevel: data.teamMemberLevel || 0,
                userBadges: data.userBadges,
                timestamp: Date.now(),
            };
            this._pushEvent(ev);
            this._broadcast('tiktok', 'member', ev);
            this._processRules(ev);
        });

        c.on('roomUser', (data) => {
            const prevCount = this.stats.viewerCount;
            this.stats.viewerCount = data.viewerCount || 0;
            this._broadcast('tiktok', 'roomUser', {
                viewerCount: data.viewerCount,
                topViewers: data.topViewers,
                timestamp: Date.now(),
            });
            // Viewer milestone detection (50, 100, 200, 500, 1000, 2000, 5000, 10000)
            const milestones = [50, 100, 200, 500, 1000, 2000, 5000, 10000];
            for (const m of milestones) {
                if (prevCount < m && this.stats.viewerCount >= m) {
                    const mEv = { type: 'viewer_milestone', milestone: m, viewerCount: this.stats.viewerCount, timestamp: Date.now() };
                    this._broadcast('tiktok', 'viewer_milestone', mEv);
                    this._processRules(mEv);
                }
            }
            // Top gifter change detection
            if (data.topViewers && data.topViewers.length > 0) {
                const topUser = data.topViewers[0];
                if (this._lastTopGifter && this._lastTopGifter !== topUser.uniqueId) {
                    const tgEv = { type: 'topGifterChange', userId: topUser.uniqueId || '', uniqueId: topUser.uniqueId || '', nickname: topUser.nickname || '', profilePictureUrl: topUser.profilePictureUrl || '', timestamp: Date.now() };
                    this._broadcast('tiktok', 'topGifterChange', tgEv);
                    this._processRules(tgEv);
                }
                this._lastTopGifter = topUser.uniqueId;
            }
        });

        c.on('social', (data) => {
            const isFollow = data.displayType?.includes('follow');
            const isShare = data.displayType?.includes('share');
            if (isFollow) this.stats.followers++;
            if (isShare) this.stats.shares++;
            const ev = {
                type: isFollow ? 'follow' : isShare ? 'share' : 'social',
                userId: data.userId,
                uniqueId: data.uniqueId,
                nickname: data.nickname,
                profilePictureUrl: data.profilePictureUrl,
                displayType: data.displayType,
                label: data.label,
                followRole: data.followRole || 0,
                isModerator: !!data.isModerator,
                isSubscriber: !!data.isSubscriber,
                teamMemberLevel: data.teamMemberLevel || 0,
                timestamp: Date.now(),
            };
            this._pushEvent(ev);
            this._broadcast('tiktok', ev.type, ev);
            this._processRules(ev);
        });

        c.on('follow', (data) => {
            this.stats.followers++;
            const ev = {
                type: 'follow',
                userId: data.userId,
                uniqueId: data.uniqueId,
                nickname: data.nickname,
                profilePictureUrl: data.profilePictureUrl,
                followRole: data.followRole || 0,
                isModerator: !!data.isModerator,
                isSubscriber: !!data.isSubscriber,
                teamMemberLevel: data.teamMemberLevel || 0,
                timestamp: Date.now(),
            };
            this._pushEvent(ev);
            this._broadcast('tiktok', 'follow', ev);
            this._processRules(ev);
        });

        c.on('share', (data) => {
            this.stats.shares++;
            const ev = {
                type: 'share',
                userId: data.userId,
                uniqueId: data.uniqueId,
                nickname: data.nickname,
                profilePictureUrl: data.profilePictureUrl,
                followRole: data.followRole || 0,
                isModerator: !!data.isModerator,
                isSubscriber: !!data.isSubscriber,
                teamMemberLevel: data.teamMemberLevel || 0,
                timestamp: Date.now(),
            };
            this._pushEvent(ev);
            this._broadcast('tiktok', 'share', ev);
            this._processRules(ev);
        });

        c.on('subscribe', (data) => {
            const ev = {
                type: 'subscribe',
                userId: data.userId,
                uniqueId: data.uniqueId,
                nickname: data.nickname,
                profilePictureUrl: data.profilePictureUrl,
                subMonth: data.subMonth,
                followRole: data.followRole || 0,
                isModerator: !!data.isModerator,
                isSubscriber: true,
                teamMemberLevel: data.teamMemberLevel || 0,
                timestamp: Date.now(),
            };
            this._pushEvent(ev);
            this._broadcast('tiktok', 'subscribe', ev);
            this._processRules(ev);
        });

        c.on('emote', (data) => {
            const ev = {
                type: 'emote',
                userId: data.userId,
                uniqueId: data.uniqueId,
                nickname: data.nickname || data.uniqueId,
                emoteId: data.emoteId,
                emoteImageUrl: data.emoteImageUrl,
                isSubscriberEmote: !!data.isSubscriber,
                followRole: data.followRole || 0,
                isModerator: !!data.isModerator,
                isSubscriber: !!data.isSubscriber,
                teamMemberLevel: data.teamMemberLevel || 0,
                timestamp: Date.now(),
            };
            this._broadcast('tiktok', 'emote', ev);
            this._processRules(ev);
        });

        c.on('envelope', (data) => {
            this._broadcast('tiktok', 'envelope', { ...data, timestamp: Date.now() });
        });

        c.on('questionNew', (data) => {
            this._broadcast('tiktok', 'questionNew', {
                userId: data.userId,
                uniqueId: data.uniqueId,
                nickname: data.nickname,
                questionText: data.questionText,
                timestamp: Date.now(),
            });
        });

        c.on('streamEnd', (actionId) => {
            this.state = 'disconnected';
            this.log.info(`[TikTok] Stream ended (action: ${actionId})`);
            this._broadcast('tiktok', 'streamEnd', { actionId, username: this.username });
        });

        c.on('disconnected', () => {
            if (this.state === 'connected') {
                this.state = 'disconnected';
                this.log.warn(`[TikTok] Disconnected from @${this.username}`);
                this._broadcast('tiktok', 'disconnected', { username: this.username });
            }
        });

        c.on('error', (err) => {
            this.log.error(`[TikTok] Error:`, err.message);
            this._broadcast('tiktok', 'error', { message: err.message });
        });
    }

    /**
     * Send a chatbot message (broadcast to all overlays/widgets)
     * TikTok LIVE doesn't have a public API for sending chat messages,
     * so bot messages are broadcast to connected overlays and displayed on-stream.
     */
    sendBotMessage(message, options = {}) {
        const ev = {
            type: 'botMessage',
            message: (message || '').slice(0, 500),
            botName: options.botName || 'StreamFinity Bot',
            replyTo: options.replyTo || null,
            trigger: options.trigger || 'manual',
            style: options.style || 'default',
            timestamp: Date.now(),
        };
        this._pushEvent(ev);
        this._broadcast('tiktok', 'botMessage', ev);
        return ev;
    }

    /**
     * Auto-response engine — check incoming chat against rules
     */
    checkAutoResponse(chatEvent, rules) {
        if (!rules || !rules.length) return null;
        const msg = (chatEvent.comment || '').toLowerCase().trim();
        for (const rule of rules) {
            if (!rule.enabled) continue;
            let match = false;
            switch (rule.matchType || 'contains') {
                case 'exact': match = msg === (rule.pattern || '').toLowerCase(); break;
                case 'contains': match = msg.includes((rule.pattern || '').toLowerCase()); break;
                case 'startsWith': match = msg.startsWith((rule.pattern || '').toLowerCase()); break;
                case 'regex': try { match = new RegExp(rule.pattern, 'i').test(msg); } catch(_) {} break;
            }
            if (match) {
                // Variable substitution
                let response = rule.response || '';
                response = response.replace(/{user}/g, chatEvent.nickname || chatEvent.uniqueId || 'viewer');
                response = response.replace(/{message}/g, chatEvent.comment || '');
                response = response.replace(/{viewers}/g, String(this.stats.viewerCount || 0));
                response = response.replace(/{likes}/g, String(this.stats.likeCount || 0));
                response = response.replace(/{gifts}/g, String(this.stats.totalGifts || 0));

                // Cooldown check
                const now = Date.now();
                if (rule._lastUsed && now - rule._lastUsed < (rule.cooldown || 5) * 1000) continue;
                rule._lastUsed = now;

                return this.sendBotMessage(response, {
                    replyTo: chatEvent.uniqueId,
                    trigger: 'auto:' + rule.pattern,
                });
            }
        }
        return null;
    }

    /**
     * Set the active profile ID (called from connect API)
     */
    setActiveProfile(profileId) {
        this.activeProfileId = profileId;
        if (this.rulesEngine) this.rulesEngine.resetFirstActivity(profileId);
    }

    // ── Private: Process event through RulesEngine ──

    _processRules(eventData) {
        if (!this.rulesEngine || !this.activeProfileId) return;
        const enriched = { ...eventData, _profileId: this.activeProfileId };
        this.rulesEngine.processEvent(this.activeProfileId, enriched).catch(err => {
            this.log.error('[TikTok] RulesEngine error:', err.message);
        });
        this.rulesEngine.processGoals(this.activeProfileId, enriched).catch(err => {
            this.log.error('[TikTok] RulesEngine goals error:', err.message);
        });
    }

    // ── Private: Broadcast to all WS clients ──

    _broadcast(source, type, data) {
        const msg = JSON.stringify({ event: { source, type }, data });
        for (const client of this.wsClients) {
            if (client.readyState === 1) { // WebSocket.OPEN
                try { client.send(msg); } catch (_) {}
            }
        }
        if (this.metrics) this.metrics.trackWSMessage();
    }

    // ── Private: Push to recent events buffer ──

    _pushEvent(ev) {
        this.recentEvents.push(ev);
        if (this.recentEvents.length > this.maxRecentEvents) {
            this.recentEvents.shift();
        }
    }
}

module.exports = TikTokLiveService;
