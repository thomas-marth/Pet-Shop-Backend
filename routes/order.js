const express = require('express');
const router = express.Router();

router.post('/send', async (req, res, next) => {
  try {
    // твоя логика (валидация, сохранение, отправка письма и т.д.)
    res.json({ status: 'OK' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
