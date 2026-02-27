/**
 * RulesEngine — Server-side action/event processing pipeline
 * 
 * Architecture:
 * - Actions: reusable effect bundles (name, multi-effects, duration, screen, cooldowns)
 * - Events: triggers that link to one or more Actions (trigger type, user filter, actions_all, actions_random)
 * - Pipeline: TikTok event → match Events → check filters → enqueue Actions → broadcast to overlay screens
 */

const Logger = require('./Logger');

class RulesEngine {
    constructor({ db, redis, wsClients, log }) {
        this.db = db;
        this.redis = redis;
        this.wsClients = wsClients;
        this.log = log || new Logger('RulesEngine');
        this.firstActivityTracker = new Map(); // profileId → Set<userId>
        this._cooldowns = new Map(); // `global:${actionId}` → expiry timestamp
        this._userCooldowns = new Map(); // `user:${actionId}:${userId}` → expiry timestamp
    }

    // ═══════════════════════════════════════════
    // DATABASE SCHEMA
    // ═══════════════════════════════════════════

    async ensureTables() {
        if (!this.db?.pool) return;
        try {
            await this.db.pool.query(`
                CREATE TABLE IF NOT EXISTS sf_actions (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    profile_id VARCHAR(64) NOT NULL,
                    name VARCHAR(255) NOT NULL DEFAULT 'Untitled Action',
                    description TEXT DEFAULT '',
                    enabled BOOLEAN DEFAULT true,

                    -- Multi-effect flags (checkboxes)
                    effect_animation BOOLEAN DEFAULT false,
                    effect_image BOOLEAN DEFAULT false,
                    effect_audio BOOLEAN DEFAULT false,
                    effect_video BOOLEAN DEFAULT false,
                    effect_alert BOOLEAN DEFAULT false,
                    effect_tts BOOLEAN DEFAULT false,
                    effect_chat BOOLEAN DEFAULT false,
                    effect_obs_scene BOOLEAN DEFAULT false,
                    effect_obs_source BOOLEAN DEFAULT false,
                    effect_webhook BOOLEAN DEFAULT false,
                    effect_minecraft BOOLEAN DEFAULT false,
                    effect_keystrokes BOOLEAN DEFAULT false,
                    effect_points_add BOOLEAN DEFAULT false,
                    effect_points_remove BOOLEAN DEFAULT false,
                    effect_streamerbot BOOLEAN DEFAULT false,
                    effect_voicemod BOOLEAN DEFAULT false,
                    effect_timer_control BOOLEAN DEFAULT false,
                    effect_goal_control BOOLEAN DEFAULT false,

                    -- Effect values (JSON for flexibility)
                    effect_config JSONB DEFAULT '{}',

                    -- Display settings
                    duration_seconds NUMERIC(8,1) DEFAULT 5,
                    overlay_screen INT DEFAULT 1 CHECK (overlay_screen BETWEEN 1 AND 8),
                    media_volume INT DEFAULT 80 CHECK (media_volume BETWEEN 0 AND 100),
                    fade_in_out BOOLEAN DEFAULT false,
                    repeat_gift_combos BOOLEAN DEFAULT false,
                    skip_on_next BOOLEAN DEFAULT false,

                    -- Cooldowns
                    global_cooldown INT DEFAULT 0,
                    user_cooldown INT DEFAULT 0,

                    -- Points
                    points_add INT DEFAULT 0,
                    points_remove INT DEFAULT 0,

                    -- Timestamps
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );
                CREATE INDEX IF NOT EXISTS idx_sf_actions_profile ON sf_actions(profile_id);
                CREATE INDEX IF NOT EXISTS idx_sf_actions_enabled ON sf_actions(profile_id, enabled);

                CREATE TABLE IF NOT EXISTS sf_events (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    profile_id VARCHAR(64) NOT NULL,
                    name VARCHAR(255) DEFAULT '',
                    enabled BOOLEAN DEFAULT true,

                    -- Trigger
                    trigger_type VARCHAR(64) NOT NULL,
                    trigger_config JSONB DEFAULT '{}',

                    -- User filter
                    user_filter VARCHAR(32) DEFAULT 'everyone',
                    specific_user VARCHAR(128) DEFAULT NULL,
                    min_team_level INT DEFAULT 0,

                    -- Linked actions
                    actions_all UUID[] DEFAULT '{}',
                    actions_random UUID[] DEFAULT '{}',

                    -- Timestamps
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );
                CREATE INDEX IF NOT EXISTS idx_sf_events_profile ON sf_events(profile_id);
                CREATE INDEX IF NOT EXISTS idx_sf_events_trigger ON sf_events(profile_id, trigger_type);
                CREATE INDEX IF NOT EXISTS idx_sf_events_enabled ON sf_events(profile_id, enabled);

                CREATE TABLE IF NOT EXISTS sf_goals (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    profile_id VARCHAR(64) NOT NULL,
                    name VARCHAR(255) NOT NULL DEFAULT 'Goal',
                    description TEXT DEFAULT '',
                    enabled BOOLEAN DEFAULT true,

                    -- Metric tracking
                    metric VARCHAR(32) NOT NULL DEFAULT 'custom',
                    target INT NOT NULL DEFAULT 100,
                    current INT DEFAULT 0,
                    auto_track BOOLEAN DEFAULT true,

                    -- Display
                    label VARCHAR(255) DEFAULT '',
                    style VARCHAR(32) DEFAULT 'default',
                    color VARCHAR(32) DEFAULT '#8b5cf6',
                    overlay_screen INT DEFAULT 1 CHECK (overlay_screen BETWEEN 1 AND 8),

                    -- Action on reaching goal
                    action_on_reach UUID DEFAULT NULL,
                    auto_reset BOOLEAN DEFAULT false,
                    notify_at_pct INT[] DEFAULT '{50,75,100}',

                    -- Timestamps
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );
                CREATE INDEX IF NOT EXISTS idx_sf_goals_profile ON sf_goals(profile_id);

                CREATE TABLE IF NOT EXISTS sf_action_timers (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    profile_id VARCHAR(64) NOT NULL,
                    name VARCHAR(255) NOT NULL DEFAULT 'Timer',
                    enabled BOOLEAN DEFAULT true,
                    interval_seconds INT NOT NULL DEFAULT 300,
                    action_id UUID NOT NULL,
                    jitter_seconds INT DEFAULT 0,
                    only_when_live BOOLEAN DEFAULT true,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );
                CREATE INDEX IF NOT EXISTS idx_sf_action_timers_profile ON sf_action_timers(profile_id);
            `);
            this.log.success('[RulesEngine] Tables sf_actions + sf_events + sf_goals + sf_action_timers created');
        } catch (err) {
            this.log.warn('[RulesEngine] Table creation warning:', err.message);
        }
    }

    // ═══════════════════════════════════════════
    // ACTIONS CRUD
    // ═══════════════════════════════════════════

    async getActions(profileId) {
        if (!this.db?.pool) return [];
        const res = await this.db.pool.query(
            'SELECT * FROM sf_actions WHERE profile_id = $1 ORDER BY created_at DESC',
            [profileId]
        );
        return res.rows;
    }

    async getAction(actionId) {
        if (!this.db?.pool) return null;
        const res = await this.db.pool.query('SELECT * FROM sf_actions WHERE id = $1', [actionId]);
        return res.rows[0] || null;
    }

    async createAction(profileId, data) {
        if (!this.db?.pool) return null;
        const fields = this._actionFields(data);
        const res = await this.db.pool.query(`
            INSERT INTO sf_actions (profile_id, name, description, enabled,
                effect_animation, effect_image, effect_audio, effect_video,
                effect_alert, effect_tts, effect_chat, effect_obs_scene,
                effect_obs_source, effect_webhook, effect_minecraft, effect_keystrokes,
                effect_points_add, effect_points_remove, effect_streamerbot,
                effect_voicemod, effect_timer_control, effect_goal_control,
                effect_config, duration_seconds, overlay_screen, media_volume,
                fade_in_out, repeat_gift_combos, skip_on_next,
                global_cooldown, user_cooldown, points_add, points_remove)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33)
            RETURNING *
        `, [
            profileId, fields.name, fields.description, fields.enabled,
            fields.effect_animation, fields.effect_image, fields.effect_audio, fields.effect_video,
            fields.effect_alert, fields.effect_tts, fields.effect_chat, fields.effect_obs_scene,
            fields.effect_obs_source, fields.effect_webhook, fields.effect_minecraft, fields.effect_keystrokes,
            fields.effect_points_add, fields.effect_points_remove, fields.effect_streamerbot,
            fields.effect_voicemod, fields.effect_timer_control, fields.effect_goal_control,
            JSON.stringify(fields.effect_config), fields.duration_seconds, fields.overlay_screen, fields.media_volume,
            fields.fade_in_out, fields.repeat_gift_combos, fields.skip_on_next,
            fields.global_cooldown, fields.user_cooldown, fields.points_add, fields.points_remove
        ]);
        return res.rows[0];
    }

    async updateAction(actionId, data) {
        if (!this.db?.pool) return null;
        const fields = this._actionFields(data);
        const res = await this.db.pool.query(`
            UPDATE sf_actions SET
                name=$1, description=$2, enabled=$3,
                effect_animation=$4, effect_image=$5, effect_audio=$6, effect_video=$7,
                effect_alert=$8, effect_tts=$9, effect_chat=$10, effect_obs_scene=$11,
                effect_obs_source=$12, effect_webhook=$13, effect_minecraft=$14, effect_keystrokes=$15,
                effect_points_add=$16, effect_points_remove=$17, effect_streamerbot=$18,
                effect_voicemod=$19, effect_timer_control=$20, effect_goal_control=$21,
                effect_config=$22, duration_seconds=$23, overlay_screen=$24, media_volume=$25,
                fade_in_out=$26, repeat_gift_combos=$27, skip_on_next=$28,
                global_cooldown=$29, user_cooldown=$30, points_add=$31, points_remove=$32,
                updated_at=NOW()
            WHERE id=$33
            RETURNING *
        `, [
            fields.name, fields.description, fields.enabled,
            fields.effect_animation, fields.effect_image, fields.effect_audio, fields.effect_video,
            fields.effect_alert, fields.effect_tts, fields.effect_chat, fields.effect_obs_scene,
            fields.effect_obs_source, fields.effect_webhook, fields.effect_minecraft, fields.effect_keystrokes,
            fields.effect_points_add, fields.effect_points_remove, fields.effect_streamerbot,
            fields.effect_voicemod, fields.effect_timer_control, fields.effect_goal_control,
            JSON.stringify(fields.effect_config), fields.duration_seconds, fields.overlay_screen, fields.media_volume,
            fields.fade_in_out, fields.repeat_gift_combos, fields.skip_on_next,
            fields.global_cooldown, fields.user_cooldown, fields.points_add, fields.points_remove,
            actionId
        ]);
        return res.rows[0] || null;
    }

    async deleteAction(actionId) {
        if (!this.db?.pool) return false;
        // Also remove from any events that reference this action
        await this.db.pool.query(
            'UPDATE sf_events SET actions_all = array_remove(actions_all, $1), actions_random = array_remove(actions_random, $1)',
            [actionId]
        );
        const res = await this.db.pool.query('DELETE FROM sf_actions WHERE id = $1', [actionId]);
        return res.rowCount > 0;
    }

    // ═══════════════════════════════════════════
    // EVENTS CRUD
    // ═══════════════════════════════════════════

    async getEvents(profileId) {
        if (!this.db?.pool) return [];
        const res = await this.db.pool.query(
            'SELECT * FROM sf_events WHERE profile_id = $1 ORDER BY created_at DESC',
            [profileId]
        );
        return res.rows;
    }

    async getEvent(eventId) {
        if (!this.db?.pool) return null;
        const res = await this.db.pool.query('SELECT * FROM sf_events WHERE id = $1', [eventId]);
        return res.rows[0] || null;
    }

    async createEvent(profileId, data) {
        if (!this.db?.pool) return null;
        const f = this._eventFields(data);
        const res = await this.db.pool.query(`
            INSERT INTO sf_events (profile_id, name, enabled, trigger_type, trigger_config,
                user_filter, specific_user, min_team_level, actions_all, actions_random)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
            RETURNING *
        `, [
            profileId, f.name, f.enabled, f.trigger_type, JSON.stringify(f.trigger_config),
            f.user_filter, f.specific_user, f.min_team_level, f.actions_all, f.actions_random
        ]);
        return res.rows[0];
    }

    async updateEvent(eventId, data) {
        if (!this.db?.pool) return null;
        const f = this._eventFields(data);
        const res = await this.db.pool.query(`
            UPDATE sf_events SET
                name=$1, enabled=$2, trigger_type=$3, trigger_config=$4,
                user_filter=$5, specific_user=$6, min_team_level=$7,
                actions_all=$8, actions_random=$9, updated_at=NOW()
            WHERE id=$10
            RETURNING *
        `, [
            f.name, f.enabled, f.trigger_type, JSON.stringify(f.trigger_config),
            f.user_filter, f.specific_user, f.min_team_level,
            f.actions_all, f.actions_random, eventId
        ]);
        return res.rows[0] || null;
    }

    async deleteEvent(eventId) {
        if (!this.db?.pool) return false;
        const res = await this.db.pool.query('DELETE FROM sf_events WHERE id = $1', [eventId]);
        return res.rowCount > 0;
    }

    // ═══════════════════════════════════════════
    // GOALS CRUD
    // ═══════════════════════════════════════════

    async getGoals(profileId) {
        if (!this.db?.pool) return [];
        const res = await this.db.pool.query(
            'SELECT * FROM sf_goals WHERE profile_id = $1 ORDER BY created_at DESC',
            [profileId]
        );
        return res.rows;
    }

    async getGoal(goalId) {
        if (!this.db?.pool) return null;
        const res = await this.db.pool.query('SELECT * FROM sf_goals WHERE id = $1', [goalId]);
        return res.rows[0] || null;
    }

    async createGoal(profileId, data) {
        if (!this.db?.pool) return null;
        const f = this._goalFields(data);
        const res = await this.db.pool.query(`
            INSERT INTO sf_goals (profile_id, name, description, enabled, metric, target, current,
                auto_track, label, style, color, overlay_screen, action_on_reach, auto_reset, notify_at_pct)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
            RETURNING *
        `, [
            profileId, f.name, f.description, f.enabled, f.metric, f.target, f.current,
            f.auto_track, f.label, f.style, f.color, f.overlay_screen,
            f.action_on_reach, f.auto_reset, f.notify_at_pct
        ]);
        return res.rows[0];
    }

    async updateGoal(goalId, data) {
        if (!this.db?.pool) return null;
        const f = this._goalFields(data);
        const res = await this.db.pool.query(`
            UPDATE sf_goals SET
                name=$1, description=$2, enabled=$3, metric=$4, target=$5, current=$6,
                auto_track=$7, label=$8, style=$9, color=$10, overlay_screen=$11,
                action_on_reach=$12, auto_reset=$13, notify_at_pct=$14, updated_at=NOW()
            WHERE id=$15
            RETURNING *
        `, [
            f.name, f.description, f.enabled, f.metric, f.target, f.current,
            f.auto_track, f.label, f.style, f.color, f.overlay_screen,
            f.action_on_reach, f.auto_reset, f.notify_at_pct, goalId
        ]);
        return res.rows[0] || null;
    }

    async deleteGoal(goalId) {
        if (!this.db?.pool) return false;
        const res = await this.db.pool.query('DELETE FROM sf_goals WHERE id = $1', [goalId]);
        return res.rowCount > 0;
    }

    async updateGoalProgress(goalId, increment) {
        if (!this.db?.pool) return null;
        const res = await this.db.pool.query(
            'UPDATE sf_goals SET current = current + $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [increment, goalId]
        );
        const goal = res.rows[0];
        if (!goal) return null;

        // Broadcast goal update to widgets
        this._broadcastGoalUpdate(goal);

        // Check if goal reached
        if (goal.current >= goal.target) {
            await this._onGoalReached(goal);
        }
        return goal;
    }

    async resetGoal(goalId) {
        if (!this.db?.pool) return null;
        const res = await this.db.pool.query(
            'UPDATE sf_goals SET current = 0, updated_at = NOW() WHERE id = $1 RETURNING *',
            [goalId]
        );
        const goal = res.rows[0];
        if (goal) this._broadcastGoalUpdate(goal);
        return goal;
    }

    /**
     * Process auto-tracked goals for a TikTok event
     */
    async processGoals(profileId, rawEvent) {
        if (!this.db?.pool) return;
        try {
            const goals = await this.db.pool.query(
                'SELECT * FROM sf_goals WHERE profile_id = $1 AND enabled = true AND auto_track = true',
                [profileId]
            );
            for (const goal of goals.rows) {
                const inc = this._goalIncrement(goal, rawEvent);
                if (inc > 0) {
                    await this.updateGoalProgress(goal.id, inc);
                }
            }
        } catch (err) {
            this.log.error('[RulesEngine] processGoals error:', err.message);
        }
    }

    _goalIncrement(goal, rawEvent) {
        const type = rawEvent.type;
        switch (goal.metric) {
            case 'likes': return type === 'like' ? (rawEvent.likeCount || 1) : 0;
            case 'shares': return type === 'share' ? 1 : 0;
            case 'follows': return type === 'follow' ? 1 : 0;
            case 'coins': return type === 'gift' ? (rawEvent.totalDiamonds || rawEvent.diamondCount || 0) : 0;
            case 'subs': return type === 'subscribe' ? 1 : 0;
            case 'gifts': return type === 'gift' ? (rawEvent.repeatCount || 1) : 0;
            case 'chat': return type === 'chat' ? 1 : 0;
            case 'joins': return type === 'member' ? 1 : 0;
            default: return 0; // custom goals are manually incremented
        }
    }

    _broadcastGoalUpdate(goal) {
        const msg = JSON.stringify({
            event: { source: 'streamfinity', type: 'goalUpdate' },
            data: {
                goalId: goal.id,
                metric: goal.metric,
                current: goal.current,
                target: goal.target,
                name: goal.name,
                label: goal.label,
                style: goal.style,
                color: goal.color,
                screenId: goal.overlay_screen,
                reached: goal.current >= goal.target,
            }
        });
        for (const client of this.wsClients) {
            if (client.readyState === 1) {
                try { client.send(msg); } catch (_) {}
            }
        }
    }

    async _onGoalReached(goal) {
        this.log.info(`[RulesEngine] Goal "${goal.name}" reached! (${goal.current}/${goal.target})`);

        // Execute action-on-reach if configured
        if (goal.action_on_reach) {
            const fakeEvent = { type: 'goal_reached', goalId: goal.id, goalName: goal.name, userId: 'system', uniqueId: 'system', nickname: 'Goal System', timestamp: Date.now() };
            await this._enqueueAction(goal.action_on_reach, goal.profile_id, fakeEvent);
        }

        // Auto-reset if configured
        if (goal.auto_reset) {
            await this.db.pool.query('UPDATE sf_goals SET current = 0, updated_at = NOW() WHERE id = $1', [goal.id]);
        }
    }

    // ═══════════════════════════════════════════
    // ACTION TIMERS CRUD + RUNNER
    // ═══════════════════════════════════════════

    async getActionTimers(profileId) {
        if (!this.db?.pool) return [];
        const res = await this.db.pool.query(
            'SELECT * FROM sf_action_timers WHERE profile_id = $1 ORDER BY created_at DESC',
            [profileId]
        );
        return res.rows;
    }

    async getActionTimer(timerId) {
        if (!this.db?.pool) return null;
        const res = await this.db.pool.query('SELECT * FROM sf_action_timers WHERE id = $1', [timerId]);
        return res.rows[0] || null;
    }

    async createActionTimer(profileId, data) {
        if (!this.db?.pool) return null;
        const f = this._timerFields(data);
        const res = await this.db.pool.query(`
            INSERT INTO sf_action_timers (profile_id, name, enabled, interval_seconds, action_id, jitter_seconds, only_when_live)
            VALUES ($1,$2,$3,$4,$5,$6,$7)
            RETURNING *
        `, [profileId, f.name, f.enabled, f.interval_seconds, f.action_id, f.jitter_seconds, f.only_when_live]);
        return res.rows[0];
    }

    async updateActionTimer(timerId, data) {
        if (!this.db?.pool) return null;
        const f = this._timerFields(data);
        const res = await this.db.pool.query(`
            UPDATE sf_action_timers SET
                name=$1, enabled=$2, interval_seconds=$3, action_id=$4,
                jitter_seconds=$5, only_when_live=$6, updated_at=NOW()
            WHERE id=$7
            RETURNING *
        `, [f.name, f.enabled, f.interval_seconds, f.action_id, f.jitter_seconds, f.only_when_live, timerId]);
        return res.rows[0] || null;
    }

    async deleteActionTimer(timerId) {
        if (!this.db?.pool) return false;
        this._stopTimer(timerId);
        const res = await this.db.pool.query('DELETE FROM sf_action_timers WHERE id = $1', [timerId]);
        return res.rowCount > 0;
    }

    /**
     * Start all enabled timers for a profile (called when TikTok connects)
     */
    async startTimers(profileId, isLive) {
        if (!this._activeTimers) this._activeTimers = new Map();
        this.stopAllTimers(); // clear previous
        if (!this.db?.pool) return;
        try {
            const timers = await this.db.pool.query(
                'SELECT * FROM sf_action_timers WHERE profile_id = $1 AND enabled = true',
                [profileId]
            );
            for (const timer of timers.rows) {
                if (timer.only_when_live && !isLive) continue;
                this._startTimer(timer, profileId);
            }
            this.log.info(`[RulesEngine] Started ${timers.rows.length} action timer(s) for profile ${profileId}`);
        } catch (err) {
            this.log.error('[RulesEngine] startTimers error:', err.message);
        }
    }

    stopAllTimers() {
        if (!this._activeTimers) return;
        for (const [, handle] of this._activeTimers) {
            clearInterval(handle);
        }
        this._activeTimers.clear();
    }

    _startTimer(timer, profileId) {
        if (!this._activeTimers) this._activeTimers = new Map();
        this._stopTimer(timer.id);
        const jitter = timer.jitter_seconds || 0;
        const baseMs = (timer.interval_seconds || 300) * 1000;
        const tick = async () => {
            const fakeEvent = { type: 'timer', timerId: timer.id, timerName: timer.name, userId: 'system', uniqueId: 'system', nickname: 'Action Timer', timestamp: Date.now() };
            await this._enqueueAction(timer.action_id, profileId, fakeEvent);
        };
        const handle = setInterval(() => {
            const delay = jitter > 0 ? Math.floor(Math.random() * jitter * 1000) : 0;
            if (delay > 0) setTimeout(tick, delay); else tick();
        }, baseMs);
        this._activeTimers.set(timer.id, handle);
    }

    _stopTimer(timerId) {
        if (!this._activeTimers) return;
        const handle = this._activeTimers.get(timerId);
        if (handle) { clearInterval(handle); this._activeTimers.delete(timerId); }
    }

    // ═══════════════════════════════════════════
    // EVENT PROCESSING PIPELINE
    // ═══════════════════════════════════════════

    /**
     * Process a raw TikTok event through the rules engine
     * @param {string} profileId - Active profile ID
     * @param {object} rawEvent - { type, userId, uniqueId, ... }
     */
    async processEvent(profileId, rawEvent) {
        if (!this.db?.pool) return [];
        try {
            const events = await this._getActiveEvents(profileId);
            const executedActions = [];

            for (const event of events) {
                if (!this._matchesTrigger(event, rawEvent)) continue;
                if (!this._matchesUserFilter(event, rawEvent)) continue;

                // Execute ALL linked actions
                for (const actionId of (event.actions_all || [])) {
                    const result = await this._enqueueAction(actionId, profileId, rawEvent);
                    if (result) executedActions.push(result);
                }

                // Execute ONE random linked action
                const randomPool = event.actions_random || [];
                if (randomPool.length > 0) {
                    const randomIdx = Math.floor(Math.random() * randomPool.length);
                    const result = await this._enqueueAction(randomPool[randomIdx], profileId, rawEvent);
                    if (result) executedActions.push(result);
                }
            }

            return executedActions;
        } catch (err) {
            this.log.error('[RulesEngine] processEvent error:', err.message);
            return [];
        }
    }

    /**
     * Simulate a fake event for testing
     */
    async simulateEvent(profileId, eventData) {
        const fakeEvent = {
            type: eventData.type || 'gift',
            userId: eventData.userId || 'sim_' + Date.now(),
            uniqueId: eventData.username || 'TestViewer',
            nickname: eventData.username || 'TestViewer',
            profilePictureUrl: '',
            followRole: 0,
            isModerator: false,
            isSubscriber: false,
            comment: eventData.comment || '',
            giftId: eventData.giftId || null,
            giftName: eventData.giftName || 'Rose',
            diamondCount: eventData.coinValue || 1,
            repeatCount: eventData.repeatCount || 1,
            totalDiamonds: (eventData.coinValue || 1) * (eventData.repeatCount || 1),
            timestamp: Date.now(),
            _simulated: true,
        };
        return this.processEvent(profileId, fakeEvent);
    }

    // ═══════════════════════════════════════════
    // FIRST ACTIVITY TRACKER
    // ═══════════════════════════════════════════

    isFirstActivity(profileId, userId) {
        if (!this.firstActivityTracker.has(profileId)) {
            this.firstActivityTracker.set(profileId, new Set());
        }
        const seen = this.firstActivityTracker.get(profileId);
        if (seen.has(userId)) return false;
        seen.add(userId);
        return true;
    }

    resetFirstActivity(profileId) {
        this.firstActivityTracker.delete(profileId);
    }

    // ═══════════════════════════════════════════
    // PRIVATE: Trigger Matching
    // ═══════════════════════════════════════════

    async _getActiveEvents(profileId) {
        const res = await this.db.pool.query(
            'SELECT * FROM sf_events WHERE profile_id = $1 AND enabled = true',
            [profileId]
        );
        return res.rows;
    }

    _matchesTrigger(event, rawEvent) {
        const tt = event.trigger_type;
        const cfg = event.trigger_config || {};
        const type = rawEvent.type;

        switch (tt) {
            case 'gift':
                if (type !== 'gift') return false;
                if (cfg.gift_name && cfg.gift_name !== rawEvent.giftName) return false;
                if (cfg.min_coins && (rawEvent.totalDiamonds || 0) < cfg.min_coins) return false;
                return true;

            case 'follow':
                return type === 'follow';

            case 'share':
                return type === 'share';

            case 'like':
                return type === 'like';

            case 'subscribe':
                return type === 'subscribe';

            case 'join':
                return type === 'member';

            case 'chat_any':
                return type === 'chat';

            case 'chat_command':
                if (type !== 'chat') return false;
                const cmd = (cfg.command || '').toLowerCase();
                const comment = (rawEvent.comment || '').toLowerCase().trim();
                return comment === cmd || comment.startsWith(cmd + ' ');

            case 'gift_specific':
                if (type !== 'gift') return false;
                return rawEvent.giftName === cfg.gift_name;

            case 'gift_min_coins':
                if (type !== 'gift') return false;
                return (rawEvent.totalDiamonds || 0) >= (cfg.min_coins || 0);

            case 'viewer_milestone':
                return type === 'viewer_milestone';

            case 'gift_streak':
                return type === 'giftStreak';

            case 'emote_combo':
                return type === 'emote';

            case 'top_gifter_change':
                return type === 'topGifterChange';

            // New triggers (P1)
            case 'first_activity':
                if (!['chat', 'like', 'gift', 'share', 'member'].includes(type)) return false;
                return this.isFirstActivity(rawEvent._profileId || 'default', rawEvent.userId);

            case 'subscriber_emote':
                return type === 'emote' && rawEvent.isSubscriberEmote;

            case 'fan_club_sticker':
                return type === 'fanClubSticker';

            case 'shop_purchase':
                return type === 'shopPurchase';

            default:
                return false;
        }
    }

    _matchesUserFilter(event, rawEvent) {
        const filter = event.user_filter || 'everyone';

        let roleOk = true;
        switch (filter) {
            case 'everyone':
                roleOk = true; break;
            case 'follower':
            case 'any_follower':
                roleOk = (rawEvent.followRole || 0) >= 1; break;
            case 'subscriber':
            case 'any_subscriber':
                roleOk = !!rawEvent.isSubscriber; break;
            case 'moderator':
            case 'any_moderator':
                roleOk = !!rawEvent.isModerator; break;
            case 'top_gifter':
                roleOk = !!rawEvent.isTopGifter; break;
            case 'specific':
            case 'specific_user':
                roleOk = (rawEvent.uniqueId || '').toLowerCase() === (event.specific_user || '').toLowerCase(); break;
            default:
                roleOk = true;
        }
        if (!roleOk) return false;

        // Team level check
        if (event.min_team_level > 0) {
            const userLevel = rawEvent.teamMemberLevel || 0;
            if (userLevel < event.min_team_level) return false;
        }

        return true;
    }

    // ═══════════════════════════════════════════
    // PRIVATE: Action Execution
    // ═══════════════════════════════════════════

    async _enqueueAction(actionId, profileId, rawEvent) {
        try {
            const action = await this.getAction(actionId);
            if (!action || !action.enabled) return null;

            // Check global cooldown
            const globalKey = `global:${actionId}`;
            const now = Date.now();
            if (action.global_cooldown > 0) {
                const expiry = this._cooldowns.get(globalKey);
                if (expiry && now < expiry) return null;
                this._cooldowns.set(globalKey, now + action.global_cooldown * 1000);
            }

            // Check user cooldown
            if (action.user_cooldown > 0 && rawEvent.userId) {
                const userKey = `user:${actionId}:${rawEvent.userId}`;
                const expiry = this._userCooldowns.get(userKey);
                if (expiry && now < expiry) return null;
                this._userCooldowns.set(userKey, now + action.user_cooldown * 1000);
            }

            // Handle repeat_gift_combos
            const repeatCount = action.repeat_gift_combos ? (rawEvent.repeatCount || 1) : 1;

            for (let i = 0; i < repeatCount; i++) {
                // Broadcast to the targeted overlay screen
                this._broadcastToScreen(profileId, action.overlay_screen || 1, {
                    type: 'action',
                    action: this._serializeAction(action),
                    triggerUser: {
                        userId: rawEvent.userId,
                        uniqueId: rawEvent.uniqueId,
                        nickname: rawEvent.nickname,
                        profilePictureUrl: rawEvent.profilePictureUrl,
                    },
                    triggerData: {
                        eventType: rawEvent.type,
                        giftName: rawEvent.giftName,
                        comment: rawEvent.comment,
                        diamonds: rawEvent.totalDiamonds,
                        repeatCount: rawEvent.repeatCount,
                    },
                    timestamp: Date.now(),
                });
            }

            // Server-side effects (run once, not per repeat)
            await this._executeServerEffects(action, profileId, rawEvent);

            this.log.debug(`[RulesEngine] Executed action "${action.name}" on screen ${action.overlay_screen}`);
            return { actionId: action.id, actionName: action.name, screen: action.overlay_screen };
        } catch (err) {
            this.log.error(`[RulesEngine] _enqueueAction error:`, err.message);
            return null;
        }
    }

    async _executeServerEffects(action, profileId, rawEvent) {
        const cfg = action.effect_config || {};

        // Webhook
        if (action.effect_webhook && cfg.webhook_url) {
            try {
                const https = require('https');
                const http = require('http');
                const url = new URL(cfg.webhook_url);
                const mod = url.protocol === 'https:' ? https : http;
                const payload = JSON.stringify({ action: action.name, trigger: rawEvent.type, user: rawEvent.uniqueId, data: rawEvent, timestamp: Date.now() });
                const req = mod.request(url, { method: cfg.webhook_method || 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }, timeout: 5000 });
                req.on('error', () => {});
                req.write(payload);
                req.end();
            } catch (e) { this.log.warn('[RulesEngine] Webhook error:', e.message); }
        }

        // Streamer.bot — send action via WebSocket
        if (action.effect_streamerbot && cfg.streamerbot_action) {
            this._sendStreamerBotAction(cfg.streamerbot_action, cfg.streamerbot_args || {}, rawEvent);
        }

        // Voicemod — send voice change command
        if (action.effect_voicemod && cfg.voicemod_voice) {
            this._sendVoicemodCommand(cfg.voicemod_voice, cfg.voicemod_params || {});
        }

        // Timer control — start/stop/reset action timers
        if (action.effect_timer_control && cfg.timer_action) {
            if (cfg.timer_action === 'start') await this.startTimers(profileId, true);
            else if (cfg.timer_action === 'stop') this.stopAllTimers();
        }

        // Goal control — increment/reset a goal
        if (action.effect_goal_control && cfg.goal_id) {
            if (cfg.goal_action === 'increment') await this.updateGoalProgress(cfg.goal_id, parseInt(cfg.goal_amount) || 1);
            else if (cfg.goal_action === 'reset') await this.resetGoal(cfg.goal_id);
        }
    }

    _sendStreamerBotAction(actionName, args, rawEvent) {
        const msg = JSON.stringify({
            request: 'DoAction',
            action: { name: actionName },
            args: { ...args, triggerUser: rawEvent.uniqueId || '', triggerType: rawEvent.type || '' }
        });
        for (const client of this.wsClients) {
            if (client.readyState === 1 && client._isStreamerBot) {
                try { client.send(msg); } catch (_) {}
            }
        }
    }

    _sendVoicemodCommand(voice, params) {
        const msg = JSON.stringify({
            event: { source: 'streamfinity', type: 'voicemod' },
            data: { voice, ...params }
        });
        for (const client of this.wsClients) {
            if (client.readyState === 1) {
                try { client.send(msg); } catch (_) {}
            }
        }
    }

    _broadcastToScreen(profileId, screenId, payload) {
        const msg = JSON.stringify({
            event: { source: 'streamfinity', type: 'action' },
            data: { ...payload, profileId, screenId }
        });
        for (const client of this.wsClients) {
            if (client.readyState !== 1) continue; // WebSocket.OPEN
            // Send to all clients — widget-side filters by screenId
            // Widgets register with ?screen=N and filter incoming messages
            try { client.send(msg); } catch (_) {}
        }
    }

    _serializeAction(action) {
        return {
            id: action.id,
            name: action.name,
            effects: this._getActiveEffects(action),
            effect_config: action.effect_config || {},
            duration_seconds: parseFloat(action.duration_seconds) || 5,
            overlay_screen: action.overlay_screen || 1,
            media_volume: action.media_volume || 80,
            fade_in_out: action.fade_in_out || false,
            skip_on_next: action.skip_on_next || false,
            points_add: action.points_add || 0,
            points_remove: action.points_remove || 0,
        };
    }

    _getActiveEffects(action) {
        const effects = [];
        if (action.effect_animation) effects.push('animation');
        if (action.effect_image) effects.push('image');
        if (action.effect_audio) effects.push('audio');
        if (action.effect_video) effects.push('video');
        if (action.effect_alert) effects.push('alert');
        if (action.effect_tts) effects.push('tts');
        if (action.effect_chat) effects.push('chat');
        if (action.effect_obs_scene) effects.push('obs_scene');
        if (action.effect_obs_source) effects.push('obs_source');
        if (action.effect_webhook) effects.push('webhook');
        if (action.effect_minecraft) effects.push('minecraft');
        if (action.effect_keystrokes) effects.push('keystrokes');
        if (action.effect_points_add) effects.push('points_add');
        if (action.effect_points_remove) effects.push('points_remove');
        if (action.effect_streamerbot) effects.push('streamerbot');
        if (action.effect_voicemod) effects.push('voicemod');
        if (action.effect_timer_control) effects.push('timer_control');
        if (action.effect_goal_control) effects.push('goal_control');
        return effects;
    }

    // ═══════════════════════════════════════════
    // PRIVATE: Field Sanitizers
    // ═══════════════════════════════════════════

    _actionFields(data) {
        return {
            name: data.name || 'Untitled Action',
            description: data.description || '',
            enabled: data.enabled !== false,
            effect_animation: !!data.effect_animation,
            effect_image: !!data.effect_image,
            effect_audio: !!data.effect_audio,
            effect_video: !!data.effect_video,
            effect_alert: !!data.effect_alert,
            effect_tts: !!data.effect_tts,
            effect_chat: !!data.effect_chat,
            effect_obs_scene: !!data.effect_obs_scene,
            effect_obs_source: !!data.effect_obs_source,
            effect_webhook: !!data.effect_webhook,
            effect_minecraft: !!data.effect_minecraft,
            effect_keystrokes: !!data.effect_keystrokes,
            effect_points_add: !!data.effect_points_add,
            effect_points_remove: !!data.effect_points_remove,
            effect_streamerbot: !!data.effect_streamerbot,
            effect_voicemod: !!data.effect_voicemod,
            effect_timer_control: !!data.effect_timer_control,
            effect_goal_control: !!data.effect_goal_control,
            effect_config: data.effect_config || {},
            duration_seconds: parseFloat(data.duration_seconds) || 5,
            overlay_screen: Math.min(8, Math.max(1, parseInt(data.overlay_screen) || 1)),
            media_volume: Math.min(100, Math.max(0, parseInt(data.media_volume) || 80)),
            fade_in_out: !!data.fade_in_out,
            repeat_gift_combos: !!data.repeat_gift_combos,
            skip_on_next: !!data.skip_on_next,
            global_cooldown: Math.max(0, parseInt(data.global_cooldown) || 0),
            user_cooldown: Math.max(0, parseInt(data.user_cooldown) || 0),
            points_add: parseInt(data.points_add) || 0,
            points_remove: parseInt(data.points_remove) || 0,
        };
    }

    _eventFields(data) {
        return {
            name: data.name || '',
            enabled: data.enabled !== false,
            trigger_type: data.trigger_type || 'gift',
            trigger_config: data.trigger_config || {},
            user_filter: data.user_filter || 'everyone',
            specific_user: data.specific_user || null,
            min_team_level: parseInt(data.min_team_level) || 0,
            actions_all: Array.isArray(data.actions_all) ? data.actions_all : [],
            actions_random: Array.isArray(data.actions_random) ? data.actions_random : [],
        };
    }

    _timerFields(data) {
        return {
            name: data.name || 'Timer',
            enabled: data.enabled !== false,
            interval_seconds: Math.max(10, parseInt(data.interval_seconds) || 300),
            action_id: data.action_id || null,
            jitter_seconds: Math.max(0, parseInt(data.jitter_seconds) || 0),
            only_when_live: data.only_when_live !== false,
        };
    }

    _goalFields(data) {
        const validMetrics = ['likes','shares','follows','coins','subs','gifts','chat','joins','viewer','points','custom','custom1','custom2','custom3'];
        const validStyles = ['default','minimal','neon','gradient','retro','glassmorphism','pixel'];
        return {
            name: data.name || 'Goal',
            description: data.description || '',
            enabled: data.enabled !== false,
            metric: validMetrics.includes(data.metric) ? data.metric : 'custom',
            target: Math.max(1, parseInt(data.target) || 100),
            current: Math.max(0, parseInt(data.current) || 0),
            auto_track: data.auto_track !== false,
            label: data.label || '',
            style: validStyles.includes(data.style) ? data.style : 'default',
            color: (data.color || '#8b5cf6').slice(0, 32),
            overlay_screen: Math.min(8, Math.max(1, parseInt(data.overlay_screen) || 1)),
            action_on_reach: data.action_on_reach || null,
            auto_reset: !!data.auto_reset,
            notify_at_pct: Array.isArray(data.notify_at_pct) ? data.notify_at_pct.map(n => parseInt(n)).filter(n => n > 0 && n <= 100) : [50, 75, 100],
        };
    }

    // ═══════════════════════════════════════════
    // COOLDOWN CLEANUP (call periodically)
    // ═══════════════════════════════════════════

    cleanupCooldowns() {
        const now = Date.now();
        for (const [key, expiry] of this._cooldowns) {
            if (now >= expiry) this._cooldowns.delete(key);
        }
        for (const [key, expiry] of this._userCooldowns) {
            if (now >= expiry) this._userCooldowns.delete(key);
        }
    }
}

module.exports = RulesEngine;
