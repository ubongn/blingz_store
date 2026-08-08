const express = require('express');
const { getDb, saveDb } = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const result = db.exec(
      `SELECT w.id, w.product_id, p.name, p.description, p.price, p.image_url, p.category
       FROM wishlist w
       JOIN products p ON w.product_id = p.id
       WHERE w.user_id = ?
       ORDER BY w.created_at DESC`,
      [req.userId]
    );

    if (result.length === 0) return res.json([]);

    const columns = result[0].columns;
    const items = result[0].values.map(row => {
      const obj = {};
      columns.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });

    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { product_id } = req.body;
    if (!product_id) return res.status(400).json({ error: 'product_id is required' });

    const db = await getDb();

    const existing = db.exec(
      'SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?',
      [req.userId, product_id]
    );

    if (existing.length > 0 && existing[0].values.length > 0) {
      return res.status(409).json({ error: 'Already in wishlist' });
    }

    db.run('INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)', [req.userId, product_id]);
    saveDb();
    res.status(201).json({ message: 'Added to wishlist' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:productId', async (req, res) => {
  try {
    const db = await getDb();
    db.run('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?', [req.userId, req.params.productId]);
    saveDb();
    res.json({ message: 'Removed from wishlist' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/check/:productId', async (req, res) => {
  try {
    const db = await getDb();
    const result = db.exec(
      'SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?',
      [req.userId, req.params.productId]
    );
    const inWishlist = result.length > 0 && result[0].values.length > 0;
    res.json({ inWishlist });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
