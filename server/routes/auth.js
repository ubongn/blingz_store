const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const { getDb, saveDb } = require('../db');
const { JWT_SECRET, auth } = require('../middleware/auth');
const { sendEmail, welcomeEmail } = require('../utils/email');

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

router.post('/signup', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = await getDb();
    const existing = db.exec('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0 && existing[0].values.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, 10);
    db.run('INSERT INTO users (email, password, full_name) VALUES (?, ?, ?)', [email, hash, full_name || '']);
    saveDb();

    const userName = full_name || email;
    const adminResult = db.exec('SELECT id FROM users WHERE is_admin = 1');
    if (adminResult.length > 0) {
      adminResult[0].values.forEach(row => {
        db.run(
          'INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)',
          [row[0], `New user ${userName} registered (${email})`, 'user']
        );
      });
      saveDb();
    }

    res.status(201).json({ message: 'Account created' });
    sendEmail(email, 'Welcome to BlingzStore!', welcomeEmail(full_name || email.split('@')[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = await getDb();
    const result = db.exec('SELECT id, password FROM users WHERE email = ?', [email]);

    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const [id, storedHash] = result[0].values[0];
    const match = await bcrypt.compare(password, storedHash);

    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/profile', auth, async (req, res) => {
  try {
    const db = await getDb();
    const result = db.exec('SELECT id, email, full_name, is_admin, avatar_url FROM users WHERE id = ?', [req.userId]);

    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const columns = result[0].columns;
    const user = {};
    columns.forEach((col, i) => { user[col] = result[0].values[0][i]; });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/profile', auth, async (req, res) => {
  try {
    const { full_name } = req.body;
    const db = await getDb();

    db.run('UPDATE users SET full_name = ? WHERE id = ?',
      [full_name || '', req.userId]);
    saveDb();

    res.json({ message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/profile/avatar', auth, avatarUpload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const url = `http://localhost:5000/uploads/${req.file.filename}`;
    const db = await getDb();
    db.run('UPDATE users SET avatar_url = ? WHERE id = ?', [url, req.userId]);
    saveDb();
    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/change-password', auth, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const db = await getDb();
    const result = db.exec('SELECT password FROM users WHERE id = ?', [req.userId]);

    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const storedHash = result[0].values[0][0];
    const match = await bcrypt.compare(current_password, storedHash);

    if (!match) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hash = await bcrypt.hash(new_password, 10);
    db.run('UPDATE users SET password = ? WHERE id = ?', [hash, req.userId]);
    saveDb();

    res.json({ message: 'Password changed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/account', auth, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const db = await getDb();
    const result = db.exec('SELECT password, is_admin FROM users WHERE id = ?', [req.userId]);

    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [storedHash, isAdmin] = result[0].values[0];

    if (isAdmin) {
      return res.status(403).json({ error: 'Admin accounts cannot be deleted' });
    }

    const match = await bcrypt.compare(password, storedHash);
    if (!match) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    db.run('DELETE FROM reviews WHERE user_id = ?', [req.userId]);
    db.run('DELETE FROM wishlist WHERE user_id = ?', [req.userId]);
    db.run('DELETE FROM cart WHERE user_id = ?', [req.userId]);
    db.run('DELETE FROM notifications WHERE user_id = ?', [req.userId]);
    db.run('DELETE FROM users WHERE id = ?', [req.userId]);
    saveDb();

    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const db = await getDb();
    const result = db.exec('SELECT id FROM users WHERE email = ?', [email]);

    if (result.length === 0 || result[0].values.length === 0) {
      return res.json({ message: 'If that email exists, a reset link has been sent' });
    }

    const userId = result[0].values[0][0];
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    db.run('DELETE FROM password_resets WHERE user_id = ?', [userId]);
    db.run('INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
      [userId, token, expiresAt]);
    saveDb();

    res.json({ message: 'If that email exists, a reset link has been sent', token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const db = await getDb();
    const result = db.exec('SELECT user_id, expires_at, used FROM password_resets WHERE token = ?', [token]);

    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const [userId, expiresAt, used] = result[0].values[0];

    if (used) {
      return res.status(400).json({ error: 'Token has already been used' });
    }

    if (new Date(expiresAt) < new Date()) {
      return res.status(400).json({ error: 'Token has expired' });
    }

    const hash = await bcrypt.hash(password, 10);
    db.run('UPDATE users SET password = ? WHERE id = ?', [hash, userId]);
    db.run('UPDATE password_resets SET used = 1 WHERE token = ?', [token]);
    saveDb();

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
