const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InvoiceItem = sequelize.define('InvoiceItem', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  invoice_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  product_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  sales_order_item_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  unit_price: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  discount_percent: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00
  },
  discount_amount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00
  },
  tax_percent: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00
  },
  tax_amount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00
  },
  cgst_amount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00
  },
  sgst_amount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00
  },
  igst_amount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00
  },
  subtotal: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  total: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  hsn_code: {
    type: DataTypes.STRING(20),
    allowNull: true
  }
}, {
  tableName: 'invoice_items',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['invoice_id'] },
    { fields: ['product_id'] }
  ]
});

module.exports = InvoiceItem;
