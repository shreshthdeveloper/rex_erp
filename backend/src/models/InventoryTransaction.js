const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InventoryTransaction = sequelize.define('InventoryTransaction', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  product_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  warehouse_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  transaction_type: {
    type: DataTypes.ENUM('INWARD', 'OUTWARD', 'ADJUSTMENT', 'TRANSFER_IN', 'TRANSFER_OUT', 'RETURN', 'DAMAGE'),
    allowNull: false
  },
  reference_type: {
    type: DataTypes.ENUM('PURCHASE_ORDER', 'SALES_ORDER', 'ADJUSTMENT', 'TRANSFER', 'RETURN', 'GRN'),
    allowNull: true
  },
  reference_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  quantity_before: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
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
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  }
}, {
  tableName: 'inventory_transactions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['product_id'] },
    { fields: ['warehouse_id'] },
    { fields: ['transaction_type'] },
    { fields: ['reference_type', 'reference_id'] },
    { fields: ['created_at'] }
  ]
});

module.exports = InventoryTransaction;
