/**
 * PostgreSQL Database Manager
 * Handles connection, tables, and CRUD operations
 * Drop-in replacement for the previous MongoDB module — same public API
 */

const { Pool } = require('pg');
const Logger = require('./Logger');

class Database {
    constructor(config = {}) {
        this.connectionString = config.pgUri || process.env.DATABASE_URL || 'postgresql://streamfinity:streamfinity@127.0.0.1:5432/streamfinity';
        this.log = new Logger('Database');
        this.pool = null;
        this.connected = false;
    }

    async connect() {
        try {
            this.pool = new Pool({
                connectionString: this.connectionString,
                max: 10,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 5000
            });

            // Test the connection
            const client = await this.pool.connect();
            client.release();
            this.connected = true;

            await this._ensureTables();

            const dbName = this.connectionString.split('/').pop().split('?')[0];
            this.log.success(`Connected to PostgreSQL (${dbName})`);
            return true;
        } catch (err) {
            this.log.error('PostgreSQL connection failed:', err.message);
            this.connected = false;
            return false;
        }
    }

    async _ensureTables() {
        try {
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS assets (
                    id SERIAL PRIMARY KEY,
                    platform VARCHAR(64) NOT NULL,
                    category VARCHAR(64) NOT NULL,
                    filename VARCHAR(255) NOT NULL,
                    metadata JSONB DEFAULT '{}',
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW(),
                    UNIQUE(platform, category, filename)
                );
                CREATE INDEX IF NOT EXISTS idx_assets_platform_category ON assets(platform, category);
                CREATE INDEX IF NOT EXISTS idx_assets_filename ON assets(filename);
                CREATE INDEX IF NOT EXISTS idx_assets_updated ON assets(updated_at DESC);

                CREATE TABLE IF NOT EXISTS events (
                    id SERIAL PRIMARY KEY,
                    type VARCHAR(64) NOT NULL,
                    data JSONB DEFAULT '{}',
                    timestamp TIMESTAMPTZ DEFAULT NOW()
                );
                CREATE INDEX IF NOT EXISTS idx_events_type_ts ON events(type, timestamp DESC);

                CREATE TABLE IF NOT EXISTS sessions (
                    id SERIAL PRIMARY KEY,
                    session_id VARCHAR(128) UNIQUE NOT NULL,
                    data JSONB DEFAULT '{}',
                    expires_at TIMESTAMPTZ NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );

                CREATE TABLE IF NOT EXISTS usage (
                    id SERIAL PRIMARY KEY,
                    endpoint VARCHAR(255) NOT NULL,
                    date DATE NOT NULL DEFAULT CURRENT_DATE,
                    count INT DEFAULT 1,
                    ips TEXT[] DEFAULT '{}',
                    last_access TIMESTAMPTZ DEFAULT NOW(),
                    UNIQUE(endpoint, date)
                );
                CREATE INDEX IF NOT EXISTS idx_usage_date ON usage(date DESC);
            `);
            this.log.debug('Database tables ensured');
        } catch (err) {
            this.log.warn('Table creation warning:', err.message);
        }
    }

    // ── Asset Metadata ──

    async upsertAsset(platform, category, filename, metadata) {
        if (!this.connected) return null;
        try {
            const result = await this.pool.query(`
                INSERT INTO assets (platform, category, filename, metadata, updated_at)
                VALUES ($1, $2, $3, $4, NOW())
                ON CONFLICT (platform, category, filename)
                DO UPDATE SET metadata = $4, updated_at = NOW()
                RETURNING *
            `, [platform, category, filename, JSON.stringify(metadata)]);
            return result.rows[0];
        } catch (err) {
            this.log.error('upsertAsset error:', err.message);
            return null;
        }
    }

    async getAssets(platform, category) {
        if (!this.connected) return [];
        try {
            const conditions = [];
            const params = [];
            if (platform) { conditions.push(`platform = $${params.length + 1}`); params.push(platform); }
            if (category) { conditions.push(`category = $${params.length + 1}`); params.push(category); }
            const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
            const result = await this.pool.query(`SELECT * FROM assets ${where} ORDER BY updated_at DESC`, params);
            return result.rows;
        } catch (err) {
            this.log.error('getAssets error:', err.message);
            return [];
        }
    }

    async getAssetCount() {
        if (!this.connected) return 0;
        try {
            const result = await this.pool.query('SELECT COUNT(*)::int AS count FROM assets');
            return result.rows[0].count;
        } catch (err) {
            return 0;
        }
    }

    // ── Events ──

    async logEvent(type, data) {
        if (!this.connected) return null;
        try {
            const result = await this.pool.query(
                'INSERT INTO events (type, data) VALUES ($1, $2) RETURNING *',
                [type, JSON.stringify(data)]
            );
            return result.rows[0];
        } catch (err) {
            this.log.error('logEvent error:', err.message);
            return null;
        }
    }

    async getRecentEvents(type, limit = 50) {
        if (!this.connected) return [];
        try {
            if (type) {
                const result = await this.pool.query(
                    'SELECT * FROM events WHERE type = $1 ORDER BY timestamp DESC LIMIT $2',
                    [type, limit]
                );
                return result.rows;
            }
            const result = await this.pool.query(
                'SELECT * FROM events ORDER BY timestamp DESC LIMIT $1',
                [limit]
            );
            return result.rows;
        } catch (err) {
            this.log.error('getRecentEvents error:', err.message);
            return [];
        }
    }

    // ── Usage Tracking ──

    async trackUsage(endpoint, ip) {
        if (!this.connected) return;
        try {
            await this.pool.query(`
                INSERT INTO usage (endpoint, date, count, ips, last_access)
                VALUES ($1, CURRENT_DATE, 1, ARRAY[$2]::text[], NOW())
                ON CONFLICT (endpoint, date)
                DO UPDATE SET count = usage.count + 1,
                    ips = CASE WHEN $2 = ANY(usage.ips) THEN usage.ips ELSE array_append(usage.ips, $2) END,
                    last_access = NOW()
            `, [endpoint, ip]);
        } catch (err) {
            this.log.error('trackUsage error:', err.message);
        }
    }

    async getUsageStats(days = 7) {
        if (!this.connected) return [];
        try {
            const result = await this.pool.query(
                'SELECT * FROM usage WHERE date >= CURRENT_DATE - $1::int ORDER BY date DESC, count DESC',
                [days]
            );
            return result.rows;
        } catch (err) {
            this.log.error('getUsageStats error:', err.message);
            return [];
        }
    }

    // ── Cleanup (TTL equivalent) ──

    async cleanup() {
        if (!this.connected) return;
        try {
            await this.pool.query("DELETE FROM events WHERE timestamp < NOW() - INTERVAL '7 days'");
            await this.pool.query("DELETE FROM sessions WHERE expires_at < NOW()");
            await this.pool.query("DELETE FROM usage WHERE date < CURRENT_DATE - 90");
            this.log.debug('Cleanup completed');
        } catch (err) {
            this.log.warn('Cleanup error:', err.message);
        }
    }

    // ── Status ──

    async getStats() {
        if (!this.connected) return { connected: false };
        try {
            const assetCount = await this.getAssetCount();
            const evtRes = await this.pool.query('SELECT COUNT(*)::int AS count FROM events');
            const dbName = this.connectionString.split('/').pop().split('?')[0];
            const sizeRes = await this.pool.query("SELECT pg_database_size(current_database()) AS size");
            return {
                connected: true,
                engine: 'postgresql',
                database: dbName,
                dataSize: parseInt(sizeRes.rows[0].size),
                assetCount,
                eventCount: evtRes.rows[0].count
            };
        } catch (err) {
            return { connected: true, error: err.message };
        }
    }

    async close() {
        if (this.pool) {
            await this.pool.end();
            this.connected = false;
            this.log.info('PostgreSQL connection closed');
        }
    }
}

module.exports = Database;
