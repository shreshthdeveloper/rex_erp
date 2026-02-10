const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NotificationTemplate = sequelize.define('NotificationTemplate', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  template_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  template_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  channel: {
    type: DataTypes.ENUM('EMAIL', 'SMS', 'BOTH'),
    allowNull: false,
    defaultValue: 'EMAIL'
  },
  event_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'e.g., ORDER_CREATED, ORDER_SHIPPED, PAYMENT_RECEIVED'
  },
  email_subject: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  email_body: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'HTML template with placeholders like {{customer_name}}'
  },
  sms_body: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  variables: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'List of available variables for this template'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'notification_templates',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['template_code'], unique: true },
    { fields: ['event_type'] },
    { fields: ['is_active'] }
  ]
});

module.exports = NotificationTemplate;
