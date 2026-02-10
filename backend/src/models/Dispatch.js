const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Dispatch = sequelize.define('Dispatch', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  dispatch_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  sales_order_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  warehouse_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  carrier_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  tracking_number: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  dispatch_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  expected_delivery_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  actual_delivery_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'PICKING', 'PACKED', 'READY_TO_SHIP', 'SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED'),
    defaultValue: 'PENDING'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  packed_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  packed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  shipped_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  shipped_at: {
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
  tableName: 'dispatch',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['dispatch_number'] },
    { fields: ['sales_order_id'] },
    { fields: ['tracking_number'] },
    { fields: ['status'] }
  ]
});

module.exports = Dispatch;
