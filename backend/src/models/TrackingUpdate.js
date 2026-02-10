const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TrackingUpdate = sequelize.define('TrackingUpdate', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  dispatch_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  tracking_number: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  status: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  status_code: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  event_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  raw_response: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Raw response from carrier API'
  }
}, {
  tableName: 'tracking_updates',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['dispatch_id'] },
    { fields: ['tracking_number'] },
    { fields: ['event_time'] }
  ]
});

module.exports = TrackingUpdate;
