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

// один раз синкаем БД при холодном старте
let dbInitPromise;
function ensureDb() {
  if (!dbInitPromise) {
    const syncOpts = process.env.VERCEL ? { force: true } : {};
    dbInitPromise = sequelize.sync(syncOpts);
  }
  return dbInitPromise;
}
app.use(async (req, res, next) => {
  try { await ensureDb(); next(); } catch (e) { next(e); }
});

// --- роуты ---
app.use('/categories', categories);
app.use('/products', products);
app.use('/sale', sale);
app.use('/order', order);

// корень и health
app.get('/', (_, res) => {
  res.json({ ok: true, routes: [
    '/categories/all','/products/all','/products/:id','/order/send','/sale/send','/health'
  ]});
});
app.get('/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

// глобальный обработчик ошибок (чтобы 500 были в JSON и в логах)
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ ok: false, error: err?.message || 'Server error' });
});

// локальный запуск только в dev
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3333;
  app.listen(PORT, () => console.log(`Local server on ${PORT}`));
}

module.exports = app;

