const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Category = sequelize.define('Category', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title: { type: DataTypes.TEXT, allowNull: false },
  image: { type: DataTypes.TEXT, allowNull: true }
}, {
  tableName: 'categories',
  timestamps: false
});

module.exports = Category;
