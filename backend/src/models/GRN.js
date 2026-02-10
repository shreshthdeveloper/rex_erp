const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GRN = sequelize.define('GRN', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  grn_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  purchase_order_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  supplier_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  warehouse_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('DRAFT', 'PENDING_VERIFICATION', 'VERIFIED', 'COMPLETED', 'REJECTED'),
    defaultValue: 'DRAFT'
  },
  received_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  invoice_number: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  invoice_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  total_items: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  total_quantity_expected: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  total_quantity_received: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  total_quantity_accepted: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  total_quantity_rejected: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  total_amount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00
  },
  has_discrepancy: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  discrepancy_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  received_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  verified_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  verified_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'grn',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['grn_number'], unique: true },
    { fields: ['purchase_order_id'] },
    { fields: ['supplier_id'] },
    { fields: ['warehouse_id'] },
    { fields: ['status'] },
    { fields: ['received_date'] }
  ]
});

module.exports = GRN;
