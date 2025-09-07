const express = require('express');
const Product = require('../database/models/product');

const router = express.Router();

// GET /products/all
router.get('/all', async (req, res, next) => {
  try {
    const rows = await Product.findAll();
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// (временный) GET добавление — если очень нужно, держи ВЫШЕ /:id
router.get('/add/:title/:price/:discont_price/:description', async (req, res, next) => {
  try {
    const { title, price, discont_price, description } = req.params;
    if (!title || isNaN(price)) {
      return res.status(400).json({ status: 'ERR', message: 'Неверные параметры' });
    }
    const item = await Product.create({
      title,
      price: Number(price),
      discont_price: isNaN(discont_price) ? null : Number(discont_price),
      description: description || '',
      categoryId: 1
    });
    res.json({ status: 'OK', data: item });
  } catch (err) {
    next(err);
  }
});

// Рекомендуемый способ добавления — POST /products
router.post('/', async (req, res, next) => {
  try {
    const { title, price, discont_price, description, categoryId } = req.body;

    if (!title || price == null || !Number.isFinite(Number(price))) {
      return res.status(400).json({ status: 'ERR', message: 'title и числовой price обязательны' });
    }

    const item = await Product.create({
      title,
      price: Number(price),
      discont_price: discont_price != null ? Number(discont_price) : null,
      description: description || '',
      categoryId: categoryId != null ? Number(categoryId) : null
    });

    res.status(201).json({ status: 'OK', data: item });
  } catch (err) {
    next(err);
  }
});

// GET /products/:id — ниже, чтобы не перехватывать /add/...
router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ status: 'ERR', message: 'wrong id' });
    }

    const row = await Product.findOne({ where: { id } });
    if (!row) {
      return res.status(404).json({ status: 'ERR', message: 'product not found' });
    }

    res.json(row);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

