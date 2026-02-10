const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Unit = sequelize.define('Unit', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  unit_name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  short_name: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true
  },
  base_unit_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  conversion_factor: {
    type: DataTypes.DECIMAL(15, 6),
    allowNull: true,
    defaultValue: 1
  },
  description: {
    type: DataTypes.TEXT,
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
  tableName: 'units',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['short_name'] },
    { fields: ['is_active'] }
  ]
});

module.exports = Unit;
