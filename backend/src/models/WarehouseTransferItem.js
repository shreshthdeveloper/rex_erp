const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WarehouseTransferItem = sequelize.define('WarehouseTransferItem', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  warehouse_transfer_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  product_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  quantity_requested: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  quantity_shipped: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  quantity_received: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  quantity_damaged: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  unit_cost: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  notes: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'warehouse_transfer_items',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['warehouse_transfer_id'] },
    { fields: ['product_id'] }
  ]
});

module.exports = WarehouseTransferItem;
