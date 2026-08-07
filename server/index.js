const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const checkoutRoutes = require('./routes/checkout');
const { getDb, saveDb } = require('./db');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

app.use('/api', authRoutes);
app.use('/products', productRoutes);
app.use('/cart', cartRoutes);
app.use('/checkout', checkoutRoutes);

app.get('/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

async function seedProducts() {
  const db = await getDb();
  const result = db.exec('SELECT COUNT(*) as count FROM products');
  const count = result[0].values[0][0];

  if (count === 0) {
    const products = [
      ['Wireless Headphones', 'Premium noise-cancelling over-ear headphones with 30-hour battery life', 79.99, 'https://placehold.co/300x300?text=Headphones'],
      ['Running Shoes', 'Lightweight breathable running shoes with responsive cushioning', 129.99, 'https://placehold.co/300x300?text=Shoes'],
      ['Backpack', 'Water-resistant laptop backpack with padded compartment', 49.99, 'https://placehold.co/300x300?text=Backpack'],
      ['Smart Watch', 'Fitness tracker with heart rate monitor and 7-day battery', 199.99, 'https://placehold.co/300x300?text=Watch'],
      ['Coffee Maker', '12-cup programmable coffee maker with thermal carafe', 89.99, 'https://placehold.co/300x300?text=Coffee'],
    ];

    for (const [name, desc, price, img] of products) {
      db.run(
        'INSERT INTO products (name, description, price, image_url) VALUES (?, ?, ?, ?)',
        [name, desc, price, img]
      );
    }
    saveDb();
    console.log('Seeded 5 sample products');
  }
}

async function start() {
  await getDb();
  await seedProducts();
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

start();
