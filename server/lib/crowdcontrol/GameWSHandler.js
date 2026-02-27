/**
 * CrowdControl Game WebSocket Handler
 * Real-time multiplayer game rooms with synchronized gameplay
 *
 * Room lifecycle: waiting → countdown → playing → finished
 * Supports: matchmaking, live scores, spectators, game-specific logic
 */

const gameRooms = new Map();   // roomId -> Room
const matchQueue = new Map();  // gameType -> [{ ws, userId, username, queuedAt }]

// ── Room class ──
class Room {
    constructor(id, gameType, hostWs, hostInfo, options = {}) {
        this.id = id;
        this.gameType = gameType;
        this.state = 'waiting'; // waiting | countdown | playing | finished
        this.players = new Map(); // ws -> { userId, username, score, ready, data }
        this.spectators = new Set(); // ws set
        this.host = hostWs;
        this.createdAt = Date.now();
        this.startedAt = null;
        this.endedAt = null;
        this.maxPlayers = options.maxPlayers || 10;
        this.isPrivate = !!options.isPrivate;
        this.inviteCode = options.inviteCode || null;
        this.roundDuration = options.roundDuration || this._defaultDuration(gameType);
        this.scores = {}; // userId -> score
        this.gameData = {}; // game-specific shared state
        this.countdownTimer = null;
        this.roundTimer = null;

        // Add host as first player
        this.addPlayer(hostWs, hostInfo);
    }

    _defaultDuration(type) {
        const durations = { race: 15000, clickBattle: 5000, reactionTime: 10000, trivia: 30000, scramble: 60000, wordGuess: 90000 };
        return durations[type] || 30000;
    }

    addPlayer(ws, info) {
        if (this.players.size >= this.maxPlayers) return false;
        if (this.state !== 'waiting') return false;
        this.players.set(ws, { userId: info.userId, username: info.username, score: 0, ready: false, data: {} });
        this.scores[info.userId] = 0;
        ws._gameRoom = this.id;
        ws._userId = info.userId;
        return true;
    }

    removePlayer(ws) {
        const info = this.players.get(ws);
        this.players.delete(ws);
        this.spectators.delete(ws);
        ws._gameRoom = null;
        ws._userId = null;
        if (ws === this.host && this.players.size > 0) {
            this.host = this.players.keys().next().value;
            const newHostInfo = this.players.get(this.host);
            this.broadcast({ type: 'host_changed', userId: newHostInfo.userId, username: newHostInfo.username });
        }
        return info;
    }

    addSpectator(ws) {
        this.spectators.add(ws);
        ws._gameRoom = this.id;
        ws._userId = 'spectator_' + Date.now();
    }

    getPlayerList() {
        const list = [];
        for (const [, p] of this.players) {
            list.push({ userId: p.userId, username: p.username, score: p.score, ready: p.ready });
        }
        return list.sort((a, b) => b.score - a.score);
    }

    setReady(ws) {
        const p = this.players.get(ws);
        if (p) p.ready = true;
        return this._allReady();
    }

    _allReady() {
        if (this.players.size < 2) return false;
        for (const [, p] of this.players) { if (!p.ready) return false; }
        return true;
    }

    startCountdown(duration = 3000) {
        if (this.state !== 'waiting') return;
        this.state = 'countdown';
        this.broadcast({ type: 'countdown_start', duration, startsAt: Date.now() + duration });
        this.countdownTimer = setTimeout(() => this.startGame(), duration);
    }

    startGame() {
        this.state = 'playing';
        this.startedAt = Date.now();
        // Reset scores
        for (const [, p] of this.players) p.score = 0;
        this.scores = {};
        for (const [, p] of this.players) this.scores[p.userId] = 0;

        // Generate game-specific data
        this.gameData = this._generateGameData();

        this.broadcast({ type: 'game_start', gameType: this.gameType, duration: this.roundDuration, gameData: this.gameData, players: this.getPlayerList(), startedAt: this.startedAt });

        // Auto-end after round duration
        this.roundTimer = setTimeout(() => this.endGame(), this.roundDuration);
    }

    _generateGameData() {
        switch (this.gameType) {
            case 'trivia': {
                const questions = [
                    { q: 'What year was TikTok launched?', options: ['2016', '2017', '2018', '2019'], answer: 1 },
                    { q: 'Which country has the most TikTok users?', options: ['USA', 'India', 'China', 'Brazil'], answer: 0 },
                    { q: 'What was TikTok originally called?', options: ['Musical.ly', 'Vine', 'Dubsmash', 'Byte'], answer: 0 },
                    { q: 'How long can a TikTok video be?', options: ['1 min', '3 min', '10 min', '60 min'], answer: 2 },
                    { q: 'What is TikTok called in China?', options: ['Douyin', 'WeChat', 'Kuaishou', 'Bilibili'], answer: 0 },
                ];
                return { questions: questions.sort(() => Math.random() - 0.5).slice(0, 3), currentQ: 0 };
            }
            case 'scramble': {
                const words = ['STREAMING', 'TIKTOK', 'FOLLOWERS', 'DIAMOND', 'GIFTING', 'VIEWERS', 'CONTENT', 'CREATOR', 'TRENDING', 'HASHTAG'];
                const word = words[Math.floor(Math.random() * words.length)];
                const scrambled = word.split('').sort(() => Math.random() - 0.5).join('');
                return { scrambled, wordLength: word.length, hint: word[0] + '...' + word[word.length - 1] };
            }
            case 'race': return { distance: 100, tapBoost: null };
            case 'clickBattle': return { duration: 5000 };
            case 'reactionTime': return { rounds: 3, currentRound: 0 };
            case 'wordGuess': {
                const words = ['LIVESTREAM', 'BROADCAST', 'AUDIENCE', 'SUBSCRIBE', 'DONATION', 'MODERATOR', 'EMOJIS', 'OVERLAY'];
                const word = words[Math.floor(Math.random() * words.length)];
                return { wordLength: word.length, hint: word[0] + '_'.repeat(word.length - 2) + word[word.length - 1], maxGuesses: 6 };
            }
            default: return {};
        }
    }

    updateScore(ws, points) {
        const p = this.players.get(ws);
        if (!p || this.state !== 'playing') return;
        p.score += points;
        this.scores[p.userId] = p.score;
        this.broadcast({ type: 'score_update', userId: p.userId, username: p.username, score: p.score, leaderboard: this.getPlayerList() });
    }

    setScore(ws, score) {
        const p = this.players.get(ws);
        if (!p || this.state !== 'playing') return;
        p.score = score;
        this.scores[p.userId] = score;
        this.broadcast({ type: 'score_update', userId: p.userId, username: p.username, score: p.score, leaderboard: this.getPlayerList() });
    }

    endGame(reason) {
        if (this.state === 'finished') return;
        clearTimeout(this.roundTimer);
        this.state = 'finished';
        this.endedAt = Date.now();
        const leaderboard = this.getPlayerList();
        const winner = leaderboard[0] || null;
        this.broadcast({
            type: 'game_end',
            reason: reason || 'time_up',
            leaderboard,
            winner: winner ? { userId: winner.userId, username: winner.username, score: winner.score } : null,
            duration: this.endedAt - (this.startedAt || this.createdAt),
        });
    }

    broadcast(message, excludeWs) {
        const payload = JSON.stringify(message);
        for (const [ws] of this.players) {
            if (ws !== excludeWs && ws.readyState === 1) { try { ws.send(payload); } catch {} }
        }
        for (const ws of this.spectators) {
            if (ws.readyState === 1) { try { ws.send(payload); } catch {} }
        }
    }

    cleanup() {
        clearTimeout(this.countdownTimer);
        clearTimeout(this.roundTimer);
    }
}

// ── Main WS handler ──
function handleGameWS(ws, message) {
    try {
        const data = typeof message === 'string' ? JSON.parse(message) : message;
        if (!data.type) return;

        switch (data.type) {
            // ── Room management ──
            case 'create_room': {
                const { gameType, userId, username, maxPlayers, isPrivate, roundDuration } = data.data || {};
                if (!gameType || !userId) return send(ws, { type: 'error', error: 'gameType and userId required' });
                const roomId = gameType + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
                const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();
                const room = new Room(roomId, gameType, ws, { userId, username: username || userId }, { maxPlayers, isPrivate, inviteCode, roundDuration });
                gameRooms.set(roomId, room);
                send(ws, { type: 'room_created', roomId, inviteCode, gameType, playerCount: 1, maxPlayers: room.maxPlayers });
                break;
            }

            case 'join_game': {
                const { gameId, userId, username, spectate } = data.data || {};
                if (!userId) return send(ws, { type: 'error', error: 'userId required' });

                // Join by room ID or invite code
                let room = gameRooms.get(gameId);
                if (!room) {
                    for (const [, r] of gameRooms) {
                        if (r.inviteCode === gameId) { room = r; break; }
                    }
                }
                if (!room) return send(ws, { type: 'error', error: 'Room not found' });

                if (spectate) {
                    room.addSpectator(ws);
                    send(ws, { type: 'joined_spectator', roomId: room.id, gameType: room.gameType, state: room.state, players: room.getPlayerList() });
                } else {
                    const added = room.addPlayer(ws, { userId, username: username || userId });
                    if (!added) return send(ws, { type: 'error', error: room.state !== 'waiting' ? 'Game already started' : 'Room is full' });
                    send(ws, { type: 'joined', roomId: room.id, gameType: room.gameType, playerCount: room.players.size, state: room.state, players: room.getPlayerList(), inviteCode: room.inviteCode });
                    room.broadcast({ type: 'player_joined', userId, username: username || userId, playerCount: room.players.size, players: room.getPlayerList() }, ws);
                }
                break;
            }

            case 'leave_game': {
                leaveRoom(ws);
                break;
            }

            // ── Matchmaking ──
            case 'find_match': {
                const { gameType, userId, username } = data.data || {};
                if (!gameType || !userId) return send(ws, { type: 'error', error: 'gameType and userId required' });
                if (!matchQueue.has(gameType)) matchQueue.set(gameType, []);
                const queue = matchQueue.get(gameType);
                // Remove duplicates
                const idx = queue.findIndex(q => q.userId === userId);
                if (idx >= 0) queue.splice(idx, 1);
                queue.push({ ws, userId, username: username || userId, queuedAt: Date.now() });
                send(ws, { type: 'matchmaking', status: 'queued', position: queue.length, gameType });

                // Try to match 2+ players
                if (queue.length >= 2) {
                    const matched = queue.splice(0, Math.min(queue.length, 4));
                    const roomId = gameType + '_match_' + Date.now().toString(36);
                    const room = new Room(roomId, gameType, matched[0].ws, matched[0], { maxPlayers: matched.length });
                    for (let i = 1; i < matched.length; i++) {
                        room.addPlayer(matched[i].ws, matched[i]);
                    }
                    gameRooms.set(roomId, room);
                    for (const m of matched) {
                        send(m.ws, { type: 'match_found', roomId, gameType, players: room.getPlayerList(), playerCount: room.players.size });
                    }
                    // Auto-start after 3s
                    setTimeout(() => { if (room.state === 'waiting') room.startCountdown(3000); }, 2000);
                }
                break;
            }

            case 'cancel_match': {
                const { gameType, userId } = data.data || {};
                if (gameType && matchQueue.has(gameType)) {
                    const queue = matchQueue.get(gameType);
                    const idx = queue.findIndex(q => q.userId === userId);
                    if (idx >= 0) queue.splice(idx, 1);
                }
                send(ws, { type: 'matchmaking', status: 'cancelled' });
                break;
            }

            // ── Ready / Start ──
            case 'player_ready': {
                const room = getRoom(ws);
                if (!room) return send(ws, { type: 'error', error: 'Not in a room' });
                const allReady = room.setReady(ws);
                room.broadcast({ type: 'player_ready', userId: ws._userId, players: room.getPlayerList() });
                if (allReady && room.state === 'waiting') room.startCountdown(3000);
                break;
            }

            case 'start_game': {
                const room = getRoom(ws);
                if (!room) return send(ws, { type: 'error', error: 'Not in a room' });
                if (ws !== room.host) return send(ws, { type: 'error', error: 'Only the host can start' });
                if (room.players.size < 2) return send(ws, { type: 'error', error: 'Need at least 2 players' });
                if (room.state === 'waiting') room.startCountdown(3000);
                break;
            }

            // ── Gameplay actions ──
            case 'game_action': {
                const room = getRoom(ws);
                if (!room || room.state !== 'playing') return;
                const action = data.data?.action;
                const payload = data.data?.payload || {};

                // Game-specific server-side logic
                switch (room.gameType) {
                    case 'race': {
                        if (action === 'tap') {
                            const boost = 3 + Math.random() * 5;
                            const p = room.players.get(ws);
                            const newPos = Math.min(100, (p.data.position || 0) + boost);
                            p.data.position = newPos;
                            room.setScore(ws, Math.round(newPos));
                            if (newPos >= 100) room.endGame('player_finished');
                        }
                        break;
                    }
                    case 'clickBattle': {
                        if (action === 'click') {
                            room.updateScore(ws, 1);
                        }
                        break;
                    }
                    case 'reactionTime': {
                        if (action === 'react') {
                            const reactionMs = payload.reactionMs || 9999;
                            const points = Math.max(0, Math.round(1000 - reactionMs));
                            room.updateScore(ws, points);
                        }
                        break;
                    }
                    case 'trivia': {
                        if (action === 'answer') {
                            const { questionIdx, answerIdx } = payload;
                            const q = room.gameData.questions?.[questionIdx];
                            if (q && answerIdx === q.answer) {
                                const speed = payload.timeMs || 30000;
                                const points = Math.max(10, Math.round(100 - speed / 300));
                                room.updateScore(ws, points);
                                room.broadcast({ type: 'correct_answer', userId: ws._userId, questionIdx, points });
                            } else {
                                room.broadcast({ type: 'wrong_answer', userId: ws._userId, questionIdx });
                            }
                        }
                        break;
                    }
                    case 'scramble':
                    case 'wordGuess': {
                        if (action === 'guess') {
                            room.broadcast({ type: 'player_guess', userId: ws._userId, guess: (payload.guess || '').slice(0, 30) });
                            if (payload.correct) {
                                const speed = payload.timeMs || 60000;
                                const points = Math.max(10, Math.round(500 - speed / 200));
                                room.updateScore(ws, points);
                                room.endGame('word_solved');
                            }
                        }
                        break;
                    }
                    default: {
                        // Generic: broadcast action to all
                        room.broadcast({ type: 'game_action', userId: ws._userId, action, payload }, ws);
                    }
                }
                break;
            }

            case 'game_state_update': {
                const room = getRoom(ws);
                if (!room) return;
                if (ws === room.host) {
                    room.gameData = { ...room.gameData, ...(data.data || {}) };
                    room.broadcast({ type: 'game_state_update', data: data.data }, ws);
                }
                break;
            }

            case 'game_result': {
                const room = getRoom(ws);
                if (!room) return;
                if (ws === room.host) room.endGame('host_ended');
                break;
            }

            // ── In-game chat ──
            case 'chat': {
                const room = getRoom(ws);
                if (!room) return;
                room.broadcast({ type: 'chat', userId: ws._userId, message: (data.data?.message || '').slice(0, 200), timestamp: Date.now() });
                break;
            }

            // ── Room listing ──
            case 'list_rooms': {
                const gameType = data.data?.gameType;
                const rooms = [];
                for (const [, r] of gameRooms) {
                    if (r.isPrivate) continue;
                    if (gameType && r.gameType !== gameType) continue;
                    if (r.state === 'finished') continue;
                    rooms.push({ id: r.id, gameType: r.gameType, state: r.state, playerCount: r.players.size, maxPlayers: r.maxPlayers, inviteCode: r.inviteCode, createdAt: r.createdAt });
                }
                send(ws, { type: 'room_list', rooms });
                break;
            }

            case 'ping':
                send(ws, { type: 'pong', timestamp: Date.now() });
                break;
        }
    } catch (e) {
        send(ws, { type: 'error', error: 'Invalid message' });
    }
}

function handleGameWSClose(ws) {
    leaveRoom(ws);
    // Remove from match queues
    for (const [, queue] of matchQueue) {
        const idx = queue.findIndex(q => q.ws === ws);
        if (idx >= 0) queue.splice(idx, 1);
    }
}

function getRoom(ws) {
    const roomId = ws._gameRoom;
    return roomId ? gameRooms.get(roomId) : null;
}

function leaveRoom(ws) {
    const roomId = ws._gameRoom;
    if (!roomId) return;
    const room = gameRooms.get(roomId);
    if (room) {
        const info = room.removePlayer(ws);
        room.broadcast({ type: 'player_left', userId: info?.userId, playerCount: room.players.size, players: room.getPlayerList() });
        if (room.players.size === 0) {
            room.cleanup();
            gameRooms.delete(roomId);
        }
    }
    ws._gameRoom = null;
    ws._userId = null;
}

function send(ws, data) {
    if (ws.readyState === 1) {
        try { ws.send(JSON.stringify(data)); } catch {}
    }
}

function getActiveRooms() {
    const rooms = [];
    for (const [id, room] of gameRooms) {
        rooms.push({ id, gameType: room.gameType, state: room.state, playerCount: room.players.size, maxPlayers: room.maxPlayers, createdAt: room.createdAt });
    }
    return rooms;
}

// Cleanup stale rooms every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [id, room] of gameRooms) {
        if (room.players.size === 0 && now - room.createdAt > 300000) { room.cleanup(); gameRooms.delete(id); }
        if (room.state === 'finished' && now - room.endedAt > 60000) { room.cleanup(); gameRooms.delete(id); }
    }
    // Cleanup stale match queue entries (>2 min)
    for (const [, queue] of matchQueue) {
        for (let i = queue.length - 1; i >= 0; i--) {
            if (now - queue[i].queuedAt > 120000 || queue[i].ws.readyState !== 1) queue.splice(i, 1);
        }
    }
}, 300000);

module.exports = { handleGameWS, handleGameWSClose, getActiveRooms };
