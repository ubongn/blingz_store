const express = require('express');
const { getDb } = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const result = db.exec('SELECT id, name, description, price, image_url FROM products');

    if (result.length === 0) {
      return res.json([]);
    }

    const columns = result[0].columns;
    const products = result[0].values.map(row => {
      const obj = {};
      columns.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const result = db.exec('SELECT id, name, description, price, image_url FROM products WHERE id = ?', [req.params.id]);

    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const columns = result[0].columns;
    const product = {};
    columns.forEach((col, i) => { product[col] = result[0].values[0][i]; });

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
