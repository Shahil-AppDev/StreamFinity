/**
 * StreamFinity - Main Application Orchestrator
 * Initializes and coordinates all 3 platforms
 */

const path = require('path');
const { Logger } = require('../utils/logger');
const EventBus = require('./EventBus');
const ConfigManager = require('./ConfigManager');
const StreamFinityPlatform = require('../platforms/StreamFinity');
const StreamToryPlatform = require('../platforms/StreamTory');
const StreamControlPlatform = require('../platforms/StreamControl');
const StreamerBotPlatform = require('../platforms/StreamerBot');
const ProBypass = require('../services/ProBypass');
const SessionManager = require('../services/SessionManager');
const IPCHandlers = require('../services/IPCHandlers');

class StreamFinityApp {
    constructor(basePath) {
        this.log = new Logger('App');
        this.basePath = basePath;

        // Core systems
        this.eventBus = new EventBus();
        this.configManager = new ConfigManager(basePath);
        this.proBypass = new ProBypass();

        // Platforms (initialized later)
        this.platforms = {};
        this.activePlatform = 'streamfinity';

        // Electron references (set externally)
        this.mainWindow = null;
    }

    /**
     * Initialize the entire application
     */
    async initialize() {
        this.log.start('StreamFinity Unified Platform v1.0.0');

        // 1. Load configuration
        this.configManager.load();

        // 2. Initialize platforms
        await this._initPlatforms();

        // 3. Register IPC handlers
        const ipc = new IPCHandlers(this);
        ipc.register();

        // 4. Configure session (pro bypass + headers)
        this.sessionManager = new SessionManager(this.configManager.config);

        this.log.success('All systems initialized');
        this.log.info(`Platforms: ${Object.keys(this.platforms).join(', ')}`);

        return { success: true, platforms: Object.keys(this.platforms) };
    }

    /**
     * Called after app.whenReady() — configures Electron session
     */
    configureSession(electronSession) {
        this.sessionManager.configure();
        this.proBypass.configureSession(electronSession);
        this.log.success('Electron session configured');
    }

    /**
     * Inject pro bypass into a BrowserWindow
     */
    injectBypass(webContents) {
        webContents.on('did-start-loading', () => {
            webContents.executeJavaScript(this.proBypass.getInjectionScript()).catch(err => {
                this.log.error('Bypass injection failed:', err.message);
            });
        });
    }

    // ── Platform management ──

    async _initPlatforms() {
        const config = this.configManager.config;

        this.platforms.streamfinity = new StreamFinityPlatform(this.eventBus, config);
        this.platforms.streamtory = new StreamToryPlatform(this.eventBus, config);
        this.platforms.streamcontrol = new StreamControlPlatform(this.eventBus, config);
        this.platforms.streamerbot = new StreamerBotPlatform(this.eventBus, config);

        for (const [key, platform] of Object.entries(this.platforms)) {
            const enabled = this.configManager.get(`platforms.${key}.enabled`, true);
            if (enabled) {
                try {
                    await platform.initialize();
                } catch (err) {
                    this.log.error(`Failed to init ${key}:`, err.message);
                }
            }
        }
    }

    switchPlatform(platformId) {
        if (!this.platforms[platformId]) {
            return { success: false, error: `Unknown platform: ${platformId}` };
        }
        this.activePlatform = platformId;
        this.eventBus.setState('activePlatform', platformId, 'user');
        this.log.info(`Switched to ${this.platforms[platformId].name}`);
        return { success: true, platform: platformId };
    }

    getPlatformList() {
        return Object.entries(this.platforms).map(([id, p]) => ({
            id,
            name: p.name,
            active: id === this.activePlatform,
            features: p.features
        }));
    }

    getUnifiedStats() {
        const stats = { timestamp: new Date().toISOString(), activePlatform: this.activePlatform, platforms: {} };
        for (const [key, platform] of Object.entries(this.platforms)) {
            stats.platforms[key] = platform.getStats();
        }
        return stats;
    }

    /**
     * Get the unified API object (for global exposure)
     */
    getUnifiedAPI() {
        return {
            switchPlatform: (id) => this.switchPlatform(id),
            getPlatforms: () => this.getPlatformList(),
            getStats: () => this.getUnifiedStats(),
            streamfinity: this.platforms.streamfinity.getAPI(),
            streamtory: this.platforms.streamtory.getAPI(),
            streamcontrol: this.platforms.streamcontrol.getAPI()
        };
    }

    /**
     * Get the host URL to load
     */
    getTargetURL() {
        return this.configManager.get('hosts.primary', 'https://streamfinity.zerody.one');
    }

    /**
     * Graceful shutdown
     */
    async shutdown() {
        this.log.info('Shutting down StreamFinity...');
        for (const platform of Object.values(this.platforms)) {
            await platform.shutdown();
        }
        this.log.info('Goodbye!');
    }
}

module.exports = StreamFinityApp;
