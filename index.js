const express = require('express');
const cors = require('cors');

const categories = require('./routes/categories');
const sale = require('./routes/sale');
const order = require('./routes/order');
const products = require('./routes/products');

const sequelize = require('./database/database');
const Category = require('./database/models/category');
const Product = require('./database/models/product');

// Связи
Category.hasMany(Product);

const app = express();

// --- middleware до роутов ---
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// --- "ленивая" инициализация БД (один раз на холодный старт) ---
let dbInitPromise;
function ensureDb() {
  if (!dbInitPromise) {
    dbInitPromise = sequelize.sync(); // при желании: { alter: true }
  }
  return dbInitPromise;
}
app.use(async (req, res, next) => {
  try {
    await ensureDb();
    next();
  } catch (e) {
    next(e);
  }
});

// --- роуты ---
app.use('/categories', categories);
app.use('/products', products);
app.use('/sale', sale);
app.use('/order', order);

// Корневой маршрут, чтобы / не отдавал 404
app.get('/', (_, res) => {
  res.json({
    ok: true,
    routes: [
      '/categories/all',
      '/products/all',
      '/products/:id',
      '/order/send',
      '/sale/send'
    ]
  });
});

// Локальный запуск (dev). В проде (Vercel) ПОРТ НЕ СЛУШАЕМ!
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3333;
  app.listen(PORT, () => console.log(`Local server on ${PORT}`));
}

// Экспорт для Vercel (@vercel/node)
module.exports = app;

