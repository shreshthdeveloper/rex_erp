const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BarcodeScan = sequelize.define('BarcodeScan', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  barcode: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  barcode_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  product_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  warehouse_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  scan_type: {
    type: DataTypes.ENUM('INWARD', 'OUTWARD', 'PICKING', 'PACKING', 'TRANSFER', 'INVENTORY_COUNT', 'VERIFICATION'),
    allowNull: false
  },
  reference_type: {
    type: DataTypes.ENUM('SALES_ORDER', 'PURCHASE_ORDER', 'TRANSFER', 'ADJUSTMENT', 'GRN', 'DISPATCH'),
    allowNull: true
  },
  reference_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  location: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Warehouse location like A1-B2'
  },
  scanned_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  device_info: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'barcode_scans',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['barcode'] },
    { fields: ['product_id'] },
    { fields: ['warehouse_id'] },
    { fields: ['scan_type'] },
    { fields: ['reference_type', 'reference_id'] },
    { fields: ['created_at'] }
  ]
});

module.exports = BarcodeScan;
