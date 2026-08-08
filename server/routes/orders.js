const express = require('express');
const { getDb } = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const result = db.exec(
      `SELECT id, full_name, address, city, phone, total, status, payment_status, payment_method, coupon_code, discount_amount, created_at
       FROM orders
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.userId]
    );

    if (result.length === 0) return res.json([]);

    const columns = result[0].columns;
    const orders = result[0].values.map(row => {
      const obj = {};
      columns.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const result = db.exec(
      `SELECT id, full_name, address, city, phone, total, status, payment_status, payment_method, coupon_code, discount_amount, created_at
       FROM orders
       WHERE id = ? AND user_id = ?`,
      [req.params.id, req.userId]
    );

    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const columns = result[0].columns;
    const order = {};
    columns.forEach((col, i) => { order[col] = result[0].values[0][i]; });

    const itemsResult = db.exec(
      `SELECT oi.product_id, oi.quantity, oi.price, p.name, p.image_url
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [req.params.id]
    );

    if (itemsResult.length > 0) {
      const itemColumns = itemsResult[0].columns;
      order.items = itemsResult[0].values.map(row => {
        const obj = {};
        itemColumns.forEach((col, i) => { obj[col] = row[i]; });
        return obj;
      });
    } else {
      order.items = [];
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
