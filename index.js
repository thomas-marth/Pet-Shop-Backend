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

// ---------- middleware ----------
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// ---------- Диагностика (ДО любой работы с БД!) ----------
app.get('/__env', (req, res) => {
  res.json({
    vercel: !!process.env.VERCEL,
    has_POSTGRES_URL: !!process.env.POSTGRES_URL,
    has_DATABASE_URL: !!process.env.DATABASE_URL,
    node: process.version
  });
});

app.get('/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

app.get('/__db', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      ok: true,
      dialect: sequelize.getDialect(),
      env: process.env.VERCEL ? 'vercel' : 'local'
    });
  } catch (err) {
    console.error('[DB_AUTH_ERROR]', err);
    res.status(500).json({ ok: false, name: err.name, message: err.message });
  }
});

// ---------- связи моделей (до sync) ----------
Category.hasMany(Product, { foreignKey: 'categoryId' });
Product.belongsTo(Category, { foreignKey: 'categoryId' });

// ---------- ленивый sync (пропускаем диагностику) ----------
let dbInitPromise;
function ensureDb() {
  if (!dbInitPromise) {
    dbInitPromise = sequelize.sync(); // без force в проде (Postgres постоянный)
  }
  return dbInitPromise;
}

app.use(async (req, res, next) => {
  if (req.path.startsWith('/__') || req.path === '/health') return next();
  try {
    await ensureDb();
    next();
  } catch (e) {
    console.error('[DB_SYNC_ERROR]', e);
    next(e);
  }
});

// ---------- основные роуты ----------
app.use('/categories', categories);
app.use('/products', products);
app.use('/sale', sale);
app.use('/order', order);

// корень
app.get('/', (_, res) => {
  res.json({
    ok: true,
    routes: [
      '/categories/all',
      '/products/all',
      '/products/:id',
      '/order/send',
      '/sale/send',
      '/health',
      '/__env',
      '/__db'
    ]
  });
});

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
