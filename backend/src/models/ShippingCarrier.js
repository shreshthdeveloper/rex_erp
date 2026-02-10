const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ShippingCarrier = sequelize.define('ShippingCarrier', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  carrier_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  carrier_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  tracking_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'URL pattern with {tracking_number} placeholder'
  },
  api_endpoint: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  api_key: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  contact_phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  contact_email: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'shipping_carriers',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['carrier_code'], unique: true },
    { fields: ['is_active'] }
  ]
});

module.exports = ShippingCarrier;
