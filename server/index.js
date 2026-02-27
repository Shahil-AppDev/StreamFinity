/**
 * StreamFinity Unified Server
 * Main entry point — Express HTTP + WebSocket server
 *
 * Integrates:
 * - TikFinity assets & electron scripts
 * - StreamTory analytics & overlays
 * - StreamControl games & rewards
 * - StreamerBot WebSocket relay
 * - Pro bypass for all platforms
 * - Unified API gateway with caching
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');

const config = require('./config');
const Logger = require('./lib/Logger');
const MemoryCache = require('./lib/MemoryCache');
const AssetProxy = require('./lib/AssetProxy');
const handleWSRequest = require('./lib/WSHandler');
const MetricsCollector = require('./lib/MetricsCollector');
const AssetExtractor = require('./extractors/AssetExtractor');
const Database = require('./lib/Database');
const RedisCache = require('./lib/RedisCache');

const TikFinityLoader = require('./loaders/TikFinityLoader');
const StreamToryLoader = require('./loaders/StreamToryLoader');
const StreamControlLoader = require('./loaders/StreamControlLoader');

const createAssetRoutes = require('./routes/assets');
const createLoaderRoutes = require('./routes/loaders');
const createUnifiedRoutes = require('./routes/unified');
const createProRoutes = require('./routes/pro');
const createExtractionRoutes = require('./routes/extraction');
const createMonitoringRoutes = require('./routes/monitoring');
const createGiftRoutes = require('./routes/gifts');
const createCrowdControlRoutes = require('./routes/crowdcontrol');
const createAuthRoutes = require('./routes/auth');
const createGameRoutes = require('./routes/games');
const { handleGameWS, handleGameWSClose } = require('./lib/crowdcontrol/GameWSHandler');
const CrowdControlDB = require('./lib/crowdcontrol/CrowdControlDB');
const TikTokLiveService = require('./lib/TikTokLiveService');
const createTikTokRoutes = require('./routes/tiktok');
const createWidgetRoutes = require('./routes/widgets');
const createSpotifyRoutes = require('./routes/spotify');
const createViewerRoutes = require('./routes/viewers');
const RulesEngine = require('./lib/RulesEngine');
const createActionRoutes = require('./routes/actions');
const cookieParser = require('cookie-parser');

const log = new Logger('Server', { logDir: config.logsDir });
const startTime = Date.now();
const metrics = new MetricsCollector();
const db = new Database({ pgUri: config.pgUri });
const redis = new RedisCache({ redisUrl: config.redisUrl });
const ccDb = new CrowdControlDB(db.pool);

// ── Rules Engine (Actions & Events) ──
const rulesEngine = new RulesEngine({ db, redis, wsClients: null, log }); // wsClients set later

// ── Initialize Core Systems ──

const cache = new MemoryCache({
    maxEntries: config.cache.maxEntries,
    maxMemoryMB: config.cache.maxMemoryMB
});

const assetProxy = new AssetProxy(cache, config);
const extractor = new AssetExtractor(config);

const loaders = {
    tikfinity: new TikFinityLoader(assetProxy, config),
    streamtory: new StreamToryLoader(assetProxy, config),
    streamcontrol: new StreamControlLoader(assetProxy, config)
};

// ── Express App ──

const app = express();
app.set('trust proxy', 1); // Behind nginx

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] }));
app.use(compression());
app.use(morgan('short'));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(metrics.middleware());

const apiLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests' }
});
app.use('/api/', apiLimiter);

const assetLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.assetMax,
    standardHeaders: true,
    legacyHeaders: false
});

// ── WebSocket clients set (shared with routes) ──
const wsClients = new Set();

// ── TikTok LIVE Service ──
const tiktokService = new TikTokLiveService({ log, wsClients, db, metrics, rulesEngine });
rulesEngine.wsClients = wsClients; // Now that wsClients is defined

// ── Route context ──
const ctx = { assetProxy, loaders, config, log, startTime, wsClients, metrics, extractor, db, redis, tiktokService };

// ── Static asset serving ──
fs.mkdirSync(config.assetsDir, { recursive: true });
app.use('/static', assetLimiter, express.static(config.assetsDir, { maxAge: '1d' }));

const brandingDir = path.join(config.assetsDir, 'streamfinity', 'branding');
fs.mkdirSync(brandingDir, { recursive: true });
app.use('/branding', express.static(brandingDir, { maxAge: '7d' }));

// ── API Routes ──
app.use('/api/assets', createAssetRoutes(ctx));
app.use('/api/loaders', createLoaderRoutes(ctx));
app.use('/api/unified', createUnifiedRoutes(ctx));
app.use('/api/extraction', createExtractionRoutes(ctx));
app.use('/api/monitoring', createMonitoringRoutes(ctx));
app.use('/api/gifts', createGiftRoutes());
app.use('/api/crowdcontrol/games', createGameRoutes(ccDb));
app.use('/api/crowdcontrol', createCrowdControlRoutes(ccDb));
app.use('/api/auth', createAuthRoutes(ccDb));
app.use('/api/tiktok', createTikTokRoutes(tiktokService));
app.use('/api/sounds', require('./routes/sounds')(ctx));
app.use('/api/spotify', createSpotifyRoutes(ctx));
app.use('/api/viewers', createViewerRoutes(db));
app.use('/api', createActionRoutes(rulesEngine));

// ── Health endpoint ──
app.get('/health', async (_req, res) => {
    const checks = { server: true, postgresql: db.connected, redis: redis.connected };
    const ok = Object.values(checks).every(Boolean);
    res.status(ok ? 200 : 503).json({ status: ok ? 'healthy' : 'degraded', checks, uptime: Math.floor((Date.now() - startTime) / 1000) });
});

// ── Electron Script Serving (TikFinity compatibility) ──
app.get('/electron/:filename', async (req, res) => {
    const result = await loaders.tikfinity.getElectronScript(req.params.filename);
    if (result.success) {
        const ct = result.contentType || (req.params.filename.endsWith('.js') ? 'application/javascript' : 'application/octet-stream');
        res.set('Content-Type', ct);
        res.set('Cache-Control', 'no-cache');
        res.set('X-Asset-Source', result.source || 'proxy');
        return res.send(result.data);
    }
    res.status(404).json(result);
});

// ── Bridge Script (TikFinity compatibility) ──
app.get('/extension/:filename', async (req, res) => {
    const filename = req.params.filename;
    if (filename.includes('bridge')) {
        const result = await loaders.tikfinity.getBridgeScript();
        if (result.success) {
            res.set('Content-Type', 'application/javascript');
            res.set('Cache-Control', 'no-cache');
            return res.send(result.data);
        }
    }
    res.set('Content-Type', 'application/javascript');
    res.send("console.log('[StreamFinity] Extension loaded');window.isPro=()=>true;window.isPremium=()=>true;");
});

// ── Pro Bypass API (after specific routes, before catch-all) ──
app.use('/api', createProRoutes(ctx));

// ── UI static files ──
app.use('/ui', express.static(path.join(__dirname, 'public', 'ui'), { maxAge: 0, etag: false }));

// ── Gift images ──
app.use('/static/gifts', express.static(path.join(__dirname, 'public', 'static', 'gifts'), { maxAge: '30d' }));

// ── Sound Alerts ──
app.use('/sounds', express.static(path.join(__dirname, 'public', 'sounds'), { maxAge: 0, etag: false }));

// ── Widget Overlays (local StreamFinity widgets) ──
app.use('/widgets', express.static(path.join(__dirname, 'public', 'widgets'), { maxAge: 0, etag: false }));
app.use('/widget', createWidgetRoutes(ctx));

// ── CrowdControl Standalone Game Pages ──
const gamesHtml = path.join(__dirname, 'public', 'games.html');
app.get('/games', (_req, res) => res.sendFile(gamesHtml));
app.get('/games/:gameSlug', (req, res) => {
    const slug = req.params.gameSlug.replace(/[^a-z0-9-]/gi, '');
    res.send(require('fs').readFileSync(gamesHtml, 'utf8').replace(
        'const gameSlug = window.__GAME_ID__ || null;',
        `const gameSlug = "${slug}";`
    ));
});

// ── Session Invite/Join Links ──
app.get('/join/:code', (req, res) => {
    res.redirect(`/games?join=${encodeURIComponent(req.params.code)}`);
});
app.get('/invite/:code', (req, res) => {
    res.redirect(`/games?invite=${encodeURIComponent(req.params.code)}`);
});

// ── Share Links ──
app.get('/share/win/:sessionId', (req, res) => {
    res.redirect(`/games?share=win&session=${encodeURIComponent(req.params.sessionId)}`);
});
app.get('/share/achievement/:achievementId', (req, res) => {
    res.redirect(`/games?share=achievement&id=${encodeURIComponent(req.params.achievementId)}`);
});

// ── Main App (TikFinity-style SPA) ──
const appHtml = path.join(__dirname, 'public', 'app.html');
app.get('/', (_req, res) => res.sendFile(appHtml));
app.get('/tiktok/*', (_req, res) => res.sendFile(appHtml));

// ── Admin Dashboard (old) ──
app.get('/admin', (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── HTTP Server ──
const httpServer = http.createServer(app);

// ── WebSocket Server (StreamerBot relay) ──
const wss = new WebSocket.Server({ noServer: true });

httpServer.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url, 'http://localhost');
    if (url.pathname === '/ws' || url.pathname === '/' || url.pathname === '/ws/crowdcontrol') {
        wss.handleUpgrade(request, socket, head, (ws) => {
            ws._wsPath = url.pathname;
            wss.emit('connection', ws, request);
        });
    } else {
        socket.destroy();
    }
});

function broadcast(sender, data) {
    const msg = JSON.stringify(data);
    for (const client of wsClients) {
        if (client !== sender && client.readyState === WebSocket.OPEN) {
            client.send(msg);
        }
    }
}

wss.on('connection', (ws, req) => {
    const ip = req.socket.remoteAddress;
    log.info(`[WS] Client connected from ${ip}`);
    wsClients.add(ws);
    metrics.trackWSConnection(wsClients.size);

    ws.on('message', (raw) => {
        try {
            const data = JSON.parse(raw.toString());
            metrics.trackWSMessage();
            // Route CrowdControl game messages
            const gameTypes = ['join_game','leave_game','game_action','game_state_update','game_result','chat','create_room','find_match','cancel_match','player_ready','start_game','list_rooms','ping'];
            if (ws._wsPath === '/ws/crowdcontrol' || gameTypes.includes(data.type)) {
                handleGameWS(ws, data, broadcast);
            } else {
                handleWSRequest(ws, data, log, broadcast);
            }
        } catch (_) {
            ws.send(JSON.stringify({ status: 'error', error: 'Invalid JSON' }));
        }
    });

    ws.on('close', () => {
        wsClients.delete(ws);
        handleGameWSClose(ws);
        log.debug(`[WS] Client disconnected (${ip})`);
    });

    ws.on('error', (err) => {
        log.error(`[WS] Error:`, err.message);
        wsClients.delete(ws);
    });
});

// ── Start Server ──

async function start() {
    log.info('Initializing StreamFinity Unified Server...');

    // Connect to databases (with 5s timeout so server starts even if DBs are down)
    const withTimeout = (p, ms) => Promise.race([p, new Promise(r => setTimeout(() => r(false), ms))]);
    const [mongoOk, redisOk] = await Promise.all([
        withTimeout(db.connect().catch(e => { log.warn('PostgreSQL unavailable:', e.message); return false; }), 5000),
        withTimeout(redis.connect().catch(e => { log.warn('Redis unavailable:', e.message); return false; }), 5000)
    ]);
    if (mongoOk) {
        log.success('PostgreSQL connected');
        // Initialize CrowdControl tables
        try { ccDb.pool = db.pool; await ccDb.ensureTables(); log.success('CrowdControl tables ready'); }
        catch (e) { log.warn('CrowdControl tables init failed:', e.message); }
        // Initialize RulesEngine tables
        try { await rulesEngine.ensureTables(); }
        catch (e) { log.warn('RulesEngine tables init failed:', e.message); }
    }
    if (redisOk) log.success('Redis connected');

    // Initialize all loaders in parallel
    const results = await Promise.allSettled([
        loaders.tikfinity.initialize(),
        loaders.streamtory.initialize(),
        loaders.streamcontrol.initialize()
    ]);

    for (const [i, r] of results.entries()) {
        const name = ['TikFinity', 'StreamTory', 'StreamControl'][i];
        if (r.status === 'fulfilled') {
            log.success(`${name} loader initialized`);
        } else {
            log.warn(`${name} loader init failed: ${r.reason}`);
        }
    }

    httpServer.listen(config.httpPort, '0.0.0.0', () => {
        log.success(`HTTP server listening on port ${config.httpPort}`);
        log.success(`WebSocket server on same port (upgrade /ws)`);
        log.info(`Dashboard: http://localhost:${config.httpPort}/`);
        log.info(`API: http://localhost:${config.httpPort}/api/unified/status`);
    });
}

start().catch(err => {
    log.error('Fatal startup error:', err);
    process.exit(1);
});

// ── Graceful Shutdown ──
const shutdown = async (signal) => {
    log.info(`${signal} received — shutting down...`);
    httpServer.close();
    for (const client of wsClients) client.close();
    await db.close().catch(() => {});
    await redis.close().catch(() => {});
    log.info('Shutdown complete');
    process.exit(0);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
