const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  parent_product_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    defaultValue: null
  },
  product_type: {
    type: DataTypes.ENUM('SINGLE', 'VARIANT', 'VARIANT_CHILD'),
    defaultValue: 'SINGLE'
  },
  sku: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  product_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  category_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  brand_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  unit_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  short_description: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  cost_price: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00
  },
  selling_price: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  mrp: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  tax_category: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  hsn_code: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  weight: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  length: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  width: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  height: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  reorder_level: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  is_taxable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  track_inventory: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'products',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['sku'] },
    { fields: ['parent_product_id'] },
    { fields: ['category_id'] },
    { fields: ['brand_id'] },
    { fields: ['unit_id'] },
    { fields: ['is_active'] },
    { fields: ['slug'] }
  ]
});

module.exports = Product;
