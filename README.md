# StreamFinity

**All-in-one TikTok LIVE streaming toolkit** — Electron desktop app + Node.js backend server with real-time overlays, chat commands, sound alerts, games, points system, and more.

![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)
![Electron](https://img.shields.io/badge/Electron-27-blue?logo=electron)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)
![Redis](https://img.shields.io/badge/Redis-7-red?logo=redis)
![License](https://img.shields.io/badge/License-MIT-yellow)

## Features

### Core
- **TikTok LIVE Connection** — Real-time chat, gifts, follows, shares, likes via WebSocket
- **Multi-Profile System** — Multiple stream profiles with isolated settings
- **i18n** — English, French, German, Spanish

### Overlays & Widgets (29)
- Chat, Gifts, Top Gifters, Top Likers, Ranking, Viewer Count, Activity Feed
- Wheel of Fortune, Coin Drop, Coin Match, Coin Jar, Cannon, Like Fountain
- Timer, Song Requests, Sound Alert, TTS Chat, Stream Buddies, Webcam Frame
- Goal, Gift Counter, Last X, Falling Snow, Firework, Emojify, Social Media Rotator

### Actions & Automation
- **Actions & Events** — 18 trigger types, 18 effect types, user filters, cooldowns
- **Goals** — 7 display styles, auto-tracking from events, auto-reset
- **Action Timers** — Interval-based action execution with jitter
- **OBS WebSocket** — Scene switching, source toggling, stream/recording control
- **Streamer.bot** — WebSocket integration for cross-platform automation
- **Minecraft RCON** — Send commands to Minecraft on events

### Chat & Audio
- **Chat Commands** — Custom `!commands` with cooldowns, variables, permissions
- **Chatbot** — Auto-responses, spam protection, message log
- **Sound Alerts** — Trigger sounds on events with queue management
- **TTS Chat** — Text-to-speech with voice selection, filters, point charges

### Points & Engagement
- **Points System** — Earn rates per event type, manual adjustments, CSV export
- **Song Requests** — Spotify integration with `!play`, `!skip`, queue management
- **Likeathon** — Live like goal tracking with auto-toast on completion
- **Wheel of Fortune** — Custom segments, weights, colors

### CrowdControl (Mini-Games Platform)
- **18 Games** — Roulette, Dice, Slots, Coin Flip, Card Draw, Trivia, Reaction Time, Word Guess, Scramble, Target Click, and more
- **User Accounts** — Registration, login (JWT), profiles, XP/levels, achievements
- **Virtual Economy** — Coins, gems, shop items (avatars, frames, effects, badges)
- **Polls** — Create and vote on community polls
- **Leaderboards** — Global and weekly rankings

### Monitoring
- **Activity Log** — Real-time event feed with filtering and export
- **Live Channels** — Search and connect to TikTok channels
- **Dashboard** — Live stats, viewer count, like count, connection status

## Architecture

```
StreamFinity/
├── main.js                     # Electron entry point
├── preload.js                  # Secure renderer bridge (5 APIs)
├── config.json                 # Unified configuration
│
├── src/                        # Electron client
│   ├── core/                   # App orchestrator, EventBus, ConfigManager
│   ├── platforms/              # StreamFinity, StreamTory, StreamControl, StreamerBot
│   ├── services/               # ProBypass, SessionManager, IPCHandlers
│   └── utils/                  # Logger
│
├── server/                     # Node.js backend (Express + WebSocket)
│   ├── index.js                # Main entry — HTTP + WS on port 3010
│   ├── config.js               # Server config (ports, DB, Redis, cache)
│   ├── config/
│   │   └── crowdcontrol.js     # CrowdControl games, currency, shop config
│   ├── lib/
│   │   ├── Database.js         # PostgreSQL (pg) — assets, events, sessions
│   │   ├── RedisCache.js       # Redis cache layer
│   │   ├── RulesEngine.js      # Actions, events, goals, timers engine
│   │   ├── TikTokLiveService.js# TikTok LIVE WebSocket handler
│   │   ├── WSHandler.js        # StreamerBot-compatible WS API
│   │   ├── AssetProxy.js       # Upstream proxy with cache
│   │   ├── MemoryCache.js      # LRU cache with TTL
│   │   ├── MetricsCollector.js # Performance tracking
│   │   ├── Logger.js           # Server logger
│   │   └── crowdcontrol/       # CrowdControlDB, GameEngine, GameWSHandler
│   ├── routes/                 # 16 API route files
│   │   ├── actions.js          # Actions, events, goals, timers CRUD
│   │   ├── auth.js             # JWT auth (register, login)
│   │   ├── crowdcontrol.js     # CC users, shop, polls, leaderboard
│   │   ├── games.js            # Per-game endpoints (spin, roll, flip, etc.)
│   │   ├── tiktok.js           # TikTok connect/status/events
│   │   ├── viewers.js          # Viewer points, levels, stats
│   │   ├── spotify.js          # Spotify OAuth + player control
│   │   ├── sounds.js           # Sound upload/management
│   │   ├── gifts.js            # Gift catalog
│   │   ├── widgets.js          # Widget HTML serving
│   │   └── ...                 # assets, loaders, monitoring, pro, unified
│   ├── extractors/             # Asset extraction from source platforms
│   ├── loaders/                # Platform data loaders
│   └── public/                 # Static files
│       ├── app.html            # SPA shell
│       ├── ui/
│       │   ├── app.js          # Full SPA (~390KB) — all pages & logic
│       │   ├── styles.css      # Dark theme CSS
│       │   └── i18n.js         # Translation strings
│       ├── widgets/            # 29 widget HTML files + sf-bridge.js
│       ├── static/             # Logo, assets
│       └── sounds/defaults/    # 10 default sound alerts
│
├── scripts/                    # Deploy, backup, healthcheck, nginx config
└── docs/                       # Architecture documentation
```

## Quick Start

### Prerequisites
- **Node.js** 18+
- **PostgreSQL** 16+
- **Redis** 7+

### Server Setup
```bash
cd server
cp .env.example .env        # Edit with your DB credentials
npm install
node index.js               # Starts on port 3010
```

### Electron App (Desktop)
```bash
npm install
npm start                   # Launches Electron app
```

### Production Deployment
```bash
# Using PM2 (cluster mode)
cd server
pm2 start ecosystem.config.js

# Or with the deploy script
bash scripts/deploy.sh
```

### Access the Web UI
Open `http://localhost:3010/app.html` in your browser (or via the Electron app).

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Server health check |
| `GET` | `/api/tiktok/status` | TikTok connection status |
| `POST` | `/api/tiktok/connect` | Connect to a TikTok LIVE stream |
| `GET` | `/api/viewers` | Paginated viewer list |
| `GET/POST/PUT/DELETE` | `/api/actions` | Actions CRUD |
| `GET/POST/PUT/DELETE` | `/api/events` | Event triggers CRUD |
| `GET/POST/PUT/DELETE` | `/api/goals` | Goals CRUD |
| `GET` | `/api/crowdcontrol/games` | List all CC games |
| `POST` | `/api/crowdcontrol/games/roulette/spin` | Play roulette |
| `POST` | `/api/auth/register` | Register CC account |
| `POST` | `/api/auth/login` | Login (returns JWT) |
| `WS` | `/ws` | Real-time events WebSocket |

## Tech Stack

- **Frontend**: Vanilla JS SPA, TailwindCSS-inspired custom CSS
- **Backend**: Express.js, WebSocket (ws)
- **Database**: PostgreSQL 16 (pg)
- **Cache**: Redis 7
- **Desktop**: Electron 27
- **Auth**: JWT + bcrypt
- **Music**: Spotify Web API
- **TTS**: Web Speech API
- **OBS**: obs-websocket v5 protocol
- **Deploy**: PM2, Nginx, Let's Encrypt

## License

MIT
