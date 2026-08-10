const request = require('supertest');
const app = require('../app');
const { query, closePool } = require('../db');

let dbAvailable = false;

beforeAll(async () => {
  try {
    await query('SELECT 1');
    dbAvailable = true;
  } catch {
    console.warn('[Tests] PostgreSQL not available — skipping integration tests');
  }
});

afterAll(async () => {
  await closePool();
});

describe('Health check', () => {
  it('GET /health - returns status', async () => {
    if (!dbAvailable) return;
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBe('connected');
  });
});

describe('Auth endpoints', () => {
  const testEmail = `test${Date.now()}@example.com`;

  it('POST /api/auth/signup - creates new user', async () => {
    if (!dbAvailable) return;
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: testEmail, password: 'password123', full_name: 'Test User' });
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Account created');
  });

  it('POST /api/auth/signup - rejects duplicate email', async () => {
    if (!dbAvailable) return;
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: testEmail, password: 'password123' });
    expect(res.status).toBe(409);
  });

  it('POST /api/auth/signup - rejects short password', async () => {
    if (!dbAvailable) return;
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'new@example.com', password: '123' });
    expect(res.status).toBe(400);
  });

  it('POST /api/auth/login - returns token with correct credentials', async () => {
    if (!dbAvailable) return;
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('POST /api/auth/login - rejects wrong password', async () => {
    if (!dbAvailable) return;
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });
});

describe('Product endpoints', () => {
  it('GET /products - returns paginated products', async () => {
    if (!dbAvailable) return;
    const res = await request(app).get('/products');
    expect(res.status).toBe(200);
    expect(res.body.products).toBeDefined();
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body.totalPages).toBeDefined();
  });

  it('GET /products?search= - filters by search', async () => {
    if (!dbAvailable) return;
    const res = await request(app).get('/products?search=honey');
    expect(res.status).toBe(200);
    expect(res.body.products.length).toBeGreaterThan(0);
  });

  it('GET /products/categories - returns categories', async () => {
    if (!dbAvailable) return;
    const res = await request(app).get('/products/categories');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /products/:id - returns product detail', async () => {
    if (!dbAvailable) return;
    const listRes = await request(app).get('/products');
    const productId = listRes.body.products[0].id;
    const res = await request(app).get(`/products/${productId}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBeDefined();
    expect(res.body.reviews).toBeDefined();
    expect(res.body.images).toBeDefined();
  });

  it('GET /products/99999 - returns 404', async () => {
    if (!dbAvailable) return;
    const res = await request(app).get('/products/99999');
    expect(res.status).toBe(404);
  });
});
