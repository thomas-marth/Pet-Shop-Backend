// Подскажем бандлеру Vercel включить драйверы Postgres
try { require('pg'); require('pg-hstore'); } catch (_) {}

const express = require('express');

let sequelize; // будет создан при первом обращении
function getSequelize() {
  if (!sequelize) sequelize = require('./database/database');
  return sequelize;
}

const cors = require('cors');

const app = express();
console.log('[BOOT]', { vercel: !!process.env.VERCEL, nodeEnv: process.env.NODE_ENV });

// ---------- middleware ----------
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// ---------- Диагностика (ДО любых require моделей/роутов!) ----------
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

// ---------- Ленивая инициализация моделей + связей + синк ----------
let dbInitPromise;
let Category, Product;

function initModelsOnce() {
  if (!Category || !Product) {
    Category = require('./database/models/category');
    Product  = require('./database/models/product');
    Category.hasMany(Product, { foreignKey: 'categoryId' });
    Product.belongsTo(Category, { foreignKey: 'categoryId' });
    console.log('[MODELS_READY]', Object.keys(sequelize.models));
  }
}

function ensureDb() {
  if (!dbInitPromise) {
    initModelsOnce();
    dbInitPromise = getSequelize().sync(); // без force в проде (Postgres постоянный)
  }
  return dbInitPromise;
}

// Пропускаем диагностику, чтобы она работала даже при падении БД/импортов
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

// ---------- Импорт роутов в try/catch, чтобы не уронить всё приложение ----------
let categories, products, sale, order;
try { categories = require('./routes/categories'); } catch (e) { console.error('[ROUTE_IMPORT_ERROR categories]', e); }
try { products  = require('./routes/products');  } catch (e) { console.error('[ROUTE_IMPORT_ERROR products]', e); }
try { sale      = require('./routes/sale');      } catch (e) { console.error('[ROUTE_IMPORT_ERROR sale]', e); }
try { order     = require('./routes/order');     } catch (e) { console.error('[ROUTE_IMPORT_ERROR order]', e); }

// Подключаем только те роуты, что успешно импортировались
if (categories) app.use('/categories', categories); else app.get('/categories/*', (_,r)=>r.status(500).json({ok:false,error:'categories route failed to load'}));
if (products)   app.use('/products', products);   else app.get('/products/*',   (_,r)=>r.status(500).json({ok:false,error:'products route failed to load'}));
if (sale)       app.use('/sale', sale);           else app.get('/sale/*',       (_,r)=>r.status(500).json({ok:false,error:'sale route failed to load'}));
if (order)      app.use('/order', order);         else app.get('/order/*',      (_,r)=>r.status(500).json({ok:false,error:'order route failed to load'}));

// ---------- Корень ----------
app.get('/', (_, res) => {
  res.json({ ok: true, routes: [
    '/categories/all','/products/all','/products/:id','/order/send','/sale/send','/health','/__env','/__db'
  ]});
});

// ---------- Глобальный обработчик ошибок ----------
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ ok: false, error: err?.message || 'Server error' });
});

// ---------- Локальный запуск ----------
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3333;
  app.listen(PORT, () => console.log(`Local server on ${PORT}`));
}

module.exports = app;
