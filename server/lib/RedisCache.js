/**
 * Redis Cache Manager
 * Session storage, asset caching, rate limiting support
 */

const { createClient } = require('redis');
const Logger = require('./Logger');

class RedisCache {
    constructor(config = {}) {
        this.url = config.redisUrl || process.env.REDIS_URL || 'redis://127.0.0.1:6379';
        this.prefix = config.prefix || 'sf:';
        this.log = new Logger('Redis');
        this.client = null;
        this.connected = false;
        this.ttls = {
            asset: config.assetTTL || 86400,       // 24h
            api: config.apiTTL || 3600,             // 1h
            session: config.sessionTTL || 1800,     // 30min
            rateLimit: config.rateLimitTTL || 60    // 1min
        };
    }

    async connect() {
        try {
            this.client = createClient({ url: this.url });
            this.client.on('error', (err) => {
                if (this.connected) this.log.warn('Redis error:', err.message);
            });
            this.client.on('reconnecting', () => this.log.debug('Redis reconnecting...'));
            await this.client.connect();
            this.connected = true;
            this.log.success('Connected to Redis');
            return true;
        } catch (err) {
            this.log.error('Redis connection failed:', err.message);
            this.connected = false;
            return false;
        }
    }

    _key(namespace, key) {
        return `${this.prefix}${namespace}:${key}`;
    }

    // ── Generic Cache ──

    async get(namespace, key) {
        if (!this.connected) return null;
        try {
            const val = await this.client.get(this._key(namespace, key));
            return val ? JSON.parse(val) : null;
        } catch (_) { return null; }
    }

    async set(namespace, key, value, ttl) {
        if (!this.connected) return false;
        try {
            const k = this._key(namespace, key);
            await this.client.set(k, JSON.stringify(value), { EX: ttl || this.ttls.api });
            return true;
        } catch (_) { return false; }
    }

    async del(namespace, key) {
        if (!this.connected) return false;
        try {
            await this.client.del(this._key(namespace, key));
            return true;
        } catch (_) { return false; }
    }

    // ── Asset Cache ──

    async cacheAsset(platform, category, id, data) {
        return this.set('asset', `${platform}:${category}:${id}`, data, this.ttls.asset);
    }

    async getAsset(platform, category, id) {
        return this.get('asset', `${platform}:${category}:${id}`);
    }

    // ── Session ──

    async setSession(sessionId, data) {
        return this.set('session', sessionId, data, this.ttls.session);
    }

    async getSession(sessionId) {
        return this.get('session', sessionId);
    }

    async deleteSession(sessionId) {
        return this.del('session', sessionId);
    }

    // ── Rate Limiting ──

    async checkRateLimit(ip, limit = 200) {
        if (!this.connected) return { allowed: true, remaining: limit };
        try {
            const key = this._key('rl', ip);
            const current = await this.client.incr(key);
            if (current === 1) await this.client.expire(key, this.ttls.rateLimit);
            return {
                allowed: current <= limit,
                remaining: Math.max(0, limit - current),
                current
            };
        } catch (_) {
            return { allowed: true, remaining: limit };
        }
    }

    // ── Flush ──

    async flushNamespace(namespace) {
        if (!this.connected) return 0;
        try {
            const pattern = `${this.prefix}${namespace}:*`;
            let cursor = 0;
            let deleted = 0;
            do {
                const result = await this.client.scan(cursor, { MATCH: pattern, COUNT: 100 });
                cursor = result.cursor;
                if (result.keys.length > 0) {
                    await this.client.del(result.keys);
                    deleted += result.keys.length;
                }
            } while (cursor !== 0);
            return deleted;
        } catch (_) { return 0; }
    }

    // ── Stats ──

    async getStats() {
        if (!this.connected) return { connected: false };
        try {
            const info = await this.client.info('memory');
            const keyspace = await this.client.info('keyspace');
            const memMatch = info.match(/used_memory_human:(\S+)/);
            const keysMatch = keyspace.match(/keys=(\d+)/);
            return {
                connected: true,
                memory: memMatch ? memMatch[1] : 'unknown',
                keys: keysMatch ? parseInt(keysMatch[1]) : 0
            };
        } catch (err) {
            return { connected: true, error: err.message };
        }
    }

    async close() {
        if (this.client && this.connected) {
            await this.client.quit();
            this.connected = false;
            this.log.info('Redis connection closed');
        }
    }
}

module.exports = RedisCache;
