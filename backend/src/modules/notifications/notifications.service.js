const { Op } = require('sequelize');
const {
  Notification,
  NotificationTemplate,
  User,
  sequelize
} = require('../../models');
const { AppError } = require('../../middleware/error.middleware');

class NotificationsService {
  // Notification Templates
  async getTemplates(options = {}) {
    const { page = 1, limit = 20, type, isActive } = options;

    const where = {};
    if (type) where.type = type;
    if (isActive !== undefined) where.is_active = isActive === 'true';

    const { rows, count } = await NotificationTemplate.findAndCountAll({
      where,
      limit,
      offset: (page - 1) * limit,
      order: [['name', 'ASC']]
    });

    return {
      templates: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    };
  }

  async getTemplateById(id) {
    const template = await NotificationTemplate.findByPk(id);
    if (!template) {
      throw new AppError('Template not found', 404, 'NOT_FOUND');
    }
    return template;
  }

  async createTemplate(data) {
    return await NotificationTemplate.create(data);
  }

  async updateTemplate(id, data) {
    const template = await NotificationTemplate.findByPk(id);
    if (!template) {
      throw new AppError('Template not found', 404, 'NOT_FOUND');
    }

    await template.update(data);
    return template;
  }

  async deleteTemplate(id) {
    const template = await NotificationTemplate.findByPk(id);
    if (!template) {
      throw new AppError('Template not found', 404, 'NOT_FOUND');
    }

    await template.destroy();
    return { message: 'Template deleted successfully' };
  }

  // Notifications
  async getNotifications(userId, options = {}) {
    const { page = 1, limit = 20, type, isRead, priority } = options;

    const where = { user_id: userId };
    if (type) where.type = type;
    if (isRead !== undefined) where.is_read = isRead === 'true';
    if (priority) where.priority = priority;

    const { rows, count } = await Notification.findAndCountAll({
      where,
      limit,
      offset: (page - 1) * limit,
      order: [['created_at', 'DESC']]
    });

    const unreadCount = await Notification.count({
      where: { user_id: userId, is_read: false }
    });

    return {
      notifications: rows,
      total: count,
      unreadCount,
      page,
      totalPages: Math.ceil(count / limit)
    };
  }

  async getNotificationById(id, userId) {
    const notification = await Notification.findOne({
      where: { id, user_id: userId }
    });
    
    if (!notification) {
      throw new AppError('Notification not found', 404, 'NOT_FOUND');
    }
    
    return notification;
  }

  async createNotification(data) {
    const { userId, type, title, message, priority = 'normal', referenceType, referenceId, templateId, templateData } = data;

    let finalTitle = title;
    let finalMessage = message;

    // Apply template if provided
    if (templateId) {
      const template = await NotificationTemplate.findByPk(templateId);
      if (template && template.is_active) {
        finalTitle = this.applyTemplate(template.subject_template, templateData);
        finalMessage = this.applyTemplate(template.body_template, templateData);
      }
    }

    const notification = await Notification.create({
      user_id: userId,
      type,
      title: finalTitle,
      message: finalMessage,
      priority,
      reference_type: referenceType,
      reference_id: referenceId,
      is_read: false
    });

    return notification;
  }

  applyTemplate(template, data = {}) {
    if (!template) return '';
    let result = template;
    for (const [key, value] of Object.entries(data)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return result;
  }

  async sendBulkNotification(data) {
    const { userIds, type, title, message, priority = 'normal', referenceType, referenceId } = data;

    const notifications = userIds.map(userId => ({
      user_id: userId,
      type,
      title,
      message,
      priority,
      reference_type: referenceType,
      reference_id: referenceId,
      is_read: false
    }));

    const created = await Notification.bulkCreate(notifications);

    return {
      sent: created.length,
      message: `Notification sent to ${created.length} users`
    };
  }

  async markAsRead(id, userId) {
    const notification = await Notification.findOne({
      where: { id, user_id: userId }
    });
    
    if (!notification) {
      throw new AppError('Notification not found', 404, 'NOT_FOUND');
    }

    await notification.update({
      is_read: true,
      read_at: new Date()
    });

    return notification;
  }

  async markAllAsRead(userId) {
    const [updated] = await Notification.update(
      { is_read: true, read_at: new Date() },
      { where: { user_id: userId, is_read: false } }
    );

    return { markedRead: updated };
  }

  async deleteNotification(id, userId) {
    const notification = await Notification.findOne({
      where: { id, user_id: userId }
    });
    
    if (!notification) {
      throw new AppError('Notification not found', 404, 'NOT_FOUND');
    }

    await notification.destroy();
    return { message: 'Notification deleted successfully' };
  }

  async deleteAllNotifications(userId, options = {}) {
    const { onlyRead = false } = options;

    const where = { user_id: userId };
    if (onlyRead) where.is_read = true;

    const deleted = await Notification.destroy({ where });
    return { deleted };
  }

  // Notification statistics
  async getNotificationStats(userId) {
    const total = await Notification.count({ where: { user_id: userId } });
    const unread = await Notification.count({ where: { user_id: userId, is_read: false } });
    const read = await Notification.count({ where: { user_id: userId, is_read: true } });

    const byType = await Notification.findAll({
      where: { user_id: userId },
      attributes: [
        'type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['type'],
      raw: true
    });

    const byPriority = await Notification.findAll({
      where: { user_id: userId, is_read: false },
      attributes: [
        'priority',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['priority'],
      raw: true
    });

    return {
      total,
      unread,
      read,
      byType,
      byPriority
    };
  }

  // System notifications (for admins)
  async sendSystemNotification(data, createdBy) {
    const { role, type, title, message, priority = 'high' } = data;

    const where = {};
    if (role) where.role = role;

    const users = await User.findAll({
      where,
      attributes: ['id']
    });

    if (users.length === 0) {
      throw new AppError('No users found matching criteria', 400, 'NO_RECIPIENTS');
    }

    const userIds = users.map(u => u.id);
    return await this.sendBulkNotification({
      userIds,
      type,
      title,
      message,
      priority
    });
  }

  // Notification preferences (if supported)
  async getUserPreferences(userId) {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'notification_preferences']
    });

    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    return user.notification_preferences || {
      email: true,
      push: true,
      sms: false,
      order_updates: true,
      inventory_alerts: true,
      payment_reminders: true
    };
  }

  async updateUserPreferences(userId, preferences) {
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    await user.update({
      notification_preferences: preferences
    });

    return preferences;
  }
}

module.exports = new NotificationsService();
