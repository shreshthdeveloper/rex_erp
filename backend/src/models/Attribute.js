const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Attribute = sequelize.define('Attribute', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  attribute_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  attribute_type: {
    type: DataTypes.ENUM('TEXT', 'NUMBER', 'SELECT', 'MULTISELECT', 'COLOR'),
    allowNull: false,
    defaultValue: 'TEXT'
  },
  is_variant_attribute: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'TRUE for Size, Color, etc. that create product variants'
  },
  is_filterable: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Show as filter option in product listing'
  },
  is_required: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  display_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'attributes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['attribute_name'], unique: true },
    { fields: ['is_variant_attribute'] }
  ]
});

module.exports = Attribute;
