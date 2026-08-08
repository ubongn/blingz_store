const express = require('express');
const { getDb, saveDb } = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const result = db.exec(
      `SELECT cart.id, cart.quantity, products.id as product_id,
              products.name, products.price, products.image_url
       FROM cart
       JOIN products ON cart.product_id = products.id
       WHERE cart.user_id = ?`,
      [req.userId]
    );

    if (result.length === 0) {
      return res.json([]);
    }

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
    const { product_id, quantity } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: 'product_id is required' });
    }

    const db = await getDb();

    const product = db.exec('SELECT id FROM products WHERE id = ?', [product_id]);
    if (product.length === 0 || product[0].values.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const existing = db.exec(
      'SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ?',
      [req.userId, product_id]
    );

    if (existing.length > 0 && existing[0].values.length > 0) {
      const [cartId, currentQty] = existing[0].values[0];
      const newQty = currentQty + (quantity || 1);
      db.run('UPDATE cart SET quantity = ? WHERE id = ?', [newQty, cartId]);
    } else {
      db.run(
        'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [req.userId, product_id, quantity || 1]
      );
    }

    saveDb();

    const countResult = db.exec('SELECT COUNT(*) FROM cart WHERE user_id = ?', [req.userId]);
    const cartCount = countResult.length > 0 ? countResult[0].values[0][0] : 0;

    res.status(201).json({ message: 'Item added to cart', cartCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:itemId', async (req, res) => {
  try {
    const db = await getDb();
    const existing = db.exec(
      'SELECT id FROM cart WHERE id = ? AND user_id = ?',
      [req.params.itemId, req.userId]
    );

    if (existing.length === 0 || existing[0].values.length === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    db.run('DELETE FROM cart WHERE id = ?', [req.params.itemId]);
    saveDb();

    const countResult = db.exec('SELECT COUNT(*) FROM cart WHERE user_id = ?', [req.userId]);
    const cartCount = countResult.length > 0 ? countResult[0].values[0][0] : 0;

    res.json({ message: 'Item removed from cart', cartCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
