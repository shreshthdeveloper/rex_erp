const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PurchaseOrderItem = sequelize.define('PurchaseOrderItem', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  purchase_order_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  product_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  quantity_ordered: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  quantity_received: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  unit_price: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  tax_percent: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00
  },
  tax_amount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00
  },
  total: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'purchase_order_items',
  timestamps: false,
  underscored: true,
  indexes: [
    { fields: ['purchase_order_id'] },
    { fields: ['product_id'] }
  ]
});

module.exports = PurchaseOrderItem;
