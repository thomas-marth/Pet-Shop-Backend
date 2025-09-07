// --- подскажем Vercel-бандлеру включить драйверы Postgres ---
try { require('pg'); require('pg-hstore'); } catch (_) {}

const express = require('express');
const cors = require('cors');

const app = express();
console.log('[BOOT]', { vercel: !!process.env.VERCEL, nodeEnv: process.env.NODE_ENV });

// ------------ ленивое подключение к Sequelize ------------
let _sequelize;
function getSequelize() {
  if (!_sequelize) _sequelize = require('./database/database'); // один общий инстанс
  return _sequelize;
}

// ------------ middleware ------------
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// ------------ диагностика (ДО любой работы с БД/моделями) ------------
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
    await getSequelize().authenticate();
    res.json({ ok: true, dialect: getSequelize().getDialect(), env: process.env.VERCEL ? 'vercel' : 'local' });
  } catch (err) {
    console.error('[DB_AUTH_ERROR]', err);
    res.status(500).json({ ok: false, name: err.name, message: err.message });
  }
});

// ------------ ленивая инициализация моделей + связей + sync ------------
let dbInitPromise;
let Category, Product;

function initModelsOnce() {
  if (!Category || !Product) {
    Category = require('./database/models/category'); // ВНУТРИ модели: require('../database')
    Product  = require('./database/models/product');
    Category.hasMany(Product, { foreignKey: 'categoryId' });
    Product.belongsTo(Category, { foreignKey: 'categoryId' });
    console.log('[MODELS_READY]', Object.keys(getSequelize().models));
  }
}

function ensureDb() {
  if (!dbInitPromise) {
    initModelsOnce();
    dbInitPromise = getSequelize().sync(); // без force в проде (Postgres постоянный)
  }
  return dbInitPromise;
}

// пропускаем диагностику, чтобы она работала даже при падении БД
app.use(async (req, res, next) => {
  if (req.path.startsWith('/__') || req.path === '/health') return next();
  try { await ensureDb(); next(); } catch (e) { console.error('[DB_SYNC_ERROR]', e); next(e); }
});

// ------------ ВРЕМЕННЫЕ утилиты (удали после запуска) ------------
// 1) разовая миграция/обновление схемы
app.post('/__migrate', async (req, res, next) => {
  try {
    await getSequelize().sync({ alter: true });
    res.json({ ok: true, migrated: true });
  } catch (e) { next(e); }
});

// 2) сид из файла репозитория seed/seed.json (опционально)
app.post('/__seed_file', async (req, res, next) => {
  try {
    const seed = require('./seeed/seed.json'); // добавь файл при необходимости
    await getSequelize().sync();
    initModelsOnce();

    const cats = seed.categories || [];
    const prods = seed.products || [];

    if (cats.length) await Category.bulkCreate(cats, { updateOnDuplicate: ['title', 'image'] });
    if (prods.length) await Product.bulkCreate(prods, {
      updateOnDuplicate: ['title','price','discont_price','description','image','categoryId']
    });

    // починим автоинкремент
    await getSequelize().query(
      `SELECT setval(pg_get_serial_sequence('categories','id'),
                     COALESCE((SELECT MAX(id) FROM categories),0)+1, false);`
    );
    await getSequelize().query(
      `SELECT setval(pg_get_serial_sequence('products','id'),
                     COALESCE((SELECT MAX(id) FROM products),0)+1, false);`
    );

    res.json({ ok: true, inserted: { categories: cats.length, products: prods.length } });
  } catch (e) { next(e); }
});

// ------------ основные роуты ------------
let categories, products, sale, order;
try { categories = require('./routes/categories'); } catch (e) { console.error('[ROUTE_IMPORT_ERROR categories]', e); }
try { products  = require('./routes/products');  } catch (e) { console.error('[ROUTE_IMPORT_ERROR products]', e); }
try { sale      = require('./routes/sale');      } catch (e) { console.error('[ROUTE_IMPORT_ERROR sale]', e); }
try { order     = require('./routes/order');     } catch (e) { console.error('[ROUTE_IMPORT_ERROR order]', e); }

if (categories) app.use('/categories', categories); else app.get('/categories/*', (_,r)=>r.status(500).json({ok:false,error:'categories route failed to load'}));
if (products)   app.use('/products', products);   else app.get('/products/*',   (_,r)=>r.status(500).json({ok:false,error:'products route failed to load'}));
if (sale)       app.use('/sale', sale);           else app.get('/sale/*',       (_,r)=>r.status(500).json({ok:false,error:'sale route failed to load'}));
if (order)      app.use('/order', order);         else app.get('/order/*',      (_,r)=>r.status(500).json({ok:false,error:'order route failed to load'}));

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
      '/__db',
      '/__migrate',
      '/__seed_file'
    ]
  });
});

// ------------ глобальный обработчик ошибок ------------
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ ok: false, error: err?.message || 'Server error' });
});

// ------------ локальный запуск (dev) ------------
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3333;
  app.listen(PORT, () => console.log(`Local server on ${PORT}`));
}

module.exports = app;

