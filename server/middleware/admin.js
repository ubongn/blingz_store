const { query } = require('../db');

async function admin(req, res, next) {
  try {
    const { rows } = await query('SELECT is_admin FROM users WHERE id = $1', [req.userId]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!rows[0].is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { admin };
