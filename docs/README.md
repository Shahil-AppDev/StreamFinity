# StreamFinity - Unified Multi-Platform Live Streaming

## Architecture

```
StreamFinity/
├── main.js                  # Electron entry point (128 lines)
├── preload.js               # Secure renderer bridge (5 APIs)
├── config.json              # Unified configuration
├── package.json             # Dependencies & build config
│
├── src/
│   ├── core/
│   │   ├── StreamFinityApp.js   # Main orchestrator — coordinates all 4 platforms
│   │   ├── EventBus.js          # Cross-platform event system + shared state
│   │   └── ConfigManager.js     # Config loading, dot-notation get/set
│   │
│   ├── platforms/
│   │   ├── StreamFinity.js      # Live streaming: TikTok connection, chat, gifts
│   │   ├── StreamTory.js        # Analytics: overlays, alerts, revenue tracking
│   │   ├── StreamControl.js     # Interaction: polls, games, rewards, moderation
│   │   └── StreamerBot.js       # Automation: Streamer.bot WebSocket API integration
│   │
│   ├── services/
│   │   ├── ProBypass.js         # License bypass (session + renderer injection)
│   │   ├── SessionManager.js    # Electron session: headers, CSP, CORS
│   │   └── IPCHandlers.js       # All IPC channels (sf:* namespace)
│   │
│   └── utils/
│       └── logger.js            # Unified logger with child loggers
│
├── assets/                      # Icons, images
├── data/                        # Runtime data per platform
├── vendor/                      # Original binaries & legacy files
└── docs/                        # This file
```

## How the 4 platforms are linked

```
main.js
  └── StreamFinityApp (orchestrator)
        ├── EventBus ←──────────── shared event system
        │     ├── platformEmit()   scoped events (e.g. streamfinity:chat)
        │     ├── broadcast()      relay to all other platforms
        │     └── setState()       shared state across all 4
        │
        ├── StreamFinity ──────── live_connection, chat, gifts (TikTok)
        │     └── onGift() → broadcasts to StreamTory (revenue tracking)
        │                  → broadcasts to StreamControl (reward triggers)
        │                  → broadcasts to StreamerBot (action triggers)
        │
        ├── StreamTory ────────── analytics, overlays, alerts
        │     └── listens to gift:received → trackRevenue()
        │     └── listens to chat:new → engagement tracking
        │
        ├── StreamControl ─────── polls, games, rewards, moderation
        │     └── listens to chat:new → moderation filter
        │     └── poll results → broadcast to all platforms
        │
        └── StreamerBot ──────── Streamer.bot WebSocket integration
              │                   (Twitch, YouTube, Kick, Trovo)
              ├── doAction()      execute Streamer.bot actions
              ├── sendMessage()   send chat to Twitch/YouTube/Kick
              ├── subscribe()     listen to Twitch/YT/Kick events
              └── onEvent() → broadcasts chat/gifts/follows to all platforms
```

## StreamerBot Integration

StreamerBot connects to a local **Streamer.bot** instance via WebSocket (`ws://127.0.0.1:8080/`).

**Key capabilities:**
- **Execute actions** — trigger any Streamer.bot action by ID or name
- **Multi-platform chat** — send messages to Twitch, YouTube, Kick, Trovo
- **Event subscriptions** — listen to follows, cheers, subs, raids, etc.
- **Viewer tracking** — get active viewers across all connected platforms
- **Code triggers** — execute custom code triggers with arguments
- **Cross-platform relay** — Twitch/YouTube events are broadcast to StreamFinity/StreamTory/StreamControl

**Configuration** (`config.json`):
```json
{
  "integrations": {
    "streamerbot": {
      "enabled": true,
      "host": "127.0.0.1",
      "port": 8080,
      "autoConnect": true
    }
  }
}
```

## IPC Channels (preload.js → main process)

| Channel | Description |
|---|---|
| `sf:switch-platform` | Switch active platform |
| `sf:get-platforms` | List all platforms + status |
| `sf:get-stats` | Unified stats from all 4 |
| `sf:streamfinity:connect` | Connect to TikTok LIVE |
| `sf:streamtory:analytics` | Get analytics data |
| `sf:streamtory:create-overlay` | Create overlay |
| `sf:streamcontrol:create-poll` | Create audience poll |
| `sf:streamcontrol:start-game` | Start mini-game |
| `sf:streamcontrol:give-reward` | Give reward to user |
| `sf:streamerbot:connect` | Connect to Streamer.bot WebSocket |
| `sf:streamerbot:do-action` | Execute a Streamer.bot action |
| `sf:streamerbot:send-message` | Send chat message (Twitch/YT/Kick) |
| `sf:streamerbot:get-actions` | List available actions |
| `sf:streamerbot:get-broadcaster` | Get broadcaster info |
| `sf:streamerbot:get-viewers` | Get active viewers |
| `sf:streamerbot:subscribe` | Subscribe to events |
| `sf:streamerbot:execute-trigger` | Execute a code trigger |

## Renderer APIs (available in browser context)

- `window.streamfinityAPI` — platform management, config, version
- `window.streamfinity` — live connection, chat, gifts
- `window.streamtory` — analytics, overlays, export
- `window.streamcontrol` — polls, games, rewards
- `window.streamerbot` — Streamer.bot actions, chat, events, viewers

## Quick Start

```bash
npm install
npm start
```

**Note:** Streamer.bot must be running locally with its WebSocket Server enabled (default port 8080) for the StreamerBot integration to work.
