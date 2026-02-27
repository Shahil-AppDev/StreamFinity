/**
 * StreamFinity Unified Asset Extractor
 * Orchestrates extraction from all 3 platforms + generates StreamFinity exclusive assets
 */

const fs = require('fs');
const path = require('path');
const Logger = require('../lib/Logger');
const TikFinityExtractor = require('./TikFinityExtractor');
const StreamToryExtractor = require('./StreamToryExtractor');
const StreamControlExtractor = require('./StreamControlExtractor');

class AssetExtractor {
    constructor(config) {
        this.config = config;
        this.log = new Logger('AssetExtractor');
        this.extractors = {
            tikfinity: new TikFinityExtractor(config),
            streamtory: new StreamToryExtractor(config),
            streamcontrol: new StreamControlExtractor(config)
        };
        this._lastRun = null;
        this._results = null;
    }

    /**
     * Run full extraction pipeline across all platforms
     */
    async extractAll() {
        this.log.info('Starting full asset extraction pipeline...');
        const startTime = Date.now();
        const results = { platforms: {}, streamfinity: null, duration: 0, timestamp: null };

        // Extract from all 3 platforms in parallel
        const [tf, st, sc] = await Promise.allSettled([
            this.extractors.tikfinity.extract(),
            this.extractors.streamtory.extract(),
            this.extractors.streamcontrol.extract()
        ]);

        results.platforms.tikfinity = tf.status === 'fulfilled' ? tf.value : { error: tf.reason?.message };
        results.platforms.streamtory = st.status === 'fulfilled' ? st.value : { error: st.reason?.message };
        results.platforms.streamcontrol = sc.status === 'fulfilled' ? sc.value : { error: sc.reason?.message };

        // Generate StreamFinity exclusive assets
        results.streamfinity = await this._generateStreamFinityExclusives();

        results.duration = Date.now() - startTime;
        results.timestamp = new Date().toISOString();
        results.totals = this._computeTotals(results);

        this._lastRun = results;
        this._results = results;

        // Write extraction report
        const reportPath = path.join(this.config.assetsDir, 'extraction-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

        this.log.success(`Full extraction complete in ${results.duration}ms — ${results.totals.total} assets (${results.totals.local} local, ${results.totals.upstream} upstream, ${results.totals.failed} failed)`);
        return results;
    }

    /**
     * Extract from a single platform
     */
    async extractPlatform(platform) {
        const extractor = this.extractors[platform];
        if (!extractor) throw new Error(`Unknown platform: ${platform}`);
        return extractor.extract();
    }

    /**
     * Generate StreamFinity-exclusive enhanced assets
     */
    async _generateStreamFinityExclusives() {
        const exclusiveDir = path.join(this.config.assetsDir, 'streamfinity');
        const dirs = ['branding', 'enhanced', 'exclusive', 'themes'];
        for (const d of dirs) {
            fs.mkdirSync(path.join(exclusiveDir, d), { recursive: true });
        }

        let count = 0;

        // Branding config
        const branding = {
            name: 'StreamFinity',
            tagline: 'Unified Multi-Platform Live Streaming',
            version: '1.0.0',
            colors: {
                primary: '#6366f1',
                secondary: '#8b5cf6',
                accent: '#ec4899',
                success: '#10b981',
                warning: '#f59e0b',
                error: '#ef4444',
                background: '#0f172a',
                surface: '#1e1b4b',
                text: '#e2e8f0'
            },
            fonts: {
                heading: 'Inter, system-ui, sans-serif',
                body: 'Inter, system-ui, sans-serif',
                mono: 'JetBrains Mono, Fira Code, monospace'
            },
            gradients: {
                primary: 'linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)',
                dark: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
                accent: 'linear-gradient(135deg, #f59e0b, #ec4899)'
            }
        };
        fs.writeFileSync(path.join(exclusiveDir, 'branding', 'config.json'), JSON.stringify(branding, null, 2));
        count++;

        // Enhanced features manifest
        const enhanced = {
            crossPlatformSync: { enabled: true, description: 'Sync state across TikFinity + StreamTory + StreamControl + StreamerBot' },
            unifiedChat: { enabled: true, description: 'Single chat view aggregating all platform messages' },
            aiVoices: { enabled: true, description: 'AI-powered TTS with multiple voices and languages' },
            advancedAnalytics: { enabled: true, description: 'Cross-platform analytics with ML-powered insights' },
            customAutomation: { enabled: true, description: 'Event-driven automation across all platforms' },
            multiStream: { enabled: true, description: 'Simultaneous streaming to multiple platforms' },
            overlayStudio: { enabled: true, description: 'Visual overlay editor with drag-and-drop' },
            rewardEconomy: { enabled: true, description: 'Unified point system across all platforms' }
        };
        fs.writeFileSync(path.join(exclusiveDir, 'enhanced', 'features.json'), JSON.stringify(enhanced, null, 2));
        count++;

        // Exclusive themes
        const themes = [
            { id: 'streamfinity-dark', name: 'StreamFinity Dark', type: 'dark', colors: branding.colors },
            { id: 'streamfinity-light', name: 'StreamFinity Light', type: 'light', colors: { ...branding.colors, background: '#f8fafc', surface: '#ffffff', text: '#0f172a' } },
            { id: 'neon-purple', name: 'Neon Purple', type: 'dark', colors: { ...branding.colors, primary: '#a855f7', accent: '#d946ef' } },
            { id: 'cyber-blue', name: 'Cyber Blue', type: 'dark', colors: { ...branding.colors, primary: '#06b6d4', secondary: '#0ea5e9', accent: '#22d3ee' } },
            { id: 'sunset-orange', name: 'Sunset Orange', type: 'dark', colors: { ...branding.colors, primary: '#f97316', secondary: '#fb923c', accent: '#fbbf24' } }
        ];
        for (const theme of themes) {
            fs.writeFileSync(path.join(exclusiveDir, 'themes', `${theme.id}.json`), JSON.stringify(theme, null, 2));
            count++;
        }

        // Platform integration manifest
        const manifest = {
            version: '1.0.0',
            generatedAt: new Date().toISOString(),
            platforms: ['tikfinity', 'streamtory', 'streamcontrol', 'streamerbot'],
            features: Object.keys(enhanced),
            themes: themes.map(t => t.id),
            endpoints: {
                assets: '/api/assets',
                loaders: '/api/loaders',
                unified: '/api/unified',
                pro: '/api/user/license',
                ws: '/ws'
            }
        };
        fs.writeFileSync(path.join(exclusiveDir, 'exclusive', 'manifest.json'), JSON.stringify(manifest, null, 2));
        count++;

        return { generated: count, assets: ['branding/config.json', 'enhanced/features.json', `themes (${themes.length})`, 'exclusive/manifest.json'] };
    }

    _computeTotals(results) {
        let local = 0, upstream = 0, failed = 0;
        for (const p of Object.values(results.platforms)) {
            if (p && !p.error) {
                local += p.local || 0;
                upstream += p.upstream || 0;
                failed += p.failed || 0;
            }
        }
        const sfCount = results.streamfinity?.generated || 0;
        return { local: local + sfCount, upstream, failed, total: local + upstream + sfCount };
    }

    getLastResults() {
        return this._lastRun;
    }
}

module.exports = AssetExtractor;
