const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NotificationLog = sequelize.define('NotificationLog', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  notification_type: {
    type: DataTypes.ENUM('EMAIL', 'SMS', 'PUSH', 'IN_APP'),
    allowNull: false
  },
  event_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  recipient: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  subject: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'SENT', 'FAILED'),
    defaultValue: 'PENDING'
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  sent_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'notification_logs',
  timestamps: false,
  underscored: true,
  indexes: [
    { fields: ['notification_type'] },
    { fields: ['event_type'] },
    { fields: ['status'] },
    { fields: ['created_at'] }
  ]
});

module.exports = NotificationLog;
