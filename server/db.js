const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const config = require('./config');

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: config.databaseUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    pool.on('error', (err) => {
      console.error('[DB] Unexpected error on idle client:', err.message);
    });
  }
  return pool;
}

async function query(text, params) {
  const client = await getPool().connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

async function initDatabase() {
  const db = getPool();

  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      full_name VARCHAR(255) DEFAULT '',
      is_admin BOOLEAN DEFAULT FALSE,
      avatar_url TEXT DEFAULT ''
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT DEFAULT '',
      price DECIMAL(10,2) NOT NULL,
      image_url TEXT DEFAULT '',
      category VARCHAR(100) DEFAULT '',
      stock INTEGER DEFAULT 0
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS cart (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      quantity INTEGER DEFAULT 1
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      full_name VARCHAR(255) NOT NULL,
      address TEXT NOT NULL,
      city VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      total DECIMAL(10,2) NOT NULL,
      status VARCHAR(50) DEFAULT 'Processing',
      payment_status VARCHAR(50) DEFAULT 'pending',
      payment_method VARCHAR(50) DEFAULT '',
      stripe_payment_intent_id TEXT DEFAULT '',
      coupon_code VARCHAR(50) DEFAULT '',
      discount_amount DECIMAL(10,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      quantity INTEGER NOT NULL,
      price DECIMAL(10,2) NOT NULL
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS wishlist (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, product_id)
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      type VARCHAR(50) DEFAULT 'info',
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS coupons (
      id SERIAL PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
      discount_value DECIMAL(10,2) NOT NULL,
      min_order_amount DECIMAL(10,2) DEFAULT 0,
      max_uses INTEGER DEFAULT 0,
      used_count INTEGER DEFAULT 0,
      expires_at TIMESTAMP,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS password_resets (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token VARCHAR(255) UNIQUE NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS product_images (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      image_url TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Indexes
  await db.query('CREATE INDEX IF NOT EXISTS idx_cart_user_id ON cart(user_id)');
  await db.query('CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)');
  await db.query('CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)');
  await db.query('CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id)');
  await db.query('CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id)');
  await db.query('CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)');
  await db.query('CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)');
  await db.query('CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token)');
  await db.query('CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)');
  await db.query('CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)');

  console.log('[DB] Tables and indexes created');
}

async function seedProducts() {
  const { rows } = await query('SELECT COUNT(*)::int as count FROM products');
  if (rows[0].count === 0) {
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
      await query(
        'INSERT INTO products (name, description, price, image_url, category, stock) VALUES ($1, $2, $3, $4, $5, $6)',
        [name, desc, price, img, category, stock]
      );
    }
    console.log('[DB] Seeded 12 sample products');
  }
}

async function seedAdmin() {
  const { rows } = await query('SELECT id FROM users WHERE email = $1', [config.adminEmail]);
  if (rows.length === 0) {
    const hash = await bcrypt.hash(config.adminPassword, 12);
    await query(
      'INSERT INTO users (email, password, full_name, is_admin) VALUES ($1, $2, $3, TRUE)',
      [config.adminEmail, hash, 'Admin']
    );
    console.log(`[DB] Seeded admin user: ${config.adminEmail}`);
  }
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = { query, getPool, initDatabase, seedProducts, seedAdmin, closePool };
