const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PaymentMethod = sequelize.define('PaymentMethod', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  method_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  method_type: {
    type: DataTypes.ENUM('CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'WALLET', 'OTHER'),
    allowNull: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'payment_methods',
  timestamps: false,
  underscored: true,
  indexes: [
    { fields: ['is_active'] }
  ]
});

module.exports = PaymentMethod;
