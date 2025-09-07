const express = require('express');
const Category = require('../database/models/category');
const Product = require('../database/models/product');

const router = express.Router();

/**
 * GET /categories/all
 * Возвращает список всех категорий
 */
router.get('/all', async (req, res, next) => {
  try {
    const rows = await Category.findAll();
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /categories/:id
 * Возвращает категорию и товары этой категории
 */
router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ status: 'ERR', message: 'wrong id' });
    }

    // Получаем категорию и товары параллельно
    const [category, items] = await Promise.all([
      Category.findOne({ where: { id } }),
      Product.findAll({ where: { categoryId: id } })
    ]);

    if (!category) {
      return res.status(404).json({ status: 'ERR', message: 'category not found' });
    }

    if (items.length === 0) {
      // категория есть, но товаров нет — это не ошибка сервера
      return res.status(404).json({ status: 'ERR', message: 'empty category' });
    }

    res.json({ category, data: items });
  } catch (err) {
    next(err);
  }
});

module.exports = router;



