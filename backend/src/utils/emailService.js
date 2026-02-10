const nodemailer = require('nodemailer');
const { NotificationLog } = require('../models');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    if (process.env.EMAIL_SERVICE === 'sendgrid') {
      // SendGrid configuration
      this.transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        auth: {
          user: 'apikey',
          pass: process.env.EMAIL_API_KEY
        }
      });
    } else {
      // SMTP configuration
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      });
    }
  }

  async sendEmail({ to, subject, text, html, eventType = 'CUSTOM' }) {
    try {
      const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
        to,
        subject,
        text,
        html
      };

      const info = await this.transporter.sendMail(mailOptions);

      // Log notification
      await NotificationLog.create({
        notification_type: 'EMAIL',
        event_type: eventType,
        recipient: to,
        subject,
        message: text || html,
        status: 'SENT',
        sent_at: new Date()
      });

      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      console.error('Email send error:', error);

      // Log failed notification
      await NotificationLog.create({
        notification_type: 'EMAIL',
        event_type: eventType,
        recipient: to,
        subject,
        message: text || html,
        status: 'FAILED',
        error_message: error.message
      });

      throw error;
    }
  }

  async sendOrderConfirmation(order, customer) {
    const subject = `Order Confirmation - ${order.order_number}`;
    const html = `
      <h2>Order Confirmation</h2>
      <p>Dear ${customer.company_name},</p>
      <p>Thank you for your order. Your order has been confirmed.</p>
      <p><strong>Order Number:</strong> ${order.order_number}</p>
      <p><strong>Order Date:</strong> ${new Date(order.order_date).toLocaleDateString()}</p>
      <p><strong>Total Amount:</strong> $${order.total_amount}</p>
      <p>We will notify you when your order is shipped.</p>
    `;

    return this.sendEmail({
      to: customer.email,
      subject,
      html,
      eventType: 'ORDER_CONFIRMED'
    });
  }

  async sendInvoice(invoice, customer) {
    const subject = `Invoice ${invoice.invoice_number}`;
    const html = `
      <h2>Invoice</h2>
      <p>Dear ${customer.company_name},</p>
      <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
      <p><strong>Invoice Date:</strong> ${new Date(invoice.invoice_date).toLocaleDateString()}</p>
      <p><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>
      <p><strong>Total Amount:</strong> $${invoice.total_amount}</p>
      <p><strong>Balance Due:</strong> $${invoice.balance_amount}</p>
    `;

    return this.sendEmail({
      to: customer.email,
      subject,
      html,
      eventType: 'INVOICE_GENERATED'
    });
  }

  async sendPasswordReset(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const subject = 'Password Reset Request';
    const html = `
      <h2>Password Reset</h2>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;

    return this.sendEmail({
      to: user.email,
      subject,
      html,
      eventType: 'PASSWORD_RESET'
    });
  }
}

module.exports = new EmailService();
