const requiredVars = [
  'JWT_SECRET',
  'DATABASE_URL',
  'STRIPE_SECRET_KEY',
];

const recommendedVars = [
  'STRIPE_WEBHOOK_SECRET',
  'CORS_ORIGIN',
  'SMTP_USER',
  'ADMIN_PASSWORD',
];

function validateEnv() {
  const missing = requiredVars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    console.error(`[FATAL] Missing required environment variables: ${missing.join(', ')}`);
    console.error('Add them to server/.env or set them in your environment.');
    process.exit(1);
  }

  const missingRecommended = recommendedVars.filter(v => !process.env[v]);
  if (missingRecommended.length > 0) {
    console.warn(`[WARN] Missing recommended environment variables: ${missingRecommended.join(', ')}`);
  }
}

module.exports = { validateEnv };
