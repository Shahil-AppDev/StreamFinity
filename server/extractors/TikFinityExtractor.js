/**
 * TikFinity Asset Extractor
 * Extracts assets from local tikfinity-source directory and upstream servers
 * 
 * Local sources:
 * - vendor/streamfinity-source/resources/app/scripts/ (bridge.js, closeonredirect.js, preload.js)
 * - vendor/streamfinity-source/resources/app/resources/ (icons, splash)
 * - vendor/streamfinity-source/resources/app/main.js (parse for upstream URLs)
 * - vendor/streamfinity-source/resources/app/index.js (host config)
 * 
 * Upstream sources:
 * - https://tikfinity.zerody.one/electron/* (dynamic scripts)
 * - https://tikfinity.zerody.one/extension/* (bridge scripts)
 * - https://tikfinity.zerody.one/img/* (branding)
 * - https://tikfinity.zerody.one/assets/* (overlays, sounds, gifts)
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Logger = require('../lib/Logger');

class TikFinityExtractor {
    constructor(config) {
        this.config = config;
        this.log = new Logger('TikFinityExtractor');
        this.sourceDir = path.resolve(config.assetsDir, '..', '..', 'vendor', 'streamfinity-source', 'resources', 'app');
        this.outputDir = path.join(config.assetsDir, 'tikfinity');
        this.upstream = config.upstream.tikfinity;
        this._results = { local: 0, upstream: 0, failed: 0, assets: [] };
    }

    async extract() {
        this.log.info('Starting TikFinity asset extraction...');
        this._results = { local: 0, upstream: 0, failed: 0, assets: [] };

        // Ensure output directories
        const dirs = ['electron', 'scripts', 'icons', 'ui', 'overlays', 'sounds', 'gifts', 'branding'];
        for (const d of dirs) {
            fs.mkdirSync(path.join(this.outputDir, d), { recursive: true });
        }

        // Phase 1: Extract local files
        await this._extractLocalScripts();
        await this._extractLocalIcons();
        await this._extractLocalConfigs();

        // Phase 2: Scrape upstream URLs found in source code
        await this._scrapeUpstreamAssets();

        // Phase 3: Discover and fetch known upstream paths
        await this._fetchKnownUpstreamPaths();

        this.log.success(`Extraction complete: ${this._results.local} local, ${this._results.upstream} upstream, ${this._results.failed} failed`);
        return this._results;
    }

    async _extractLocalScripts() {
        const scriptsDir = path.join(this.sourceDir, 'scripts');
        if (!fs.existsSync(scriptsDir)) {
            this.log.warn('Local scripts directory not found:', scriptsDir);
            return;
        }

        const scripts = ['bridge.js', 'closeonredirect.js', 'preload.js'];
        for (const script of scripts) {
            const src = path.join(scriptsDir, script);
            if (fs.existsSync(src)) {
                const dest = path.join(this.outputDir, 'scripts', script);
                fs.copyFileSync(src, dest);
                // Also copy to electron/ for serving via /electron/:filename
                fs.copyFileSync(src, path.join(this.outputDir, 'electron', script));
                this._results.local++;
                this._results.assets.push({ name: script, type: 'script', source: 'local', size: fs.statSync(src).size });
                this.log.debug(`Extracted local script: ${script}`);
            }
        }

        // Also extract main.js and index.js as reference
        for (const file of ['main.js', 'index.js']) {
            const src = path.join(this.sourceDir, file);
            if (fs.existsSync(src)) {
                const dest = path.join(this.outputDir, 'electron', file);
                fs.copyFileSync(src, dest);
                this._results.local++;
                this._results.assets.push({ name: file, type: 'script', source: 'local', size: fs.statSync(src).size });
            }
        }
    }

    async _extractLocalIcons() {
        const resourcesDir = path.join(this.sourceDir, 'resources');
        if (!fs.existsSync(resourcesDir)) return;

        const icons = ['install_icon.ico', 'install_splash.gif', 'streamfinity.ico'];
        for (const icon of icons) {
            const src = path.join(resourcesDir, icon);
            if (fs.existsSync(src)) {
                const dest = path.join(this.outputDir, 'icons', icon);
                fs.copyFileSync(src, dest);
                // Also copy to branding
                fs.copyFileSync(src, path.join(this.outputDir, 'branding', icon));
                this._results.local++;
                this._results.assets.push({ name: icon, type: 'icon', source: 'local', size: fs.statSync(src).size });
                this.log.debug(`Extracted local icon: ${icon}`);
            }
        }
    }

    async _extractLocalConfigs() {
        // Extract forge.config.js for build metadata
        const forgeConfig = path.join(this.sourceDir, 'forge.config.js');
        if (fs.existsSync(forgeConfig)) {
            fs.copyFileSync(forgeConfig, path.join(this.outputDir, 'electron', 'forge.config.js'));
            this._results.local++;
            this._results.assets.push({ name: 'forge.config.js', type: 'config', source: 'local' });
        }

        // Extract package.json for dependency info
        const pkgJson = path.join(this.sourceDir, 'package.json');
        if (fs.existsSync(pkgJson)) {
            fs.copyFileSync(pkgJson, path.join(this.outputDir, 'electron', 'original-package.json'));
            this._results.local++;
            this._results.assets.push({ name: 'original-package.json', type: 'config', source: 'local' });
        }
    }

    async _scrapeUpstreamAssets() {
        // Parse main.js for upstream URLs
        const mainJs = path.join(this.sourceDir, 'main.js');
        if (!fs.existsSync(mainJs)) return;

        const content = fs.readFileSync(mainJs, 'utf8');

        // Extract all URL patterns from source code
        const urlPatterns = content.match(/https?:\/\/[^\s'"`,)]+/g) || [];
        const uniqueUrls = [...new Set(urlPatterns)].filter(u =>
            u.includes('tikfinity') || u.includes('zerody') || u.includes('streamfinity')
        );

        // Save discovered URLs as metadata
        const urlsFile = path.join(this.outputDir, 'discovered-urls.json');
        fs.writeFileSync(urlsFile, JSON.stringify({ discoveredAt: new Date().toISOString(), urls: uniqueUrls }, null, 2));
        this._results.assets.push({ name: 'discovered-urls.json', type: 'metadata', source: 'parsed', count: uniqueUrls.length });
    }

    async _fetchKnownUpstreamPaths() {
        if (!this.upstream.primary) return;

        // Known upstream paths from source code analysis
        const paths = [
            { path: '/electron/main.js', dest: 'electron/upstream-main.js', type: 'script' },
            { path: '/electron/fetchhelper.js', dest: 'electron/fetchhelper.js', type: 'script' },
            { path: '/electron/closeonredirect.js', dest: 'electron/upstream-closeonredirect.js', type: 'script' },
            { path: '/electron/websocketserver.js', dest: 'electron/websocketserver.js', type: 'script' },
            { path: '/electron/keyboardlistener.js', dest: 'electron/keyboardlistener.js', type: 'script' },
            { path: '/extension/tiktok_live_bridge_electron.user.js', dest: 'scripts/upstream-bridge.js', type: 'script' },
            { path: '/img/streamfinity.ico', dest: 'branding/upstream-streamfinity.ico', type: 'icon' }
        ];

        for (const item of paths) {
            const urls = [this.upstream.primary, this.upstream.fallback].filter(Boolean);
            let fetched = false;

            for (const baseUrl of urls) {
                try {
                    const url = baseUrl + item.path;
                    this.log.debug(`Fetching upstream: ${url}`);
                    const response = await axios.get(url, {
                        timeout: 8000,
                        responseType: 'arraybuffer',
                        validateStatus: s => s >= 200 && s < 400
                    });

                    const dest = path.join(this.outputDir, item.dest);
                    fs.mkdirSync(path.dirname(dest), { recursive: true });
                    fs.writeFileSync(dest, response.data);
                    this._results.upstream++;
                    this._results.assets.push({ name: item.dest, type: item.type, source: 'upstream', size: response.data.length });
                    fetched = true;
                    break;
                } catch (err) {
                    this.log.debug(`Failed: ${baseUrl}${item.path} — ${err.message}`);
                }
            }

            if (!fetched) {
                this._results.failed++;
                this.log.warn(`Could not fetch: ${item.path}`);
            }
        }
    }

    getResults() {
        return this._results;
    }
}

module.exports = TikFinityExtractor;
