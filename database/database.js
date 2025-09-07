const { Sequelize } = require('sequelize');

// Для Vercel — файл в /tmp (живёт в рамках инстанса) или :memory:
const storage = process.env.SQLITE_PATH
  || (process.env.VERCEL ? '/tmp/database.sqlite' : 'database.sqlite');

console.log('[DB] storage =', storage);

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage,
  logging: false
});

module.exports = sequelize;



