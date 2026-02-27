/**
 * TikFinity Loader
 * Handles loading and serving of TikFinity assets:
 * - Electron scripts (bridge.js, main.js, fetchhelper.js, etc.)
 * - Overlay templates
 * - Gift icons and animations
 * - Sound effects
 * - UI components
 */

const fs = require('fs');
const path = require('path');
const Logger = require('../lib/Logger');

class TikFinityLoader {
    constructor(assetProxy, config) {
        this.proxy = assetProxy;
        this.config = config;
        this.log = new Logger('TikFinityLoader');
        this.assetsDir = path.join(config.assetsDir, 'tikfinity');
        this._initialized = false;

        // Ensure asset directories exist
        const dirs = ['overlays', 'sounds', 'gifts', 'ui', 'electron'];
        for (const d of dirs) {
            fs.mkdirSync(path.join(this.assetsDir, d), { recursive: true });
        }
    }

    async initialize() {
        this.log.info('Initializing TikFinity loader...');

        // Pre-fetch critical electron scripts from upstream
        const scripts = ['main.js', 'bridge.js', 'fetchhelper.js', 'closeonredirect.js', 'websocketserver.js', 'keyboardlistener.js'];
        let loaded = 0;

        for (const script of scripts) {
            const localPath = path.join(this.assetsDir, 'electron', script);

            // Try upstream first
            const result = await this.proxy.fetch('tikfinity', `/electron/${script}`, {
                ttl: this.config.cache.scriptTTL,
                responseType: 'text'
            });

            if (result.success) {
                const data = typeof result.data === 'string' ? result.data : result.data.toString();
                fs.writeFileSync(localPath, data);
                loaded++;
                this.log.debug(`Cached electron script: ${script}`);
            } else {
                // Check if we have a local copy
                if (fs.existsSync(localPath)) {
                    this.log.warn(`Using local fallback for ${script}`);
                    loaded++;
                } else {
                    this.log.warn(`Script not available: ${script}`);
                }
            }
        }

        this._initialized = true;
        this.log.success(`TikFinity loader ready (${loaded}/${scripts.length} scripts)`);
        return { success: true, scripts: loaded };
    }

    /**
     * Get an electron script (bridge.js, main.js, etc.)
     * Priority: memory cache → disk cache → upstream → local fallback
     */
    async getElectronScript(filename) {
        // Sanitize filename
        const safe = path.basename(filename);
        if (!this.config.electronScripts.includes(safe) && !safe.endsWith('.js') && !safe.endsWith('.exe')) {
            return { success: false, error: 'Invalid script name' };
        }

        // Try proxy (has memory + disk cache built in)
        const result = await this.proxy.fetch('tikfinity', `/electron/${safe}`, {
            ttl: this.config.cache.scriptTTL,
            responseType: 'arraybuffer'
        });

        if (result.success) return result;

        // Fallback to local file
        const localPath = path.join(this.assetsDir, 'electron', safe);
        if (fs.existsSync(localPath)) {
            const data = fs.readFileSync(localPath);
            const contentType = safe.endsWith('.js') ? 'application/javascript' : 'application/octet-stream';
            return { success: true, data, contentType, source: 'local-fallback' };
        }

        return { success: false, error: `Script not found: ${safe}` };
    }

    /**
     * Get the TikTok Live bridge script (injected into TikTok pages)
     * This is the critical script that intercepts WebSocket data
     */
    async getBridgeScript() {
        return this.getElectronScript('bridge.js');
    }

    /**
     * Load overlay templates from upstream or local
     */
    async loadOverlays() {
        const result = await this.proxy.fetch('tikfinity', '/api/overlays', {
            ttl: this.config.cache.dynamicTTL,
            responseType: 'text'
        });

        if (result.success) {
            try {
                return { success: true, overlays: JSON.parse(result.data.toString()) };
            } catch (_) {
                return { success: true, overlays: result.data };
            }
        }

        // Return built-in overlays
        return {
            success: true,
            overlays: this._getBuiltInOverlays(),
            source: 'built-in'
        };
    }

    /**
     * Load gift asset (icon/animation) by gift ID
     */
    async getGiftAsset(giftId) {
        return this.proxy.fetch('tikfinity', `/assets/gifts/${giftId}`, {
            ttl: this.config.cache.staticTTL
        });
    }

    /**
     * Load sound effect
     */
    async getSoundEffect(soundId) {
        const localPath = path.join(this.assetsDir, 'sounds', `${soundId}.mp3`);
        if (fs.existsSync(localPath)) {
            return { success: true, data: fs.readFileSync(localPath), contentType: 'audio/mpeg', source: 'local' };
        }

        return this.proxy.fetch('tikfinity', `/assets/sounds/${soundId}`, {
            ttl: this.config.cache.staticTTL
        });
    }

    _getBuiltInOverlays() {
        return [
            { id: 'sf-chat', name: 'StreamFinity Chat Overlay', type: 'chat', platform: 'tikfinity' },
            { id: 'sf-gifts', name: 'StreamFinity Gift Alert', type: 'alert', platform: 'tikfinity' },
            { id: 'sf-goal', name: 'StreamFinity Goal Bar', type: 'goal', platform: 'tikfinity' },
            { id: 'sf-ticker', name: 'StreamFinity Event Ticker', type: 'ticker', platform: 'tikfinity' },
            { id: 'sf-leaderboard', name: 'StreamFinity Leaderboard', type: 'leaderboard', platform: 'tikfinity' }
        ];
    }

    getStats() {
        return {
            initialized: this._initialized,
            assetsDir: this.assetsDir,
            electronScripts: this.config.electronScripts.length
        };
    }
}

module.exports = TikFinityLoader;
