const path = require('path');
const StreamFinityApp = require('./src/core/StreamFinityApp');

// ── Global state ──
let sfApp = null;
let mainWindow = null;
let powerSaveBlockerId = null;

// ── Bootstrap ──
async function bootstrap() {
    try {
        // 1. Create and initialize the app orchestrator
        sfApp = new StreamFinityApp(__dirname);
        await sfApp.initialize();

        // 2. Electron lifecycle
        app.whenReady().then(onReady);

        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') app.quit();
        });

        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) onReady();
        });

        app.on('before-quit', async () => {
            if (powerSaveBlockerId) powerSaveBlocker.stop(powerSaveBlockerId);
            if (sfApp) await sfApp.shutdown();
        });

        app.setAsDefaultProtocolClient('streamfinity');

    } catch (err) {
        console.error('[StreamFinity] Fatal:', err);
        dialog.showErrorBox('StreamFinity Error', 'Initialization failed:\n' + err.message);
        app.quit();
    }
}

// ── Called when Electron is ready ──
function onReady() {
    // Configure session (headers, CSP bypass, pro bypass)
    sfApp.configureSession(session.defaultSession);

    // Create the main window
    createMainWindow();
}

// ── Window creation ──
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1600,
        height: 1000,
        minWidth: 1200,
        minHeight: 800,
        show: false,
        backgroundColor: '#1a1a1a',
        icon: path.join(__dirname, 'assets', 'streamfinity.ico'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            webSecurity: true,
            allowRunningInsecureContent: false,
            backgroundThrottling: false,
            preload: path.join(__dirname, 'preload.js')
        },
        title: 'StreamFinity - Unified Multi-Platform Streaming',
        frame: true
    });

    sfApp.mainWindow = mainWindow;

    // Inject pro bypass into renderer
    sfApp.injectBypass(mainWindow.webContents);

    // Block payment popups
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.includes('checkout') || url.includes('payment') || url.includes('subscribe')) {
            return { action: 'deny' };
        }
        return { action: 'deny' };
    });

    // Load the target URL
    const targetUrl = sfApp.getTargetURL();
    mainWindow.loadURL(targetUrl).catch(err => {
        console.error('[StreamFinity] Load failed:', err);
        dialog.showErrorBox('StreamFinity Error', 'Failed to load. Check your internet connection.');
        app.quit();
    });

    // Window events
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.maximize();
        powerSaveBlockerId = powerSaveBlocker.start('prevent-display-sleep');
    });

    mainWindow.webContents.on('did-fail-load', (_event, errorCode, desc) => {
        console.error(`[StreamFinity] Load error ${errorCode}: ${desc}`);
    });

    mainWindow.webContents.on('will-navigate', (event, url) => {
        if (url.includes('checkout') || url.includes('payment') || url.includes('subscribe')) {
            event.preventDefault();
        }
    });

    mainWindow.on('closed', () => { mainWindow = null; });
}

// ── Start ──
bootstrap();
