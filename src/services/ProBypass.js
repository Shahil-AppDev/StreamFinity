/**
 * StreamFinity - Pro Bypass Service
 * Centralized license bypass logic for all platforms
 */

const { Logger } = require('../utils/logger');

class ProBypass {
    constructor() {
        this.log = new Logger('ProBypass');
    }

    /**
     * Returns the JavaScript to inject into the renderer process
     * to unlock all pro features across all platforms.
     */
    getInjectionScript() {
        return `
        (function() {
            'use strict';

            console.log('🚀 StreamFinity Unified Pro Mode Activated!');

            // ── Global StreamFinity object ──
            window.StreamFinity = {
                version: '1.0.0',
                mode: 'unified',
                platforms: {
                    streamfinity: { active: true, pro: true },
                    streamtory: { active: true, pro: true },
                    streamcontrol: { active: true, pro: true }
                },
                proMode: { enabled: true, lifetime: true, allFeatures: true }
            };

            // ── Force all pro variables ──
            const proVars = [
                'isPro', 'hasProLicense', 'proFeatures', 'licenseValid',
                'userIsPro', 'isPremium', 'hasPremium', 'subscribed',
                'premiumUser', 'isDeveloper', 'hasLifetimeLicense', 'lifetimePro',
                'streamfinityPro', 'streamtoryPro', 'streamcontrolPro', 'unifiedPro'
            ];
            proVars.forEach(v => { window[v] = true; });

            // ── Override license check functions ──
            const proFns = [
                'checkLicense', 'verifyPro', 'isProUser', 'hasValidLicense',
                'isStreamfinityPro', 'isStreamtoryPro', 'isStreamControlPro', 'isUnifiedPro'
            ];
            proFns.forEach(fn => { window[fn] = () => true; });
            window.getSubscriptionType = () => 'lifetime_pro';

            // ── Block alerts/confirms ──
            window.alert = function(msg) { console.log('[StreamFinity] Alert blocked:', msg); return false; };
            window.confirm = function() { return true; };

            // ── Override XMLHttpRequest ──
            const OrigXHR = window.XMLHttpRequest;
            window.XMLHttpRequest = function() {
                const xhr = new OrigXHR();
                const origOpen = xhr.open;
                xhr.open = function(method, url, ...args) {
                    if (url && (url.includes('/api/pro/') || url.includes('setUpgradeIntent') ||
                               url.includes('checkLicense') || url.includes('subscription'))) {
                        console.log('[StreamFinity] XHR blocked:', url);
                        return;
                    }
                    return origOpen.call(this, method, url, ...args);
                };
                return xhr;
            };

            // ── Override fetch ──
            const origFetch = window.fetch;
            window.fetch = function(url, options) {
                if (url && (url.includes('/api/pro/') || url.includes('setUpgradeIntent') ||
                           url.includes('checkLicense') || url.includes('subscription'))) {
                    console.log('[StreamFinity] Fetch blocked:', url);
                    return Promise.resolve(new Response(JSON.stringify({
                        success: true, isPro: true, subscriptionType: 'lifetime_pro',
                        platforms: { streamfinity: true, streamtory: true, streamcontrol: true }
                    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
                }
                return origFetch.call(this, url, options);
            };

            // ── Popup removal ──
            function removePopups() {
                const selectors = [
                    '[class*="modal"]', '[class*="popup"]', '[class*="dialog"]',
                    '[class*="overlay"]', '[class*="backdrop"]', '[role="dialog"]',
                    '[aria-modal="true"]'
                ];
                selectors.forEach(sel => {
                    document.querySelectorAll(sel).forEach(el => {
                        el.style.display = 'none';
                        el.remove();
                    });
                });

                document.querySelectorAll('*').forEach(el => {
                    const text = (el.textContent || '').toLowerCase();
                    if (text.includes('exclusively') || text.includes('pro member') ||
                        text.includes('streamfinity pro') || text.includes('streamtory pro') ||
                        text.includes('streamcontrol pro') || text.includes('subscribe') ||
                        text.includes('payment') || text.includes('upgrade') || text.includes('checkout')) {
                        el.style.display = 'none';
                        el.remove();
                    }
                });
            }

            removePopups();
            setInterval(removePopups, 100);
            const observer = new MutationObserver(removePopups);
            observer.observe(document.documentElement, { childList: true, subtree: true });

            // ── UI badge ──
            function addBadge() {
                if (document.getElementById('sf-pro-badge')) return;
                const badge = document.createElement('div');
                badge.id = 'sf-pro-badge';
                badge.style.cssText = 'position:fixed;top:10px;right:10px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:8px 14px;border-radius:8px;font-weight:bold;z-index:99999;font-size:13px;box-shadow:0 4px 15px rgba(99,102,241,0.3);pointer-events:none;';
                badge.textContent = '🚀 StreamFinity PRO';
                document.body.appendChild(badge);
            }
            if (document.body) addBadge();
            else document.addEventListener('DOMContentLoaded', addBadge);

            console.log('✨ StreamFinity Pro Bypass loaded');
        })();
        `;
    }

    /**
     * Configure session-level request blocking
     */
    configureSession(session) {
        session.webRequest.onBeforeRequest((details, callback) => {
            const url = details.url;
            if (url.includes('/api/pro/') || url.includes('setUpgradeIntent') ||
                url.includes('checkLicense') || url.includes('subscription/verify')) {
                this.log.debug('Blocked license request:', url);
                callback({ cancel: true });
                return;
            }
            callback({});
        });
    }
}

module.exports = ProBypass;
