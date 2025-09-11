// Подскажем Vercel-бандлеру взять драйверы Postgres (безвредно оставить)
try { require('pg'); require('pg-hstore'); } catch (_) {}

const express = require('express');
const cors = require('cors');

const sequelize = require('./database/database');
const Category  = require('./database/models/category');
const Product   = require('./database/models/product');

const app = express();
console.log('[BOOT]', { vercel: !!process.env.VERCEL, nodeEnv: process.env.NODE_ENV });

/** CORS – ЖЁСТКО ЗАДАДИМ ПОЛИТИКУ + ОБРАБОТАЕМ PREFLIGHT **/
const corsOptions = {
  origin: '*',                              // при необходимости тут whitelist доменов
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));        // <-- ВАЖНО: отвечаем 204 на любой OPTIONS

/** Парсеры тела ДОЛЖНЫ быть до роутов */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

/** Связи моделей и единичный sync (на холодный старт) */
Category.hasMany(Product, { foreignKey: 'categoryId' });
Product.belongsTo(Category, { foreignKey: 'categoryId' });

let dbInitPromise;
function ensureDb() {
  if (!dbInitPromise) dbInitPromise = sequelize.sync(); // без alter/force в проде
  return dbInitPromise;
}

// health должен работать даже если БД не поднялась
app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// все остальные запросы — после ensureDb
app.use(async (req, res, next) => {
  if (req.path === '/health') return next();
  try { await ensureDb(); next(); } catch (e) { next(e); }
});

/** РОУТЫ */
app.use('/categories', require('./routes/categories'));
app.use('/products',   require('./routes/products'));
app.use('/sale',       require('./routes/sale'));   // <-- см. файл ниже
app.use('/order',      require('./routes/order'));  // <-- см. файл ниже

// корень
app.get('/', (_req, res) => {
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

// глобальный обработчик ошибок
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ ok: false, error: err?.message || 'Server error' });
});

// локальный запуск
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3333;
  app.listen(PORT, () => console.log(`Local server on ${PORT}`));
}

module.exports = app;
