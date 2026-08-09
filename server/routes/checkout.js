const express = require('express');
const Stripe = require('stripe');
const { query } = require('../db');
const { auth } = require('../middleware/auth');
const { sendEmail, orderConfirmationEmail } = require('../utils/email');
const { checkoutRules } = require('../middleware/validate');
const config = require('../config');

const router = express.Router();
const stripe = Stripe(config.stripeSecretKey);

router.use(auth);

router.get('/suggest-coupons', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT code, discount_type, discount_value, min_order_amount, expires_at
       FROM coupons
       WHERE is_active = TRUE AND (max_uses = 0 OR used_count < max_uses)
       AND (expires_at IS NULL OR expires_at >= NOW())
       ORDER BY discount_value DESC`
    );

    const coupons = rows.map(row => ({
      code: row.code,
      discount_type: row.discount_type,
      discount_value: parseFloat(row.discount_value),
      min_order_amount: parseFloat(row.min_order_amount),
      label: row.discount_type === 'percentage' ? `${row.discount_value}% off` : `₦${row.discount_value} off`,
      min_label: row.min_order_amount > 0 ? `Min. order ₦${row.min_order_amount}` : null,
    }));

    res.json(coupons);
  } catch (err) {
    next(err);
  }
});

router.post('/create-payment-intent', async (req, res, next) => {
  try {
    const { coupon_code } = req.body;

    const cartResult = await query(
      `SELECT cart.product_id, cart.quantity, products.price, products.stock
       FROM cart
       JOIN products ON cart.product_id = products.id
       WHERE cart.user_id = $1`,
      [req.userId]
    );

    if (cartResult.rows.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const cartItems = cartResult.rows;
    let subtotal = 0;
    for (const item of cartItems) {
      subtotal += parseFloat(item.price) * item.quantity;
    }

    let finalAmount = subtotal;

    if (coupon_code) {
      const couponResult = await query(
        'SELECT discount_type, discount_value, min_order_amount, max_uses, used_count, expires_at FROM coupons WHERE code = $1 AND is_active = TRUE',
        [coupon_code.toUpperCase()]
      );

      if (couponResult.rows.length > 0) {
        const coupon = couponResult.rows[0];

        if (coupon.max_uses > 0 && coupon.used_count >= coupon.max_uses) {
          return res.status(400).json({ error: 'Coupon usage limit reached' });
        }

        if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
          return res.status(400).json({ error: 'Coupon has expired' });
        }

        if (subtotal < parseFloat(coupon.min_order_amount)) {
          return res.status(400).json({ error: `Minimum order amount is ₦${coupon.min_order_amount}` });
        }

        if (coupon.discount_type === 'percentage') {
          finalAmount = subtotal - (subtotal * parseFloat(coupon.discount_value) / 100);
        } else {
          finalAmount = subtotal - parseFloat(coupon.discount_value);
        }

        if (finalAmount < 0) finalAmount = 0;
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(finalAmount * 100),
      currency: 'ngn',
      automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
    }, {
      idempotencyKey: req.headers['idempotency-key'] || require('crypto').randomUUID(),
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      finalAmount,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/validate-coupon', async (req, res, next) => {
  try {
    const { code, orderAmount } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Coupon code is required' });
    }

    const { rows } = await query(
      'SELECT id, discount_type, discount_value, min_order_amount, max_uses, used_count, expires_at FROM coupons WHERE code = $1 AND is_active = TRUE',
      [code.toUpperCase()]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Invalid coupon code' });
    }

    const coupon = rows[0];

    if (coupon.max_uses > 0 && coupon.used_count >= coupon.max_uses) {
      return res.status(400).json({ error: 'Coupon usage limit reached' });
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Coupon has expired' });
    }

    if (orderAmount < parseFloat(coupon.min_order_amount)) {
      return res.status(400).json({ error: `Minimum order amount is ₦${coupon.min_order_amount}` });
    }

    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
      discountAmount = orderAmount * parseFloat(coupon.discount_value) / 100;
    } else {
      discountAmount = parseFloat(coupon.discount_value);
    }

    res.json({
      code: code.toUpperCase(),
      discount_type: coupon.discount_type,
      discount_value: parseFloat(coupon.discount_value),
      discount_amount: discountAmount,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', checkoutRules, async (req, res, next) => {
  try {
    const { full_name, address, city, phone, payment_intent_id, coupon_code, discount_amount } = req.body;

    if (!payment_intent_id) {
      return res.status(400).json({ error: 'Payment is required' });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    const cartResult = await query(
      `SELECT cart.product_id, cart.quantity, products.price, products.stock
       FROM cart
       JOIN products ON cart.product_id = products.id
       WHERE cart.user_id = $1`,
      [req.userId]
    );

    if (cartResult.rows.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const cartItems = cartResult.rows;

    for (const item of cartItems) {
      if (item.quantity > item.stock) {
        return res.status(400).json({ error: 'Not enough stock for one of the items' });
      }
    }

    const subtotal = cartItems.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
    const total = subtotal - (discount_amount || 0);

    const expectedAmount = Math.round(total * 100);
    if (paymentIntent.amount !== expectedAmount) {
      return res.status(400).json({ error: 'Payment amount mismatch' });
    }

    const orderResult = await query(
      'INSERT INTO orders (user_id, full_name, address, city, phone, total, payment_status, payment_method, stripe_payment_intent_id, coupon_code, discount_amount) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id',
      [req.userId, full_name, address, city, phone, total, 'paid', 'stripe', payment_intent_id, coupon_code || '', discount_amount || 0]
    );
    const orderId = orderResult.rows[0].id;

    for (const item of cartItems) {
      await query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [orderId, item.product_id, item.quantity, item.price]
      );
      await query('UPDATE products SET stock = stock - $1 WHERE id = $2', [item.quantity, item.product_id]);

      const newStock = item.stock - item.quantity;
      if (newStock <= 5) {
        const prodResult = await query('SELECT name FROM products WHERE id = $1', [item.product_id]);
        const prodName = prodResult.rows[0]?.name || 'Product';
        const adminResult = await query('SELECT id FROM users WHERE is_admin = TRUE');
        for (const row of adminResult.rows) {
          await query(
            'INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)',
            [row.id, `Low stock: ${prodName} has only ${newStock} left`, 'stock']
          );
        }
      }
    }

    if (coupon_code) {
      await query('UPDATE coupons SET used_count = used_count + 1 WHERE code = $1', [coupon_code.toUpperCase()]);
    }

    await query(
      'INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)',
      [req.userId, `Your order #${orderId} has been placed successfully`, 'order']
    );

    const adminResult = await query('SELECT id FROM users WHERE is_admin = TRUE');
    for (const row of adminResult.rows) {
      await query(
        'INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)',
        [row.id, `New order #${orderId} placed by ${full_name}`, 'order']
      );
    }

    await query('DELETE FROM cart WHERE user_id = $1', [req.userId]);

    res.status(201).json({ message: 'Order placed', orderId });

    const emailItems = [];
    for (const item of cartItems) {
      const nameResult = await query('SELECT name FROM products WHERE id = $1', [item.product_id]);
      emailItems.push({
        name: nameResult.rows[0]?.name || 'Product',
        quantity: item.quantity,
        price: parseFloat(item.price),
      });
    }
    const userEmailResult = await query('SELECT email FROM users WHERE id = $1', [req.userId]);
    if (userEmailResult.rows.length > 0) {
      sendEmail(userEmailResult.rows[0].email, `Order #${orderId} Confirmed`, orderConfirmationEmail(full_name, orderId, total, emailItems));
    }
  } catch (err) {
    next(err);
  }
});

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, config.stripeWebhookSecret);
  } catch (err) {
    console.error('[Stripe] Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    console.log(`[Stripe] Payment succeeded: ${paymentIntent.id}`);
  } else if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object;
    console.log(`[Stripe] Payment failed: ${paymentIntent.id}`);
    await query(
      "UPDATE orders SET payment_status = 'failed' WHERE stripe_payment_intent_id = $1",
      [paymentIntent.id]
    );
  }

  res.json({ received: true });
});

module.exports = router;
