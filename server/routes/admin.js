const express = require('express');
const multer = require('multer');
const path = require('path');
const { query } = require('../db');
const { auth } = require('../middleware/auth');
const { admin } = require('../middleware/admin');
const { sendEmail, orderShippedEmail, orderDeliveredEmail } = require('../utils/email');
const { couponRules, productRules } = require('../middleware/validate');
const config = require('../config');

const router = express.Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

const galleryStorage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-gallery-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const galleryUpload = multer({
  storage: galleryStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const url = `${config.baseUrl}/uploads/${req.file.filename}`;
  res.json({ url });
});

router.use(auth, admin);

router.get('/stats', async (req, res, next) => {
  try {
    const usersResult = await query('SELECT COUNT(*)::int FROM users');
    const totalUsers = usersResult.rows[0].count;

    const ordersResult = await query('SELECT COUNT(*)::int FROM orders');
    const totalOrders = ordersResult.rows[0].count;

    const revenueResult = await query("SELECT COALESCE(SUM(total), 0)::numeric(10,2) FROM orders WHERE payment_status = 'paid'");
    const totalRevenue = parseFloat(revenueResult.rows[0].sum);

    const productsResult = await query('SELECT COUNT(*)::int FROM products');
    const totalProducts = productsResult.rows[0].count;

    const statusResult = await query('SELECT status, COUNT(*)::int FROM orders GROUP BY status');
    const ordersByStatus = {};
    statusResult.rows.forEach(row => { ordersByStatus[row.status] = row.count; });

    const recentResult = await query(
      `SELECT o.id, o.full_name, o.total, o.status, o.created_at, u.email
       FROM orders o JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC LIMIT 5`
    );

    const lowStockResult = await query('SELECT id, name, stock FROM products WHERE stock <= 5 ORDER BY stock ASC LIMIT 5');

    res.json({
      totalUsers,
      totalOrders,
      totalRevenue,
      totalProducts,
      ordersByStatus,
      recentOrders: recentResult.rows,
      lowStockProducts: lowStockResult.rows,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/coupons', async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT id, code, discount_type, discount_value, min_order_amount, max_uses, used_count, expires_at, is_active, created_at FROM coupons ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/coupons', couponRules, async (req, res, next) => {
  try {
    const { code, discount_type, discount_value, min_order_amount, max_uses, expires_at } = req.body;

    const existing = await query('SELECT id FROM coupons WHERE code = $1', [code.toUpperCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Coupon code already exists' });
    }

    await query(
      'INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, max_uses, expires_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [code.toUpperCase(), discount_type, discount_value, min_order_amount || 0, max_uses || 0, expires_at || null]
    );

    res.status(201).json({ message: 'Coupon created' });
  } catch (err) {
    next(err);
  }
});

router.put('/coupons/:id', async (req, res, next) => {
  try {
    const { code, discount_type, discount_value, min_order_amount, max_uses, expires_at, is_active } = req.body;

    await query(
      'UPDATE coupons SET code = $1, discount_type = $2, discount_value = $3, min_order_amount = $4, max_uses = $5, expires_at = $6, is_active = $7 WHERE id = $8',
      [code.toUpperCase(), discount_type, discount_value, min_order_amount || 0, max_uses || 0, expires_at || null, is_active, req.params.id]
    );

    res.json({ message: 'Coupon updated' });
  } catch (err) {
    next(err);
  }
});

router.delete('/coupons/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM coupons WHERE id = $1', [req.params.id]);
    res.json({ message: 'Coupon deleted' });
  } catch (err) {
    next(err);
  }
});

router.get('/products', async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT id, name, description, price, image_url, category, stock FROM products ORDER BY id DESC'
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/products', productRules, async (req, res, next) => {
  try {
    const { name, description, price, image_url, category, stock } = req.body;

    await query(
      'INSERT INTO products (name, description, price, image_url, category, stock) VALUES ($1, $2, $3, $4, $5, $6)',
      [name, description || '', price, image_url || '', category || '', stock || 0]
    );

    res.status(201).json({ message: 'Product created' });
  } catch (err) {
    next(err);
  }
});

router.put('/products/:id', async (req, res, next) => {
  try {
    const { name, description, price, image_url, category, stock } = req.body;

    await query(
      'UPDATE products SET name = $1, description = $2, price = $3, image_url = $4, category = $5, stock = $6 WHERE id = $7',
      [name, description || '', price, image_url || '', category || '', stock || 0, req.params.id]
    );

    res.json({ message: 'Product updated' });
  } catch (err) {
    next(err);
  }
});

router.delete('/products/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM product_images WHERE product_id = $1', [req.params.id]);
    await query('DELETE FROM products WHERE id = $1', [req.params.id]);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
});

router.post('/products/:id/images', galleryUpload.array('images', 10), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const maxOrder = await query('SELECT COALESCE(MAX(sort_order), 0)::int as max_order FROM product_images WHERE product_id = $1', [req.params.id]);
    let order = maxOrder.rows[0].max_order + 1;

    for (const file of req.files) {
      const url = `${config.baseUrl}/uploads/${file.filename}`;
      await query('INSERT INTO product_images (product_id, image_url, sort_order) VALUES ($1, $2, $3)',
        [req.params.id, url, order++]);
    }

    const result = await query('SELECT id, image_url, sort_order FROM product_images WHERE product_id = $1 ORDER BY sort_order', [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.delete('/products/images/:imageId', async (req, res, next) => {
  try {
    await query('DELETE FROM product_images WHERE id = $1', [req.params.imageId]);
    res.json({ message: 'Image deleted' });
  } catch (err) {
    next(err);
  }
});

router.get('/orders', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT o.id, o.full_name, o.address, o.city, o.phone, o.total, o.status, o.payment_status, o.coupon_code, o.discount_amount, o.created_at, u.email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.put('/orders/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['Processing', 'Shipped', 'Delivered', 'Cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    if (status === 'Cancelled') {
      const itemsResult = await query('SELECT product_id, quantity FROM order_items WHERE order_id = $1', [req.params.id]);
      for (const item of itemsResult.rows) {
        await query('UPDATE products SET stock = stock + $1 WHERE id = $2', [item.quantity, item.product_id]);
      }
    }

    await query('UPDATE orders SET status = $1 WHERE id = $2', [status, req.params.id]);

    if (status === 'Shipped' || status === 'Delivered') {
      const orderResult = await query(
        `SELECT o.full_name, u.email FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = $1`,
        [req.params.id]
      );
      if (orderResult.rows.length > 0) {
        const { full_name, email } = orderResult.rows[0];
        if (email) {
          const template = status === 'Shipped'
            ? orderShippedEmail(full_name, req.params.id)
            : orderDeliveredEmail(full_name, req.params.id);
          sendEmail(email, `Order #${req.params.id} ${status}`, template);
        }
      }
    }

    res.json({ message: 'Order status updated' });
  } catch (err) {
    next(err);
  }
});

router.get('/users', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT u.id, u.email, u.full_name, u.is_admin,
        (SELECT COUNT(*)::int FROM orders WHERE user_id = u.id) as order_count,
        (SELECT COUNT(*)::int FROM reviews WHERE user_id = u.id) as review_count
       FROM users u
       ORDER BY u.id ASC`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.put('/users/:id/role', async (req, res, next) => {
  try {
    const { is_admin } = req.body;

    if (parseInt(req.params.id) === req.userId) {
      return res.status(400).json({ error: 'Cannot change your own admin status' });
    }

    await query('UPDATE users SET is_admin = $1 WHERE id = $2', [is_admin, req.params.id]);
    res.json({ message: 'User role updated' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
