/**
 * StreamTory Platform Module
 * Analytics, overlays, alerts, multi-stream, data export
 */

const { Logger } = require('../utils/logger');

class StreamToryPlatform {
    constructor(eventBus, config) {
        this.log = new Logger('StreamTory');
        this.eventBus = eventBus;
        this.config = config;
        this.name = 'StreamTory';
        this.id = 'streamtory';

        this.state = {
            active: false,
            overlays: [],
            alerts: [],
            analytics: {
                viewers: { current: 0, peak: 0, history: [] },
                engagement: { rate: 0, messages: 0, reactions: 0 },
                revenue: { total: 0, history: [] },
                sessions: []
            }
        };

        this.features = [
            'advanced_overlays',
            'custom_alerts',
            'analytics_dashboard',
            'multi_stream_support',
            'data_export',
            'historical_analysis'
        ];
    }

    async initialize() {
        this.log.start('Initializing StreamTory platform...');

        this._registerEventHandlers();

        this.state.active = true;
        this.log.success('StreamTory platform ready');
        return { success: true, platform: this.id };
    }

    trackViewers(count) {
        this.state.analytics.viewers.current = count;
        if (count > this.state.analytics.viewers.peak) {
            this.state.analytics.viewers.peak = count;
        }
        this.state.analytics.viewers.history.push({
            count,
            timestamp: Date.now()
        });

        this.eventBus.platformEmit(this.id, 'viewers:updated', {
            current: count,
            peak: this.state.analytics.viewers.peak
        });
    }

    trackRevenue(amount, source) {
        this.state.analytics.revenue.total += amount;
        this.state.analytics.revenue.history.push({
            amount, source, timestamp: Date.now()
        });

        this.eventBus.platformEmit(this.id, 'revenue:updated', {
            amount,
            total: this.state.analytics.revenue.total
        });
    }

    createOverlay(overlayConfig) {
        const overlay = {
            id: 'overlay_' + Date.now(),
            ...overlayConfig,
            createdAt: Date.now(),
            active: true
        };
        this.state.overlays.push(overlay);
        this.log.info(`Overlay created: ${overlay.id}`);

        this.eventBus.platformEmit(this.id, 'overlay:created', overlay);
        return overlay;
    }

    removeOverlay(overlayId) {
        this.state.overlays = this.state.overlays.filter(o => o.id !== overlayId);
        this.eventBus.platformEmit(this.id, 'overlay:removed', { id: overlayId });
        return { success: true };
    }

    createAlert(alertConfig) {
        const alert = {
            id: 'alert_' + Date.now(),
            ...alertConfig,
            createdAt: Date.now()
        };
        this.state.alerts.push(alert);
        this.log.info(`Alert created: ${alert.id}`);

        this.eventBus.platformEmit(this.id, 'alert:created', alert);
        this.eventBus.broadcast(this.id, 'alert:trigger', alert);
        return alert;
    }

    getAnalytics(timeRange = 'all') {
        return {
            viewers: { ...this.state.analytics.viewers },
            engagement: { ...this.state.analytics.engagement },
            revenue: {
                total: this.state.analytics.revenue.total,
                recentCount: this.state.analytics.revenue.history.length
            },
            timeRange
        };
    }

    exportData(format = 'json') {
        const data = {
            analytics: this.state.analytics,
            overlays: this.state.overlays,
            alerts: this.state.alerts,
            exportedAt: new Date().toISOString()
        };

        this.log.info(`Data exported in ${format} format`);
        return { success: true, format, data };
    }

    getStats() {
        return {
            platform: this.id,
            activeOverlays: this.state.overlays.filter(o => o.active).length,
            totalAlerts: this.state.alerts.length,
            viewers: this.state.analytics.viewers.current,
            peakViewers: this.state.analytics.viewers.peak,
            totalRevenue: this.state.analytics.revenue.total,
            engagementRate: this.state.analytics.engagement.rate
        };
    }

    getAPI() {
        return {
            getAnalytics: (range) => this.getAnalytics(range),
            createOverlay: (config) => this.createOverlay(config),
            removeOverlay: (id) => this.removeOverlay(id),
            getOverlays: () => [...this.state.overlays],
            createAlert: (config) => this.createAlert(config),
            exportData: (format) => this.exportData(format),
            getStats: () => this.getStats()
        };
    }

    _registerEventHandlers() {
        // React to StreamFinity gift events → track revenue
        this.eventBus.platformOn(this.id, 'gift:received', (gift) => {
            if (gift.diamondCount) {
                this.trackRevenue(gift.diamondCount * 0.005, 'tiktok_gift');
            }
        });

        // React to viewer count updates
        this.eventBus.platformOn(this.id, 'chat:new', () => {
            this.state.analytics.engagement.messages++;
        });

        this.eventBus.platformOn(this.id, 'data:sync', (data) => {
            this.log.debug('Received sync data:', data.key);
        });
    }

    async shutdown() {
        this.log.info('Shutting down StreamTory platform...');
        this.state.active = false;
    }
}

module.exports = StreamToryPlatform;
