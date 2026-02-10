const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Country = sequelize.define('Country', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  code: {
    type: DataTypes.STRING(3),
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  currency_code: {
    type: DataTypes.STRING(3),
    allowNull: true
  },
  phone_code: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  tax_system: {
    type: DataTypes.ENUM('GST', 'SALES_TAX', 'VAT', 'OTHER'),
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'countries',
  timestamps: false,
  underscored: true,
  indexes: [
    { fields: ['code'] }
  ]
});

module.exports = Country;
