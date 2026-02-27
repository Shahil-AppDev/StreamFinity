/**
 * StreamFinity - Unified Logger
 * Centralized logging for all platforms
 */

const LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };

class Logger {
    constructor(prefix = 'StreamFinity', level = LOG_LEVELS.DEBUG) {
        this.prefix = prefix;
        this.level = level;
        this.history = [];
        this.maxHistory = 500;
    }

    _log(level, levelName, icon, ...args) {
        if (level < this.level) return;

        const timestamp = new Date().toISOString();
        const entry = { timestamp, level: levelName, prefix: this.prefix, message: args.join(' ') };

        this.history.push(entry);
        if (this.history.length > this.maxHistory) this.history.shift();

        const tag = `[${this.prefix}]`;
        switch (level) {
            case LOG_LEVELS.ERROR: console.error(icon, tag, ...args); break;
            case LOG_LEVELS.WARN:  console.warn(icon, tag, ...args); break;
            default:               console.log(icon, tag, ...args); break;
        }
    }

    debug(...args) { this._log(LOG_LEVELS.DEBUG, 'DEBUG', '🔍', ...args); }
    info(...args)  { this._log(LOG_LEVELS.INFO,  'INFO',  '📋', ...args); }
    warn(...args)  { this._log(LOG_LEVELS.WARN,  'WARN',  '⚠️', ...args); }
    error(...args) { this._log(LOG_LEVELS.ERROR, 'ERROR', '❌', ...args); }

    success(...args) { this._log(LOG_LEVELS.INFO, 'OK', '✅', ...args); }
    start(...args)   { this._log(LOG_LEVELS.INFO, 'START', '🚀', ...args); }

    child(prefix) {
        return new Logger(`${this.prefix}:${prefix}`, this.level);
    }

    getHistory(count = 50) {
        return this.history.slice(-count);
    }
}

module.exports = { Logger, LOG_LEVELS };
