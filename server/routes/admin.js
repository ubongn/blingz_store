const express = require('express');
const multer = require('multer');
const path = require('path');
const { getDb, saveDb } = require('../db');
const { auth } = require('../middleware/auth');
const { admin } = require('../middleware/admin');
const { sendEmail, orderShippedEmail, orderDeliveredEmail } = require('../utils/email');

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
  const url = `http://localhost:5000/uploads/${req.file.filename}`;
  res.json({ url });
});

router.use(auth, admin);

// ─── Dashboard Stats ───

router.get('/stats', async (req, res) => {
  try {
    const db = await getDb();

    const usersResult = db.exec('SELECT COUNT(*) FROM users');
    const totalUsers = usersResult.length > 0 ? usersResult[0].values[0][0] : 0;

    const ordersResult = db.exec('SELECT COUNT(*) FROM orders');
    const totalOrders = ordersResult.length > 0 ? ordersResult[0].values[0][0] : 0;

    const revenueResult = db.exec("SELECT COALESCE(SUM(total), 0) FROM orders WHERE payment_status = 'paid'");
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].values[0][0] : 0;

    const productsResult = db.exec('SELECT COUNT(*) FROM products');
    const totalProducts = productsResult.length > 0 ? productsResult[0].values[0][0] : 0;

    const statusResult = db.exec("SELECT status, COUNT(*) FROM orders GROUP BY status");
    const ordersByStatus = {};
    if (statusResult.length > 0) {
      statusResult[0].values.forEach(([status, count]) => {
        ordersByStatus[status] = count;
      });
    }

    const recentResult = db.exec(
      `SELECT o.id, o.full_name, o.total, o.status, o.created_at, u.email
       FROM orders o JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC LIMIT 5`
    );
    const recentOrders = [];
    if (recentResult.length > 0) {
      const cols = recentResult[0].columns;
      recentOrders.push(...recentResult[0].values.map(row => {
        const obj = {};
        cols.forEach((col, i) => { obj[col] = row[i]; });
        return obj;
      }));
    }

    const lowStockResult = db.exec('SELECT id, name, stock FROM products WHERE stock <= 5 ORDER BY stock ASC LIMIT 5');
    const lowStockProducts = [];
    if (lowStockResult.length > 0) {
      const cols = lowStockResult[0].columns;
      lowStockProducts.push(...lowStockResult[0].values.map(row => {
        const obj = {};
        cols.forEach((col, i) => { obj[col] = row[i]; });
        return obj;
      }));
    }

    res.json({
      totalUsers,
      totalOrders,
      totalRevenue,
      totalProducts,
      ordersByStatus,
      recentOrders,
      lowStockProducts,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
    db.run('DELETE FROM product_images WHERE product_id = ?', [req.params.id]);
    db.run('DELETE FROM products WHERE id = ?', [req.params.id]);
    saveDb();
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/products/:id/images', galleryUpload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    const db = await getDb();
    const maxOrder = db.exec('SELECT COALESCE(MAX(sort_order), 0) FROM product_images WHERE product_id = ?', [req.params.id]);
    let order = maxOrder.length > 0 ? maxOrder[0].values[0][0] + 1 : 0;

    for (const file of req.files) {
      const url = `http://localhost:5000/uploads/${file.filename}`;
      db.run('INSERT INTO product_images (product_id, image_url, sort_order) VALUES (?, ?, ?)',
        [req.params.id, url, order++]);
    }
    saveDb();

    const result = db.exec('SELECT id, image_url, sort_order FROM product_images WHERE product_id = ? ORDER BY sort_order', [req.params.id]);
    const images = result.length > 0 ? result[0].values.map(row => ({ id: row[0], image_url: row[1], sort_order: row[2] })) : [];
    res.json(images);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/products/images/:imageId', async (req, res) => {
  try {
    const db = await getDb();
    db.run('DELETE FROM product_images WHERE id = ?', [req.params.imageId]);
    saveDb();
    res.json({ message: 'Image deleted' });
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

    if (!['Processing', 'Shipped', 'Delivered', 'Cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const db = await getDb();

    if (status === 'Cancelled') {
      const itemsResult = db.exec('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [req.params.id]);
      if (itemsResult.length > 0) {
        itemsResult[0].values.forEach(([productId, quantity]) => {
          db.run('UPDATE products SET stock = stock + ? WHERE id = ?', [quantity, productId]);
        });
      }
    }

    db.run('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    saveDb();

    if (status === 'Shipped' || status === 'Delivered') {
      const orderResult = db.exec(
        `SELECT o.full_name, u.email FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?`,
        [req.params.id]
      );
      if (orderResult.length > 0 && orderResult[0].values.length > 0) {
        const [name, email] = orderResult[0].values[0];
        if (email) {
          const template = status === 'Shipped' ? orderShippedEmail(name, req.params.id) : orderDeliveredEmail(name, req.params.id);
          sendEmail(email, `Order #${req.params.id} ${status}`, template);
        }
      }
    }

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
