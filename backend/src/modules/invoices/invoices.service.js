const { Op } = require('sequelize');
const {
  Invoice,
  InvoiceItem,
  Customer,
  SalesOrder,
  Product,
  Payment,
  sequelize
} = require('../../models');
const { AppError } = require('../../middleware/error.middleware');

class InvoicesService {
  async findAll(options = {}) {
    const { page = 1, limit = 20, search, status, customerId, startDate, endDate, overdue } = options;

    const where = {};
    if (search) {
      where[Op.or] = [
        { invoiceNumber: { [Op.like]: `%${search}%` } }
      ];
    }
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (startDate || endDate) {
      where.invoiceDate = {};
      if (startDate) where.invoiceDate[Op.gte] = new Date(startDate);
      if (endDate) where.invoiceDate[Op.lte] = new Date(endDate);
    }
    if (overdue === 'true') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      where.dueDate = { [Op.lt]: today };
      where.status = { [Op.ne]: 'paid' };
    }

    const { rows, count } = await Invoice.findAndCountAll({
      where,
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'customerCode', 'companyName'] },
        { model: SalesOrder, as: 'salesOrder', attributes: ['id', 'order_number'] }
      ],
      limit,
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']]
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
        { model: Customer, as: 'customer' },
        { model: SalesOrder, as: 'salesOrder' },
        {
          model: InvoiceItem,
          as: 'items',
          include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'sku'] }]
        },
        { model: Payment, as: 'payments' }
      ]
    });

    return invoice;
  }

  async create(data, createdBy) {
    const transaction = await sequelize.transaction();

    try {
      const { customerId, items, ...invoiceData } = data;

      // Generate invoice number
      const count = await Invoice.count({ transaction });
      const invoiceNumber = `INV${new Date().getFullYear()}${String(count + 1).padStart(6, '0')}`;

      // Calculate totals
      let subtotalAmount = 0;
      let taxAmount = 0;

      for (const item of items) {
        const itemSubtotal = item.quantity * item.unitPrice;
        const itemDiscount = item.discountAmount || 0;
        const itemTax = (itemSubtotal - itemDiscount) * (item.taxPercent || 0) / 100;
        subtotalAmount += itemSubtotal;
        taxAmount += itemTax;
      }

      const discountAmount = invoiceData.discountAmount || 0;
      const shippingAmount = invoiceData.shippingAmount || 0;
      const totalAmount = subtotalAmount - discountAmount + taxAmount + shippingAmount;

      const invoice = await Invoice.create({
        invoiceNumber,
        customerId,
        invoiceDate: invoiceData.invoiceDate || new Date(),
        dueDate: invoiceData.dueDate,
        subtotalAmount,
        discountAmount,
        taxAmount,
        shippingAmount,
        totalAmount,
        paidAmount: 0,
        balanceAmount: totalAmount,
        status: 'unpaid',
        paymentTerms: invoiceData.paymentTerms,
        notes: invoiceData.notes,
        termsAndConditions: invoiceData.termsAndConditions,
        createdBy
      }, { transaction });

      // Create invoice items
      for (const item of items) {
        const itemSubtotal = item.quantity * item.unitPrice;
        const itemDiscount = item.discountAmount || 0;
        const itemTax = (itemSubtotal - itemDiscount) * (item.taxPercent || 0) / 100;
        const itemTotal = itemSubtotal - itemDiscount + itemTax;

        await InvoiceItem.create({
          invoiceId: invoice.id,
          productId: item.productId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPercent: item.discountPercent || 0,
          discountAmount: itemDiscount,
          taxPercent: item.taxPercent || 0,
          taxAmount: itemTax,
          totalAmount: itemTotal,
          hsnCode: item.hsnCode
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

    if (invoice.status === 'paid') {
      throw new AppError('Cannot update a paid invoice', 400, 'INVALID_STATUS');
    }

    await invoice.update(data);
    return this.findById(id);
  }

  async markAsSent(id, sentBy) {
    const invoice = await Invoice.findByPk(id);

    if (!invoice) {
      throw new AppError('Invoice not found', 404, 'NOT_FOUND');
    }

    await invoice.update({
      status: invoice.status === 'unpaid' ? 'sent' : invoice.status,
      sentAt: new Date(),
      sentBy
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

      if (invoice.paidAmount > 0) {
        throw new AppError('Cannot void an invoice with payments', 400, 'HAS_PAYMENTS');
      }

      await invoice.update({
        status: 'void',
        voidReason: reason,
        voidedBy,
        voidedAt: new Date()
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
        status: { [Op.notIn]: ['paid', 'void'] },
        invoiceDate: { [Op.lte]: date }
      },
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'customerCode', 'companyName'] }
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
      const dueDate = new Date(invoice.dueDate);
      const daysOverdue = Math.floor((date - dueDate) / (1000 * 60 * 60 * 24));
      const balance = parseFloat(invoice.balanceAmount);

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
        invoiceNumber: invoice.invoiceNumber,
        customer: invoice.customer,
        dueDate: invoice.dueDate,
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
      sentTo: emailOptions.to || invoice.customer?.email,
      sentAt: new Date()
    };
  }
}

module.exports = new InvoicesService();
