/**
 * StreamTory Asset Extractor
 * Extracts assets from local app-1.1.24 directory and upstream tiktory.app
 *
 * Local sources:
 * - vendor/app-1.1.24/ (Electron binary — no extractable source code)
 * - vendor/legacy/ (config files with feature lists and host URLs)
 *
 * Upstream sources:
 * - https://tiktory.app/static/* (UI assets)
 * - https://tiktory.app/api/v1/* (templates, overlays)
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Logger = require('../lib/Logger');

class StreamToryExtractor {
    constructor(config) {
        this.config = config;
        this.log = new Logger('StreamToryExtractor');
        this.legacyDir = path.resolve(config.assetsDir, '..', '..', 'vendor', 'legacy');
        this.outputDir = path.join(config.assetsDir, 'streamtory');
        this.upstream = config.upstream.streamtory;
        this._results = { local: 0, upstream: 0, failed: 0, assets: [] };
    }

    async extract() {
        this.log.info('Starting StreamTory asset extraction...');
        this._results = { local: 0, upstream: 0, failed: 0, assets: [] };

        const dirs = ['analytics', 'overlays', 'exports', 'templates', 'config'];
        for (const d of dirs) {
            fs.mkdirSync(path.join(this.outputDir, d), { recursive: true });
        }

        // Phase 1: Extract feature metadata from legacy configs
        await this._extractLegacyConfigs();

        // Phase 2: Generate built-in analytics templates
        await this._generateAnalyticsTemplates();

        // Phase 3: Generate overlay templates
        await this._generateOverlayTemplates();

        // Phase 4: Try upstream assets
        await this._fetchUpstreamAssets();

        this.log.success(`Extraction complete: ${this._results.local} local, ${this._results.upstream} upstream, ${this._results.failed} failed`);
        return this._results;
    }

    async _extractLegacyConfigs() {
        const configFiles = ['streamfinity-config.json', 'streamfinity-complete.json', 'StreamFinity-Full-Config.json'];

        for (const file of configFiles) {
            const src = path.join(this.legacyDir, file);
            if (fs.existsSync(src)) {
                const dest = path.join(this.outputDir, 'config', file);
                fs.copyFileSync(src, dest);
                this._results.local++;
                this._results.assets.push({ name: file, type: 'config', source: 'legacy' });
                this.log.debug(`Extracted legacy config: ${file}`);

                // Parse for StreamTory-specific features
                try {
                    const data = JSON.parse(fs.readFileSync(src, 'utf8'));
                    if (data.platforms?.streamtory) {
                        const featureFile = path.join(this.outputDir, 'config', 'streamtory-features.json');
                        fs.writeFileSync(featureFile, JSON.stringify({
                            extractedFrom: file,
                            extractedAt: new Date().toISOString(),
                            platform: data.platforms.streamtory,
                            features: data.features || {},
                            hosts: data.hosts || {}
                        }, null, 2));
                        this._results.local++;
                        this._results.assets.push({ name: 'streamtory-features.json', type: 'metadata', source: 'parsed' });
                    }
                } catch (_) {}
            }
        }
    }

    async _generateAnalyticsTemplates() {
        const templates = [
            {
                id: 'revenue-dashboard',
                name: 'Revenue Dashboard',
                type: 'dashboard',
                description: 'Real-time revenue tracking with gift breakdown',
                metrics: ['gifts', 'coins', 'diamonds', 'revenue_usd'],
                layout: {
                    type: 'grid',
                    columns: 3,
                    widgets: [
                        { type: 'stat-card', metric: 'total_revenue', position: { row: 0, col: 0, span: 3 } },
                        { type: 'line-chart', metric: 'revenue_over_time', position: { row: 1, col: 0, span: 2 } },
                        { type: 'pie-chart', metric: 'gift_breakdown', position: { row: 1, col: 2, span: 1 } },
                        { type: 'table', metric: 'top_gifters', position: { row: 2, col: 0, span: 3 } }
                    ]
                },
                refreshInterval: 5000
            },
            {
                id: 'engagement-tracker',
                name: 'Engagement Tracker',
                type: 'tracker',
                description: 'Live engagement metrics with trend analysis',
                metrics: ['viewers', 'likes', 'shares', 'comments', 'followers'],
                layout: {
                    type: 'grid',
                    columns: 4,
                    widgets: [
                        { type: 'stat-card', metric: 'current_viewers', position: { row: 0, col: 0 } },
                        { type: 'stat-card', metric: 'total_likes', position: { row: 0, col: 1 } },
                        { type: 'stat-card', metric: 'total_shares', position: { row: 0, col: 2 } },
                        { type: 'stat-card', metric: 'new_followers', position: { row: 0, col: 3 } },
                        { type: 'area-chart', metric: 'engagement_over_time', position: { row: 1, col: 0, span: 4 } }
                    ]
                },
                refreshInterval: 3000
            },
            {
                id: 'stream-summary',
                name: 'Stream Summary',
                type: 'summary',
                description: 'Post-stream analytics report',
                metrics: ['duration', 'peak_viewers', 'total_gifts', 'new_followers', 'avg_engagement'],
                layout: {
                    type: 'report',
                    sections: ['overview', 'engagement', 'revenue', 'growth', 'highlights']
                },
                exportFormats: ['json', 'csv', 'pdf']
            },
            {
                id: 'gift-leaderboard',
                name: 'Gift Leaderboard',
                type: 'leaderboard',
                description: 'Top gifters ranking with real-time updates',
                metrics: ['top_gifters', 'gift_count', 'gift_value'],
                config: { maxEntries: 50, showAvatar: true, animateChanges: true }
            },
            {
                id: 'viewer-heatmap',
                name: 'Viewer Heatmap',
                type: 'heatmap',
                description: 'Viewer activity patterns over stream duration',
                metrics: ['viewer_count_over_time', 'engagement_over_time', 'chat_activity'],
                config: { resolution: '1min', colorScheme: 'viridis' }
            },
            {
                id: 'growth-chart',
                name: 'Growth Chart',
                type: 'chart',
                description: 'Long-term follower and revenue growth tracking',
                metrics: ['followers_over_time', 'revenue_over_time', 'streams_count'],
                config: { periods: ['7d', '30d', '90d', '1y'], chartType: 'line' }
            }
        ];

        for (const tmpl of templates) {
            const dest = path.join(this.outputDir, 'templates', `${tmpl.id}.json`);
            fs.writeFileSync(dest, JSON.stringify(tmpl, null, 2));
            this._results.local++;
            this._results.assets.push({ name: `${tmpl.id}.json`, type: 'template', source: 'generated' });
        }

        // Write index
        const indexFile = path.join(this.outputDir, 'templates', '_index.json');
        fs.writeFileSync(indexFile, JSON.stringify({ templates: templates.map(t => ({ id: t.id, name: t.name, type: t.type })), count: templates.length }, null, 2));
    }

    async _generateOverlayTemplates() {
        const overlays = [
            {
                id: 'chat-overlay',
                name: 'Chat Overlay',
                type: 'chat',
                description: 'Customizable chat display for OBS/streaming software',
                config: {
                    maxMessages: 20,
                    fadeAfter: 30000,
                    fontSize: '14px',
                    fontFamily: 'Inter, sans-serif',
                    showBadges: true,
                    showGifts: true,
                    animation: 'slide-up',
                    theme: 'dark-transparent'
                },
                css: '.sf-chat { background: rgba(0,0,0,0.6); border-radius: 8px; padding: 8px; }'
            },
            {
                id: 'alert-overlay',
                name: 'Alert Overlay',
                type: 'alert',
                description: 'Gift and follow alert notifications',
                config: {
                    duration: 5000,
                    animation: 'bounce-in',
                    sound: true,
                    showAmount: true,
                    minGiftValue: 1,
                    position: 'top-center'
                }
            },
            {
                id: 'goal-bar',
                name: 'Goal Progress Bar',
                type: 'goal',
                description: 'Animated progress bar for stream goals',
                config: {
                    goalType: 'gifts',
                    targetValue: 100,
                    showPercentage: true,
                    showContributors: true,
                    animation: 'fill',
                    colors: { bg: '#1e1b4b', fill: '#6366f1', text: '#ffffff' }
                }
            },
            {
                id: 'event-ticker',
                name: 'Event Ticker',
                type: 'ticker',
                description: 'Scrolling event feed (follows, gifts, shares)',
                config: {
                    speed: 50,
                    direction: 'left',
                    eventTypes: ['follow', 'gift', 'share', 'like'],
                    separator: ' • ',
                    maxEvents: 50
                }
            }
        ];

        for (const overlay of overlays) {
            const dest = path.join(this.outputDir, 'overlays', `${overlay.id}.json`);
            fs.writeFileSync(dest, JSON.stringify(overlay, null, 2));
            this._results.local++;
            this._results.assets.push({ name: `${overlay.id}.json`, type: 'overlay', source: 'generated' });
        }
    }

    async _fetchUpstreamAssets() {
        if (!this.upstream.primary) return;

        const paths = [
            { path: '/api/v1/templates', dest: 'config/upstream-templates.json' },
            { path: '/api/v1/overlays', dest: 'config/upstream-overlays.json' }
        ];

        for (const item of paths) {
            try {
                const url = this.upstream.primary + item.path;
                this.log.debug(`Fetching upstream: ${url}`);
                const response = await axios.get(url, { timeout: 8000, validateStatus: s => s >= 200 && s < 400 });
                const dest = path.join(this.outputDir, item.dest);
                fs.writeFileSync(dest, typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2));
                this._results.upstream++;
                this._results.assets.push({ name: item.dest, type: 'upstream-data', source: 'upstream' });
            } catch (err) {
                this._results.failed++;
                this.log.debug(`Failed upstream: ${item.path} — ${err.message}`);
            }
        }
    }

    getResults() {
        return this._results;
    }
}

module.exports = StreamToryExtractor;
