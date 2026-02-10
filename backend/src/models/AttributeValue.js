const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AttributeValue = sequelize.define('AttributeValue', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  attribute_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  value: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  display_value: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Optional display label different from value'
  },
  color_code: {
    type: DataTypes.STRING(7),
    allowNull: true,
    comment: 'Hex color code for COLOR type attributes'
  },
  display_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'attribute_values',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['attribute_id'] },
    { fields: ['attribute_id', 'value'], unique: true }
  ]
});

module.exports = AttributeValue;
