const { Op } = require('sequelize');
const {
  Invoice,
  InvoiceItem,
  Customer,
  SalesOrder,
  Product,
  sequelize
} = require('../../models');
const { AppError } = require('../../middleware/error.middleware');

class InvoicesService {
  async findAll(options = {}) {
    const { page = 1, limit = 20, search, status, customerId, startDate, endDate, overdue } = options;

    const where = {};
    if (search) {
      where[Op.or] = [
        { invoice_number: { [Op.like]: `%${search}%` } }
      ];
    }
    if (status) {
      const statusMap = {
        unpaid: 'UNPAID',
        partial: 'PARTIALLY_PAID',
        partially_paid: 'PARTIALLY_PAID',
        paid: 'PAID',
        overpaid: 'OVERPAID',
        refunded: 'REFUNDED'
      };
      where.payment_status = statusMap[status] || status.toUpperCase();
    }
    if (customerId) where.customer_id = customerId;
    if (startDate || endDate) {
      where.invoice_date = {};
      if (startDate) where.invoice_date[Op.gte] = new Date(startDate);
      if (endDate) where.invoice_date[Op.lte] = new Date(endDate);
    }
    if (overdue === 'true') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      where.due_date = { [Op.lt]: today };
      where.payment_status = { [Op.ne]: 'PAID' };
    }

    const { rows, count } = await Invoice.findAndCountAll({
      where,
      include: [
        { model: Customer, attributes: ['id', 'customer_code', 'company_name'] },
        { model: SalesOrder, attributes: ['id', 'order_number'] }
      ],
      limit,
      offset: (page - 1) * limit,
      order: [['created_at', 'DESC']]
    });

    return {
      invoices: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    };
  }

  async findById(id) {
    const invoice = await Invoice.findByPk(id, {
      include: [
        { model: Customer },
        { model: SalesOrder },
        {
          model: InvoiceItem,
          as: 'items',
          include: [{ model: Product, attributes: ['id', 'product_name', 'sku'] }]
        },
      ]
    });

    return invoice;
  }

  async create(data, createdBy) {
    const transaction = await sequelize.transaction();

    try {
      const customerId = data.customer_id || data.customerId;
      const salesOrderId = data.sales_order_id || data.salesOrderId || null;
      const items = data.items || [];
      const invoiceData = data;

      // Generate invoice number
      const count = await Invoice.count({ transaction });
      const invoice_number = `INV${new Date().getFullYear()}${String(count + 1).padStart(6, '0')}`;

      // Calculate totals
      let subtotal_amount = 0;
      let tax_amount = 0;

      for (const item of items) {
        const item_subtotal = item.quantity * item.unit_price;
        const item_discount = item.discount_amount || 0;
        const item_tax = (item_subtotal - item_discount) * (item.tax_percent || 0) / 100;
        subtotal_amount += item_subtotal;
        tax_amount += item_tax;
      }

      const discount_amount = invoiceData.discount_amount || invoiceData.discountAmount || 0;
      const total_amount = subtotal_amount - discount_amount + tax_amount;

      const invoice = await Invoice.create({
        invoice_number,
        sales_order_id: salesOrderId,
        customer_id: customerId,
        invoice_date: invoiceData.invoice_date || invoiceData.invoiceDate || new Date(),
        due_date: invoiceData.due_date || invoiceData.dueDate,
        subtotal_amount,
        discount_amount,
        tax_amount,
        total_amount,
        paid_amount: 0,
        balance_amount: total_amount,
        payment_status: 'UNPAID',
        notes: invoiceData.notes,
        created_by: createdBy
      }, { transaction });

      // Create invoice items
      for (const item of items) {
        const productId = item.product_id || item.productId;
        const unitPrice = item.unit_price || item.unitPrice;
        const itemDiscount = item.discount_amount || item.discountAmount || 0;
        const taxPercent = item.tax_percent || item.taxPercent || 0;

        const item_subtotal = item.quantity * unitPrice;
        const item_discount = itemDiscount;
        const item_tax = (item_subtotal - item_discount) * taxPercent / 100;
        const item_total = item_subtotal - item_discount + item_tax;

        await InvoiceItem.create({
          invoice_id: invoice.id,
          product_id: productId,
          sales_order_item_id: item.sales_order_item_id || item.salesOrderItemId || null,
          description: item.description,
          quantity: item.quantity,
          unit_price: unitPrice,
          discount_percent: item.discount_percent || item.discountPercent || 0,
          discount_amount: item_discount,
          tax_percent: taxPercent,
          tax_amount: item_tax,
          subtotal: item_subtotal,
          total: item_total,
          hsn_code: item.hsn_code
        }, { transaction });
      }

      await transaction.commit();

      return this.findById(invoice.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async update(id, data) {
    const invoice = await Invoice.findByPk(id);

    if (!invoice) {
      throw new AppError('Invoice not found', 404, 'NOT_FOUND');
    }

    if (invoice.payment_status === 'PAID') {
      throw new AppError('Cannot update a paid invoice', 400, 'INVALID_STATUS');
    }

    const updates = {};
    if (data.due_date || data.dueDate) updates.due_date = data.due_date || data.dueDate;
    if (data.notes) updates.notes = data.notes;
    await invoice.update(updates);
    return this.findById(id);
  }

  async markAsSent(id, sentBy) {
    const invoice = await Invoice.findByPk(id);

    if (!invoice) {
      throw new AppError('Invoice not found', 404, 'NOT_FOUND');
    }

    await invoice.update({
      payment_status: invoice.payment_status === 'UNPAID' ? 'UNPAID' : invoice.payment_status,
      notes: invoice.notes
    });

    return this.findById(id);
  }

  async voidInvoice(id, reason, voidedBy) {
    const transaction = await sequelize.transaction();

    try {
      const invoice = await Invoice.findByPk(id, { transaction });

      if (!invoice) {
        throw new AppError('Invoice not found', 404, 'NOT_FOUND');
      }

      if (invoice.paid_amount > 0) {
        throw new AppError('Cannot void an invoice with payments', 400, 'HAS_PAYMENTS');
      }

      await invoice.update({
        payment_status: 'REFUNDED',
        notes: reason || invoice.notes
      }, { transaction });

      await transaction.commit();

      return this.findById(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getAgingReport(asOfDate) {
    const date = asOfDate ? new Date(asOfDate) : new Date();
    date.setHours(23, 59, 59, 999);

    const invoices = await Invoice.findAll({
      where: {
        payment_status: { [Op.notIn]: ['PAID', 'REFUNDED'] },
        invoice_date: { [Op.lte]: date }
      },
      include: [
        { model: Customer, attributes: ['id', 'customer_code', 'company_name'] }
      ]
    });

    const aging = {
      current: { count: 0, amount: 0, invoices: [] },
      '1-30': { count: 0, amount: 0, invoices: [] },
      '31-60': { count: 0, amount: 0, invoices: [] },
      '61-90': { count: 0, amount: 0, invoices: [] },
      '90+': { count: 0, amount: 0, invoices: [] }
    };

    for (const invoice of invoices) {
      const dueDate = new Date(invoice.due_date);
      const daysOverdue = Math.floor((date - dueDate) / (1000 * 60 * 60 * 24));
      const balance = parseFloat(invoice.balance_amount);

      let bucket;
      if (daysOverdue <= 0) bucket = 'current';
      else if (daysOverdue <= 30) bucket = '1-30';
      else if (daysOverdue <= 60) bucket = '31-60';
      else if (daysOverdue <= 90) bucket = '61-90';
      else bucket = '90+';

      aging[bucket].count++;
      aging[bucket].amount += balance;
      aging[bucket].invoices.push({
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        customer: invoice.Customer,
        dueDate: invoice.due_date,
        balance,
        daysOverdue: daysOverdue > 0 ? daysOverdue : 0
      });
    }

    return {
      asOfDate: date,
      aging,
      totalOutstanding: Object.values(aging).reduce((sum, b) => sum + b.amount, 0)
    };
  }

  async generatePDF(id) {
    const invoice = await this.findById(id);

    if (!invoice) {
      throw new AppError('Invoice not found', 404, 'NOT_FOUND');
    }

    // In production, use a PDF library like pdfkit or puppeteer
    // This returns invoice data for now
    return {
      invoice,
      pdfGenerated: true,
      generatedAt: new Date()
    };
  }

  async sendInvoice(id, emailOptions) {
    const invoice = await this.findById(id);

    if (!invoice) {
      throw new AppError('Invoice not found', 404, 'NOT_FOUND');
    }

    // In production, integrate with email service
    // This is a placeholder implementation
    return {
      success: true,
      invoiceId: id,
      sentTo: emailOptions.to || invoice.Customer?.email,
      sentAt: new Date()
    };
  }
}

module.exports = new InvoicesService();
