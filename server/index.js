require('dotenv').config();
const { validateEnv } = require('./middleware/validateEnv');
validateEnv();

const config = require('./config');
const { initDatabase, seedProducts, seedAdmin, closePool } = require('./db');
const app = require('./app');

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
