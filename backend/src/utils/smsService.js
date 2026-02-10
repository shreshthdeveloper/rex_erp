const twilio = require('twilio');
const { NotificationLog } = require('../models');

class SMSService {
  constructor() {
    this.client = null;
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
    }
  }

  async sendSMS({ to, message, eventType = 'CUSTOM' }) {
    try {
      if (!this.client) {
        throw new Error('Twilio client not initialized');
      }

      const result = await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to
      });

      // Log notification
      await NotificationLog.create({
        notification_type: 'SMS',
        event_type: eventType,
        recipient: to,
        message,
        status: 'SENT',
        sent_at: new Date()
      });

      return {
        success: true,
        sid: result.sid
      };
    } catch (error) {
      console.error('SMS send error:', error);

      // Log failed notification
      await NotificationLog.create({
        notification_type: 'SMS',
        event_type: eventType,
        recipient: to,
        message,
        status: 'FAILED',
        error_message: error.message
      });

      throw error;
    }
  }

  async sendOrderShipped(customer, order, trackingNumber) {
    const message = `Your order ${order.order_number} has been shipped. Tracking: ${trackingNumber}`;
    
    return this.sendSMS({
      to: customer.phone,
      message,
      eventType: 'ORDER_SHIPPED'
    });
  }

  async sendPaymentReceived(customer, payment) {
    const message = `Payment of $${payment.amount} received. Thank you!`;
    
    return this.sendSMS({
      to: customer.phone,
      message,
      eventType: 'PAYMENT_RECEIVED'
    });
  }

  async sendLowStockAlert(manager, product, warehouse) {
    const message = `Low stock alert: ${product.product_name} at ${warehouse.warehouse_name}`;
    
    return this.sendSMS({
      to: manager.phone,
      message,
      eventType: 'LOW_STOCK_ALERT'
    });
  }
}

module.exports = new SMSService();
