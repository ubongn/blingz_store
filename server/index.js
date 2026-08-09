require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const crypto = require('crypto');

const { validateEnv } = require('./middleware/validateEnv');
validateEnv();

const config = require('./config');
const { initDatabase, seedProducts, seedAdmin, query, closePool } = require('./db');
const { createSecurityMiddleware } = require('./middleware/security');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const checkoutRoutes = require('./routes/checkout');
const wishlistRoutes = require('./routes/wishlist');
const orderRoutes = require('./routes/orders');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');

const app = express();

// Request ID
app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
});

// Logging
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));

// Security
const { generalLimiter, authLimiter, checkoutLimiter } = createSecurityMiddleware(app);
app.use(generalLimiter);

// CORS
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
}));

// Stripe webhook needs raw body
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  // Handled by checkout routes
  res.status(404).json({ error: 'Webhook not configured' });
});

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting on auth routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/checkout', checkoutLimiter);

// Routes
app.use('/api', authRoutes);
app.use('/products', productRoutes);
app.use('/cart', cartRoutes);
app.use('/checkout', checkoutRoutes);
app.use('/wishlist', wishlistRoutes);
app.use('/orders', orderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: 'connected',
      environment: config.nodeEnv,
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      error: config.nodeEnv === 'production' ? 'Database connection failed' : err.message,
    });
  }
});

// Serve static client build in production
app.use(express.static(path.join(__dirname, 'public')));

// SPA catch-all — serve index.html for client-side routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 handler for API routes
app.use('/api', notFoundHandler);
app.use('/products', notFoundHandler);
app.use('/cart', notFoundHandler);
app.use('/checkout', notFoundHandler);
app.use('/wishlist', notFoundHandler);
app.use('/orders', notFoundHandler);
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Graceful shutdown
async function shutdown(signal) {
  console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
  await closePool();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

async function start() {
  try {
    await initDatabase();
    await seedProducts();
    await seedAdmin();
    app.listen(config.port, '0.0.0.0', () => {
      console.log(`[Server] Running on http://localhost:${config.port}`);
      console.log(`[Server] Environment: ${config.nodeEnv}`);
    });
  } catch (err) {
    console.error('[Server] Failed to start:', err.message);
    process.exit(1);
  }
}

start();

module.exports = app;
