const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getDb, saveDb } = require('../db');
const { JWT_SECRET, auth } = require('../middleware/auth');

const router = express.Router();

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
    const result = db.exec('SELECT id, email, full_name, is_admin FROM users WHERE id = ?', [req.userId]);

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

module.exports = router;
