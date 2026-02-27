const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const PORT = 3010;
const WS_PORT = 8090;

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['DNT', 'User-Agent', 'X-Requested-With', 'If-Modified-Since', 'Cache-Control', 'Content-Type', 'Range', 'X-StreamFinity-Version', 'X-StreamFinity-User']
}));
app.use(morgan('combined'));
app.use(express.json());

// StreamFinity Pro Responses
const proResponse = {
    success: true,
    isPro: true,
    isPremium: true,
    plan: 'pro',
    maxUsers: 999999,
    features: 'all',
    licenseValid: true,
    expired: false,
    trial: false,
    needsUpgrade: false,
    paid: true,
    subscription: 'pro',
    server: 'tik.starline-agency.xyz',
    unlimited: true
};

// Main page
app.get('/', (req, res) => {
    console.log('[StreamFinity] Access from:', req.ip);
    res.send(`<!DOCTYPE html>
<html>
<head>
    <title>StreamFinity Pro</title>
    <style>
        body { font-family: Arial, sans-serif; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-align: center; padding: 50px; margin: 0; }
        .container { background: rgba(0,0,0,0.3); padding: 40px; border-radius: 20px; backdrop-filter: blur(10px); max-width: 800px; margin: 0 auto; }
        .pro-badge { background: linear-gradient(135deg, #f59e0b, #ec4899); color: white; padding: 15px 30px; border-radius: 50px; font-weight: bold; font-size: 24px; margin-bottom: 20px; display: inline-block; }
        .status { background: rgba(0,255,0,0.15); padding: 20px; border-radius: 10px; margin: 20px 0; border: 2px solid #10b981; }
        .feature { background: rgba(255,255,255,0.1); padding: 15px; margin: 10px 0; border-radius: 10px; text-align: left; }
        h1 { color: #10b981; font-size: 42px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="pro-badge">STREAMFINITY PRO</div>
        <h1>All Features Unlocked</h1>
        <div class="status">
            <h3>STATUS: ACTIVE</h3>
            <p><strong>Server:</strong> tik.starline-agency.xyz</p>
            <p><strong>License:</strong> PRO UNLIMITED</p>
            <p><strong>Platforms:</strong> StreamFinity + StreamTory + StreamControl + StreamerBot</p>
            <p><strong>WebSocket:</strong> ws://live.starline-agency.xyz:${WS_PORT}/</p>
        </div>
        <div style="text-align: left; max-width: 600px; margin: 30px auto;">
            <div class="feature">StreamFinity: TikTok LIVE connection, chat, gifts</div>
            <div class="feature">StreamTory: Analytics, overlays, alerts</div>
            <div class="feature">StreamControl: Polls, games, rewards</div>
            <div class="feature">StreamerBot: Twitch/YouTube/Kick automation</div>
            <div class="feature">Multi-Accounts: Unlimited</div>
            <div class="feature">Premium Overlays: All Unlocked</div>
            <div class="feature">AI Voices + TTS: Unlimited</div>
            <div class="feature">Custom Commands: Unlimited</div>
        </div>
    </div>
<script>
console.log('[StreamFinity] Pro Mode Active');
window.isPro = () => true;
window.isPremium = () => true;
window.hasLicense = () => true;
window.needsPayment = () => false;
localStorage.setItem('streamfinity_license', 'pro_unlimited');
localStorage.setItem('streamfinity_plan', 'pro');
</script>
</body>
</html>`);
});

// API Routes
app.get('/api/user/license', (req, res) => {
    console.log('[StreamFinity] License API called');
    res.json(proResponse);
});

app.get('/api/user/info', (req, res) => {
    console.log('[StreamFinity] User Info API called');
    res.json({
        ...proResponse,
        user: { id: 'PRO_USER', username: 'StreamFinityPro', plan: 'pro', features: ['all'] }
    });
});

app.get('/api/payment/status', (req, res) => {
    res.json({ ...proResponse, paid: true, subscription: 'pro', nextBilling: null });
});

app.get('/api/features/list', (req, res) => {
    res.json({
        success: true,
        features: [
            'multi_accounts', 'premium_overlays', 'ai_voices', 'tts_unlimited',
            'sound_alerts', 'actions_events', 'custom_commands', 'analytics',
            'no_watermarks', 'priority_support', 'streamfinity', 'streamtory',
            'streamcontrol', 'streamerbot'
        ],
        all: true
    });
});

// Extension/Electron files
app.get('/extension/tiktok_live_bridge_electron.user.js', (req, res) => {
    console.log('[StreamFinity] Bridge JS requested');
    res.set('Content-Type', 'application/javascript');
    res.send(`
console.log('[StreamFinity] Bridge Activated');
window.isPro = () => true;
window.isPremium = () => true;
window.hasLicense = () => true;
setInterval(() => {
    document.querySelectorAll('.modal, .dialog, .popup, [class*="upgrade"], [class*="payment"]').forEach(el => el.remove());
}, 200);
`);
});

app.get('/electron/:filename', (req, res) => {
    console.log('[StreamFinity] Electron file requested:', req.params.filename);
    res.set('Content-Type', 'application/javascript');
    res.send(`console.log('[StreamFinity] Module loaded: ${req.params.filename}');`);
});

// Catch-all (must be last)
app.use((req, res) => {
    if (req.path.includes('/api/')) return res.json(proResponse);
    res.redirect('/');
});

// ── HTTP Server ──
const httpServer = http.createServer(app);
httpServer.listen(PORT, () => {
    console.log(`[StreamFinity] HTTP server on port ${PORT}`);
});

// ── WebSocket Server (for StreamerBot relay) ──
const wss = new WebSocket.Server({ port: WS_PORT });

// Connected StreamFinity clients
const clients = new Set();

wss.on('connection', (ws, req) => {
    const ip = req.socket.remoteAddress;
    console.log(`[StreamFinity WS] Client connected from ${ip}`);
    clients.add(ws);

    ws.on('message', (raw) => {
        try {
            const data = JSON.parse(raw.toString());
            handleWSRequest(ws, data);
        } catch (err) {
            ws.send(JSON.stringify({ status: 'error', error: 'Invalid JSON' }));
        }
    });

    ws.on('close', () => {
        clients.delete(ws);
        console.log(`[StreamFinity WS] Client disconnected (${ip})`);
    });

    ws.on('error', (err) => {
        console.error(`[StreamFinity WS] Error:`, err.message);
        clients.delete(ws);
    });
});

function handleWSRequest(ws, data) {
    const { request, id } = data;

    switch (request) {
        case 'Subscribe':
            ws.send(JSON.stringify({ status: 'ok', id, events: data.events || {} }));
            break;

        case 'UnSubscribe':
            ws.send(JSON.stringify({ status: 'ok', id, events: data.events || {} }));
            break;

        case 'GetInfo':
            ws.send(JSON.stringify({
                status: 'ok', id,
                info: {
                    instanceId: 'streamfinity-server',
                    name: 'StreamFinity Server',
                    version: '1.0.0',
                    os: 'linux',
                    connected: true
                }
            }));
            break;

        case 'GetActions':
            ws.send(JSON.stringify({
                status: 'ok', id,
                actions: [
                    { id: 'sf-pro-bypass', name: 'StreamFinity Pro Bypass', enabled: true },
                    { id: 'sf-overlay-trigger', name: 'Trigger Overlay', enabled: true },
                    { id: 'sf-chat-relay', name: 'Chat Relay', enabled: true },
                    { id: 'sf-alert-trigger', name: 'Trigger Alert', enabled: true }
                ],
                count: 4
            }));
            break;

        case 'DoAction':
            console.log(`[StreamFinity WS] DoAction: ${data.action?.name || data.action?.id}`);
            ws.send(JSON.stringify({ status: 'ok', id }));
            // Broadcast action to all other clients
            broadcast(ws, { event: { source: 'StreamFinity', type: 'ActionExecuted' }, data: data.action });
            break;

        case 'GetBroadcaster':
            ws.send(JSON.stringify({
                status: 'ok', id,
                platforms: {
                    tiktok: { broadcastUser: 'StreamFinityPro', broadcastUserId: 'sf-server' }
                },
                connected: ['tiktok'],
                disconnected: []
            }));
            break;

        case 'GetActiveViewers':
            ws.send(JSON.stringify({ status: 'ok', id, count: 0, viewers: [] }));
            break;

        case 'GetCommands':
            ws.send(JSON.stringify({ status: 'ok', id, commands: [], count: 0 }));
            break;

        case 'SendMessage':
            console.log(`[StreamFinity WS] SendMessage (${data.platform}): ${data.message}`);
            ws.send(JSON.stringify({ status: 'ok', id }));
            broadcast(ws, { event: { source: 'StreamFinity', type: 'MessageSent' }, data: { platform: data.platform, message: data.message } });
            break;

        case 'GetCredits':
            ws.send(JSON.stringify({ status: 'ok', id, credits: {} }));
            break;

        case 'GetGlobals':
            ws.send(JSON.stringify({ status: 'ok', id, variables: [] }));
            break;

        case 'GetGlobal':
            ws.send(JSON.stringify({ status: 'ok', id, variable: null }));
            break;

        case 'ExecuteCodeTrigger':
            console.log(`[StreamFinity WS] CodeTrigger: ${data.triggerName}`);
            ws.send(JSON.stringify({ status: 'ok', id }));
            break;

        case 'GetEvents':
            ws.send(JSON.stringify({
                status: 'ok', id,
                events: {
                    General: ['Custom'],
                    StreamFinity: ['ChatMessage', 'Gift', 'Follow', 'ActionExecuted'],
                    Command: ['Triggered']
                }
            }));
            break;

        case 'GetCodeTriggers':
            ws.send(JSON.stringify({ status: 'ok', id, count: 0, triggers: [] }));
            break;

        default:
            ws.send(JSON.stringify({ status: 'ok', id }));
            break;
    }
}

function broadcast(sender, data) {
    const msg = JSON.stringify(data);
    for (const client of clients) {
        if (client !== sender && client.readyState === WebSocket.OPEN) {
            client.send(msg);
        }
    }
}

console.log(`[StreamFinity] WebSocket server on port ${WS_PORT}`);
console.log(`[StreamFinity] Server ready — HTTP:${PORT} WS:${WS_PORT}`);
