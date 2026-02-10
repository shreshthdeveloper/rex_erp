const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SupplierPayment = sequelize.define('SupplierPayment', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  payment_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  supplier_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  purchase_order_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  payment_method_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  payment_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  reference_number: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED'),
    defaultValue: 'PENDING'
  },
  status_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  approved_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  approved_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  processed_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  processed_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'supplier_payments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['payment_number'], unique: true },
    { fields: ['supplier_id'] },
    { fields: ['status'] },
    { fields: ['payment_date'] }
  ]
});

module.exports = SupplierPayment;
