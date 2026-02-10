const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  customer_code: {
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
  billing_address_line1: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  billing_address_line2: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  billing_city: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  billing_state_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  billing_country_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  billing_postal_code: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  shipping_address_line1: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  shipping_address_line2: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  shipping_city: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  shipping_state_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  shipping_country_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  shipping_postal_code: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  tax_id: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  credit_limit: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00
  },
  credit_days: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  payment_terms: {
    type: DataTypes.ENUM('IMMEDIATE', 'NET_30', 'NET_60', 'NET_90', 'CUSTOM'),
    defaultValue: 'IMMEDIATE'
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
  tableName: 'customers',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['customer_code'] },
    { fields: ['email'] },
    { fields: ['is_active'] },
    { fields: ['billing_country_id'] }
  ]
});

module.exports = Customer;
