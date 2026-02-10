const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PurchaseOrder = sequelize.define('PurchaseOrder', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  po_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  supplier_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  warehouse_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  po_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  expected_delivery_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'),
    defaultValue: 'DRAFT'
  },
  subtotal_amount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00
  },
  tax_amount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00
  },
  total_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  payment_status: {
    type: DataTypes.ENUM('UNPAID', 'PARTIALLY_PAID', 'PAID'),
    defaultValue: 'UNPAID'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  approved_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  approved_at: {
    type: DataTypes.DATE,
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
  tableName: 'purchase_orders',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['po_number'] },
    { fields: ['supplier_id'] },
    { fields: ['warehouse_id'] },
    { fields: ['status'] }
  ]
});

module.exports = PurchaseOrder;
