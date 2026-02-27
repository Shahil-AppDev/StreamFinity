#!/usr/bin/env node
/**
 * StreamFinity — Complete Asset Extraction Script
 * Extracts ALL assets from TikFinity, StreamTory, CrowdControl sources
 * 
 * Run: node scripts/extract-all-assets.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const ASSETS = path.join(ROOT, 'server', 'assets');
const VENDOR = path.join(ROOT, 'vendor');
const CC_DIR = path.join(ROOT, 'streamcontrol');

const inventory = {
    extractedAt: new Date().toISOString(),
    tikfinity: { overlays: [], sounds: [], ui: [], gifts: [], scripts: [], configs: [], urls: [] },
    streamtory: { analytics: [], overlays: [], exports: [], configs: [], endpoints: [] },
    streamcontrol: { games: [], polls: [], rewards: [], configs: [], endpoints: [] },
    streamfinity: { branding: [], themes: [], features: [] },
    totals: { files: 0, bytes: 0 }
};

function mkdirs(...dirs) {
    dirs.forEach(d => fs.mkdirSync(d, { recursive: true }));
}

function copyFile(src, dest, category, platform) {
    if (!fs.existsSync(src)) return false;
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    const size = fs.statSync(dest).size;
    const name = path.basename(dest);
    inventory[platform][category].push({ name, size, path: path.relative(ASSETS, dest) });
    inventory.totals.files++;
    inventory.totals.bytes += size;
    console.log(`  ✓ [${platform}/${category}] ${name} (${(size/1024).toFixed(1)}KB)`);
    return true;
}

function writeJSON(dest, data, category, platform) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const content = JSON.stringify(data, null, 2);
    fs.writeFileSync(dest, content);
    const name = path.basename(dest);
    inventory[platform][category].push({ name, size: content.length, path: path.relative(ASSETS, dest) });
    inventory.totals.files++;
    inventory.totals.bytes += content.length;
    console.log(`  ✓ [${platform}/${category}] ${name} (${(content.length/1024).toFixed(1)}KB)`);
}

// ═══════════════════════════════════════════════════
// PHASE 1: Directory Structure
// ═══════════════════════════════════════════════════
console.log('\n═══ PHASE 1: Creating directory structure ═══');
const platforms = ['tikfinity', 'streamtory', 'streamcontrol', 'streamfinity'];
const categories = ['overlays', 'sounds', 'games', 'analytics', 'ui', 'branding', 'scripts', 'configs', 'gifts', 'polls', 'rewards', 'themes', 'exports', 'endpoints'];
platforms.forEach(p => categories.forEach(c => mkdirs(path.join(ASSETS, p, c))));
console.log('  ✓ Created', platforms.length * categories.length, 'directories');

// ═══════════════════════════════════════════════════
// PHASE 2: TikFinity Assets
// ═══════════════════════════════════════════════════
console.log('\n═══ PHASE 2: Extracting TikFinity assets ═══');
const TF_APP = path.join(VENDOR, 'streamfinity-source', 'resources', 'app');

// 2a. Icons & branding
console.log('\n  [2a] Icons & branding:');
copyFile(path.join(TF_APP, 'resources', 'streamfinity.ico'), path.join(ASSETS, 'tikfinity', 'ui', 'streamfinity.ico'), 'ui', 'tikfinity');
copyFile(path.join(TF_APP, 'resources', 'install_icon.ico'), path.join(ASSETS, 'tikfinity', 'ui', 'install_icon.ico'), 'ui', 'tikfinity');
copyFile(path.join(TF_APP, 'resources', 'install_splash.gif'), path.join(ASSETS, 'tikfinity', 'ui', 'install_splash.gif'), 'ui', 'tikfinity');

// 2b. Scripts
console.log('\n  [2b] Electron scripts:');
copyFile(path.join(TF_APP, 'scripts', 'bridge.js'), path.join(ASSETS, 'tikfinity', 'scripts', 'bridge.js'), 'scripts', 'tikfinity');
copyFile(path.join(TF_APP, 'scripts', 'preload.js'), path.join(ASSETS, 'tikfinity', 'scripts', 'preload.js'), 'scripts', 'tikfinity');
copyFile(path.join(TF_APP, 'scripts', 'closeonredirect.js'), path.join(ASSETS, 'tikfinity', 'scripts', 'closeonredirect.js'), 'scripts', 'tikfinity');
copyFile(path.join(TF_APP, 'main.js'), path.join(ASSETS, 'tikfinity', 'scripts', 'main.js'), 'scripts', 'tikfinity');
copyFile(path.join(TF_APP, 'index.js'), path.join(ASSETS, 'tikfinity', 'scripts', 'index.js'), 'scripts', 'tikfinity');

// 2c. Configs
console.log('\n  [2c] Configs:');
copyFile(path.join(TF_APP, 'package.json'), path.join(ASSETS, 'tikfinity', 'configs', 'package.json'), 'configs', 'tikfinity');
copyFile(path.join(TF_APP, 'forge.config.js'), path.join(ASSETS, 'tikfinity', 'configs', 'forge.config.js'), 'configs', 'tikfinity');

// 2d. Parse ALL URLs from bridge.js + main.js
console.log('\n  [2d] Parsing URLs from source code:');
const urlsFound = new Set();
['bridge.js', 'main.js', 'index.js', 'preload.js'].forEach(file => {
    const fp = file === 'bridge.js' || file === 'preload.js'
        ? path.join(TF_APP, 'scripts', file)
        : path.join(TF_APP, file);
    if (!fs.existsSync(fp)) return;
    const content = fs.readFileSync(fp, 'utf8');
    // URLs
    const urls = content.match(/https?:\/\/[^\s"'`\),;]+/g) || [];
    urls.forEach(u => urlsFound.add(u));
    // Endpoint paths
    const endpoints = content.match(/['"`]\/(electron|extension|api|overlay|img|assets|sounds|static|ws)[^\s"'`]*/g) || [];
    endpoints.forEach(e => urlsFound.add('ENDPOINT:' + e.replace(/^['"`]/, '')));
});

const parsedUrls = {
    extractedAt: new Date().toISOString(),
    totalFound: urlsFound.size,
    serverUrls: [...urlsFound].filter(u => !u.startsWith('ENDPOINT:')).sort(),
    endpoints: [...urlsFound].filter(u => u.startsWith('ENDPOINT:')).map(u => u.replace('ENDPOINT:', '')).sort()
};
writeJSON(path.join(ASSETS, 'tikfinity', 'configs', 'discovered-urls.json'), parsedUrls, 'configs', 'tikfinity');
console.log(`    Found ${parsedUrls.serverUrls.length} URLs + ${parsedUrls.endpoints.length} endpoints`);

// Store URLs in inventory
inventory.tikfinity.urls = parsedUrls.serverUrls;

// 2e. Generate overlay definitions from parsed endpoints
console.log('\n  [2e] Generating overlay configs:');
const overlayDefs = [
    { id: 'coin-match', name: 'Coin Match', type: 'auction', pro: true, endpoint: '/overlay/coin-match', desc: 'Live auction where viewers bid with gifts' },
    { id: 'coin-jar', name: 'Coin Jar', type: 'goal', pro: true, endpoint: '/overlay/coin-jar', desc: 'Visual jar that fills with gifts' },
    { id: 'gift-goal', name: 'Gift Goal', type: 'goal', pro: true, endpoint: '/overlay/gift-goal', desc: 'Gift goal progress bar' },
    { id: 'top-gifters', name: 'Top Gifters', type: 'leaderboard', pro: true, endpoint: '/overlay/top-gifters', desc: 'Live top gifters leaderboard' },
    { id: 'recent-events', name: 'Recent Events', type: 'feed', pro: false, endpoint: '/overlay/recent-events', desc: 'Scrolling event feed' },
    { id: 'alert-box', name: 'Alert Box', type: 'alert', pro: true, endpoint: '/overlay/alert-box', desc: 'Gift/follow/share alert notifications' },
    { id: 'chat-overlay', name: 'Chat Overlay', type: 'chat', pro: false, endpoint: '/overlay/chat', desc: 'Live chat display on stream' },
    { id: 'viewer-count', name: 'Viewer Count', type: 'stats', pro: false, endpoint: '/overlay/viewer-count', desc: 'Current viewer count overlay' },
    { id: 'spin-wheel', name: 'Spin Wheel', type: 'game', pro: true, endpoint: '/overlay/spin-wheel', desc: 'Interactive spin wheel game' },
    { id: 'poll-overlay', name: 'Poll', type: 'poll', pro: true, endpoint: '/overlay/poll', desc: 'Live voting poll' },
    { id: 'countdown', name: 'Countdown Timer', type: 'timer', pro: false, endpoint: '/overlay/countdown', desc: 'Countdown timer overlay' },
    { id: 'sub-goal', name: 'Sub Goal', type: 'goal', pro: true, endpoint: '/overlay/sub-goal', desc: 'Follower/subscriber milestone tracker' }
];
overlayDefs.forEach(ov => {
    writeJSON(path.join(ASSETS, 'tikfinity', 'overlays', `${ov.id}.json`), ov, 'overlays', 'tikfinity');
});

// ═══════════════════════════════════════════════════
// PHASE 3: StreamTory Assets
// ═══════════════════════════════════════════════════
console.log('\n═══ PHASE 3: Extracting StreamTory assets ═══');
const ST_DIR = path.join(VENDOR, 'app-1.1.24');

// 3a. Analyze STREAMTORY.exe for embedded strings
console.log('\n  [3a] Analyzing STREAMTORY.exe binary:');
const exePath = path.join(ST_DIR, 'STREAMTORY.exe');
let exeStrings = { urls: [], paths: [], configs: [] };
if (fs.existsSync(exePath)) {
    try {
        // Read binary and extract ASCII strings (min 8 chars)
        const buf = fs.readFileSync(exePath);
        const strings = [];
        let current = '';
        for (let i = 0; i < buf.length; i++) {
            const c = buf[i];
            if (c >= 32 && c < 127) {
                current += String.fromCharCode(c);
            } else {
                if (current.length >= 8) strings.push(current);
                current = '';
            }
        }
        if (current.length >= 8) strings.push(current);

        // Filter interesting strings
        exeStrings.urls = strings.filter(s => /^https?:\/\//.test(s)).slice(0, 200);
        exeStrings.paths = strings.filter(s => /\/(api|assets|static|overlay|template|analytics)/.test(s) && !s.startsWith('http')).slice(0, 100);
        exeStrings.configs = strings.filter(s => /tiktory|streamtory|crowdcontrol|tiktok/i.test(s)).slice(0, 100);

        console.log(`    Found ${exeStrings.urls.length} URLs, ${exeStrings.paths.length} paths, ${exeStrings.configs.length} config strings`);
    } catch (e) {
        console.log(`    Binary analysis failed: ${e.message}`);
    }
}
writeJSON(path.join(ASSETS, 'streamtory', 'configs', 'exe-strings.json'), {
    extractedAt: new Date().toISOString(),
    source: 'STREAMTORY.exe',
    ...exeStrings
}, 'configs', 'streamtory');
inventory.streamtory.endpoints = exeStrings.urls.filter(u => u.includes('tiktory') || u.includes('tiktok'));

// 3b. Check for app.asar in resources/
console.log('\n  [3b] Checking for app.asar:');
const asarPath = path.join(ST_DIR, 'resources', 'app.asar');
if (fs.existsSync(asarPath)) {
    console.log('    Found app.asar — attempting extraction...');
    try {
        const extractDir = path.join(ASSETS, 'streamtory', 'configs', 'asar-extracted');
        execSync(`npx asar extract "${asarPath}" "${extractDir}"`, { timeout: 30000 });
        console.log('    ✓ Extracted app.asar');
    } catch (e) {
        console.log('    app.asar extraction failed:', e.message);
    }
} else {
    console.log('    No app.asar found (exe is self-contained)');
    // Check resources directory
    const resDir = path.join(ST_DIR, 'resources');
    if (fs.existsSync(resDir)) {
        const resFiles = fs.readdirSync(resDir);
        console.log('    Resources dir contents:', resFiles.join(', ') || '(empty)');
    }
}

// 3c. Copy vk_swiftshader_icd.json (only JSON in the dir)
const vkJson = path.join(ST_DIR, 'vk_swiftshader_icd.json');
if (fs.existsSync(vkJson)) {
    copyFile(vkJson, path.join(ASSETS, 'streamtory', 'configs', 'vk_swiftshader_icd.json'), 'configs', 'streamtory');
}

// 3d. Legacy configs
console.log('\n  [3d] Legacy configs:');
const legacyDir = path.join(VENDOR, 'legacy');
if (fs.existsSync(legacyDir)) {
    const legacyFiles = fs.readdirSync(legacyDir).filter(f => f.endsWith('.json') || f.endsWith('.js'));
    legacyFiles.forEach(f => {
        copyFile(path.join(legacyDir, f), path.join(ASSETS, 'streamtory', 'configs', `legacy-${f}`), 'configs', 'streamtory');
    });
}

// 3e. Generate analytics templates
console.log('\n  [3e] Generating analytics templates:');
const analyticsTemplates = [
    { id: 'revenue-dashboard', name: 'Revenue Dashboard', type: 'dashboard', metrics: ['gifts', 'coins', 'diamonds', 'revenue_usd'], refreshMs: 5000 },
    { id: 'engagement-tracker', name: 'Engagement Tracker', type: 'tracker', metrics: ['viewers', 'likes', 'shares', 'comments', 'followers'], refreshMs: 3000 },
    { id: 'stream-summary', name: 'Stream Summary', type: 'summary', metrics: ['duration', 'peak_viewers', 'total_gifts', 'new_followers'], exportFormats: ['json', 'csv'] },
    { id: 'gift-leaderboard', name: 'Gift Leaderboard', type: 'leaderboard', config: { maxEntries: 50, showAvatar: true } },
    { id: 'viewer-heatmap', name: 'Viewer Heatmap', type: 'heatmap', config: { resolution: '1min' } },
    { id: 'growth-chart', name: 'Growth Chart', type: 'chart', config: { periods: ['7d', '30d', '90d'] } }
];
analyticsTemplates.forEach(t => {
    writeJSON(path.join(ASSETS, 'streamtory', 'analytics', `${t.id}.json`), t, 'analytics', 'streamtory');
});

// 3f. Generate overlay templates
console.log('\n  [3f] Generating overlay templates:');
const stOverlays = [
    { id: 'chat-overlay', name: 'Chat Overlay', type: 'chat', config: { maxMessages: 20, theme: 'dark', animation: 'slide-up' } },
    { id: 'alert-overlay', name: 'Alert Overlay', type: 'alert', config: { duration: 5000, animation: 'bounce-in' } },
    { id: 'goal-bar', name: 'Goal Progress Bar', type: 'goal', config: { showPercentage: true, colors: { fill: '#6366f1' } } },
    { id: 'event-ticker', name: 'Event Ticker', type: 'ticker', config: { speed: 50, direction: 'left' } }
];
stOverlays.forEach(o => {
    writeJSON(path.join(ASSETS, 'streamtory', 'overlays', `${o.id}.json`), o, 'overlays', 'streamtory');
});

// ═══════════════════════════════════════════════════
// PHASE 4: CrowdControl Assets
// ═══════════════════════════════════════════════════
console.log('\n═══ PHASE 4: Extracting CrowdControl assets ═══');

// 4a. Preferences
console.log('\n  [4a] Preferences:');
['Preferences', 'Local State'].forEach(file => {
    const fp = path.join(CC_DIR, file);
    if (fs.existsSync(fp)) {
        try {
            const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
            writeJSON(path.join(ASSETS, 'streamcontrol', 'configs', `${file.toLowerCase().replace(/\s/g, '-')}.json`), data, 'configs', 'streamcontrol');
        } catch (_) {
            copyFile(fp, path.join(ASSETS, 'streamcontrol', 'configs', `${file.toLowerCase().replace(/\s/g, '-')}.raw`), 'configs', 'streamcontrol');
        }
    }
});

// Disrupt overlay preferences
const disruptPrefs = path.join(CC_DIR, 'Partitions', 'disrupt-overlay', 'Preferences');
if (fs.existsSync(disruptPrefs)) {
    try {
        const data = JSON.parse(fs.readFileSync(disruptPrefs, 'utf8'));
        writeJSON(path.join(ASSETS, 'streamcontrol', 'configs', 'disrupt-overlay-prefs.json'), data, 'configs', 'streamcontrol');
    } catch (_) {}
}

// 4b. Network endpoints
console.log('\n  [4b] Network endpoints:');
const netState = path.join(CC_DIR, 'Network', 'Network Persistent State');
if (fs.existsSync(netState)) {
    try {
        const data = JSON.parse(fs.readFileSync(netState, 'utf8'));
        const servers = data?.net?.http_server_properties?.servers || [];
        const endpoints = servers.map(s => s.server).filter(Boolean);
        writeJSON(path.join(ASSETS, 'streamcontrol', 'endpoints', 'discovered-servers.json'), {
            extractedAt: new Date().toISOString(),
            source: 'Network Persistent State',
            servers: endpoints,
            details: servers
        }, 'endpoints', 'streamcontrol');
        inventory.streamcontrol.endpoints = endpoints;
        console.log(`    Found ${endpoints.length} server endpoints`);
    } catch (e) {
        console.log('    Failed to parse network state:', e.message);
    }
}

// 4c. LevelDB extraction
console.log('\n  [4c] LevelDB data:');
const leveldbDirs = [
    { path: path.join(CC_DIR, 'Local Storage', 'leveldb'), name: 'main' },
    { path: path.join(CC_DIR, 'Partitions', 'disrupt-overlay', 'Local Storage', 'leveldb'), name: 'disrupt-overlay' }
];
leveldbDirs.forEach(({ path: dbPath, name }) => {
    if (!fs.existsSync(dbPath)) return;
    const files = fs.readdirSync(dbPath);
    const ldbFiles = files.filter(f => f.endsWith('.ldb') || f.endsWith('.log'));
    console.log(`    ${name}: ${ldbFiles.length} data files`);

    // Read raw LDB/LOG files and extract readable strings
    const extractedData = [];
    ldbFiles.forEach(f => {
        const fp = path.join(dbPath, f);
        try {
            const buf = fs.readFileSync(fp);
            let current = '';
            for (let i = 0; i < buf.length; i++) {
                const c = buf[i];
                if (c >= 32 && c < 127) {
                    current += String.fromCharCode(c);
                } else {
                    if (current.length >= 10) extractedData.push(current);
                    current = '';
                }
            }
            if (current.length >= 10) extractedData.push(current);
        } catch (_) {}
    });

    // Filter for interesting data
    const urls = extractedData.filter(s => /^https?:\/\//.test(s));
    const jsonLike = extractedData.filter(s => s.startsWith('{') || s.startsWith('['));
    const keys = extractedData.filter(s => s.startsWith('_') || s.includes('crowdcontrol') || s.includes('overlay') || s.includes('game') || s.includes('poll'));

    writeJSON(path.join(ASSETS, 'streamcontrol', 'configs', `leveldb-${name}.json`), {
        extractedAt: new Date().toISOString(),
        source: dbPath,
        dataFiles: ldbFiles.length,
        totalStrings: extractedData.length,
        urls: [...new Set(urls)],
        jsonFragments: jsonLike.slice(0, 50),
        interestingKeys: [...new Set(keys)].slice(0, 100)
    }, 'configs', 'streamcontrol');
});

// 4d. Generate game templates
console.log('\n  [4d] Generating game templates:');
const games = [
    { id: 'spin-wheel', name: 'Spin the Wheel', type: 'wheel', minPlayers: 1, maxPlayers: 100, config: { segments: 8, spinDuration: 5000 }, triggers: [{ event: 'gift', minValue: 10 }, { event: 'command', keyword: '!spin' }] },
    { id: 'trivia', name: 'Trivia Challenge', type: 'quiz', minPlayers: 2, maxPlayers: 1000, config: { questionTime: 30, rounds: 10, categories: ['general', 'gaming', 'music'] } },
    { id: 'word-chain', name: 'Word Chain', type: 'word', minPlayers: 2, maxPlayers: 50, config: { timePerTurn: 15, minWordLength: 3 } },
    { id: 'number-guess', name: 'Number Guess', type: 'guess', minPlayers: 1, maxPlayers: 1000, config: { minNumber: 1, maxNumber: 100, hintType: 'hot-cold' } },
    { id: 'chat-battle', name: 'Chat Battle', type: 'battle', minPlayers: 2, maxPlayers: 10000, config: { duration: 60, teams: 2 } },
    { id: 'bingo', name: 'Stream Bingo', type: 'bingo', minPlayers: 2, maxPlayers: 500, config: { gridSize: 5, autoCall: true } },
    { id: 'raffle', name: 'Raffle Draw', type: 'raffle', minPlayers: 2, maxPlayers: 10000, config: { entryKeyword: '!join', maxWinners: 5 } },
    { id: 'prediction', name: 'Prediction Market', type: 'prediction', minPlayers: 2, maxPlayers: 10000, config: { options: 2, duration: 300 } }
];
games.forEach(g => writeJSON(path.join(ASSETS, 'streamcontrol', 'games', `${g.id}.json`), g, 'games', 'streamcontrol'));

// 4e. Generate poll templates
console.log('\n  [4e] Generating poll templates:');
const polls = [
    { id: 'yes-no', name: 'Yes/No Poll', config: { options: ['Yes', 'No'], duration: 60 } },
    { id: 'multiple-choice', name: 'Multiple Choice', config: { maxOptions: 6, duration: 120 } },
    { id: 'rating', name: 'Rating Poll', config: { scale: 5, duration: 60 } },
    { id: 'word-cloud', name: 'Word Cloud', config: { maxWords: 100, duration: 120 } },
    { id: 'versus', name: 'Versus Poll', config: { options: 2, duration: 90, animation: 'tug-of-war' } }
];
polls.forEach(p => writeJSON(path.join(ASSETS, 'streamcontrol', 'polls', `${p.id}.json`), p, 'polls', 'streamcontrol'));

// 4f. Generate reward templates
console.log('\n  [4f] Generating reward templates:');
const rewards = [
    { id: 'vip-badge', name: 'VIP Badge', type: 'badge', icon: 'star', color: '#f59e0b', requirement: { type: 'gift_total', value: 100 } },
    { id: 'mod-badge', name: 'Moderator Badge', type: 'badge', icon: 'shield', color: '#10b981', requirement: { type: 'manual' } },
    { id: 'top-gifter', name: 'Top Gifter', type: 'badge', icon: 'gift', color: '#ec4899', requirement: { type: 'gift_rank', value: 1 } },
    { id: 'loyal-viewer', name: 'Loyal Viewer', type: 'badge', icon: 'heart', color: '#ef4444', requirement: { type: 'watch_hours', value: 10 } },
    { id: 'first-chat', name: 'First Chat', type: 'badge', icon: 'message', color: '#6366f1', requirement: { type: 'first_message' } },
    { id: 'custom-title', name: 'Custom Title', type: 'title', icon: 'crown', color: '#8b5cf6', requirement: { type: 'points', value: 5000 } },
    { id: 'highlight-msg', name: 'Highlighted Message', type: 'effect', icon: 'sparkles', color: '#f97316', requirement: { type: 'points', value: 1000 } },
    { id: 'sound-alert', name: 'Custom Sound Alert', type: 'sound', icon: 'volume', color: '#14b8a6', requirement: { type: 'points', value: 3000 } }
];
rewards.forEach(r => writeJSON(path.join(ASSETS, 'streamcontrol', 'rewards', `${r.id}.json`), r, 'rewards', 'streamcontrol'));

// ═══════════════════════════════════════════════════
// PHASE 5: StreamFinity Exclusive Assets
// ═══════════════════════════════════════════════════
console.log('\n═══ PHASE 5: Generating StreamFinity exclusives ═══');

// 5a. Branding
const branding = {
    name: 'StreamFinity', tagline: 'Unified Multi-Platform Live Streaming', version: '1.0.0',
    colors: { primary: '#6366f1', secondary: '#8b5cf6', accent: '#ec4899', success: '#10b981', warning: '#f59e0b', error: '#ef4444', bg: '#1a1225', surface: '#1e1530', text: '#e2e8f0' },
    fonts: { heading: 'Inter, system-ui, sans-serif', mono: 'JetBrains Mono, monospace' },
    gradients: { primary: 'linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)', dark: 'linear-gradient(135deg, #1a1225, #1e1530)' }
};
writeJSON(path.join(ASSETS, 'streamfinity', 'branding', 'config.json'), branding, 'branding', 'streamfinity');

// 5b. Themes
const themes = [
    { id: 'dark-default', name: 'StreamFinity Dark', type: 'dark' },
    { id: 'light', name: 'StreamFinity Light', type: 'light' },
    { id: 'neon-purple', name: 'Neon Purple', type: 'dark' },
    { id: 'cyber-blue', name: 'Cyber Blue', type: 'dark' },
    { id: 'sunset', name: 'Sunset Orange', type: 'dark' }
];
themes.forEach(t => writeJSON(path.join(ASSETS, 'streamfinity', 'themes', `${t.id}.json`), t, 'themes', 'streamfinity'));

// 5c. Features manifest
const features = {
    crossPlatformSync: true, unifiedChat: true, aiVoices: true, advancedAnalytics: true,
    customAutomation: true, multiStream: true, overlayStudio: true, rewardEconomy: true,
    proBypass: true, allPlatforms: ['tikfinity', 'streamtory', 'streamcontrol', 'streamerbot']
};
writeJSON(path.join(ASSETS, 'streamfinity', 'branding', 'features.json'), features, 'features', 'streamfinity');

// ═══════════════════════════════════════════════════
// PHASE 6: Write INVENTORY.json
// ═══════════════════════════════════════════════════
console.log('\n═══ PHASE 6: Writing INVENTORY.json ═══');
const inventoryPath = path.join(ASSETS, 'INVENTORY.json');
fs.writeFileSync(inventoryPath, JSON.stringify(inventory, null, 2));
console.log(`  ✓ Inventory written: ${inventory.totals.files} files, ${(inventory.totals.bytes/1024).toFixed(1)}KB total`);

// ═══════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════
console.log('\n' + '═'.repeat(60));
console.log('  EXTRACTION COMPLETE');
console.log('═'.repeat(60));
console.log(`  TikFinity:     ${inventory.tikfinity.ui.length} UI + ${inventory.tikfinity.scripts.length} scripts + ${inventory.tikfinity.overlays.length} overlays + ${inventory.tikfinity.configs.length} configs`);
console.log(`  StreamTory:    ${inventory.streamtory.analytics.length} analytics + ${inventory.streamtory.overlays.length} overlays + ${inventory.streamtory.configs.length} configs`);
console.log(`  StreamControl: ${inventory.streamcontrol.games.length} games + ${inventory.streamcontrol.polls.length} polls + ${inventory.streamcontrol.rewards.length} rewards + ${inventory.streamcontrol.configs.length} configs`);
console.log(`  StreamFinity:  ${inventory.streamfinity.branding.length} branding + ${inventory.streamfinity.themes.length} themes`);
console.log(`  TOTAL:         ${inventory.totals.files} files (${(inventory.totals.bytes/1024).toFixed(1)}KB)`);
console.log(`  URLs found:    ${inventory.tikfinity.urls.length} TikFinity + ${inventory.streamcontrol.endpoints.length} CrowdControl`);
console.log('═'.repeat(60));
console.log(`  Assets dir: ${ASSETS}`);
console.log(`  Inventory:  ${inventoryPath}`);
