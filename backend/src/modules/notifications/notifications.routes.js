const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const notificationsController = require('./notifications.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');

// Apply authentication to all routes
router.use(authenticate);

// ============ TEMPLATE ROUTES (Admin only) ============

// Get all templates
router.get(
  '/templates',
  authorize('admin'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('type').optional().isString(),
    query('isActive').optional().isIn(['true', 'false'])
  ],
  validate,
  notificationsController.getTemplates
);

// Get template by ID
router.get(
  '/templates/:id',
  authorize('admin'),
  [
    param('id').isInt().withMessage('Template ID must be an integer')
  ],
  validate,
  notificationsController.getTemplateById
);

// Create template
router.post(
  '/templates',
  authorize('admin'),
  [
    body('name').notEmpty().withMessage('Template name is required'),
    body('code').notEmpty().withMessage('Template code is required'),
    body('type').isIn(['email', 'sms', 'push', 'in_app']).withMessage('Invalid template type'),
    body('subject_template').optional().isString(),
    body('body_template').notEmpty().withMessage('Body template is required'),
    body('is_active').optional().isBoolean()
  ],
  validate,
  notificationsController.createTemplate
);

// Update template
router.put(
  '/templates/:id',
  authorize('admin'),
  [
    param('id').isInt().withMessage('Template ID must be an integer'),
    body('name').optional().notEmpty(),
    body('type').optional().isIn(['email', 'sms', 'push', 'in_app']),
    body('subject_template').optional().isString(),
    body('body_template').optional().isString(),
    body('is_active').optional().isBoolean()
  ],
  validate,
  notificationsController.updateTemplate
);

// Delete template
router.delete(
  '/templates/:id',
  authorize('admin'),
  [
    param('id').isInt().withMessage('Template ID must be an integer')
  ],
  validate,
  notificationsController.deleteTemplate
);

// ============ USER NOTIFICATION ROUTES ============

// Get user's notifications
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('type').optional().isString(),
    query('isRead').optional().isIn(['true', 'false']),
    query('priority').optional().isIn(['low', 'normal', 'high', 'urgent'])
  ],
  validate,
  notificationsController.getNotifications
);

// Get notification stats
router.get(
  '/stats',
  notificationsController.getNotificationStats
);

// Get user preferences
router.get(
  '/preferences',
  notificationsController.getUserPreferences
);

// Update user preferences
router.put(
  '/preferences',
  [
    body('email').optional().isBoolean(),
    body('push').optional().isBoolean(),
    body('sms').optional().isBoolean(),
    body('order_updates').optional().isBoolean(),
    body('inventory_alerts').optional().isBoolean(),
    body('payment_reminders').optional().isBoolean()
  ],
  validate,
  notificationsController.updateUserPreferences
);

// Get notification by ID
router.get(
  '/:id',
  [
    param('id').isInt().withMessage('Notification ID must be an integer')
  ],
  validate,
  notificationsController.getNotificationById
);

// Mark notification as read
router.patch(
  '/:id/read',
  [
    param('id').isInt().withMessage('Notification ID must be an integer')
  ],
  validate,
  notificationsController.markAsRead
);

// Mark all notifications as read
router.patch(
  '/read-all',
  notificationsController.markAllAsRead
);

// Delete notification
router.delete(
  '/:id',
  [
    param('id').isInt().withMessage('Notification ID must be an integer')
  ],
  validate,
  notificationsController.deleteNotification
);

// Delete all notifications
router.delete(
  '/',
  [
    query('onlyRead').optional().isIn(['true', 'false'])
  ],
  validate,
  notificationsController.deleteAllNotifications
);

// ============ ADMIN NOTIFICATION ROUTES ============

// Create notification (admin)
router.post(
  '/',
  authorize('admin'),
  [
    body('userId').isInt().withMessage('User ID is required'),
    body('type').notEmpty().withMessage('Type is required'),
    body('title').notEmpty().withMessage('Title is required'),
    body('message').notEmpty().withMessage('Message is required'),
    body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']),
    body('referenceType').optional().isString(),
    body('referenceId').optional().isInt(),
    body('templateId').optional().isInt(),
    body('templateData').optional().isObject()
  ],
  validate,
  notificationsController.createNotification
);

// Send bulk notification
router.post(
  '/bulk',
  authorize('admin'),
  [
    body('userIds').isArray({ min: 1 }).withMessage('User IDs array is required'),
    body('userIds.*').isInt().withMessage('Each user ID must be an integer'),
    body('type').notEmpty().withMessage('Type is required'),
    body('title').notEmpty().withMessage('Title is required'),
    body('message').notEmpty().withMessage('Message is required'),
    body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']),
    body('referenceType').optional().isString(),
    body('referenceId').optional().isInt()
  ],
  validate,
  notificationsController.sendBulkNotification
);

// Send system-wide notification
router.post(
  '/system',
  authorize('admin'),
  [
    body('type').notEmpty().withMessage('Type is required'),
    body('title').notEmpty().withMessage('Title is required'),
    body('message').notEmpty().withMessage('Message is required'),
    body('role').optional().isIn(['admin', 'manager', 'sales', 'warehouse', 'accounts', 'viewer']),
    body('priority').optional().isIn(['low', 'normal', 'high', 'urgent'])
  ],
  validate,
  notificationsController.sendSystemNotification
);

module.exports = router;
