const express = require('express');
const router = express.Router();

/**
 * POST /sale/send
 * Тело (JSON): { productId, userId, discount? }
 */
router.post('/send', async (req, res, next) => {
  try {
    const { productId, userId, discount } = req.body;

    // простая валидация входных данных
    if (!productId || !userId) {
      return res.status(400).json({
        status: 'ERR',
        message: 'productId и userId обязательны'
      });
    }

    // TODO: здесь можно добавить сохранение в БД (если будет модель Sale)
    // await Sale.create({ productId, userId, discount });

    return res.json({
      status: 'OK',
      message: 'sale request accepted',
      data: { productId, userId, discount: discount ?? null }
    });
  } catch (err) {
    next(err); // передаём в глобальный обработчик ошибок (в index.js)
  }
});

module.exports = router;
