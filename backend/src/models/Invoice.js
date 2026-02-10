const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Invoice = sequelize.define('Invoice', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  invoice_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  sales_order_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  customer_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  invoice_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  due_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  subtotal_amount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00
  },
  tax_amount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00
  },
  discount_amount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00
  },
  total_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  paid_amount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00
  },
  balance_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  payment_status: {
    type: DataTypes.ENUM('UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERPAID', 'REFUNDED'),
    defaultValue: 'UNPAID'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
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
  tableName: 'invoices',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['invoice_number'] },
    { fields: ['sales_order_id'] },
    { fields: ['customer_id'] },
    { fields: ['payment_status'] },
    { fields: ['due_date'] }
  ]
});

module.exports = Invoice;
