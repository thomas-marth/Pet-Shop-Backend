// Подскажем Vercel-бандлеру включить драйверы Postgres (безопасно оставить)
try { require('pg'); require('pg-hstore'); } catch (_) {}

const express = require('express');
const cors = require('cors');

const sequelize = require('./database/database');        // теперь можно импортировать сразу
const Category = require('./database/models/category');  // в моделях: require('../database')
const Product  = require('./database/models/product');

const app = express();
console.log('[BOOT]', { vercel: !!process.env.VERCEL, nodeEnv: process.env.NODE_ENV });

// ---------- middleware ----------
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// ---------- связи моделей (до sync) ----------
Category.hasMany(Product, { foreignKey: 'categoryId' });
Product.belongsTo(Category, { foreignKey: 'categoryId' });

// ---------- один sync на холодный старт ----------
let dbInitPromise;
function ensureDb() {
  if (!dbInitPromise) {
    dbInitPromise = sequelize.sync(); // без force/alter в проде
  }
  return dbInitPromise;
}

// Пропустим health, чтобы он работал даже если БД вдруг недоступна
app.use(async (req, res, next) => {
  if (req.path === '/health') return next();
  try { await ensureDb(); next(); } catch (e) { next(e); }
});

// ---------- опциональные диагностические роуты ----------
if (process.env.DEBUG_ROUTES === '1') {
  app.get('/__env', (req, res) => {
    res.json({
      vercel: !!process.env.VERCEL,
      has_POSTGRES_URL: !!process.env.POSTGRES_URL,
      has_DATABASE_URL: !!process.env.DATABASE_URL,
      node: process.version
    });
  });
  app.get('/__db', async (req, res) => {
    try {
      await sequelize.authenticate();
      res.json({ ok: true, dialect: sequelize.getDialect(), env: process.env.VERCEL ? 'vercel' : 'local' });
    } catch (err) {
      res.status(500).json({ ok: false, name: err.name, message: err.message });
    }
  });
}

// ---------- основные роуты ----------
app.use('/categories', require('./routes/categories'));
app.use('/products',   require('./routes/products'));
app.use('/sale',       require('./routes/sale'));
app.use('/order',      require('./routes/order'));

// корень и health
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
app.get('/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

// ---------- глобальный обработчик ошибок ----------
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ ok: false, error: err?.message || 'Server error' });
});

// ---------- локальный запуск ----------
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3333;
  app.listen(PORT, () => console.log(`Local server on ${PORT}`));
}

module.exports = app;
