/**
 * StreamFinity - Configuration Manager
 * Centralized config loading and management
 */

const fs = require('fs');
const path = require('path');
const { Logger } = require('../utils/logger');

class ConfigManager {
    constructor(basePath) {
        this.log = new Logger('ConfigManager');
        this.basePath = basePath;
        this.config = {};
        this.configPath = path.join(basePath, 'config.json');
    }

    load() {
        try {
            if (fs.existsSync(this.configPath)) {
                const raw = fs.readFileSync(this.configPath, 'utf8');
                this.config = JSON.parse(raw);
                this.log.success('Configuration loaded from', this.configPath);
            } else {
                this.log.warn('Config not found, using defaults');
                this.config = this.getDefaults();
                this.save();
            }
        } catch (err) {
            this.log.error('Failed to load config:', err.message);
            this.config = this.getDefaults();
        }
        return this.config;
    }

    save() {
        try {
            fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf8');
            this.log.info('Configuration saved');
        } catch (err) {
            this.log.error('Failed to save config:', err.message);
        }
    }

    get(key, defaultValue = null) {
        const keys = key.split('.');
        let val = this.config;
        for (const k of keys) {
            if (val == null || typeof val !== 'object') return defaultValue;
            val = val[k];
        }
        return val !== undefined ? val : defaultValue;
    }

    set(key, value) {
        const keys = key.split('.');
        let obj = this.config;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!obj[keys[i]] || typeof obj[keys[i]] !== 'object') {
                obj[keys[i]] = {};
            }
            obj = obj[keys[i]];
        }
        obj[keys[keys.length - 1]] = value;
        this.save();
    }

    getDefaults() {
        return {
            app: {
                name: 'StreamFinity',
                version: '1.0.0',
                mode: 'unified'
            },
            platforms: {
                streamfinity: { enabled: true, autoStart: true },
                streamtory: { enabled: true, autoStart: true },
                streamcontrol: { enabled: true, autoStart: true }
            },
            hosts: {
                primary: 'https://streamfinity.zerody.one',
                fallback: 'http://streamfinity-origin.zerody.one',
                api: 'http://localhost:8080',
                websocket: 'ws://localhost:8081'
            },
            ui: {
                theme: 'dark',
                colors: {
                    primary: '#6366f1',
                    secondary: '#8b5cf6',
                    accent: '#ec4899'
                }
            },
            integrations: {
                tiktok: { enabled: true },
                discord: { enabled: false },
                obs: { enabled: false, port: 4444 }
            },
            pro: {
                enabled: true,
                lifetime: true,
                bypassLicense: true
            }
        };
    }
}

module.exports = ConfigManager;
