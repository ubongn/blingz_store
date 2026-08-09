const express = require('express');
const { query } = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT cart.id, cart.quantity, products.id as product_id,
              products.name, products.price, products.image_url, products.stock
       FROM cart
       JOIN products ON cart.product_id = products.id
       WHERE cart.user_id = $1`,
      [req.userId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { product_id, quantity } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: 'product_id is required' });
    }

    const product = await query('SELECT id, stock FROM products WHERE id = $1', [product_id]);
    if (product.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const stock = product.rows[0].stock;
    if (stock <= 0) {
      return res.status(400).json({ error: 'Product is out of stock' });
    }

    const existing = await query(
      'SELECT id, quantity FROM cart WHERE user_id = $1 AND product_id = $2',
      [req.userId, product_id]
    );

    if (existing.rows.length > 0) {
      const cartId = existing.rows[0].id;
      const currentQty = existing.rows[0].quantity;
      const newQty = currentQty + (quantity || 1);
      if (newQty > stock) {
        return res.status(400).json({ error: `Only ${stock} items available in stock` });
      }
      await query('UPDATE cart SET quantity = $1 WHERE id = $2', [newQty, cartId]);
    } else {
      if ((quantity || 1) > stock) {
        return res.status(400).json({ error: `Only ${stock} items available in stock` });
      }
      await query(
        'INSERT INTO cart (user_id, product_id, quantity) VALUES ($1, $2, $3)',
        [req.userId, product_id, quantity || 1]
      );
    }

    const countResult = await query('SELECT COUNT(*)::int FROM cart WHERE user_id = $1', [req.userId]);
    const cartCount = countResult.rows[0].count;

    res.status(201).json({ message: 'Item added to cart', cartCount });
  } catch (err) {
    next(err);
  }
});

router.put('/:itemId', async (req, res, next) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1' });
    }

    const cartItem = await query(
      'SELECT c.id, c.product_id FROM cart c WHERE c.id = $1 AND c.user_id = $2',
      [req.params.itemId, req.userId]
    );

    if (cartItem.rows.length === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    const productId = cartItem.rows[0].product_id;
    const product = await query('SELECT stock FROM products WHERE id = $1', [productId]);
    const stock = product.rows[0].stock;

    if (quantity > stock) {
      return res.status(400).json({ error: `Only ${stock} items available in stock` });
    }

    await query('UPDATE cart SET quantity = $1 WHERE id = $2', [quantity, req.params.itemId]);

    res.json({ message: 'Quantity updated' });
  } catch (err) {
    next(err);
  }
});

router.delete('/:itemId', async (req, res, next) => {
  try {
    const existing = await query(
      'SELECT id FROM cart WHERE id = $1 AND user_id = $2',
      [req.params.itemId, req.userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    await query('DELETE FROM cart WHERE id = $1', [req.params.itemId]);

    const countResult = await query('SELECT COUNT(*)::int FROM cart WHERE user_id = $1', [req.userId]);
    const cartCount = countResult.rows[0].count;

    res.json({ message: 'Item removed from cart', cartCount });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
