const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Inventory = sequelize.define('Inventory', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  product_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  warehouse_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  quantity_available: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  quantity_reserved: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  quantity_damaged: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  reorder_point: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  },
  last_restocked_at: {
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
  tableName: 'inventory',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { unique: true, fields: ['product_id', 'warehouse_id'] },
    { fields: ['product_id'] },
    { fields: ['warehouse_id'] }
  ]
});

module.exports = Inventory;
