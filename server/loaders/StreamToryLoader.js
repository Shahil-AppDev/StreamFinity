/**
 * StreamTory Loader
 * Handles loading and serving of StreamTory (Tiktory) assets:
 * - Analytics dashboard templates
 * - Custom overlay systems
 * - Data visualization components
 * - Export templates and formats
 */

const fs = require('fs');
const path = require('path');
const Logger = require('../lib/Logger');

class StreamToryLoader {
    constructor(assetProxy, config) {
        this.proxy = assetProxy;
        this.config = config;
        this.log = new Logger('StreamToryLoader');
        this.assetsDir = path.join(config.assetsDir, 'streamtory');
        this._initialized = false;

        const dirs = ['analytics', 'overlays', 'exports', 'templates'];
        for (const d of dirs) {
            fs.mkdirSync(path.join(this.assetsDir, d), { recursive: true });
        }
    }

    async initialize() {
        this.log.info('Initializing StreamTory loader...');

        // Pre-load analytics templates
        await this._loadBuiltInTemplates();

        this._initialized = true;
        this.log.success('StreamTory loader ready');
        return { success: true };
    }

    /**
     * Load analytics dashboard templates
     */
    async loadAnalyticsTemplates() {
        // Try upstream first
        const result = await this.proxy.fetch('streamtory', '/api/v1/templates', {
            ttl: this.config.cache.dynamicTTL,
            responseType: 'text'
        });

        if (result.success) {
            try {
                return { success: true, templates: JSON.parse(result.data.toString()) };
            } catch (_) {}
        }

        // Return built-in templates
        return { success: true, templates: this._getBuiltInAnalyticsTemplates(), source: 'built-in' };
    }

    /**
     * Load custom overlay by ID
     */
    async loadCustomOverlay(overlayId) {
        const localPath = path.join(this.assetsDir, 'overlays', `${overlayId}.json`);
        if (fs.existsSync(localPath)) {
            try {
                const data = JSON.parse(fs.readFileSync(localPath, 'utf8'));
                return { success: true, overlay: data, source: 'local' };
            } catch (_) {}
        }

        const result = await this.proxy.fetch('streamtory', `/api/v1/overlays/${overlayId}`, {
            ttl: this.config.cache.dynamicTTL,
            responseType: 'text'
        });

        if (result.success) {
            try {
                const overlay = JSON.parse(result.data.toString());
                // Cache locally
                fs.writeFileSync(localPath, JSON.stringify(overlay, null, 2));
                return { success: true, overlay, source: 'upstream' };
            } catch (_) {}
        }

        return { success: false, error: `Overlay not found: ${overlayId}` };
    }

    /**
     * Get data export in specified format
     */
    async loadDataExport(format = 'json') {
        const templates = {
            json: { contentType: 'application/json', ext: '.json' },
            csv: { contentType: 'text/csv', ext: '.csv' },
            xlsx: { contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ext: '.xlsx' }
        };

        const tmpl = templates[format] || templates.json;
        const localPath = path.join(this.assetsDir, 'exports', `template${tmpl.ext}`);

        if (fs.existsSync(localPath)) {
            return { success: true, data: fs.readFileSync(localPath), contentType: tmpl.contentType, source: 'local' };
        }

        return { success: true, data: Buffer.from('{}'), contentType: tmpl.contentType, source: 'empty-template' };
    }

    /**
     * Get analytics data (revenue, engagement, viewers)
     */
    async getAnalyticsData(type = 'summary', params = {}) {
        const cacheKey = `analytics:${type}:${JSON.stringify(params)}`;
        const cached = this.proxy.cache ? this.proxy.cache.get(cacheKey) : null;
        if (cached) return { success: true, data: cached, source: 'cache' };

        // Try upstream
        const qs = new URLSearchParams(params).toString();
        const result = await this.proxy.fetch('streamtory', `/api/v1/analytics/${type}?${qs}`, {
            ttl: this.config.cache.dynamicTTL,
            responseType: 'text'
        });

        if (result.success) {
            try {
                const data = JSON.parse(result.data.toString());
                return { success: true, data, source: 'upstream' };
            } catch (_) {}
        }

        // Return mock data
        return { success: true, data: this._getMockAnalytics(type), source: 'mock' };
    }

    async _loadBuiltInTemplates() {
        const templates = this._getBuiltInAnalyticsTemplates();
        for (const tmpl of templates) {
            const filePath = path.join(this.assetsDir, 'templates', `${tmpl.id}.json`);
            if (!fs.existsSync(filePath)) {
                fs.writeFileSync(filePath, JSON.stringify(tmpl, null, 2));
            }
        }
    }

    _getBuiltInAnalyticsTemplates() {
        return [
            { id: 'revenue-dashboard', name: 'Revenue Dashboard', type: 'dashboard', metrics: ['gifts', 'coins', 'diamonds', 'revenue_usd'] },
            { id: 'engagement-tracker', name: 'Engagement Tracker', type: 'tracker', metrics: ['viewers', 'likes', 'shares', 'comments', 'followers'] },
            { id: 'stream-summary', name: 'Stream Summary', type: 'summary', metrics: ['duration', 'peak_viewers', 'total_gifts', 'new_followers'] },
            { id: 'gift-leaderboard', name: 'Gift Leaderboard', type: 'leaderboard', metrics: ['top_gifters', 'gift_count', 'gift_value'] },
            { id: 'viewer-heatmap', name: 'Viewer Heatmap', type: 'heatmap', metrics: ['viewer_count_over_time', 'engagement_over_time'] },
            { id: 'growth-chart', name: 'Growth Chart', type: 'chart', metrics: ['followers_over_time', 'revenue_over_time'] }
        ];
    }

    _getMockAnalytics(type) {
        const base = { timestamp: Date.now(), platform: 'streamtory' };
        switch (type) {
            case 'revenue': return { ...base, total: 0, currency: 'USD', gifts: [], period: '24h' };
            case 'engagement': return { ...base, viewers: 0, likes: 0, shares: 0, comments: 0 };
            case 'viewers': return { ...base, current: 0, peak: 0, history: [] };
            default: return { ...base, type, data: {} };
        }
    }

    getStats() {
        return { initialized: this._initialized, assetsDir: this.assetsDir };
    }
}

module.exports = StreamToryLoader;
