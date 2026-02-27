/**
 * StreamFinity - Preload Script
 * Secure bridge between main process and renderer
 * Exposes unified API for all 3 platforms via contextBridge
 */

const { contextBridge, ipcRenderer } = require('electron');

// ── StreamFinity Unified API ──
contextBridge.exposeInMainWorld('streamfinityAPI', {
    // Platform management
    switchPlatform: (platform) => ipcRenderer.invoke('sf:switch-platform', platform),
    getPlatforms: () => ipcRenderer.invoke('sf:get-platforms'),
    getStats: () => ipcRenderer.invoke('sf:get-stats'),
    getConfig: () => ipcRenderer.invoke('sf:get-config'),
    getVersion: () => ipcRenderer.invoke('sf:version'),

    // Events
    onPlatformSwitch: (callback) => {
        ipcRenderer.on('sf:platform-switched', (_event, data) => callback(data));
    },
    onStatsUpdate: (callback) => {
        ipcRenderer.on('sf:stats-update', (_event, data) => callback(data));
    }
});

// ── StreamFinity Platform API (live, chat, gifts) ──
contextBridge.exposeInMainWorld('streamfinity', {
    connect: (username) => ipcRenderer.invoke('sf:streamfinity:connect', username),
    disconnect: () => ipcRenderer.invoke('sf:streamfinity:disconnect'),
    getStats: () => ipcRenderer.invoke('sf:streamfinity:stats'),

    onChat: (callback) => {
        ipcRenderer.on('sf:streamfinity:chat', (_event, msg) => callback(msg));
    },
    onGift: (callback) => {
        ipcRenderer.on('sf:streamfinity:gift', (_event, gift) => callback(gift));
    }
});

// ── StreamTory Platform API (analytics, overlays) ──
contextBridge.exposeInMainWorld('streamtory', {
    getAnalytics: (range) => ipcRenderer.invoke('sf:streamtory:analytics', range),
    createOverlay: (config) => ipcRenderer.invoke('sf:streamtory:create-overlay', config),
    exportData: (format) => ipcRenderer.invoke('sf:streamtory:export', format),

    onOverlayCreated: (callback) => {
        ipcRenderer.on('sf:streamtory:overlay-created', (_event, data) => callback(data));
    },
    onAlert: (callback) => {
        ipcRenderer.on('sf:streamtory:alert', (_event, data) => callback(data));
    }
});

// ── StreamControl Platform API (polls, games, rewards) ──
contextBridge.exposeInMainWorld('streamcontrol', {
    createPoll: (options) => ipcRenderer.invoke('sf:streamcontrol:create-poll', options),
    vote: (pollId, optionId, userId) => ipcRenderer.invoke('sf:streamcontrol:vote', pollId, optionId, userId),
    startGame: (type, opts) => ipcRenderer.invoke('sf:streamcontrol:start-game', type, opts),
    giveReward: (userId, reward) => ipcRenderer.invoke('sf:streamcontrol:give-reward', userId, reward),

    onPollCreated: (callback) => {
        ipcRenderer.on('sf:streamcontrol:poll-created', (_event, data) => callback(data));
    },
    onGameStarted: (callback) => {
        ipcRenderer.on('sf:streamcontrol:game-started', (_event, data) => callback(data));
    }
});

// ── StreamerBot Platform API (actions, chat, events, viewers) ──
contextBridge.exposeInMainWorld('streamerbot', {
    // Connection
    connect: (host, port) => ipcRenderer.invoke('sf:streamerbot:connect', host, port),
    disconnect: () => ipcRenderer.invoke('sf:streamerbot:disconnect'),
    getStats: () => ipcRenderer.invoke('sf:streamerbot:stats'),

    // Actions
    getActions: () => ipcRenderer.invoke('sf:streamerbot:get-actions'),
    doAction: (actionId, args) => ipcRenderer.invoke('sf:streamerbot:do-action', actionId, args),

    // Chat
    sendMessage: (message, platform, opts) => ipcRenderer.invoke('sf:streamerbot:send-message', message, platform, opts),

    // Data
    getBroadcaster: () => ipcRenderer.invoke('sf:streamerbot:get-broadcaster'),
    getViewers: () => ipcRenderer.invoke('sf:streamerbot:get-viewers'),
    getCommands: () => ipcRenderer.invoke('sf:streamerbot:get-commands'),

    // Events
    subscribe: (events) => ipcRenderer.invoke('sf:streamerbot:subscribe', events),
    executeTrigger: (name, args) => ipcRenderer.invoke('sf:streamerbot:execute-trigger', name, args),

    // Event listeners
    onEvent: (callback) => {
        ipcRenderer.on('sf:streamerbot:event', (_event, data) => callback(data));
    },
    onConnected: (callback) => {
        ipcRenderer.on('sf:streamerbot:connected', (_event, data) => callback(data));
    },
    onDisconnected: (callback) => {
        ipcRenderer.on('sf:streamerbot:disconnected', (_event, data) => callback(data));
    }
});

console.log('[StreamFinity] Preload script ready — APIs: streamfinityAPI, streamfinity, streamtory, streamcontrol, streamerbot');
