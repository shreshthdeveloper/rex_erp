const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProductAttribute = sequelize.define('ProductAttribute', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  product_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  attribute_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  attribute_value_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    comment: 'For SELECT/MULTISELECT types'
  },
  text_value: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'For TEXT type attributes'
  },
  number_value: {
    type: DataTypes.DECIMAL(15, 4),
    allowNull: true,
    comment: 'For NUMBER type attributes'
  }
}, {
  tableName: 'product_attributes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['product_id'] },
    { fields: ['attribute_id'] },
    { fields: ['product_id', 'attribute_id'], unique: true }
  ]
});

module.exports = ProductAttribute;
