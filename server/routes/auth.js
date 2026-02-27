/**
 * Auth Routes — /api/auth/*
 * Register, Login, Profile, Settings, Notifications, Password Reset
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'streamfinity_cc_secret_key_2024';
const JWT_EXPIRES = '7d';
const JWT_REMEMBER = '30d';

// ── JWT Auth Middleware ──
function authMiddleware(req, res, next) {
    const token = req.cookies?.streamfinity_token
        || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
    if (!token) return res.status(401).json({ error: 'Authentication required' });
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

module.exports = function createAuthRoutes(ccDb) {
    const router = express.Router();

    // ── REGISTER ──
    router.post('/register', async (req, res) => {
        try {
            const { username, email, password, confirmPassword, profile, gaming } = req.body;

            // Validation
            const errors = [];
            if (!username || username.length < 3 || username.length > 20) errors.push('Username must be 3-20 characters');
            if (!/^[a-zA-Z0-9_]+$/.test(username)) errors.push('Username can only contain letters, numbers, and underscores');
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Valid email required');
            if (!password || password.length < 8) errors.push('Password must be at least 8 characters');
            if (password !== confirmPassword) errors.push('Passwords do not match');

            if (errors.length > 0) return res.status(400).json({ error: 'Validation failed', details: errors });

            // Check existing
            const byEmail = await ccDb.findByEmail(email);
            if (byEmail) return res.status(409).json({ error: 'Email already registered' });
            const byUsername = await ccDb.findByUsername(username);
            if (byUsername) return res.status(409).json({ error: 'Username already taken' });

            // Hash password
            const passwordHash = await bcrypt.hash(password, 12);

            // Create user
            const user = await ccDb.registerUser(username, email, passwordHash, profile || {});

            // Apply gaming preferences
            if (gaming?.notifications || gaming?.privacy) {
                const settings = { ...(gaming.notifications || {}), ...(gaming.privacy || {}) };
                await ccDb.updateSettings(user.user_id, settings);
            }

            // Generate JWT
            const token = jwt.sign(
                { userId: user.user_id, username: user.username },
                JWT_SECRET, { expiresIn: JWT_EXPIRES }
            );

            res.cookie('streamfinity_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            res.status(201).json({
                success: true,
                message: 'Account created successfully',
                user: sanitizeUser(user),
                token
            });
        } catch (err) {
            if (err.code === '23505') {
                const field = err.constraint?.includes('email') ? 'Email' : 'Username';
                return res.status(409).json({ error: `${field} already exists` });
            }
            res.status(500).json({ error: 'Registration failed: ' + err.message });
        }
    });

    // ── LOGIN ──
    router.post('/login', async (req, res) => {
        try {
            const { identifier, password, rememberMe } = req.body;
            if (!identifier || !password) return res.status(400).json({ error: 'Email/username and password required' });

            const user = await ccDb.findByIdentifier(identifier);
            if (!user || !user.password_hash) return res.status(401).json({ error: 'Invalid credentials' });
            if (user.status !== 'active') return res.status(403).json({ error: 'Account is suspended' });

            const valid = await bcrypt.compare(password, user.password_hash);
            if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

            await ccDb.updateLastLogin(user.user_id);

            const expiresIn = rememberMe ? JWT_REMEMBER : JWT_EXPIRES;
            const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
            const token = jwt.sign(
                { userId: user.user_id, username: user.username, level: user.level },
                JWT_SECRET, { expiresIn }
            );

            res.cookie('streamfinity_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge
            });

            const inventory = await ccDb.getUserInventory(user.user_id);

            res.json({
                success: true,
                message: 'Login successful',
                user: sanitizeUser(user),
                inventory,
                token
            });
        } catch (err) {
            res.status(500).json({ error: 'Login failed: ' + err.message });
        }
    });

    // ── LOGOUT ──
    router.post('/logout', (req, res) => {
        res.clearCookie('streamfinity_token');
        res.json({ success: true, message: 'Logged out' });
    });

    // ── GET CURRENT USER (me) ──
    router.get('/me', authMiddleware, async (req, res) => {
        try {
            const user = await ccDb.getUser(req.user.userId);
            if (!user) return res.status(404).json({ error: 'User not found' });
            const inventory = await ccDb.getUserInventory(user.user_id);
            const unread = await ccDb.getUnreadCount(user.user_id);
            res.json({ user: sanitizeUser(user), inventory, unreadNotifications: unread });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // ── UPDATE PROFILE ──
    router.put('/profile', authMiddleware, async (req, res) => {
        try {
            const { display_name, bio, timezone } = req.body;
            const updates = {};
            if (display_name !== undefined) {
                if (display_name.length > 30) return res.status(400).json({ error: 'Display name max 30 chars' });
                updates.display_name = display_name;
            }
            if (bio !== undefined) {
                if (bio.length > 200) return res.status(400).json({ error: 'Bio max 200 chars' });
                updates.bio = bio;
            }
            if (timezone !== undefined) updates.timezone = timezone;

            const user = await ccDb.updateProfile(req.user.userId, updates);
            if (!user) return res.status(404).json({ error: 'User not found' });
            res.json({ success: true, user: sanitizeUser(user) });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // ── UPDATE SETTINGS ──
    router.put('/settings', authMiddleware, async (req, res) => {
        try {
            const user = await ccDb.updateSettings(req.user.userId, req.body);
            if (!user) return res.status(404).json({ error: 'User not found' });
            res.json({ success: true, settings: user.settings });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // ── CHANGE PASSWORD ──
    router.put('/password', authMiddleware, async (req, res) => {
        try {
            const { currentPassword, newPassword } = req.body;
            if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required' });
            if (newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });

            const user = await ccDb.getUser(req.user.userId);
            if (!user) return res.status(404).json({ error: 'User not found' });

            const valid = await bcrypt.compare(currentPassword, user.password_hash);
            if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

            const hash = await bcrypt.hash(newPassword, 12);
            await ccDb.changePassword(req.user.userId, hash);
            res.json({ success: true, message: 'Password changed' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // ── FORGOT PASSWORD ──
    router.post('/forgot-password', async (req, res) => {
        try {
            const { email } = req.body;
            if (!email) return res.status(400).json({ error: 'Email required' });
            const token = await ccDb.setResetToken(email);
            // In production, send email with reset link. For now, return token.
            res.json({ success: true, message: 'If the email exists, a reset link has been sent.' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // ── RESET PASSWORD ──
    router.post('/reset-password', async (req, res) => {
        try {
            const { token, newPassword } = req.body;
            if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password required' });
            if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

            const hash = await bcrypt.hash(newPassword, 12);
            const user = await ccDb.resetPassword(token, hash);
            if (!user) return res.status(400).json({ error: 'Invalid or expired reset token' });
            res.json({ success: true, message: 'Password reset successful' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // ── VERIFY EMAIL ──
    router.get('/verify-email', async (req, res) => {
        try {
            const { token } = req.query;
            if (!token) return res.status(400).json({ error: 'Token required' });
            const user = await ccDb.verifyEmail(token);
            if (!user) return res.status(400).json({ error: 'Invalid or already used token' });
            res.json({ success: true, message: 'Email verified successfully' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // ── NOTIFICATIONS ──
    router.get('/notifications', authMiddleware, async (req, res) => {
        try {
            const unreadOnly = req.query.unread === 'true';
            const limit = Math.min(parseInt(req.query.limit) || 30, 100);
            const notifications = await ccDb.getNotifications(req.user.userId, limit, unreadOnly);
            const unreadCount = await ccDb.getUnreadCount(req.user.userId);
            res.json({ notifications, unreadCount });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    router.post('/notifications/:id/read', authMiddleware, async (req, res) => {
        try {
            await ccDb.markNotificationRead(parseInt(req.params.id), req.user.userId);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    router.post('/notifications/read-all', authMiddleware, async (req, res) => {
        try {
            await ccDb.markAllNotificationsRead(req.user.userId);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // ── PUBLIC PROFILE ──
    router.get('/profile/:username', async (req, res) => {
        try {
            const user = await ccDb.findByUsername(req.params.username);
            if (!user) return res.status(404).json({ error: 'User not found' });
            if (!user.settings?.publicProfile) return res.status(403).json({ error: 'Profile is private' });
            const inventory = await ccDb.getUserInventory(user.user_id);
            res.json({
                profile: {
                    username: user.username,
                    display_name: user.display_name,
                    bio: user.bio,
                    avatar: user.avatar,
                    frame: user.frame,
                    badge: user.badge,
                    level: user.level,
                    stats: user.settings?.showStats ? user.stats : null,
                    achievements: user.achievements,
                    created_at: user.created_at
                },
                inventory: user.settings?.showStats ? inventory : null
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    return router;
};

// Export middleware for use in other routes
module.exports.authMiddleware = authMiddleware;

function sanitizeUser(user) {
    const { password_hash, verification_token, reset_token, reset_token_expires, ...safe } = user;
    return safe;
}
