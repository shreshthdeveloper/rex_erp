const { Customer, Invoice, SalesOrder } = require('../models');
const { Op } = require('sequelize');

class CreditManager {
  /**
   * Check if customer has sufficient credit for new order
   */
  static async checkCreditLimit(customerId, newOrderAmount) {
    try {
      const customer = await Customer.findByPk(customerId);

      if (!customer) {
        throw new Error('Customer not found');
      }

      // If immediate payment terms, no credit check needed
      if (customer.payment_terms === 'IMMEDIATE') {
        return {
          approved: true,
          creditLimit: customer.credit_limit,
          currentUsage: 0,
          availableCredit: customer.credit_limit,
          message: 'Immediate payment terms - no credit check required'
        };
      }

      // Get all unpaid invoices
      const unpaidInvoices = await Invoice.findAll({
        where: {
          customer_id: customerId,
          payment_status: {
            [Op.in]: ['UNPAID', 'PARTIALLY_PAID']
          }
        }
      });

      // Calculate total outstanding
      const totalOutstanding = unpaidInvoices.reduce(
        (sum, inv) => sum + parseFloat(inv.balance_amount),
        0
      );

      // Include pending/processing orders not yet invoiced
      const pendingOrders = await SalesOrder.findAll({
        where: {
          customer_id: customerId,
          status: {
            [Op.in]: ['PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'ON_HOLD']
          },
          payment_status: {
            [Op.in]: ['UNPAID', 'PARTIALLY_PAID']
          }
        }
      });

      const pendingExposure = pendingOrders.reduce(
        (sum, order) => sum + parseFloat(order.total_amount || 0),
        0
      );

      const totalExposure = totalOutstanding + pendingExposure + newOrderAmount;
      const availableCredit = customer.credit_limit - (totalOutstanding + pendingExposure);

      if (totalExposure > customer.credit_limit) {
        return {
          approved: false,
          creditLimit: customer.credit_limit,
          currentUsage: totalOutstanding,
          availableCredit,
          newOrderAmount,
          pendingExposure,
          totalExposure,
          exceeded: totalExposure - customer.credit_limit,
          message: `Credit limit exceeded. Available credit: ${availableCredit}, Required: ${newOrderAmount}`
        };
      }

      return {
        approved: true,
        creditLimit: customer.credit_limit,
        currentUsage: totalOutstanding,
        availableCredit,
        newOrderAmount,
        pendingExposure,
        totalExposure,
        message: 'Credit check passed'
      };
    } catch (error) {
      console.error('Credit check error:', error);
      throw error;
    }
  }

  /**
   * Get customer credit status
   */
  static async getCreditStatus(customerId) {
    const customer = await Customer.findByPk(customerId);

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Get unpaid invoices
    const unpaidInvoices = await Invoice.findAll({
      where: {
        customer_id: customerId,
        payment_status: {
          [Op.in]: ['UNPAID', 'PARTIALLY_PAID']
        }
      },
      include: [{ model: SalesOrder }],
      order: [['due_date', 'ASC']]
    });

    // Calculate totals
    const totalOutstanding = unpaidInvoices.reduce(
      (sum, inv) => sum + parseFloat(inv.balance_amount),
      0
    );

    const overdueInvoices = unpaidInvoices.filter(
      inv => new Date(inv.due_date) < new Date()
    );

    const overdueAmount = overdueInvoices.reduce(
      (sum, inv) => sum + parseFloat(inv.balance_amount),
      0
    );

    const availableCredit = customer.credit_limit - totalOutstanding;
    const creditUtilization = (totalOutstanding / customer.credit_limit) * 100;

    return {
      customerId: customer.id,
      customerCode: customer.customer_code,
      companyName: customer.company_name,
      creditLimit: customer.credit_limit,
      currentUsage: totalOutstanding,
      availableCredit,
      creditUtilization: parseFloat(creditUtilization.toFixed(2)),
      totalUnpaidInvoices: unpaidInvoices.length,
      overdueInvoices: overdueInvoices.length,
      overdueAmount,
      paymentTerms: customer.payment_terms,
      creditDays: customer.credit_days,
      invoices: unpaidInvoices.map(inv => ({
        invoiceNumber: inv.invoice_number,
        invoiceDate: inv.invoice_date,
        dueDate: inv.due_date,
        totalAmount: inv.total_amount,
        balanceAmount: inv.balance_amount,
        isOverdue: new Date(inv.due_date) < new Date(),
        daysOverdue: Math.max(0, Math.floor((new Date() - new Date(inv.due_date)) / (1000 * 60 * 60 * 24)))
      }))
    };
  }

  /**
   * Get aging report for customer
   */
  static async getAgingReport(customerId) {
    const invoices = await Invoice.findAll({
      where: {
        customer_id: customerId,
        payment_status: {
          [Op.in]: ['UNPAID', 'PARTIALLY_PAID']
        }
      }
    });

    const aging = {
      current: 0,      // 0-30 days
      days_30: 0,      // 31-60 days
      days_60: 0,      // 61-90 days
      days_90_plus: 0  // 90+ days
    };

    const now = new Date();

    invoices.forEach(invoice => {
      const dueDate = new Date(invoice.due_date);
      const daysOverdue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
      const balance = parseFloat(invoice.balance_amount);

      if (daysOverdue <= 0) {
        aging.current += balance;
      } else if (daysOverdue <= 30) {
        aging.current += balance;
      } else if (daysOverdue <= 60) {
        aging.days_30 += balance;
      } else if (daysOverdue <= 90) {
        aging.days_60 += balance;
      } else {
        aging.days_90_plus += balance;
      }
    });

    return {
      customerId,
      aging: {
        current: parseFloat(aging.current.toFixed(2)),
        days_30: parseFloat(aging.days_30.toFixed(2)),
        days_60: parseFloat(aging.days_60.toFixed(2)),
        days_90_plus: parseFloat(aging.days_90_plus.toFixed(2)),
        total: parseFloat((aging.current + aging.days_30 + aging.days_60 + aging.days_90_plus).toFixed(2))
      }
    };
  }

  /**
   * Update credit limit for customer
   */
  static async updateCreditLimit(customerId, newLimit, userId) {
    const customer = await Customer.findByPk(customerId);

    if (!customer) {
      throw new Error('Customer not found');
    }

    const oldLimit = customer.credit_limit;
    await customer.update({ credit_limit: newLimit });

    // Log the change (would be in audit logs)
    console.log(`Credit limit updated for ${customer.customer_code}: ${oldLimit} -> ${newLimit} by user ${userId}`);

    return customer;
  }
}

module.exports = CreditManager;
