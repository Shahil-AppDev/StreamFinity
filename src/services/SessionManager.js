/**
 * StreamFinity - Session Manager
 * Electron session configuration, CSP bypass, header manipulation
 */

const { session } = require('electron');
const { Logger } = require('../utils/logger');

class SessionManager {
    constructor(config) {
        this.log = new Logger('SessionManager');
        this.config = config;
    }

    configure() {
        const ses = session.defaultSession;

        this._configureHeaders(ses);
        this._configureCSP(ses);
        this._configureUserAgent(ses);

        this.log.success('Session configured');
    }

    _configureHeaders(ses) {
        ses.webRequest.onHeadersReceived({
            urls: [
                'https://*.tiktok.com/*',
                'https://accounts.spotify.com/*',
                'https://clienttoken.spotify.com/*',
                'https://api-partner.spotify.com/*',
                'https://*.easemob.com/*',
                'https://*.agora.io/*'
            ]
        }, (details, callback) => {
            // Remove CSP for TikTok pages
            if (details.url.startsWith('https://www.tiktok.com/')) {
                delete details.responseHeaders['content-security-policy'];
                delete details.responseHeaders['Content-Security-Policy'];
                delete details.responseHeaders['content-security-policy-report-only'];
                delete details.responseHeaders['Content-Security-Policy-Report-Only'];
            }

            // Fix CORS for Spotify
            if (details.url.includes('clienttoken.spotify.com') || details.url.includes('api-partner.spotify.com')) {
                delete details.responseHeaders['Access-Control-Allow-Origin'];
                delete details.responseHeaders['access-control-allow-origin'];
                details.responseHeaders['access-control-allow-origin'] = '*';
                details.responseHeaders['access-control-allow-credentials'] = 'true';
                details.responseHeaders['access-control-allow-methods'] = 'GET,POST,OPTIONS,PUT,DELETE,HEAD';
                details.responseHeaders['access-control-allow-headers'] = '*';
            }

            // Fix CORS for webcast
            if (details.url.includes('webcast')) {
                const key = details.responseHeaders['Access-Control-Allow-Headers'] ? 'Access-Control-Allow-Headers' : 'access-control-allow-headers';
                if (details.responseHeaders[key]) {
                    details.responseHeaders[key] = details.responseHeaders[key] + ',x-mssdk-info';
                } else {
                    details.responseHeaders['access-control-allow-headers'] = 'x-mssdk-info';
                }
            }

            callback({ responseHeaders: details.responseHeaders });
        });
    }

    _configureCSP(ses) {
        // Remove CSP restrictions for the main app
        ses.webRequest.onHeadersReceived({ urls: ['*://*/*'] }, (details, callback) => {
            if (details.responseHeaders) {
                delete details.responseHeaders['content-security-policy'];
                delete details.responseHeaders['Content-Security-Policy'];
            }
            callback({ responseHeaders: details.responseHeaders });
        });
    }

    _configureUserAgent(ses) {
        const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        ses.setUserAgent(ua);
    }
}

module.exports = SessionManager;
