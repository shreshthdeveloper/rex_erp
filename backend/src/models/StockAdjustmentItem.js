const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StockAdjustmentItem = sequelize.define('StockAdjustmentItem', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  stock_adjustment_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  product_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  quantity_before: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  quantity_adjusted: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  quantity_after: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  unit_cost: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  reason: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'stock_adjustment_items',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['stock_adjustment_id'] },
    { fields: ['product_id'] }
  ]
});

module.exports = StockAdjustmentItem;
