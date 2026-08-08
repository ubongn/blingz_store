const express = require('express');
const { getDb, saveDb } = require('../db');
const { auth } = require('../middleware/auth');
const { admin } = require('../middleware/admin');

const router = express.Router();

router.use(auth, admin);

// ─── Coupons ───

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

// ─── Products ───

router.get('/products', async (req, res) => {
  try {
    const db = await getDb();
    const result = db.exec(
      'SELECT id, name, description, price, image_url, category, stock FROM products ORDER BY id DESC'
    );

    if (result.length === 0) return res.json([]);

    const columns = result[0].columns;
    const products = result[0].values.map(row => {
      const obj = {};
      columns.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/products', async (req, res) => {
  try {
    const { name, description, price, image_url, category, stock } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const db = await getDb();
    db.run(
      'INSERT INTO products (name, description, price, image_url, category, stock) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description || '', price, image_url || '', category || '', stock || 0]
    );
    saveDb();

    res.status(201).json({ message: 'Product created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/products/:id', async (req, res) => {
  try {
    const { name, description, price, image_url, category, stock } = req.body;
    const db = await getDb();

    db.run(
      'UPDATE products SET name = ?, description = ?, price = ?, image_url = ?, category = ?, stock = ? WHERE id = ?',
      [name, description || '', price, image_url || '', category || '', stock || 0, req.params.id]
    );
    saveDb();

    res.json({ message: 'Product updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    const db = await getDb();
    db.run('DELETE FROM products WHERE id = ?', [req.params.id]);
    saveDb();
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Orders ───

router.get('/orders', async (req, res) => {
  try {
    const db = await getDb();
    const result = db.exec(
      `SELECT o.id, o.full_name, o.address, o.city, o.phone, o.total, o.status, o.payment_status, o.coupon_code, o.discount_amount, o.created_at, u.email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC`
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

router.put('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    if (!['Processing', 'Shipped', 'Delivered'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const db = await getDb();
    db.run('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    saveDb();

    res.json({ message: 'Order status updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Users ───

router.get('/users', async (req, res) => {
  try {
    const db = await getDb();
    const result = db.exec(
      `SELECT u.id, u.email, u.full_name, u.is_admin,
        (SELECT COUNT(*) FROM orders WHERE user_id = u.id) as order_count,
        (SELECT COUNT(*) FROM reviews WHERE user_id = u.id) as review_count
       FROM users u
       ORDER BY u.id ASC`
    );

    if (result.length === 0) return res.json([]);

    const columns = result[0].columns;
    const users = result[0].values.map(row => {
      const obj = {};
      columns.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:id/role', async (req, res) => {
  try {
    const { is_admin } = req.body;
    const db = await getDb();

    if (parseInt(req.params.id) === req.userId) {
      return res.status(400).json({ error: 'Cannot change your own admin status' });
    }

    db.run('UPDATE users SET is_admin = ? WHERE id = ?', [is_admin ? 1 : 0, req.params.id]);
    saveDb();

    res.json({ message: 'User role updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
