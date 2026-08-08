const express = require('express');
const { getDb, saveDb } = require('../db');
const { auth } = require('../middleware/auth');
const { admin } = require('../middleware/admin');

const router = express.Router();

router.use(auth, admin);

router.get('/coupons', async (req, res) => {
  try {
    const db = await getDb();
    const result = db.exec(
      'SELECT id, code, discount_type, discount_value, min_order_amount, max_uses, used_count, expires_at, is_active, created_at FROM coupons ORDER BY created_at DESC'
    );

    if (result.length === 0) return res.json([]);

    const columns = result[0].columns;
    const coupons = result[0].values.map(row => {
      const obj = {};
      columns.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });

    res.json(coupons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/coupons', async (req, res) => {
  try {
    const { code, discount_type, discount_value, min_order_amount, max_uses, expires_at } = req.body;

    if (!code || !discount_type || !discount_value) {
      return res.status(400).json({ error: 'Code, type, and value are required' });
    }

    if (!['percentage', 'fixed'].includes(discount_type)) {
      return res.status(400).json({ error: 'Discount type must be percentage or fixed' });
    }

    const db = await getDb();
    const existing = db.exec('SELECT id FROM coupons WHERE code = ?', [code.toUpperCase()]);
    if (existing.length > 0 && existing[0].values.length > 0) {
      return res.status(409).json({ error: 'Coupon code already exists' });
    }

    db.run(
      'INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, max_uses, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
      [code.toUpperCase(), discount_type, discount_value, min_order_amount || 0, max_uses || 0, expires_at || null]
    );
    saveDb();

    res.status(201).json({ message: 'Coupon created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/coupons/:id', async (req, res) => {
  try {
    const { code, discount_type, discount_value, min_order_amount, max_uses, expires_at, is_active } = req.body;
    const db = await getDb();

    db.run(
      'UPDATE coupons SET code = ?, discount_type = ?, discount_value = ?, min_order_amount = ?, max_uses = ?, expires_at = ?, is_active = ? WHERE id = ?',
      [code.toUpperCase(), discount_type, discount_value, min_order_amount || 0, max_uses || 0, expires_at || null, is_active ? 1 : 0, req.params.id]
    );
    saveDb();

    res.json({ message: 'Coupon updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/coupons/:id', async (req, res) => {
  try {
    const db = await getDb();
    db.run('DELETE FROM coupons WHERE id = ?', [req.params.id]);
    saveDb();
    res.json({ message: 'Coupon deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
