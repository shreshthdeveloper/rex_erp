const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ReturnItem = sequelize.define('ReturnItem', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  return_request_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  sales_order_item_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  product_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  quantity_requested: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  quantity_received: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  quantity_good: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Items that can be restocked'
  },
  quantity_damaged: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  unit_price: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  refund_amount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00
  },
  reason: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  inspection_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  restocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  restocked_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'return_items',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['return_request_id'] },
    { fields: ['product_id'] },
    { fields: ['sales_order_item_id'] }
  ]
});

module.exports = ReturnItem;
