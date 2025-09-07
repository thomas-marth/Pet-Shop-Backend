const { Sequelize } = require('sequelize');

const isProd = !!process.env.VERCEL;
const pooledUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

let sequelize;

if (isProd) {
  // Vercel/Neon: pooled URL + SSL
  sequelize = new Sequelize(pooledUrl, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    pool: { max: 5, min: 0, idle: 10000, acquire: 30000 },
    logging: false
  });
} else {
  // Локально оставляем SQLite
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'database.sqlite',
    logging: false
  });
}

module.exports = sequelize;




