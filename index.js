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

// ===== Диагностика (до БД!) =====

// 1) паспорт окружения (без секретов)
app.get('/__env', (req, res) => {
  res.json({
    vercel: !!process.env.VERCEL,
    has_POSTGRES_URL: !!process.env.POSTGRES_URL,
    has_DATABASE_URL: !!process.env.DATABASE_URL,
    node: process.version
  });
});

// 2) health, чтобы отличить 404/роутинг от падения БД
app.get('/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

// 3) проверка подключения к БД (прямо authenticate, без sync)
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

// Связи (явно укажем ключ)
Category.hasMany(Product, { foreignKey: 'categoryId' });
Product.belongsTo(Category, { foreignKey: 'categoryId' });

// один раз синкаем БД при холодном старте (но не для /__* и /health)
let dbInitPromise;
function ensureDb() {
  if (!dbInitPromise) {
    dbInitPromise = sequelize.sync(); // без force в проде
  }
  return dbInitPromise;
}

app.use(async (req, res, next) => {
  // пропускаем диагностические маршруты и /health, чтобы они работали даже при падении БД
  if (req.path.startsWith('/__') || req.path === '/health') {
    return next();
  }
  try {
    await ensureDb();
    next();
  } catch (e) {
    console.error('[DB_SYNC_ERROR]', e);
    next(e);
  }
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

// 1) Мини-паспорт окружения (без секретов)
app.get('/__env', (req, res) => {
  res.json({
    vercel: !!process.env.VERCEL,
    has_POSTGRES_URL: !!process.env.POSTGRES_URL,
    has_DATABASE_URL: !!process.env.DATABASE_URL
  });
});

// 2) Проверка подключения к БД
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

// 3) Разовая миграция схемы (создаёт таблицы из моделей)
app.post('/__migrate', async (req, res, next) => {
  try {
    await sequelize.sync({ alter: true });
    res.json({ ok: true, migrated: true });
  } catch (e) {
    next(e);
  }
});

// Проверка подключения к БД и диалекта
app.get('/_db', async (req, res) => {
  try {
    const sequelize = require('./database/database');
    await sequelize.authenticate(); // проверяем строку подключения и SSL
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

