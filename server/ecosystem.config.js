/**
 * PM2 Ecosystem Configuration for StreamFinity Server
 * Usage: pm2 start ecosystem.config.js
 */

module.exports = {
    apps: [{
        name: 'streamfinity-pro',
        script: 'index.js',
        cwd: '/var/www/tik.starline-agency.xyz',
        instances: 2,
        exec_mode: 'cluster',
        watch: false,
        max_memory_restart: '1G',
        node_args: '--max-old-space-size=1024',
        env: {
            NODE_ENV: 'production',
            SF_HTTP_PORT: 3010,
            MONGODB_URI: 'mongodb://127.0.0.1:27017',
            MONGODB_DB: 'streamfinity',
            REDIS_URL: 'redis://127.0.0.1:6379',
            CDN_URL: 'https://tik.starline-agency.xyz'
        },
        error_file: '/var/log/streamfinity/error.log',
        out_file: '/var/log/streamfinity/out.log',
        log_file: '/var/log/streamfinity/combined.log',
        merge_logs: true,
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        kill_timeout: 5000,
        listen_timeout: 10000,
        shutdown_with_message: true
    }]
};
