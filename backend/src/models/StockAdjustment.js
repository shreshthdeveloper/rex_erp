const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StockAdjustment = sequelize.define('StockAdjustment', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  adjustment_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  warehouse_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  adjustment_type: {
    type: DataTypes.ENUM('INCREASE', 'DECREASE', 'DAMAGE', 'EXPIRED', 'STOCK_COUNT', 'OTHER'),
    allowNull: false
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'COMPLETED'),
    defaultValue: 'DRAFT'
  },
  total_items: {
    type: DataTypes.INTEGER,
    defaultValue: 0
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
  created_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  }
}, {
  tableName: 'stock_adjustments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['adjustment_number'], unique: true },
    { fields: ['warehouse_id'] },
    { fields: ['status'] },
    { fields: ['created_at'] }
  ]
});

module.exports = StockAdjustment;
