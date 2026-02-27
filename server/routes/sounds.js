/**
 * Sound Alerts API Routes
 * - GET  /api/sounds          → list all sounds (defaults + user uploads)
 * - GET  /api/sounds/defaults  → list default sounds only
 * - POST /api/sounds/upload    → upload a sound file (multipart)
 * - DELETE /api/sounds/:filename → delete a user-uploaded sound
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const SOUNDS_DIR = path.join(__dirname, '..', 'public', 'sounds');
const DEFAULTS_DIR = path.join(SOUNDS_DIR, 'defaults');
const UPLOADS_DIR = path.join(SOUNDS_DIR, 'uploads');

const ALLOWED_EXT = ['.wav', '.mp3', '.ogg', '.webm', '.m4a'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

module.exports = function createSoundRoutes(/* ctx */) {
    const router = express.Router();

    // Ensure dirs exist
    fs.mkdirSync(DEFAULTS_DIR, { recursive: true });
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });

    // Multer config for uploads
    const storage = multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
        filename: (_req, file, cb) => {
            const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
            const ext = path.extname(safe);
            const base = path.basename(safe, ext);
            const final = base + '-' + Date.now() + ext;
            cb(null, final);
        }
    });
    const upload = multer({
        storage,
        limits: { fileSize: MAX_FILE_SIZE },
        fileFilter: (_req, file, cb) => {
            const ext = path.extname(file.originalname).toLowerCase();
            if (ALLOWED_EXT.includes(ext)) return cb(null, true);
            cb(new Error('Invalid file type. Allowed: ' + ALLOWED_EXT.join(', ')));
        }
    });

    function listDir(dir, prefix) {
        try {
            return fs.readdirSync(dir)
                .filter(f => ALLOWED_EXT.includes(path.extname(f).toLowerCase()))
                .map(f => {
                    const stat = fs.statSync(path.join(dir, f));
                    return {
                        filename: f,
                        url: `/sounds/${prefix}/${f}`,
                        size: stat.size,
                        category: prefix,
                        createdAt: stat.birthtime
                    };
                });
        } catch { return []; }
    }

    // GET /api/sounds — list all sounds
    router.get('/', (_req, res) => {
        const defaults = listDir(DEFAULTS_DIR, 'defaults');
        const uploads = listDir(UPLOADS_DIR, 'uploads');
        res.json({ success: true, sounds: [...defaults, ...uploads], total: defaults.length + uploads.length });
    });

    // GET /api/sounds/defaults — list default sounds only
    router.get('/defaults', (_req, res) => {
        const defaults = listDir(DEFAULTS_DIR, 'defaults');
        res.json({ success: true, sounds: defaults, total: defaults.length });
    });

    // POST /api/sounds/upload — upload a sound file
    router.post('/upload', upload.single('sound'), (req, res) => {
        if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
        const info = {
            filename: req.file.filename,
            url: `/sounds/uploads/${req.file.filename}`,
            size: req.file.size,
            category: 'uploads'
        };
        res.json({ success: true, sound: info });
    });

    // DELETE /api/sounds/:filename — delete a user-uploaded sound
    router.delete('/:filename', (req, res) => {
        const safe = path.basename(req.params.filename);
        const filepath = path.join(UPLOADS_DIR, safe);
        // Only allow deleting from uploads, never defaults
        if (!fs.existsSync(filepath)) return res.status(404).json({ success: false, error: 'Sound not found' });
        try {
            fs.unlinkSync(filepath);
            res.json({ success: true, deleted: safe });
        } catch (e) {
            res.status(500).json({ success: false, error: e.message });
        }
    });

    // Error handler for multer
    router.use((err, _req, res, _next) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ success: false, error: err.message });
        }
        res.status(400).json({ success: false, error: err.message || 'Upload failed' });
    });

    return router;
};
