const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ReturnRequest = sequelize.define('ReturnRequest', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  return_number: {
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
  return_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('REQUESTED', 'APPROVED', 'REJECTED', 'RECEIVED', 'INSPECTED', 'REFUNDED', 'REPLACED'),
    defaultValue: 'REQUESTED'
  },
  return_type: {
    type: DataTypes.ENUM('REFUND', 'REPLACE', 'CREDIT'),
    allowNull: false
  },
  total_amount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00
  },
  refund_amount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00
  },
  approved_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  approved_at: {
    type: DataTypes.DATE,
    allowNull: true
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
  tableName: 'return_requests',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['return_number'] },
    { fields: ['sales_order_id'] },
    { fields: ['customer_id'] },
    { fields: ['status'] }
  ]
});

module.exports = ReturnRequest;
