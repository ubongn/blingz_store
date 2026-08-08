const express = require('express');
const { getDb, saveDb } = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const { search, category, page = 1, limit = 12, sort, min_price, max_price } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    let where = [];
    let params = [];

    if (search) {
      where.push('(p.name LIKE ? OR p.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      where.push('p.category = ?');
      params.push(category);
    }

    if (min_price) {
      where.push('p.price >= ?');
      params.push(parseFloat(min_price));
    }

    if (max_price) {
      where.push('p.price <= ?');
      params.push(parseFloat(max_price));
    }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    let orderBy = 'p.id ASC';
    if (sort === 'price_asc') orderBy = 'p.price ASC';
    else if (sort === 'price_desc') orderBy = 'p.price DESC';
    else if (sort === 'newest') orderBy = 'p.id DESC';
    else if (sort === 'oldest') orderBy = 'p.id ASC';

    const countResult = db.exec(`SELECT COUNT(*) FROM products p ${whereClause}`, params);
    const total = countResult.length > 0 ? countResult[0].values[0][0] : 0;
    const totalPages = Math.ceil(total / limitNum);

    const result = db.exec(
      `SELECT p.id, p.name, p.description, p.price, p.image_url, p.category, p.stock
       FROM products p ${whereClause}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, limitNum, offset]
    );

    if (result.length === 0) {
      return res.json({ products: [], page: pageNum, totalPages, total });
    }

    const columns = result[0].columns;
    const products = result[0].values.map(row => {
      const obj = {};
      columns.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });

    res.json({ products, page: pageNum, totalPages, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const db = await getDb();
    const result = db.exec('SELECT DISTINCT category FROM products WHERE category != ""');
    if (result.length === 0) return res.json([]);
    const categories = result[0].values.map(row => row[0]);
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const result = db.exec(
      'SELECT id, name, description, price, image_url, category, stock FROM products WHERE id = ?',
      [req.params.id]
    );

    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const columns = result[0].columns;
    const product = {};
    columns.forEach((col, i) => { product[col] = result[0].values[0][i]; });

    const reviewResult = db.exec(
      `SELECT r.rating, r.comment, r.created_at, u.email
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = ?
       ORDER BY r.created_at DESC`,
      [req.params.id]
    );

    if (reviewResult.length > 0) {
      const reviewColumns = reviewResult[0].columns;
      product.reviews = reviewResult[0].values.map(row => {
        const obj = {};
        reviewColumns.forEach((col, i) => { obj[col] = row[i]; });
        return obj;
      });
    } else {
      product.reviews = [];
    }

    const avgResult = db.exec('SELECT AVG(rating) FROM reviews WHERE product_id = ?', [req.params.id]);
    product.avgRating = avgResult.length > 0 && avgResult[0].values[0][0] !== null
      ? Math.round(avgResult[0].values[0][0] * 10) / 10
      : 0;

    const imagesResult = db.exec(
      'SELECT id, image_url, sort_order FROM product_images WHERE product_id = ? ORDER BY sort_order',
      [req.params.id]
    );
    if (imagesResult.length > 0) {
      const imgCols = imagesResult[0].columns;
      product.images = imagesResult[0].values.map(row => {
        const obj = {};
        imgCols.forEach((col, i) => { obj[col] = row[i]; });
        return obj;
      });
    } else {
      product.images = [];
    }

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/reviews', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const db = await getDb();

    const existing = db.exec(
      'SELECT id FROM reviews WHERE user_id = ? AND product_id = ?',
      [req.userId, productId]
    );

    if (existing.length > 0 && existing[0].values.length > 0) {
      db.run('UPDATE reviews SET rating = ?, comment = ? WHERE user_id = ? AND product_id = ?',
        [rating, comment || '', req.userId, productId]);
    } else {
      db.run(
        'INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)',
        [req.userId, productId, rating, comment || '']
      );
    }

    const userResult = db.exec('SELECT full_name, email FROM users WHERE id = ?', [req.userId]);
    const reviewerName = userResult.length > 0 && userResult[0].values.length > 0
      ? (userResult[0].values[0][0] || userResult[0].values[0][1])
      : 'Someone';

    const prodResult = db.exec('SELECT name FROM products WHERE id = ?', [productId]);
    const prodName = prodResult.length > 0 && prodResult[0].values.length > 0 ? prodResult[0].values[0][0] : 'a product';

    const adminResult = db.exec('SELECT id FROM users WHERE is_admin = 1');
    if (adminResult.length > 0) {
      adminResult[0].values.forEach(row => {
        db.run(
          'INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)',
          [row[0], `${reviewerName} left a ${rating}-star review on ${prodName}`, 'review']
        );
      });
    }

    saveDb();
    res.status(201).json({ message: 'Review submitted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
