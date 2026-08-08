const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const checkoutRoutes = require('./routes/checkout');
const wishlistRoutes = require('./routes/wishlist');
const orderRoutes = require('./routes/orders');
const { getDb, saveDb } = require('./db');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

app.use('/api', authRoutes);
app.use('/products', productRoutes);
app.use('/cart', cartRoutes);
app.use('/checkout', checkoutRoutes);
app.use('/wishlist', wishlistRoutes);
app.use('/orders', orderRoutes);

app.get('/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

async function seedProducts() {
  const db = await getDb();
  const result = db.exec('SELECT COUNT(*) as count FROM products');
  const count = result[0].values[0][0];

  if (count === 0) {
    const products = [
      ['Braided Wig', 'Premium quality braided wig, ready to wear', 25000, 'https://placehold.co/300x300?text=Braided+Wig', 'Hair', 15],
      ['Curly Hair Extension', 'Natural-looking curly hair extension, soft and fluffy', 15000, 'https://placehold.co/300x300?text=Curly+Hair', 'Hair', 20],
      ['Straight Hair Weave', 'Silky straight hair weave, tangle-free', 12000, 'https://placehold.co/300x300?text=Straight+Hair', 'Hair', 10],
      ['Raw Honey (1L)', 'Pure organic honey sourced from local Nigerian farms', 5000, 'https://placehold.co/300x300?text=Honey+1L', 'Honey', 30],
      ['Honey (500ml)', 'Pure organic honey, perfect for daily use', 3000, 'https://placehold.co/300x300?text=Honey+500ml', 'Honey', 50],
      ['Honey (250ml)', 'Small bottle of pure organic honey', 1800, 'https://placehold.co/300x300?text=Honey+250ml', 'Honey', 40],
      ['Plantain Chips (Spicy)', 'Crispy spicy plantain chips, loved by everyone', 1500, 'https://placehold.co/300x300?text=Spicy+Chips', 'Plantain Chips', 100],
      ['Plantain Chips (Classic)', 'Classic salted plantain chips, timeless taste', 1200, 'https://placehold.co/300x300?text=Classic+Chips', 'Plantain Chips', 100],
      ['Plantain Chips (Jollof)', 'Jollof-flavored plantain chips, a Nigerian favorite', 1800, 'https://placehold.co/300x300?text=Jollof+Chips', 'Plantain Chips', 80],
      ['Coconut Hair Oil', 'Nourishing coconut oil for healthy shiny hair', 3500, 'https://placehold.co/300x300?text=Coconut+Oil', 'Oils & Care', 25],
      ['Argan Hair Oil', 'Premium argan oil for deep hair conditioning', 4500, 'https://placehold.co/300x300?text=Argan+Oil', 'Oils & Care', 15],
      ['Hair Growth Serum', 'Stimulates hair growth, reduces breakage', 6000, 'https://placehold.co/300x300?text=Hair+Serum', 'Oils & Care', 20],
    ];

    for (const [name, desc, price, img, category, stock] of products) {
      db.run(
        'INSERT INTO products (name, description, price, image_url, category, stock) VALUES (?, ?, ?, ?, ?, ?)',
        [name, desc, price, img, category, stock]
      );
    }
    saveDb();
    console.log('Seeded 12 sample products');
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
