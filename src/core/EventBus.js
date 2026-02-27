/**
 * StreamFinity - Cross-Platform Event Bus
 * Handles communication between StreamFinity, StreamTory, and StreamControl
 */

const { EventEmitter } = require('events');
const { Logger } = require('../utils/logger');

class EventBus extends EventEmitter {
    constructor() {
        super();
        this.log = new Logger('EventBus');
        this.subscriptions = new Map();
        this.sharedState = new Map();
        this.setMaxListeners(100);
    }

    /**
     * Emit a platform-scoped event
     * @param {string} platform - streamfinity | streamtory | streamcontrol
     * @param {string} event - event name
     * @param {*} data - event payload
     */
    platformEmit(platform, event, data) {
        const scoped = `${platform}:${event}`;
        this.log.debug(`Event: ${scoped}`);
        this.emit(scoped, data);
        this.emit('*', { platform, event, data });
    }

    /**
     * Listen to a platform-scoped event
     */
    platformOn(platform, event, handler) {
        const scoped = `${platform}:${event}`;
        this.on(scoped, handler);
        return () => this.off(scoped, handler);
    }

    /**
     * Broadcast an event to all platforms except the source
     */
    broadcast(sourcePlatform, event, data) {
        const platforms = ['streamfinity', 'streamtory', 'streamcontrol', 'streamerbot'];
        for (const p of platforms) {
            if (p !== sourcePlatform) {
                this.platformEmit(p, event, data);
            }
        }
    }

    /**
     * Shared state management across platforms
     */
    setState(key, value, source = 'system') {
        const prev = this.sharedState.get(key);
        this.sharedState.set(key, value);
        this.emit('state:changed', { key, value, prev, source });
        return value;
    }

    getState(key, defaultValue = null) {
        return this.sharedState.has(key) ? this.sharedState.get(key) : defaultValue;
    }

    getAllState() {
        return Object.fromEntries(this.sharedState);
    }
}

module.exports = EventBus;
