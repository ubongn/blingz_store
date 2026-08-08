const express = require('express');
const { getDb, saveDb } = require('../db');
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

router.put('/:id/cancel', async (req, res) => {
  try {
    const db = await getDb();
    const result = db.exec(
      'SELECT id, status FROM orders WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]
    );

    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const status = result[0].values[0][1];
    if (status !== 'Processing') {
      return res.status(400).json({ error: 'Only processing orders can be cancelled' });
    }

    db.run('UPDATE orders SET status = ? WHERE id = ?', ['Cancelled', req.params.id]);

    const itemsResult = db.exec('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [req.params.id]);
    if (itemsResult.length > 0) {
      itemsResult[0].values.forEach(([productId, quantity]) => {
        db.run('UPDATE products SET stock = stock + ? WHERE id = ?', [quantity, productId]);
      });
    }

    saveDb();
    res.json({ message: 'Order cancelled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
