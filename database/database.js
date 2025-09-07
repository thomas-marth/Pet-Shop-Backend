const { Sequelize } = require('sequelize');

const isProd = !!process.env.VERCEL;
const pooledUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

let sequelize;

if (isProd) {
  if (pooledUrl) {
    sequelize = new Sequelize(pooledUrl, {
      dialect: 'postgres',
      protocol: 'postgres',
      dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
      pool: { max: 5, min: 0, idle: 10000, acquire: 30000 },
      logging: false
    });
  } else {
    // ⬇️ важный фолбэк: не валим импорт, а даём временную SQLite,
    // чтобы /__env мог ответить и показать, что переменной нет.
    console.warn('[ENV] No DATABASE_URL/POSTGRES_URL — fallback to /tmp sqlite');
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: '/tmp/fallback.sqlite',
      logging: false
    });
  }
} else {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'database.sqlite',
    logging: false
  });
}

module.exports = sequelize;




