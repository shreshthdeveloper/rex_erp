const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DispatchItem = sequelize.define('DispatchItem', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  dispatch_id: {
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
  quantity_ordered: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  quantity_picked: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  quantity_packed: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  quantity_shipped: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  barcode_scanned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  picked_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  packed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notes: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'dispatch_items',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['dispatch_id'] },
    { fields: ['product_id'] },
    { fields: ['sales_order_item_id'] }
  ]
});

module.exports = DispatchItem;
