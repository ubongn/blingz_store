const express = require('express');
const { query } = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, full_name, address, city, phone, total, status, payment_status, payment_method, coupon_code, discount_amount, created_at
       FROM orders
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.userId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, full_name, address, city, phone, total, status, payment_status, payment_method, coupon_code, discount_amount, created_at
       FROM orders
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = rows[0];

    const itemsResult = await query(
      `SELECT oi.product_id, oi.quantity, oi.price, p.name, p.image_url
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [req.params.id]
    );
    order.items = itemsResult.rows;

    res.json(order);
  } catch (err) {
    next(err);
  }
});

router.put('/:id/cancel', async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT id, status FROM orders WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (rows[0].status !== 'Processing') {
      return res.status(400).json({ error: 'Only processing orders can be cancelled' });
    }

    await query('UPDATE orders SET status = $1 WHERE id = $2', ['Cancelled', req.params.id]);

    const itemsResult = await query('SELECT product_id, quantity FROM order_items WHERE order_id = $1', [req.params.id]);
    for (const item of itemsResult.rows) {
      await query('UPDATE products SET stock = stock + $1 WHERE id = $2', [item.quantity, item.product_id]);
    }

    res.json({ message: 'Order cancelled' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
