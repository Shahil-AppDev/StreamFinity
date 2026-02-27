/**
 * StreamFinity Metrics Collector
 * Tracks performance, asset usage, loader stats, and system health
 */

class MetricsCollector {
    constructor() {
        this._startTime = Date.now();
        this._requests = { total: 0, byRoute: {}, byMethod: {} };
        this._assets = { served: 0, byPlatform: {}, byCategory: {} };
        this._responseTimes = [];
        this._maxResponseTimes = 1000; // Keep last 1000
        this._errors = { total: 0, byType: {} };
        this._ws = { connections: 0, messages: 0, peak: 0 };
        this._extraction = { runs: 0, lastRun: null, results: {} };
    }

    // ── Request Tracking ──

    trackRequest(method, route, responseTimeMs, statusCode) {
        this._requests.total++;
        this._requests.byMethod[method] = (this._requests.byMethod[method] || 0) + 1;

        const routeKey = route.split('?')[0]; // Strip query params
        if (!this._requests.byRoute[routeKey]) {
            this._requests.byRoute[routeKey] = { count: 0, avgMs: 0, errors: 0 };
        }
        const r = this._requests.byRoute[routeKey];
        r.count++;
        r.avgMs = Math.round((r.avgMs * (r.count - 1) + responseTimeMs) / r.count);
        if (statusCode >= 400) r.errors++;

        this._responseTimes.push(responseTimeMs);
        if (this._responseTimes.length > this._maxResponseTimes) {
            this._responseTimes.shift();
        }
    }

    // ── Asset Tracking ──

    trackAssetServed(platform, category, source) {
        this._assets.served++;
        this._assets.byPlatform[platform] = (this._assets.byPlatform[platform] || 0) + 1;
        const catKey = `${platform}/${category}`;
        this._assets.byCategory[catKey] = (this._assets.byCategory[catKey] || 0) + 1;
    }

    // ── Error Tracking ──

    trackError(type, message) {
        this._errors.total++;
        this._errors.byType[type] = (this._errors.byType[type] || 0) + 1;
    }

    // ── WebSocket Tracking ──

    trackWSConnection(currentCount) {
        this._ws.connections++;
        if (currentCount > this._ws.peak) this._ws.peak = currentCount;
    }

    trackWSMessage() {
        this._ws.messages++;
    }

    // ── Extraction Tracking ──

    trackExtraction(results) {
        this._extraction.runs++;
        this._extraction.lastRun = new Date().toISOString();
        this._extraction.results = results;
    }

    // ── Metrics Output ──

    getMetrics() {
        const uptime = Math.floor((Date.now() - this._startTime) / 1000);
        const rt = this._responseTimes;
        const sorted = [...rt].sort((a, b) => a - b);

        return {
            uptime,
            uptimeHuman: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`,
            requests: {
                total: this._requests.total,
                byMethod: this._requests.byMethod,
                topRoutes: this._getTopRoutes(10)
            },
            performance: {
                avgResponseMs: rt.length > 0 ? Math.round(rt.reduce((a, b) => a + b, 0) / rt.length) : 0,
                p50Ms: sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.5)] : 0,
                p95Ms: sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.95)] : 0,
                p99Ms: sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.99)] : 0,
                samples: rt.length
            },
            assets: this._assets,
            errors: this._errors,
            websocket: this._ws,
            extraction: this._extraction,
            system: {
                memoryMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
                memoryTotalMB: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
                pid: process.pid,
                nodeVersion: process.version,
                platform: process.platform
            }
        };
    }

    _getTopRoutes(n) {
        return Object.entries(this._requests.byRoute)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, n)
            .map(([route, stats]) => ({ route, ...stats }));
    }

    // ── Express Middleware ──

    middleware() {
        return (req, res, next) => {
            const start = Date.now();
            res.on('finish', () => {
                this.trackRequest(req.method, req.path, Date.now() - start, res.statusCode);
            });
            next();
        };
    }
}

module.exports = MetricsCollector;
