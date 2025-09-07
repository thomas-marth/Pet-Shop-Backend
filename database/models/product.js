const { DataTypes } = require('sequelize');
const sequelize = require('../database/database');

const Product = sequelize.define('Product', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title: { type: DataTypes.TEXT, allowNull: false },
  price: { type: DataTypes.INTEGER, allowNull: false },
  discont_price: { type: DataTypes.INTEGER, allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  image: { type: DataTypes.TEXT, allowNull: true },

  categoryId: { type: DataTypes.INTEGER, allowNull: true }
}, {
  tableName: 'products',
  timestamps: false
});

module.exports = Product;
