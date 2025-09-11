const express = require('express');
const router = express.Router();

// Preflight для конкретного пути (не обязателен, но полезен)
router.options('/send', (_req, res) => res.sendStatus(204));

// Принимаем JSON; вернём что получили — для явной проверки на фронте
router.post('/send', (req, res) => {
  // При желании добавь валидацию req.body
  res.json({ status: 'OK', received: req.body ?? null });
});

module.exports = router;
