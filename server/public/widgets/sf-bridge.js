/**
 * StreamFinity Widget Bridge v3
 * Shared WebSocket bridge for all StreamFinity widgets.
 * Connects to the server WS, dispatches events to widget code.
 */
(function () {
    'use strict';
    var WS_URL = (location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + location.host + '/ws';
    var params = new URLSearchParams(location.search);
    window.SF = window.SF || {};
    SF.channelId = params.get('cid') || '0';
    SF.screenId = params.get('screen') || '1';
    SF.widgetId = location.pathname.split('/').filter(Boolean).pop() || 'unknown';
    SF.preview = params.has('preview');
    SF.settings = JSON.parse(localStorage.getItem('sf_widget_' + SF.widgetId) || '{}');

    var cbs = {};
    var ws = null;
    var reconnectDelay = 2000;

    SF.on = function (event, fn) {
        if (!cbs[event]) cbs[event] = [];
        cbs[event].push(fn);
    };
    SF.off = function (event, fn) {
        if (!cbs[event]) return;
        cbs[event] = cbs[event].filter(function (f) { return f !== fn; });
    };
    SF.emit = function (event, data) {
        if (ws && ws.readyState === 1) {
            ws.send(JSON.stringify({ type: 'widget_event', event: event, data: data, widgetId: SF.widgetId }));
        }
    };
    SF.dispatch = function (event, data) {
        if (cbs[event]) cbs[event].forEach(function (fn) { try { fn(data); } catch (e) { console.warn('[SF]', e); } });
    };

    function connect() {
        try {
            ws = new WebSocket(WS_URL);
            ws.onopen = function () {
                console.info('[SF Bridge] Connected');
                ws.send(JSON.stringify({ type: 'widget_register', widgetId: SF.widgetId, channelId: SF.channelId }));
                SF.dispatch('connect');
            };
            ws.onmessage = function (e) {
                try {
                    var msg = JSON.parse(e.data);
                    // Server sends: { event: { source, type }, data: {...} }
                    // or simple:    { event: "string", data: {...} }
                    // or legacy:    { type: "string", data: {...} }
                    var ev = msg.event;
                    var d = msg.data || msg;
                    if (ev && typeof ev === 'object') {
                        // TikTokLiveService format: { event: { source: "tiktok", type: "gift" }, data: {...} }
                        var evType = ev.type;
                        if (evType) {
                            SF.dispatch(evType, d);
                            // Also dispatch with source prefix: "tiktok:gift"
                            if (ev.source) SF.dispatch(ev.source + ':' + evType, d);
                        }
                    } else if (ev && typeof ev === 'string') {
                        SF.dispatch(ev, d);
                    } else if (msg.type && typeof msg.type === 'string') {
                        SF.dispatch(msg.type, d);
                    }
                } catch (_) { }
            };
            ws.onclose = function () { setTimeout(connect, reconnectDelay); };
            ws.onerror = function () { };
        } catch (_) { setTimeout(connect, reconnectDelay + 3000); }
    }

    connect();

    // Preview mode: fake events for testing
    if (SF.preview) {
        SF._fakeChat = function (user, msg) { SF.dispatch('chat', { uniqueId: user, comment: msg, userId: Math.random().toString(36).substr(2, 8) }); };
        SF._fakeGift = function (user, gift, coins, count) { SF.dispatch('gift', { uniqueId: user, giftName: gift || 'Rose', diamondCount: coins || 1, repeatCount: count || 1, userId: Math.random().toString(36).substr(2, 8) }); };
        SF._fakeFollow = function (user) { SF.dispatch('follow', { uniqueId: user || 'new_follower' }); };
        SF._fakeLike = function (user, count) { SF.dispatch('like', { uniqueId: user || 'liker', likeCount: count || 1, totalLikeCount: Math.floor(Math.random() * 10000) }); };
        SF._fakeShare = function (user) { SF.dispatch('share', { uniqueId: user || 'sharer' }); };
        SF._fakeViewerCount = function (n) { SF.dispatch('roomUser', { viewerCount: n || Math.floor(50 + Math.random() * 500) }); };
    }
})();
