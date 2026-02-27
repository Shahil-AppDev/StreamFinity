const express = require('express');
const crypto = require('crypto');

// ═══════════════════════════════════════════
// SPOTIFY API INTEGRATION
// ═══════════════════════════════════════════
// Requires: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET in env
// OAuth2 PKCE flow for user authorization
// Endpoints: /api/spotify/*

function createSpotifyRoutes(ctx) {
    const router = express.Router();
    const logger = ctx?.logger || console;

    // In-memory token store (per profile/channel)
    const tokenStore = new Map();
    const queueStore = new Map(); // channelId -> [{title, artist, uri, requester, requestedAt}]

    const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || '';
    const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || '';
    const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || 'https://tik.starline-agency.xyz/api/spotify/callback';

    // ── Helpers ──
    function getTokens(cid) { return tokenStore.get(cid) || null; }

    async function refreshAccessToken(cid) {
        const tokens = getTokens(cid);
        if (!tokens || !tokens.refresh_token) return null;
        try {
            const body = new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: tokens.refresh_token,
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
            });
            const res = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: body.toString(),
            });
            const data = await res.json();
            if (data.access_token) {
                tokens.access_token = data.access_token;
                if (data.refresh_token) tokens.refresh_token = data.refresh_token;
                tokens.expires_at = Date.now() + (data.expires_in || 3600) * 1000;
                tokenStore.set(cid, tokens);
                return tokens.access_token;
            }
            return null;
        } catch (err) {
            logger.error?.('[Spotify] Refresh failed:', err.message);
            return null;
        }
    }

    async function spotifyFetch(cid, endpoint, opts = {}) {
        let tokens = getTokens(cid);
        if (!tokens) throw new Error('Not connected to Spotify');
        // Auto-refresh if expired
        if (tokens.expires_at && Date.now() > tokens.expires_at - 60000) {
            const newToken = await refreshAccessToken(cid);
            if (!newToken) throw new Error('Spotify token expired, please reconnect');
            tokens = getTokens(cid);
        }
        const url = endpoint.startsWith('http') ? endpoint : `https://api.spotify.com/v1${endpoint}`;
        const res = await fetch(url, {
            ...opts,
            headers: {
                'Authorization': `Bearer ${tokens.access_token}`,
                'Content-Type': 'application/json',
                ...(opts.headers || {}),
            },
        });
        if (res.status === 204) return {};
        if (res.status === 401) {
            const newToken = await refreshAccessToken(cid);
            if (!newToken) throw new Error('Spotify auth expired');
            const retry = await fetch(url, {
                ...opts,
                headers: { 'Authorization': `Bearer ${newToken}`, 'Content-Type': 'application/json', ...(opts.headers || {}) },
            });
            if (retry.status === 204) return {};
            if (!retry.ok) throw new Error(`Spotify API error: ${retry.status}`);
            return retry.json();
        }
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error?.message || `Spotify error ${res.status}`);
        }
        return res.json();
    }

    // ── OAuth: Start ──
    router.get('/auth', (req, res) => {
        const cid = req.query.cid || 'default';
        if (!CLIENT_ID) return res.status(500).json({ error: 'SPOTIFY_CLIENT_ID not configured' });
        const state = crypto.randomBytes(16).toString('hex');
        tokenStore.set(`state_${state}`, cid);
        const scopes = [
            'user-read-playback-state',
            'user-modify-playback-state',
            'user-read-currently-playing',
            'streaming',
            'playlist-read-private',
            'playlist-read-collaborative',
        ].join(' ');
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: CLIENT_ID,
            scope: scopes,
            redirect_uri: REDIRECT_URI,
            state,
        });
        res.redirect(`https://accounts.spotify.com/authorize?${params}`);
    });

    // ── OAuth: Callback ──
    router.get('/callback', async (req, res) => {
        const { code, state, error } = req.query;
        if (error) return res.send(`<h2>Spotify Error</h2><p>${error}</p><script>setTimeout(()=>window.close(),3000)</script>`);
        const cid = tokenStore.get(`state_${state}`) || 'default';
        tokenStore.delete(`state_${state}`);
        try {
            const body = new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: REDIRECT_URI,
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
            });
            const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: body.toString(),
            });
            const data = await tokenRes.json();
            if (!data.access_token) throw new Error(data.error || 'Failed to get token');
            tokenStore.set(cid, {
                access_token: data.access_token,
                refresh_token: data.refresh_token,
                expires_at: Date.now() + (data.expires_in || 3600) * 1000,
            });
            // Get user profile
            const profileRes = await fetch('https://api.spotify.com/v1/me', {
                headers: { 'Authorization': `Bearer ${data.access_token}` },
            });
            const profile = await profileRes.json();
            tokenStore.get(cid).profile = { name: profile.display_name, id: profile.id, image: profile.images?.[0]?.url };
            res.send(`<!DOCTYPE html><html><head><style>body{background:#0f0f19;color:#fff;font-family:Inter,system-ui;display:flex;align-items:center;justify-content:center;height:100vh;text-align:center}h2{color:#1DB954}p{color:rgba(255,255,255,.5)}</style></head><body><div><h2>✅ Connected to Spotify!</h2><p>${profile.display_name || 'Account connected'}</p><p style="font-size:12px">This window will close automatically...</p></div><script>setTimeout(()=>window.close(),2000)</script></body></html>`);
        } catch (err) {
            res.status(500).send(`<h2>Error</h2><p>${err.message}</p><script>setTimeout(()=>window.close(),5000)</script>`);
        }
    });

    // ── Status ──
    router.get('/status', (req, res) => {
        const cid = req.query.cid || 'default';
        const tokens = getTokens(cid);
        if (!tokens || !tokens.access_token) return res.json({ connected: false });
        res.json({
            connected: true,
            profile: tokens.profile || null,
            expiresAt: tokens.expires_at,
            hasRefresh: !!tokens.refresh_token,
        });
    });

    // ── Disconnect ──
    router.post('/disconnect', (req, res) => {
        const cid = req.body.cid || 'default';
        tokenStore.delete(cid);
        res.json({ success: true });
    });

    // ── Now Playing ──
    router.get('/now-playing', async (req, res) => {
        const cid = req.query.cid || 'default';
        try {
            const data = await spotifyFetch(cid, '/me/player/currently-playing');
            if (!data || !data.item) return res.json({ playing: false });
            const item = data.item;
            res.json({
                playing: data.is_playing,
                title: item.name,
                artist: item.artists?.map(a => a.name).join(', ') || 'Unknown',
                album: item.album?.name,
                albumArt: item.album?.images?.[0]?.url,
                duration: item.duration_ms,
                progress: data.progress_ms,
                uri: item.uri,
            });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ── Search ──
    router.get('/search', async (req, res) => {
        const cid = req.query.cid || 'default';
        const q = req.query.q;
        if (!q) return res.status(400).json({ error: 'Query required' });
        try {
            const data = await spotifyFetch(cid, `/search?q=${encodeURIComponent(q)}&type=track&limit=10`);
            const tracks = (data.tracks?.items || []).map(t => ({
                title: t.name,
                artist: t.artists?.map(a => a.name).join(', '),
                album: t.album?.name,
                albumArt: t.album?.images?.[1]?.url || t.album?.images?.[0]?.url,
                duration: t.duration_ms,
                uri: t.uri,
            }));
            res.json({ tracks });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ── Add to Queue (Spotify playback queue) ──
    router.post('/queue/add', async (req, res) => {
        const { cid = 'default', uri, title, artist, requester } = req.body;
        if (!uri) return res.status(400).json({ error: 'Track URI required' });
        try {
            await spotifyFetch(cid, `/me/player/queue?uri=${encodeURIComponent(uri)}`, { method: 'POST' });
            // Also add to our internal queue for display
            if (!queueStore.has(cid)) queueStore.set(cid, []);
            const q = queueStore.get(cid);
            q.push({ title: title || 'Unknown', artist: artist || '', uri, requester: requester || 'Viewer', requestedAt: Date.now() });
            if (q.length > 50) q.shift();
            // Broadcast to widgets via WS
            if (ctx?.wsBroadcast) {
                ctx.wsBroadcast({ type: 'songRequest', title, artist, requester, uri });
            }
            res.json({ success: true, queueLength: q.length });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ── Get Queue ──
    router.get('/queue', (req, res) => {
        const cid = req.query.cid || 'default';
        const q = queueStore.get(cid) || [];
        res.json({ queue: q });
    });

    // ── Skip ──
    router.post('/skip', async (req, res) => {
        const cid = req.body.cid || 'default';
        try {
            await spotifyFetch(cid, '/me/player/next', { method: 'POST' });
            // Remove first item from our queue
            const q = queueStore.get(cid);
            if (q && q.length) q.shift();
            if (ctx?.wsBroadcast) ctx.wsBroadcast({ type: 'songSkipped' });
            res.json({ success: true });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ── Pause / Resume ──
    router.post('/pause', async (req, res) => {
        const cid = req.body.cid || 'default';
        try {
            await spotifyFetch(cid, '/me/player/pause', { method: 'PUT' });
            res.json({ success: true });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    router.post('/resume', async (req, res) => {
        const cid = req.body.cid || 'default';
        try {
            await spotifyFetch(cid, '/me/player/play', { method: 'PUT' });
            res.json({ success: true });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    // ── Volume ──
    router.post('/volume', async (req, res) => {
        const cid = req.body.cid || 'default';
        const vol = Math.max(0, Math.min(100, parseInt(req.body.volume) || 50));
        try {
            await spotifyFetch(cid, `/me/player/volume?volume_percent=${vol}`, { method: 'PUT' });
            res.json({ success: true, volume: vol });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    return router;
}

module.exports = createSpotifyRoutes;
