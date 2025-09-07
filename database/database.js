// в ./database/database.js
const storage = process.env.SQLITE_PATH
  || (process.env.VERCEL ? ':memory:' : 'database.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage,
  logging: false
});

