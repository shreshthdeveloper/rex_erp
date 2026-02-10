const notificationsService = require('./notifications.service');

// Template Controllers
const getTemplates = async (req, res, next) => {
  try {
    const result = await notificationsService.getTemplates(req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getTemplateById = async (req, res, next) => {
  try {
    const template = await notificationsService.getTemplateById(req.params.id);
    res.json({ success: true, data: { template } });
  } catch (error) {
    next(error);
  }
};

const createTemplate = async (req, res, next) => {
  try {
    const template = await notificationsService.createTemplate(req.body);
    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: { template }
    });
  } catch (error) {
    next(error);
  }
};

const updateTemplate = async (req, res, next) => {
  try {
    const template = await notificationsService.updateTemplate(req.params.id, req.body);
    res.json({
      success: true,
      message: 'Template updated successfully',
      data: { template }
    });
  } catch (error) {
    next(error);
  }
};

const deleteTemplate = async (req, res, next) => {
  try {
    const result = await notificationsService.deleteTemplate(req.params.id);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// Notification Controllers
const getNotifications = async (req, res, next) => {
  try {
    const result = await notificationsService.getNotifications(req.user.id, req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getNotificationById = async (req, res, next) => {
  try {
    const notification = await notificationsService.getNotificationById(req.params.id, req.user.id);
    res.json({ success: true, data: { notification } });
  } catch (error) {
    next(error);
  }
};

const createNotification = async (req, res, next) => {
  try {
    const notification = await notificationsService.createNotification(req.body);
    res.status(201).json({
      success: true,
      message: 'Notification created',
      data: { notification }
    });
  } catch (error) {
    next(error);
  }
};

const sendBulkNotification = async (req, res, next) => {
  try {
    const result = await notificationsService.sendBulkNotification(req.body);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const notification = await notificationsService.markAsRead(req.params.id, req.user.id);
    res.json({
      success: true,
      message: 'Notification marked as read',
      data: { notification }
    });
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    const result = await notificationsService.markAllAsRead(req.user.id);
    res.json({
      success: true,
      message: `${result.markedRead} notifications marked as read`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const deleteNotification = async (req, res, next) => {
  try {
    const result = await notificationsService.deleteNotification(req.params.id, req.user.id);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const deleteAllNotifications = async (req, res, next) => {
  try {
    const result = await notificationsService.deleteAllNotifications(req.user.id, req.query);
    res.json({
      success: true,
      message: `${result.deleted} notifications deleted`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const getNotificationStats = async (req, res, next) => {
  try {
    const stats = await notificationsService.getNotificationStats(req.user.id);
    res.json({ success: true, data: { stats } });
  } catch (error) {
    next(error);
  }
};

const sendSystemNotification = async (req, res, next) => {
  try {
    const result = await notificationsService.sendSystemNotification(req.body, req.user.id);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const getUserPreferences = async (req, res, next) => {
  try {
    const preferences = await notificationsService.getUserPreferences(req.user.id);
    res.json({ success: true, data: { preferences } });
  } catch (error) {
    next(error);
  }
};

const updateUserPreferences = async (req, res, next) => {
  try {
    const preferences = await notificationsService.updateUserPreferences(req.user.id, req.body);
    res.json({
      success: true,
      message: 'Preferences updated',
      data: { preferences }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getNotifications,
  getNotificationById,
  createNotification,
  sendBulkNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  getNotificationStats,
  sendSystemNotification,
  getUserPreferences,
  updateUserPreferences
};
