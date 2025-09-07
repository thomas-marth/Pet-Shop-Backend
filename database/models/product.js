const sequelize = require('../database'); 
const { DataTypes } = require('sequelize');

const Product = sequelize.define('Product', {
  id:            { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title:         DataTypes.TEXT,
  price:         DataTypes.INTEGER,
  discont_price: DataTypes.INTEGER,
  description:   DataTypes.TEXT,
  image:         DataTypes.TEXT,
  categoryId:    DataTypes.INTEGER,
  createdAt:     DataTypes.DATE,
  updatedAt:     DataTypes.DATE
}, {
  tableName: 'products',
  timestamps: true,       
  defaultScope: {
    order: [['id', 'ASC']]  
  },
  // (опционально) полезные именованные сортировки
  scopes: {
    newest:     { order: [['createdAt', 'DESC'], ['id', 'DESC']] },
    cheapFirst: { order: [['price', 'ASC'],      ['id', 'ASC']]  },
    priceyFirst:{ order: [['price', 'DESC'],     ['id', 'ASC']]  }
  }
});

module.exports = Product;
