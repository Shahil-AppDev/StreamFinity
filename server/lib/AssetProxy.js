/**
 * StreamFinity Asset Proxy
 * Fetches assets from upstream servers (TikFinity, StreamTory, StreamControl)
 * with caching, fallback, and compression
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Logger = require('./Logger');

class AssetProxy {
    constructor(cache, config) {
        this.cache = cache;
        this.config = config;
        this.log = new Logger('AssetProxy');
        this._stats = { proxied: 0, cached: 0, failed: 0, fallbacks: 0 };

        // Ensure cache dir exists
        try { fs.mkdirSync(config.cacheDir, { recursive: true }); } catch (_) {}
    }

    /**
     * Fetch an asset from upstream with cache-through
     * @param {string} platform - tikfinity|streamtory|streamcontrol
     * @param {string} assetPath - e.g. /assets/overlay.png
     * @param {object} opts - { ttl, forceRefresh, responseType }
     */
    async fetch(platform, assetPath, opts = {}) {
        const upstream = this.config.upstream[platform];
        if (!upstream) {
            return { success: false, error: `Unknown platform: ${platform}` };
        }

        const cacheKey = `proxy:${platform}:${assetPath}`;
        const ttl = opts.ttl || this.config.cache.staticTTL;

        // Check memory cache first
        if (!opts.forceRefresh) {
            const cached = this.cache.get(cacheKey);
            if (cached) {
                this._stats.cached++;
                return { success: true, data: cached.data, contentType: cached.contentType, source: 'cache' };
            }
        }

        // Check disk cache
        if (!opts.forceRefresh) {
            const diskResult = this._readDiskCache(cacheKey);
            if (diskResult) {
                // Promote to memory cache
                this.cache.set(cacheKey, diskResult, ttl);
                this._stats.cached++;
                return { success: true, data: diskResult.data, contentType: diskResult.contentType, source: 'disk-cache' };
            }
        }

        // Fetch from upstream
        const result = await this._fetchFromUpstream(upstream, assetPath, opts);
        if (result.success) {
            const cacheEntry = { data: result.data, contentType: result.contentType };
            this.cache.set(cacheKey, cacheEntry, ttl);
            this._writeDiskCache(cacheKey, cacheEntry);
            this._stats.proxied++;
            return { success: true, data: result.data, contentType: result.contentType, source: 'upstream' };
        }

        this._stats.failed++;
        return result;
    }

    async _fetchFromUpstream(upstream, assetPath, opts) {
        const urls = [upstream.primary, upstream.fallback].filter(Boolean);

        for (let i = 0; i < urls.length; i++) {
            const url = urls[i] + assetPath;
            try {
                this.log.debug(`Fetching ${url}`);
                const response = await axios.get(url, {
                    timeout: 8000,
                    responseType: opts.responseType || 'arraybuffer',
                    headers: {
                        'User-Agent': 'StreamFinity-Server/1.0.0',
                        'Accept': '*/*'
                    },
                    validateStatus: (s) => s >= 200 && s < 400
                });

                return {
                    success: true,
                    data: response.data,
                    contentType: response.headers['content-type'] || 'application/octet-stream'
                };
            } catch (err) {
                this.log.warn(`Failed to fetch ${url}: ${err.message}`);
                if (i > 0) this._stats.fallbacks++;
            }
        }

        return { success: false, error: `All upstream servers failed for ${assetPath}` };
    }

    // ── Disk Cache ──

    _diskCachePath(key) {
        const hash = crypto.createHash('md5').update(key).digest('hex');
        return path.join(this.config.cacheDir, hash.slice(0, 2), hash);
    }

    _readDiskCache(key) {
        try {
            const metaPath = this._diskCachePath(key) + '.meta';
            const dataPath = this._diskCachePath(key) + '.data';
            if (!fs.existsSync(metaPath) || !fs.existsSync(dataPath)) return null;

            const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
            if (meta.expiresAt && Date.now() > meta.expiresAt) {
                fs.unlinkSync(metaPath);
                fs.unlinkSync(dataPath);
                return null;
            }

            return { data: fs.readFileSync(dataPath), contentType: meta.contentType };
        } catch (_) {
            return null;
        }
    }

    _writeDiskCache(key, entry) {
        try {
            const basePath = this._diskCachePath(key);
            const dir = path.dirname(basePath);
            fs.mkdirSync(dir, { recursive: true });

            fs.writeFileSync(basePath + '.meta', JSON.stringify({
                contentType: entry.contentType,
                createdAt: Date.now(),
                expiresAt: Date.now() + this.config.cache.staticTTL
            }));

            fs.writeFileSync(basePath + '.data', entry.data);
        } catch (err) {
            this.log.warn('Disk cache write failed:', err.message);
        }
    }

    getStats() {
        return { ...this._stats, cache: this.cache.getStats() };
    }
}

module.exports = AssetProxy;
