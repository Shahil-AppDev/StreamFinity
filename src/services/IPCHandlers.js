/**
 * StreamFinity - IPC Handlers
 * All Electron IPC communication between main and renderer
 */

const { ipcMain } = require('electron');
const { Logger } = require('../utils/logger');

class IPCHandlers {
    constructor(app) {
        this.log = new Logger('IPC');
        this.app = app;
    }

    register() {
        this.log.info('Registering IPC handlers...');

        // ── Platform management ──
        ipcMain.handle('sf:switch-platform', async (_event, platform) => {
            return this.app.switchPlatform(platform);
        });

        ipcMain.handle('sf:get-platforms', async () => {
            return this.app.getPlatformList();
        });

        ipcMain.handle('sf:get-stats', async () => {
            return this.app.getUnifiedStats();
        });

        ipcMain.handle('sf:get-config', async () => {
            return this.app.configManager.config;
        });

        // ── StreamFinity API ──
        ipcMain.handle('sf:streamfinity:connect', async (_event, username) => {
            return this.app.platforms.streamfinity.connect(username);
        });

        ipcMain.handle('sf:streamfinity:disconnect', async () => {
            return this.app.platforms.streamfinity.disconnect();
        });

        ipcMain.handle('sf:streamfinity:stats', async () => {
            return this.app.platforms.streamfinity.getStats();
        });

        // ── StreamTory API ──
        ipcMain.handle('sf:streamtory:analytics', async (_event, range) => {
            return this.app.platforms.streamtory.getAnalytics(range);
        });

        ipcMain.handle('sf:streamtory:create-overlay', async (_event, config) => {
            return this.app.platforms.streamtory.createOverlay(config);
        });

        ipcMain.handle('sf:streamtory:export', async (_event, format) => {
            return this.app.platforms.streamtory.exportData(format);
        });

        // ── StreamControl API ──
        ipcMain.handle('sf:streamcontrol:create-poll', async (_event, options) => {
            return this.app.platforms.streamcontrol.createPoll(options);
        });

        ipcMain.handle('sf:streamcontrol:vote', async (_event, pollId, optionId, userId) => {
            return this.app.platforms.streamcontrol.votePoll(pollId, optionId, userId);
        });

        ipcMain.handle('sf:streamcontrol:start-game', async (_event, type, opts) => {
            return this.app.platforms.streamcontrol.startGame(type, opts);
        });

        ipcMain.handle('sf:streamcontrol:give-reward', async (_event, userId, reward) => {
            return this.app.platforms.streamcontrol.giveReward(userId, reward);
        });

        // ── StreamerBot API ──
        ipcMain.handle('sf:streamerbot:connect', async (_event, host, port) => {
            return this.app.platforms.streamerbot.connect(host, port);
        });

        ipcMain.handle('sf:streamerbot:disconnect', async () => {
            return this.app.platforms.streamerbot.disconnect();
        });

        ipcMain.handle('sf:streamerbot:do-action', async (_event, actionId, args) => {
            return this.app.platforms.streamerbot.doAction(actionId, args);
        });

        ipcMain.handle('sf:streamerbot:get-actions', async () => {
            return this.app.platforms.streamerbot.getActions();
        });

        ipcMain.handle('sf:streamerbot:send-message', async (_event, message, platform, opts) => {
            return this.app.platforms.streamerbot.sendMessage(message, platform, opts);
        });

        ipcMain.handle('sf:streamerbot:get-broadcaster', async () => {
            return this.app.platforms.streamerbot.getBroadcaster();
        });

        ipcMain.handle('sf:streamerbot:get-viewers', async () => {
            return this.app.platforms.streamerbot.getActiveViewers();
        });

        ipcMain.handle('sf:streamerbot:get-commands', async () => {
            return this.app.platforms.streamerbot.getCommands();
        });

        ipcMain.handle('sf:streamerbot:subscribe', async (_event, events) => {
            return this.app.platforms.streamerbot.subscribe(events);
        });

        ipcMain.handle('sf:streamerbot:execute-trigger', async (_event, name, args) => {
            return this.app.platforms.streamerbot.executeCodeTrigger(name, args);
        });

        ipcMain.handle('sf:streamerbot:stats', async () => {
            return this.app.platforms.streamerbot.getStats();
        });

        // ── System ──
        ipcMain.handle('sf:version', async () => {
            return this.app.configManager.get('app.version', '1.0.0');
        });

        this.log.success('IPC handlers registered');
    }
}

module.exports = IPCHandlers;
