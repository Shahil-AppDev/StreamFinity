/**
 * StreamFinity In-Memory Cache
 * LRU-style cache with TTL, size limits, and hit/miss stats
 * Replaces Redis for single-server deployments
 */

class MemoryCache {
    constructor(opts = {}) {
        this.maxEntries = opts.maxEntries || 5000;
        this.maxMemoryMB = opts.maxMemoryMB || 256;
        this._store = new Map();
        this._stats = { hits: 0, misses: 0, sets: 0, evictions: 0, totalBytes: 0 };

        // Cleanup expired entries every 60s
        this._cleanupInterval = setInterval(() => this._cleanup(), 60000);
    }

    get(key) {
        const entry = this._store.get(key);
        if (!entry) {
            this._stats.misses++;
            return null;
        }
        if (entry.expiresAt && Date.now() > entry.expiresAt) {
            this._delete(key, entry);
            this._stats.misses++;
            return null;
        }
        entry.lastAccess = Date.now();
        entry.hits++;
        this._stats.hits++;
        return entry.value;
    }

    set(key, value, ttlMs) {
        // Evict if at capacity
        if (this._store.size >= this.maxEntries) {
            this._evictLRU();
        }

        const size = this._estimateSize(value);
        const entry = {
            value,
            size,
            createdAt: Date.now(),
            lastAccess: Date.now(),
            expiresAt: ttlMs ? Date.now() + ttlMs : null,
            hits: 0
        };

        // Remove old entry size if overwriting
        const old = this._store.get(key);
        if (old) this._stats.totalBytes -= old.size;

        this._store.set(key, entry);
        this._stats.totalBytes += size;
        this._stats.sets++;
    }

    has(key) {
        const entry = this._store.get(key);
        if (!entry) return false;
        if (entry.expiresAt && Date.now() > entry.expiresAt) {
            this._delete(key, entry);
            return false;
        }
        return true;
    }

    del(key) {
        const entry = this._store.get(key);
        if (entry) this._delete(key, entry);
    }

    clear() {
        this._store.clear();
        this._stats.totalBytes = 0;
    }

    getStats() {
        const total = this._stats.hits + this._stats.misses;
        return {
            entries: this._store.size,
            maxEntries: this.maxEntries,
            memoryMB: Math.round(this._stats.totalBytes / 1024 / 1024 * 100) / 100,
            maxMemoryMB: this.maxMemoryMB,
            hits: this._stats.hits,
            misses: this._stats.misses,
            hitRate: total > 0 ? Math.round(this._stats.hits / total * 10000) / 100 : 0,
            sets: this._stats.sets,
            evictions: this._stats.evictions
        };
    }

    keys() {
        return [...this._store.keys()];
    }

    _delete(key, entry) {
        this._stats.totalBytes -= entry.size;
        this._store.delete(key);
    }

    _evictLRU() {
        let oldest = null;
        let oldestKey = null;
        for (const [key, entry] of this._store) {
            if (!oldest || entry.lastAccess < oldest.lastAccess) {
                oldest = entry;
                oldestKey = key;
            }
        }
        if (oldestKey) {
            this._delete(oldestKey, oldest);
            this._stats.evictions++;
        }
    }

    _cleanup() {
        const now = Date.now();
        for (const [key, entry] of this._store) {
            if (entry.expiresAt && now > entry.expiresAt) {
                this._delete(key, entry);
            }
        }
    }

    _estimateSize(value) {
        if (Buffer.isBuffer(value)) return value.length;
        if (typeof value === 'string') return Buffer.byteLength(value);
        if (typeof value === 'object') return Buffer.byteLength(JSON.stringify(value));
        return 64;
    }

    destroy() {
        clearInterval(this._cleanupInterval);
        this.clear();
    }
}

module.exports = MemoryCache;
