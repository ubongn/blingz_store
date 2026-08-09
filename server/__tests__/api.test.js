const request = require('supertest');
const app = require('../index');
const { query, closePool } = require('../db');

beforeAll(async () => {
  await new Promise(resolve => setTimeout(resolve, 2000));
});

afterAll(async () => {
  await closePool();
});

describe('Auth endpoints', () => {
  const testEmail = `test${Date.now()}@example.com`;
  let token;

  it('POST /api/auth/signup - creates new user', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: testEmail, password: 'password123', full_name: 'Test User' });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Account created');
  });

  it('POST /api/auth/signup - rejects duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: testEmail, password: 'password123' });

    expect(res.status).toBe(409);
  });

  it('POST /api/auth/signup - rejects short password', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'new@example.com', password: '123' });

    expect(res.status).toBe(400);
  });

  it('POST /api/auth/login - returns token with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  it('POST /api/auth/login - rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });

  it('GET /api/auth/profile - returns user profile', async () => {
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(testEmail);
    expect(res.body.full_name).toBe('Test User');
  });

  it('GET /api/auth/profile - rejects without token', async () => {
    const res = await request(app).get('/api/auth/profile');
    expect(res.status).toBe(401);
  });
});

describe('Product endpoints', () => {
  it('GET /products - returns paginated products', async () => {
    const res = await request(app).get('/products');

    expect(res.status).toBe(200);
    expect(res.body.products).toBeDefined();
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body.totalPages).toBeDefined();
  });

  it('GET /products?search= - filters by search', async () => {
    const res = await request(app).get('/products?search=honey');

    expect(res.status).toBe(200);
    expect(res.body.products.length).toBeGreaterThan(0);
  });

  it('GET /products/categories - returns categories', async () => {
    const res = await request(app).get('/products/categories');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /products/:id - returns product detail', async () => {
    const listRes = await request(app).get('/products');
    const productId = listRes.body.products[0].id;

    const res = await request(app).get(`/products/${productId}`);

    expect(res.status).toBe(200);
    expect(res.body.name).toBeDefined();
    expect(res.body.reviews).toBeDefined();
    expect(res.body.images).toBeDefined();
  });

  it('GET /products/99999 - returns 404', async () => {
    const res = await request(app).get('/products/99999');
    expect(res.status).toBe(404);
  });
});

describe('Health check', () => {
  it('GET /health - returns ok status', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBe('connected');
  });
});
