const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const { query } = require('../db');
const { auth } = require('../middleware/auth');
const { sendEmail, welcomeEmail } = require('../utils/email');
const { signupRules, changePasswordRules } = require('../middleware/validate');
const config = require('../config');

const router = express.Router();

const avatarStorage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-avatar-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

const loginAttempts = new Map();
const LOCKOUT_DURATION = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

router.post('/signup', signupRules, async (req, res, next) => {
  try {
    const { email, password, full_name } = req.body;

    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, 12);
    const { rows } = await query(
      'INSERT INTO users (email, password, full_name) VALUES ($1, $2, $3) RETURNING id',
      [email, hash, full_name || '']
    );

    const userName = full_name || email;
    const adminResult = await query('SELECT id FROM users WHERE is_admin = TRUE');
    for (const row of adminResult.rows) {
      await query(
        'INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)',
        [row.id, `New user ${userName} registered (${email})`, 'user']
      );
    }

    res.status(201).json({ message: 'Account created' });
    sendEmail(email, 'Welcome to BlingzStore!', welcomeEmail(full_name || email.split('@')[0]));
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const attempt = loginAttempts.get(email);
    if (attempt && attempt.count >= MAX_ATTEMPTS && Date.now() - attempt.lastAttempt < LOCKOUT_DURATION) {
      const remaining = Math.ceil((LOCKOUT_DURATION - (Date.now() - attempt.lastAttempt)) / 60000);
      return res.status(429).json({ error: `Account locked. Try again in ${remaining} minutes` });
    }

    const { rows } = await query('SELECT id, password FROM users WHERE email = $1', [email]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, rows[0].password);

    if (!match) {
      const current = loginAttempts.get(email) || { count: 0 };
      loginAttempts.set(email, { count: current.count + 1, lastAttempt: Date.now() });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    loginAttempts.delete(email);

    const token = jwt.sign({ userId: rows[0].id }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
      algorithm: 'HS256',
    });
    res.json({ token });
  } catch (err) {
    next(err);
  }
});

router.get('/profile', auth, async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT id, email, full_name, is_admin, avatar_url FROM users WHERE id = $1',
      [req.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put('/profile', auth, async (req, res, next) => {
  try {
    const { full_name } = req.body;
    await query('UPDATE users SET full_name = $1 WHERE id = $2', [full_name || '', req.userId]);
    res.json({ message: 'Profile updated' });
  } catch (err) {
    next(err);
  }
});

router.post('/profile/avatar', auth, avatarUpload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const url = `${config.baseUrl}/uploads/${req.file.filename}`;
    await query('UPDATE users SET avatar_url = $1 WHERE id = $2', [url, req.userId]);
    res.json({ url });
  } catch (err) {
    next(err);
  }
});

router.put('/change-password', auth, changePasswordRules, async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;

    const { rows } = await query('SELECT password FROM users WHERE id = $1', [req.userId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const match = await bcrypt.compare(current_password, rows[0].password);
    if (!match) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hash = await bcrypt.hash(new_password, 12);
    await query('UPDATE users SET password = $1 WHERE id = $2', [hash, req.userId]);

    res.json({ message: 'Password changed' });
  } catch (err) {
    next(err);
  }
});

router.delete('/account', auth, async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const { rows } = await query('SELECT password, is_admin FROM users WHERE id = $1', [req.userId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (rows[0].is_admin) {
      return res.status(403).json({ error: 'Admin accounts cannot be deleted' });
    }

    const match = await bcrypt.compare(password, rows[0].password);
    if (!match) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    await query('DELETE FROM reviews WHERE user_id = $1', [req.userId]);
    await query('DELETE FROM wishlist WHERE user_id = $1', [req.userId]);
    await query('DELETE FROM cart WHERE user_id = $1', [req.userId]);
    await query('DELETE FROM notifications WHERE user_id = $1', [req.userId]);
    await query('DELETE FROM users WHERE id = $1', [req.userId]);

    res.json({ message: 'Account deleted' });
  } catch (err) {
    next(err);
  }
});

router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const { rows } = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (rows.length === 0) {
      return res.json({ message: 'If that email exists, a reset link has been sent' });
    }

    const userId = rows[0].id;
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    await query('DELETE FROM password_resets WHERE user_id = $1', [userId]);
    await query(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [userId, token, expiresAt]
    );

    res.json({ message: 'If that email exists, a reset link has been sent' });
  } catch (err) {
    next(err);
  }
});

router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const { rows } = await query('SELECT user_id, expires_at, used FROM password_resets WHERE token = $1', [token]);
    if (rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const reset = rows[0];
    if (reset.used) {
      return res.status(400).json({ error: 'Token has already been used' });
    }

    if (new Date(reset.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Token has expired' });
    }

    const hash = await bcrypt.hash(password, 12);
    await query('UPDATE users SET password = $1 WHERE id = $2', [hash, reset.user_id]);
    await query('UPDATE password_resets SET used = TRUE WHERE token = $1', [token]);

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
