/**
 * StreamFinity Server Configuration
 * Centralized config for all server components
 */

const path = require('path');
const isDev = process.argv.includes('--dev');

module.exports = {
    isDev,

    // Server ports
    httpPort: parseInt(process.env.SF_HTTP_PORT) || 3010,
    wsPort: parseInt(process.env.SF_WS_PORT) || 8090,

    // Database
    pgUri: process.env.DATABASE_URL || 'postgresql://streamfinity:streamfinity@127.0.0.1:5432/streamfinity',
    redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379',

    // CDN / Public URL
    cdnUrl: process.env.CDN_URL || 'https://tik.starline-agency.xyz',

    // Paths
    assetsDir: path.join(__dirname, 'assets'),
    cacheDir: path.join(__dirname, '.cache'),
    logsDir: path.join(__dirname, 'logs'),

    // Original upstream servers (source of truth for proxied assets)
    upstream: {
        tikfinity: {
            primary: 'https://tikfinity.zerody.one',
            fallback: 'http://tikfinity-origin.zerody.one',
            name: 'TikFinity'
        },
        streamtory: {
            primary: 'https://tiktory.app',
            fallback: null,
            name: 'StreamTory'
        },
        streamcontrol: {
            primary: null, // No known public server — assets served locally
            fallback: null,
            name: 'StreamControl'
        }
    },

    // Cache settings
    cache: {
        staticTTL: 24 * 60 * 60 * 1000,   // 24h for static assets (images, sounds, templates)
        dynamicTTL: 60 * 60 * 1000,        // 1h for dynamic content (API responses)
        scriptTTL: 15 * 60 * 1000,         // 15min for electron scripts (bridge.js, etc.)
        maxMemoryMB: 256,                   // Max in-memory cache size
        maxEntries: 5000
    },

    // Rate limiting
    rateLimit: {
        windowMs: 60 * 1000,   // 1 minute
        maxRequests: 200,       // per IP per window
        assetMax: 500           // higher limit for asset requests
    },

    // Security
    security: {
        apiKeys: (process.env.SF_API_KEYS || '').split(',').filter(Boolean),
        requireApiKey: false,   // Set true in production if needed
        corsOrigins: ['*']
    },

    // Pro bypass
    pro: {
        enabled: true,
        plan: 'pro',
        maxUsers: 999999,
        features: 'all'
    },

    // Electron scripts served to the client app
    electronScripts: [
        'main.js',
        'bridge.js',
        'fetchhelper.js',
        'closeonredirect.js',
        'websocketserver.js',
        'keyboardlistener.js'
    ]
};
