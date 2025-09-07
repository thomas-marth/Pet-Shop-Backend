const express = require('express');
const Category = require('../database/models/category');
const Product = require('../database/models/product');

const router = express.Router();

// GET /categories/all
router.get('/all', async (req, res, next) => {
  try {
    const rows = await Category.findAll();
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /categories/:id
router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ status: 'ERR', message: 'wrong id' });
    }

    const [items, category] = await Promise.all([
      Product.findAll({ where: { categoryId: id } }),
      Category.findOne({ where: { id } })
    ]);

    if (!category) {
      return res.status(404).json({ status: 'ERR', message: 'category not found' });
    }

    if (items.length === 0) {
      return res.status(404).json({ status: 'ERR', message: 'empty category' });
    }

    res.json({ category, data: items });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
