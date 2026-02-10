const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Barcode = sequelize.define('Barcode', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  barcode: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  barcode_type: {
    type: DataTypes.ENUM('EAN13', 'CODE128', 'QR', 'UPC'),
    defaultValue: 'CODE128'
  },
  product_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  generated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'barcodes',
  timestamps: false,
  underscored: true,
  indexes: [
    { fields: ['barcode'] },
    { fields: ['product_id'] }
  ]
});

module.exports = Barcode;
