const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GRNItem = sequelize.define('GRNItem', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  grn_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  purchase_order_item_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  product_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  quantity_expected: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  quantity_received: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  quantity_accepted: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  quantity_rejected: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  rejection_reason: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  unit_cost: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  total_cost: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  batch_number: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  expiry_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  notes: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'grn_items',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['grn_id'] },
    { fields: ['product_id'] },
    { fields: ['purchase_order_item_id'] }
  ]
});

module.exports = GRNItem;
