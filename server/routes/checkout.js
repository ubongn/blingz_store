const express = require('express');
const Stripe = require('stripe');
const { getDb, saveDb } = require('../db');
const { auth } = require('../middleware/auth');
const { sendEmail, orderConfirmationEmail } = require('../utils/email');

const router = express.Router();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

router.use(auth);

router.get('/suggest-coupons', async (req, res) => {
  try {
    const db = await getDb();
    const result = db.exec(
      `SELECT code, discount_type, discount_value, min_order_amount, expires_at
       FROM coupons
       WHERE is_active = 1 AND (max_uses = 0 OR used_count < max_uses)
       AND (expires_at IS NULL OR expires_at >= datetime('now'))
       ORDER BY discount_value DESC`
    );

    if (result.length === 0) return res.json([]);

    const coupons = result[0].values.map(row => ({
      code: row[0],
      discount_type: row[1],
      discount_value: row[2],
      min_order_amount: row[3],
      label: row[1] === 'percentage' ? `${row[2]}% off` : `₦${row[2]} off`,
      min_label: row[3] > 0 ? `Min. order ₦${row[3]}` : null,
    }));

    res.json(coupons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, coupon_code } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    let finalAmount = amount;

    if (coupon_code) {
      const db = await getDb();
      const couponResult = db.exec(
        'SELECT discount_type, discount_value, min_order_amount, max_uses, used_count, expires_at FROM coupons WHERE code = ? AND is_active = 1',
        [coupon_code.toUpperCase()]
      );

      if (couponResult.length > 0 && couponResult[0].values.length > 0) {
        const [discountType, discountValue, minOrder, maxUses, usedCount, expiresAt] = couponResult[0].values[0];

        if (maxUses > 0 && usedCount >= maxUses) {
          return res.status(400).json({ error: 'Coupon usage limit reached' });
        }

        if (expiresAt && new Date(expiresAt) < new Date()) {
          return res.status(400).json({ error: 'Coupon has expired' });
        }

        if (amount < minOrder) {
          return res.status(400).json({ error: `Minimum order amount is ₦${minOrder}` });
        }

        if (discountType === 'percentage') {
          finalAmount = amount - (amount * discountValue / 100);
        } else {
          finalAmount = amount - discountValue;
        }

        if (finalAmount < 0) finalAmount = 0;
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(finalAmount * 100),
      currency: 'ngn',
      automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      finalAmount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/validate-coupon', async (req, res) => {
  try {
    const { code, orderAmount } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Coupon code is required' });
    }

    const db = await getDb();
    const result = db.exec(
      'SELECT id, discount_type, discount_value, min_order_amount, max_uses, used_count, expires_at FROM coupons WHERE code = ? AND is_active = 1',
      [code.toUpperCase()]
    );

    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(404).json({ error: 'Invalid coupon code' });
    }

    const [id, discountType, discountValue, minOrder, maxUses, usedCount, expiresAt] = result[0].values[0];

    if (maxUses > 0 && usedCount >= maxUses) {
      return res.status(400).json({ error: 'Coupon usage limit reached' });
    }

    if (expiresAt && new Date(expiresAt) < new Date()) {
      return res.status(400).json({ error: 'Coupon has expired' });
    }

    if (orderAmount < minOrder) {
      return res.status(400).json({ error: `Minimum order amount is ₦${minOrder}` });
    }

    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = orderAmount * discountValue / 100;
    } else {
      discountAmount = discountValue;
    }

    res.json({
      code: code.toUpperCase(),
      discount_type: discountType,
      discount_value: discountValue,
      discount_amount: discountAmount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { full_name, address, city, phone, payment_intent_id, coupon_code, discount_amount } = req.body;

    if (!full_name || !address || !city || !phone) {
      return res.status(400).json({ error: 'All shipping fields are required' });
    }

    if (!payment_intent_id) {
      return res.status(400).json({ error: 'Payment is required' });
    }

    const db = await getDb();

    const cartResult = db.exec(
      `SELECT cart.product_id, cart.quantity, products.price, products.stock
       FROM cart
       JOIN products ON cart.product_id = products.id
       WHERE cart.user_id = ?`,
      [req.userId]
    );

    if (cartResult.length === 0 || cartResult[0].values.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const cartItems = cartResult[0].values.map(row => ({
      product_id: row[0],
      quantity: row[1],
      price: row[2],
      stock: row[3],
    }));

    for (const item of cartItems) {
      if (item.quantity > item.stock) {
        return res.status(400).json({ error: `Not enough stock for one of the items` });
      }
    }

    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const total = subtotal - (discount_amount || 0);

    db.run(
      'INSERT INTO orders (user_id, full_name, address, city, phone, total, payment_status, payment_method, stripe_payment_intent_id, coupon_code, discount_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.userId, full_name, address, city, phone, total, 'paid', 'stripe', payment_intent_id, coupon_code || '', discount_amount || 0]
    );

    const orderIdResult = db.exec('SELECT last_insert_rowid()');
    const orderId = orderIdResult[0].values[0][0];

    for (const item of cartItems) {
      db.run(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, item.price]
      );
      db.run(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );

      const newStock = item.stock - item.quantity;
      if (newStock <= 5) {
        const prodResult = db.exec('SELECT name FROM products WHERE id = ?', [item.product_id]);
        const prodName = prodResult.length > 0 && prodResult[0].values.length > 0 ? prodResult[0].values[0][0] : 'Product';
        const adminResult = db.exec('SELECT id FROM users WHERE is_admin = 1');
        if (adminResult.length > 0) {
          adminResult[0].values.forEach(row => {
            db.run(
              'INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)',
              [row[0], `Low stock: ${prodName} has only ${newStock} left`, 'stock']
            );
          });
        }
      }
    }

    if (coupon_code) {
      db.run('UPDATE coupons SET used_count = used_count + 1 WHERE code = ?', [coupon_code.toUpperCase()]);
    }

    db.run(
      'INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)',
      [req.userId, `Your order #${orderId} has been placed successfully`, 'order']
    );

    const adminResult = db.exec('SELECT id FROM users WHERE is_admin = 1');
    if (adminResult.length > 0) {
      const userName = full_name || 'A customer';
      adminResult[0].values.forEach(row => {
        db.run(
          'INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)',
          [row[0], `New order #${orderId} placed by ${userName}`, 'order']
        );
      });
    }

    db.run('DELETE FROM cart WHERE user_id = ?', [req.userId]);
    saveDb();

    res.status(201).json({ message: 'Order placed', orderId });

    const emailItems = cartItems.map(item => {
      const nameResult = db.exec('SELECT name FROM products WHERE id = ?', [item.product_id]);
      const name = nameResult.length > 0 && nameResult[0].values.length > 0 ? nameResult[0].values[0][0] : 'Product';
      return { name, quantity: item.quantity, price: item.price };
    });
    const userEmailResult = db.exec('SELECT email FROM users WHERE id = ?', [req.userId]);
    const userEmail = userEmailResult.length > 0 && userEmailResult[0].values.length > 0 ? userEmailResult[0].values[0][0] : null;
    if (userEmail) {
      sendEmail(userEmail, `Order #${orderId} Confirmed`, orderConfirmationEmail(full_name, orderId, total, emailItems));
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
