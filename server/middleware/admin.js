const { getDb } = require('../db');

async function admin(req, res, next) {
  try {
    const db = await getDb();
    const result = db.exec('SELECT is_admin FROM users WHERE id = ?', [req.userId]);

    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const isAdmin = result[0].values[0][0];
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { admin };
