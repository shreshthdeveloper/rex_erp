const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Supplier = sequelize.define('Supplier', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  supplier_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  company_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  contact_person: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  address_line1: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  address_line2: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  state_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  country_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  postal_code: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  tax_id: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  payment_terms: {
    type: DataTypes.ENUM('IMMEDIATE', 'NET_30', 'NET_60', 'NET_90', 'CUSTOM'),
    defaultValue: 'NET_30'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
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
  tableName: 'suppliers',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['supplier_code'] },
    { fields: ['email'] },
    { fields: ['is_active'] }
  ]
});

module.exports = Supplier;
