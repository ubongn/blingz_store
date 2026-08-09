const express = require('express');
const { query } = require('../db');
const { auth } = require('../middleware/auth');
const { reviewRules } = require('../middleware/validate');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { search, category, page = 1, limit = 12, sort, min_price, max_price } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    let where = [];
    let params = [];
    let paramIndex = 1;

    if (search) {
      where.push(`(p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (category) {
      where.push(`p.category = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }

    if (min_price) {
      where.push(`p.price >= $${paramIndex}`);
      params.push(parseFloat(min_price));
      paramIndex++;
    }

    if (max_price) {
      where.push(`p.price <= $${paramIndex}`);
      params.push(parseFloat(max_price));
      paramIndex++;
    }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    let orderBy = 'p.id ASC';
    if (sort === 'price_asc') orderBy = 'p.price ASC';
    else if (sort === 'price_desc') orderBy = 'p.price DESC';
    else if (sort === 'newest') orderBy = 'p.id DESC';
    else if (sort === 'oldest') orderBy = 'p.id ASC';

    const countResult = await query(`SELECT COUNT(*)::int FROM products p ${whereClause}`, params);
    const total = countResult.rows[0].count;
    const totalPages = Math.ceil(total / limitNum);

    const result = await query(
      `SELECT p.id, p.name, p.description, p.price, p.image_url, p.category, p.stock
       FROM products p ${whereClause}
       ORDER BY ${orderBy}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limitNum, offset]
    );

    res.json({ products: result.rows, page: pageNum, totalPages, total });
  } catch (err) {
    next(err);
  }
});

router.get('/categories', async (req, res, next) => {
  try {
    const { rows } = await query("SELECT DISTINCT category FROM products WHERE category != ''");
    res.json(rows.map(r => r.category));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT id, name, description, price, image_url, category, stock FROM products WHERE id = $1',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = rows[0];

    const reviewResult = await query(
      `SELECT r.rating, r.comment, r.created_at, u.email
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = $1
       ORDER BY r.created_at DESC`,
      [req.params.id]
    );
    product.reviews = reviewResult.rows;

    const avgResult = await query('SELECT AVG(rating)::numeric(10,1) as avg FROM reviews WHERE product_id = $1', [req.params.id]);
    product.avgRating = avgResult.rows[0].avg ? parseFloat(avgResult.rows[0].avg) : 0;

    const imagesResult = await query(
      'SELECT id, image_url, sort_order FROM product_images WHERE product_id = $1 ORDER BY sort_order',
      [req.params.id]
    );
    product.images = imagesResult.rows;

    res.json(product);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/reviews', auth, reviewRules, async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.id;

    const existing = await query(
      'SELECT id FROM reviews WHERE user_id = $1 AND product_id = $2',
      [req.userId, productId]
    );

    if (existing.rows.length > 0) {
      await query('UPDATE reviews SET rating = $1, comment = $2 WHERE user_id = $3 AND product_id = $4',
        [rating, comment || '', req.userId, productId]);
    } else {
      await query(
        'INSERT INTO reviews (user_id, product_id, rating, comment) VALUES ($1, $2, $3, $4)',
        [req.userId, productId, rating, comment || '']
      );
    }

    const userResult = await query('SELECT full_name, email FROM users WHERE id = $1', [req.userId]);
    const reviewerName = userResult.rows[0]?.full_name || userResult.rows[0]?.email || 'Someone';

    const prodResult = await query('SELECT name FROM products WHERE id = $1', [productId]);
    const prodName = prodResult.rows[0]?.name || 'a product';

    const adminResult = await query('SELECT id FROM users WHERE is_admin = TRUE');
    for (const row of adminResult.rows) {
      await query(
        'INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)',
        [row.id, `${reviewerName} left a ${rating}-star review on ${prodName}`, 'review']
      );
    }

    res.status(201).json({ message: 'Review submitted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
