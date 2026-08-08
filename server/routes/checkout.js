const express = require('express');
const { getDb, saveDb } = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.post('/', async (req, res) => {
  try {
    const { full_name, address, city, phone } = req.body;

    if (!full_name || !address || !city || !phone) {
      return res.status(400).json({ error: 'All shipping fields are required' });
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

    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    db.run(
      'INSERT INTO orders (user_id, full_name, address, city, phone, total) VALUES (?, ?, ?, ?, ?, ?)',
      [req.userId, full_name, address, city, phone, total]
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
    }

    db.run('DELETE FROM cart WHERE user_id = ?', [req.userId]);
    saveDb();

    res.status(201).json({ message: 'Order placed', orderId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
