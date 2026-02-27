/**
 * Actions & Events API Routes
 * CRUD for sf_actions and sf_events tables + event simulation + migration
 */

const express = require('express');

function createActionRoutes(rulesEngine) {
    const router = express.Router();

    // ═══════════════════════════════════════════
    // ACTIONS CRUD
    // ═══════════════════════════════════════════

    // GET /api/actions?profile=<profileId>
    router.get('/actions', async (req, res) => {
        try {
            const profileId = req.query.profile;
            if (!profileId) return res.status(400).json({ error: 'profile query param required' });
            const actions = await rulesEngine.getActions(profileId);
            res.json({ success: true, actions });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // GET /api/actions/:id
    router.get('/actions/:id', async (req, res) => {
        try {
            const action = await rulesEngine.getAction(req.params.id);
            if (!action) return res.status(404).json({ error: 'Action not found' });
            res.json({ success: true, action });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // POST /api/actions
    router.post('/actions', async (req, res) => {
        try {
            const { profile_id, ...data } = req.body;
            if (!profile_id) return res.status(400).json({ error: 'profile_id required' });
            const action = await rulesEngine.createAction(profile_id, data);
            res.json({ success: true, action });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // PUT /api/actions/:id
    router.put('/actions/:id', async (req, res) => {
        try {
            const action = await rulesEngine.updateAction(req.params.id, req.body);
            if (!action) return res.status(404).json({ error: 'Action not found' });
            res.json({ success: true, action });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // DELETE /api/actions/:id
    router.delete('/actions/:id', async (req, res) => {
        try {
            const ok = await rulesEngine.deleteAction(req.params.id);
            res.json({ success: ok });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // ═══════════════════════════════════════════
    // EVENTS CRUD
    // ═══════════════════════════════════════════

    // GET /api/events?profile=<profileId>
    router.get('/events', async (req, res) => {
        try {
            const profileId = req.query.profile;
            if (!profileId) return res.status(400).json({ error: 'profile query param required' });
            const events = await rulesEngine.getEvents(profileId);
            res.json({ success: true, events });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // GET /api/events/:id
    router.get('/events/:id', async (req, res) => {
        try {
            const event = await rulesEngine.getEvent(req.params.id);
            if (!event) return res.status(404).json({ error: 'Event not found' });
            res.json({ success: true, event });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // POST /api/events
    router.post('/events', async (req, res) => {
        try {
            const { profile_id, ...data } = req.body;
            if (!profile_id) return res.status(400).json({ error: 'profile_id required' });
            const event = await rulesEngine.createEvent(profile_id, data);
            res.json({ success: true, event });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // PUT /api/events/:id
    router.put('/events/:id', async (req, res) => {
        try {
            const event = await rulesEngine.updateEvent(req.params.id, req.body);
            if (!event) return res.status(404).json({ error: 'Event not found' });
            res.json({ success: true, event });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // DELETE /api/events/:id
    router.delete('/events/:id', async (req, res) => {
        try {
            const ok = await rulesEngine.deleteEvent(req.params.id);
            res.json({ success: ok });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // ═══════════════════════════════════════════
    // EVENT SIMULATOR
    // ═══════════════════════════════════════════

    // POST /api/simulate
    router.post('/simulate', async (req, res) => {
        try {
            const { profile_id, ...eventData } = req.body;
            if (!profile_id) return res.status(400).json({ error: 'profile_id required' });
            const results = await rulesEngine.simulateEvent(profile_id, eventData);
            res.json({ success: true, executed: results });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // ═══════════════════════════════════════════
    // MIGRATION: Import flat userActions → new model
    // ═══════════════════════════════════════════

    // POST /api/actions/migrate
    router.post('/actions/migrate', async (req, res) => {
        try {
            const { profile_id, legacy_actions } = req.body;
            if (!profile_id || !Array.isArray(legacy_actions)) {
                return res.status(400).json({ error: 'profile_id and legacy_actions[] required' });
            }

            const TRIGGER_MAP = {
                'Gift Received': 'gift',
                'New Follower': 'follow',
                'Share': 'share',
                'Like': 'like',
                'Chat Message': 'chat_any',
                'Sub / Subscribe': 'subscribe',
                'Join': 'join',
                'Viewer Milestone': 'viewer_milestone',
                'Gift Streak': 'gift_streak',
                'Emote Combo': 'emote_combo',
                'Top Gifter Change': 'top_gifter_change',
            };

            const ACTION_EFFECT_MAP = {
                'Play Sound': 'effect_audio',
                'Show Alert': 'effect_alert',
                'Show Image': 'effect_image',
                'Run Minecraft Command': 'effect_minecraft',
                'Send Chat Message': 'effect_chat',
                'Change OBS Scene': 'effect_obs_scene',
                'Toggle OBS Source': 'effect_obs_source',
                'Add Points': 'effect_points_add',
                'Remove Points': 'effect_points_remove',
                'Play TTS': 'effect_tts',
                'Trigger Webhook': 'effect_webhook',
            };

            const created = { actions: 0, events: 0 };

            for (const legacy of legacy_actions) {
                // Create Action
                const effectField = ACTION_EFFECT_MAP[legacy.action] || 'effect_alert';
                const actionData = {
                    name: `${legacy.trigger} → ${legacy.action}`,
                    description: `Migrated from legacy action`,
                    enabled: legacy.enabled !== false,
                    [effectField]: true,
                    effect_config: {
                        value: legacy.actionValue || '',
                        sound_file: effectField === 'effect_audio' ? legacy.actionValue : undefined,
                        alert_text: effectField === 'effect_alert' ? legacy.actionValue : undefined,
                        image_url: effectField === 'effect_image' ? legacy.actionValue : undefined,
                        minecraft_cmd: effectField === 'effect_minecraft' ? legacy.actionValue : undefined,
                        chat_message: effectField === 'effect_chat' ? legacy.actionValue : undefined,
                        obs_scene: effectField === 'effect_obs_scene' ? legacy.actionValue : undefined,
                        obs_source: effectField === 'effect_obs_source' ? legacy.actionValue : undefined,
                        tts_text: effectField === 'effect_tts' ? legacy.actionValue : undefined,
                        webhook_url: effectField === 'effect_webhook' ? legacy.actionValue : undefined,
                    },
                    global_cooldown: legacy.cooldown || 0,
                };
                const action = await rulesEngine.createAction(profile_id, actionData);
                if (!action) continue;
                created.actions++;

                // Create Event linked to this Action
                const triggerType = TRIGGER_MAP[legacy.trigger] || 'gift';
                const triggerConfig = {};
                if (legacy.giftName) triggerConfig.gift_name = legacy.giftName;
                if (legacy.minCoins) triggerConfig.min_coins = legacy.minCoins;

                const eventData = {
                    name: legacy.trigger,
                    enabled: legacy.enabled !== false,
                    trigger_type: triggerType,
                    trigger_config: triggerConfig,
                    user_filter: 'everyone',
                    min_team_level: legacy.minLevel || 0,
                    actions_all: [action.id],
                    actions_random: [],
                };
                await rulesEngine.createEvent(profile_id, eventData);
                created.events++;
            }

            res.json({ success: true, migrated: created });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // ═══════════════════════════════════════════
    // ACTION TIMERS CRUD
    // ═══════════════════════════════════════════

    // GET /api/action-timers?profile=<profileId>
    router.get('/action-timers', async (req, res) => {
        try {
            const profileId = req.query.profile;
            if (!profileId) return res.status(400).json({ error: 'profile query param required' });
            const timers = await rulesEngine.getActionTimers(profileId);
            res.json({ success: true, timers });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // POST /api/action-timers
    router.post('/action-timers', async (req, res) => {
        try {
            const { profile_id, ...data } = req.body;
            if (!profile_id) return res.status(400).json({ error: 'profile_id required' });
            const timer = await rulesEngine.createActionTimer(profile_id, data);
            res.json({ success: true, timer });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // PUT /api/action-timers/:id
    router.put('/action-timers/:id', async (req, res) => {
        try {
            const timer = await rulesEngine.updateActionTimer(req.params.id, req.body);
            if (!timer) return res.status(404).json({ error: 'Timer not found' });
            res.json({ success: true, timer });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // DELETE /api/action-timers/:id
    router.delete('/action-timers/:id', async (req, res) => {
        try {
            const ok = await rulesEngine.deleteActionTimer(req.params.id);
            res.json({ success: ok });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // POST /api/action-timers/start — start all timers for profile
    router.post('/action-timers/start', async (req, res) => {
        try {
            const { profile_id, is_live } = req.body;
            if (!profile_id) return res.status(400).json({ error: 'profile_id required' });
            await rulesEngine.startTimers(profile_id, is_live !== false);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // POST /api/action-timers/stop — stop all timers
    router.post('/action-timers/stop', async (req, res) => {
        try {
            rulesEngine.stopAllTimers();
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // ═══════════════════════════════════════════
    // GOALS CRUD
    // ═══════════════════════════════════════════

    // GET /api/goals?profile=<profileId>
    router.get('/goals', async (req, res) => {
        try {
            const profileId = req.query.profile;
            if (!profileId) return res.status(400).json({ error: 'profile query param required' });
            const goals = await rulesEngine.getGoals(profileId);
            res.json({ success: true, goals });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // GET /api/goals/:id
    router.get('/goals/:id', async (req, res) => {
        try {
            const goal = await rulesEngine.getGoal(req.params.id);
            if (!goal) return res.status(404).json({ error: 'Goal not found' });
            res.json({ success: true, goal });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // POST /api/goals
    router.post('/goals', async (req, res) => {
        try {
            const { profile_id, ...data } = req.body;
            if (!profile_id) return res.status(400).json({ error: 'profile_id required' });
            const goal = await rulesEngine.createGoal(profile_id, data);
            res.json({ success: true, goal });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // PUT /api/goals/:id
    router.put('/goals/:id', async (req, res) => {
        try {
            const goal = await rulesEngine.updateGoal(req.params.id, req.body);
            if (!goal) return res.status(404).json({ error: 'Goal not found' });
            res.json({ success: true, goal });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // DELETE /api/goals/:id
    router.delete('/goals/:id', async (req, res) => {
        try {
            const ok = await rulesEngine.deleteGoal(req.params.id);
            res.json({ success: ok });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // POST /api/goals/:id/progress — increment goal progress
    router.post('/goals/:id/progress', async (req, res) => {
        try {
            const increment = parseInt(req.body.increment) || 1;
            const goal = await rulesEngine.updateGoalProgress(req.params.id, increment);
            if (!goal) return res.status(404).json({ error: 'Goal not found' });
            res.json({ success: true, goal });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // POST /api/goals/:id/reset — reset goal to 0
    router.post('/goals/:id/reset', async (req, res) => {
        try {
            const goal = await rulesEngine.resetGoal(req.params.id);
            if (!goal) return res.status(404).json({ error: 'Goal not found' });
            res.json({ success: true, goal });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    return router;
}

module.exports = createActionRoutes;
