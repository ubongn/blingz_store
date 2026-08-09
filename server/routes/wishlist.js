const express = require('express');
const { query } = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT w.id, w.product_id, p.name, p.description, p.price, p.image_url, p.category
       FROM wishlist w
       JOIN products p ON w.product_id = p.id
       WHERE w.user_id = $1
       ORDER BY w.created_at DESC`,
      [req.userId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { product_id } = req.body;
    if (!product_id) return res.status(400).json({ error: 'product_id is required' });

    const existing = await query(
      'SELECT id FROM wishlist WHERE user_id = $1 AND product_id = $2',
      [req.userId, product_id]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Already in wishlist' });
    }

    await query('INSERT INTO wishlist (user_id, product_id) VALUES ($1, $2)', [req.userId, product_id]);
    res.status(201).json({ message: 'Added to wishlist' });
  } catch (err) {
    next(err);
  }
});

router.delete('/:productId', async (req, res, next) => {
  try {
    await query('DELETE FROM wishlist WHERE user_id = $1 AND product_id = $2', [req.userId, req.params.productId]);
    res.json({ message: 'Removed from wishlist' });
  } catch (err) {
    next(err);
  }
});

router.get('/check/:productId', async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT id FROM wishlist WHERE user_id = $1 AND product_id = $2',
      [req.userId, req.params.productId]
    );
    res.json({ inWishlist: rows.length > 0 });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
