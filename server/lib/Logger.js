/**
 * StreamFinity Server Logger
 * Lightweight logger with levels, timestamps, and optional file output
 */

const fs = require('fs');
const path = require('path');

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3, success: 4 };
const COLORS = { debug: '\x1b[90m', info: '\x1b[36m', warn: '\x1b[33m', error: '\x1b[31m', success: '\x1b[32m' };
const RESET = '\x1b[0m';

class Logger {
    constructor(prefix, opts = {}) {
        this.prefix = prefix;
        this.level = LEVELS[opts.level || 'debug'];
        this.logDir = opts.logDir || null;
        this._stream = null;

        if (this.logDir) {
            try {
                fs.mkdirSync(this.logDir, { recursive: true });
                const file = path.join(this.logDir, `${prefix.toLowerCase().replace(/\s+/g, '-')}.log`);
                this._stream = fs.createWriteStream(file, { flags: 'a' });
            } catch (_) { /* ignore */ }
        }
    }

    _log(level, ...args) {
        if (LEVELS[level] < this.level) return;
        const ts = new Date().toISOString().slice(11, 23);
        const color = COLORS[level] || '';
        const tag = `${color}[${ts}][${this.prefix}][${level.toUpperCase()}]${RESET}`;
        console.log(tag, ...args);

        if (this._stream) {
            this._stream.write(`[${ts}][${this.prefix}][${level.toUpperCase()}] ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')}\n`);
        }
    }

    debug(...a) { this._log('debug', ...a); }
    info(...a) { this._log('info', ...a); }
    warn(...a) { this._log('warn', ...a); }
    error(...a) { this._log('error', ...a); }
    success(...a) { this._log('success', ...a); }

    child(prefix) {
        return new Logger(`${this.prefix}:${prefix}`, { level: Object.keys(LEVELS)[this.level], logDir: this.logDir });
    }
}

module.exports = Logger;
