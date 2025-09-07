const sequelize = require('../database');
const { DataTypes } = require('sequelize');

const Category = sequelize.define('Category', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title: DataTypes.TEXT,
  image: DataTypes.TEXT,
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE
}, { tableName: 'categories', timestamps: true });

module.exports = Category;

