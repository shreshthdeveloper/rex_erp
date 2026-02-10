const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TaxRate = sequelize.define('TaxRate', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  country_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  state_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  tax_type: {
    type: DataTypes.ENUM('GST', 'CGST', 'SGST', 'IGST', 'SALES_TAX', 'VAT'),
    allowNull: false
  },
  tax_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  rate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  effective_from: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  effective_to: {
    type: DataTypes.DATEONLY,
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
  tableName: 'tax_rates',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['country_id', 'state_id', 'is_active'] },
    { fields: ['effective_from', 'effective_to'] }
  ]
});

module.exports = TaxRate;
