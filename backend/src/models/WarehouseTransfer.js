const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WarehouseTransfer = sequelize.define('WarehouseTransfer', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  transfer_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  from_warehouse_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  to_warehouse_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'IN_TRANSIT', 'RECEIVED', 'COMPLETED', 'CANCELLED'),
    defaultValue: 'DRAFT'
  },
  total_items: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  total_quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  shipped_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  received_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  expected_delivery: {
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
  },
  approved_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  approved_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  shipped_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  received_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  }
}, {
  tableName: 'warehouse_transfers',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['transfer_number'], unique: true },
    { fields: ['from_warehouse_id'] },
    { fields: ['to_warehouse_id'] },
    { fields: ['status'] },
    { fields: ['created_at'] }
  ]
});

module.exports = WarehouseTransfer;
