const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SalesOrder = sequelize.define('SalesOrder', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  order_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  customer_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  warehouse_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  order_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.ENUM('DRAFT', 'PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'ON_HOLD'),
    defaultValue: 'PENDING'
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
  shipping_amount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00
  },
  total_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  payment_status: {
    type: DataTypes.ENUM('UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERPAID', 'REFUNDED'),
    defaultValue: 'UNPAID'
  },
  payment_terms: {
    type: DataTypes.ENUM('IMMEDIATE', 'NET_30', 'NET_60', 'NET_90', 'CUSTOM'),
    defaultValue: 'IMMEDIATE'
  },
  due_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  shipping_address_line1: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  shipping_address_line2: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  shipping_city: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  shipping_state_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  shipping_country_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  shipping_postal_code: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_by: {
    type: DataTypes.INTEGER.UNSIGNED,
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
  tableName: 'sales_orders',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['order_number'] },
    { fields: ['customer_id'] },
    { fields: ['warehouse_id'] },
    { fields: ['status'] },
    { fields: ['payment_status'] },
    { fields: ['order_date'] }
  ]
});

module.exports = SalesOrder;
