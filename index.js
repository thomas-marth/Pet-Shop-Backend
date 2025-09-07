const express = require('express');
const cors = require('cors');

const categories = require('./routes/categories');
const sale = require('./routes/sale');
const order = require('./routes/order');
const products = require('./routes/products');

const sequelize = require('./database/database');
const Category = require('./database/models/category');
const Product = require('./database/models/product');

const app = express();

console.log('[BOOT]', { vercel: !!process.env.VERCEL, nodeEnv: process.env.NODE_ENV });

// --- middleware до роутов ---
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Связи (явно укажем ключ)
Category.hasMany(Product, { foreignKey: 'categoryId' });
Product.belongsTo(Category, { foreignKey: 'categoryId' });

// --- "ленивая" инициализация БД (один раз на холодный старт) ---
let dbInitPromise;
function ensureDb() {
  if (!dbInitPromise) {
    dbInitPromise = sequelize.sync(); // при необходимости: { alter: true }
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

// Корневой маршрут
app.get('/', (_, res) => {
  res.json({
    ok: true,
    routes: [
      '/categories/all',
      '/products/all',
      '/products/:id',
      '/order/send',
      '/sale/send',
      '/health'
    ]
  });
});

// Health-check
app.get('/health', (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

// Глобальный обработчик ошибок (важно для serverless)
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ ok: false, error: err?.message || 'Server error' });
});

// Локальный запуск (dev). В проде (Vercel) ПОРТ НЕ СЛУШАЕМ!
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3333;
  app.listen(PORT, () => console.log(`Local server on ${PORT}`));
}

// Экспорт для Vercel (@vercel/node)
module.exports = app;

