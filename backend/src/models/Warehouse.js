const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Warehouse = sequelize.define('Warehouse', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  warehouse_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  warehouse_name: {
    type: DataTypes.STRING(255),
    allowNull: false
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
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  manager_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
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
  tableName: 'warehouses',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['warehouse_code'] },
    { fields: ['is_active'] }
  ]
});

module.exports = Warehouse;
