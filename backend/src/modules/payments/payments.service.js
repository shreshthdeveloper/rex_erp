const { Op } = require('sequelize');
const {
  Payment,
  Invoice,
  Customer,
  SupplierPayment,
  Supplier,
  PurchaseOrder,
  User,
  sequelize
} = require('../../models');
const { AppError } = require('../../middleware/error.middleware');

class PaymentsService {
  // ==================== CUSTOMER PAYMENTS ====================

  async getCustomerPayments(options = {}) {
    const { page = 1, limit = 20, search, customerId, paymentMethod, startDate, endDate } = options;

    const where = {};
    if (search) {
      where.paymentNumber = { [Op.like]: `%${search}%` };
    }
    if (customerId) where.customerId = customerId;
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate[Op.gte] = new Date(startDate);
      if (endDate) where.paymentDate[Op.lte] = new Date(endDate);
    }

    const { rows, count } = await Payment.findAndCountAll({
      where,
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'customerCode', 'companyName'] },
        { model: Invoice, as: 'invoice', attributes: ['id', 'invoiceNumber', 'totalAmount', 'balanceAmount'] },
        { model: User, as: 'receivedByUser', attributes: ['id', 'firstName', 'lastName'] }
      ],
      limit,
      offset: (page - 1) * limit,
      order: [['paymentDate', 'DESC']]
    });

    return {
      payments: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    };
  }

  async getCustomerPaymentById(id) {
    const payment = await Payment.findByPk(id, {
      include: [
        { model: Customer, as: 'customer' },
        { model: Invoice, as: 'invoice' },
        { model: User, as: 'receivedByUser', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });

    return payment;
  }

  async createCustomerPayment(data, receivedBy) {
    const transaction = await sequelize.transaction();

    try {
      const { customerId, invoiceId, amount, paymentMethod, ...paymentData } = data;

      // Get invoice
      const invoice = await Invoice.findByPk(invoiceId, { transaction });
      if (!invoice) {
        throw new AppError('Invoice not found', 404, 'NOT_FOUND');
      }

      if (invoice.customerId !== customerId) {
        throw new AppError('Invoice does not belong to this customer', 400, 'INVALID_INVOICE');
      }

      if (amount > invoice.balanceAmount) {
        throw new AppError(`Payment amount exceeds balance. Max: ${invoice.balanceAmount}`, 400, 'EXCESS_AMOUNT');
      }

      // Generate payment number
      const count = await Payment.count({ transaction });
      const paymentNumber = `PAY${new Date().getFullYear()}${String(count + 1).padStart(6, '0')}`;

      const payment = await Payment.create({
        paymentNumber,
        customerId,
        invoiceId,
        amount,
        paymentMethod,
        paymentDate: paymentData.paymentDate || new Date(),
        referenceNumber: paymentData.referenceNumber,
        bankName: paymentData.bankName,
        chequeNumber: paymentData.chequeNumber,
        chequeDate: paymentData.chequeDate,
        transactionId: paymentData.transactionId,
        notes: paymentData.notes,
        status: paymentMethod === 'cheque' ? 'pending' : 'completed',
        receivedBy
      }, { transaction });

      // Update invoice
      const newPaidAmount = parseFloat(invoice.paidAmount) + parseFloat(amount);
      const newBalanceAmount = parseFloat(invoice.totalAmount) - newPaidAmount;

      await invoice.update({
        paidAmount: newPaidAmount,
        balanceAmount: newBalanceAmount,
        status: newBalanceAmount <= 0 ? 'paid' : 'partial'
      }, { transaction });

      await transaction.commit();

      return this.getCustomerPaymentById(payment.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async updatePaymentStatus(id, status, notes) {
    const transaction = await sequelize.transaction();

    try {
      const payment = await Payment.findByPk(id, {
        include: [{ model: Invoice, as: 'invoice' }],
        transaction
      });

      if (!payment) {
        throw new AppError('Payment not found', 404, 'NOT_FOUND');
      }

      if (payment.status === 'completed') {
        throw new AppError('Cannot update completed payment', 400, 'INVALID_STATUS');
      }

      if (status === 'bounced' && payment.status === 'pending') {
        // Reverse the payment from invoice
        const invoice = payment.invoice;
        const newPaidAmount = parseFloat(invoice.paidAmount) - parseFloat(payment.amount);
        const newBalanceAmount = parseFloat(invoice.totalAmount) - newPaidAmount;

        await invoice.update({
          paidAmount: newPaidAmount,
          balanceAmount: newBalanceAmount,
          status: newPaidAmount <= 0 ? 'unpaid' : 'partial'
        }, { transaction });
      }

      await payment.update({
        status,
        statusNotes: notes
      }, { transaction });

      await transaction.commit();

      return this.getCustomerPaymentById(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getCustomerLedger(customerId, options = {}) {
    const { startDate, endDate } = options;

    const where = { customerId };
    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate[Op.gte] = new Date(startDate);
      if (endDate) where.paymentDate[Op.lte] = new Date(endDate);
    }

    const payments = await Payment.findAll({
      where,
      include: [{ model: Invoice, as: 'invoice', attributes: ['invoiceNumber'] }],
      order: [['paymentDate', 'ASC']]
    });

    const invoices = await Invoice.findAll({
      where: {
        customerId,
        status: { [Op.ne]: 'void' },
        ...(startDate || endDate ? {
          invoiceDate: {
            ...(startDate && { [Op.gte]: new Date(startDate) }),
            ...(endDate && { [Op.lte]: new Date(endDate) })
          }
        } : {})
      },
      order: [['invoiceDate', 'ASC']]
    });

    // Build ledger entries
    const entries = [];
    let runningBalance = 0;

    // Combine invoices and payments
    const allEntries = [
      ...invoices.map(inv => ({
        date: inv.invoiceDate,
        type: 'invoice',
        reference: inv.invoiceNumber,
        debit: parseFloat(inv.totalAmount),
        credit: 0,
        description: `Invoice ${inv.invoiceNumber}`
      })),
      ...payments.map(pay => ({
        date: pay.paymentDate,
        type: 'payment',
        reference: pay.paymentNumber,
        debit: 0,
        credit: parseFloat(pay.amount),
        description: `Payment ${pay.paymentNumber} - ${pay.paymentMethod}`
      }))
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    for (const entry of allEntries) {
      runningBalance += entry.debit - entry.credit;
      entries.push({
        ...entry,
        balance: runningBalance
      });
    }

    return {
      customerId,
      entries,
      totalDebits: entries.reduce((sum, e) => sum + e.debit, 0),
      totalCredits: entries.reduce((sum, e) => sum + e.credit, 0),
      closingBalance: runningBalance
    };
  }

  // ==================== SUPPLIER PAYMENTS ====================

  async getSupplierPayments(options = {}) {
    const { page = 1, limit = 20, search, supplierId, paymentMethod, startDate, endDate } = options;

    const where = {};
    if (search) {
      where.paymentNumber = { [Op.like]: `%${search}%` };
    }
    if (supplierId) where.supplierId = supplierId;
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate[Op.gte] = new Date(startDate);
      if (endDate) where.paymentDate[Op.lte] = new Date(endDate);
    }

    const { rows, count } = await SupplierPayment.findAndCountAll({
      where,
      include: [
        { model: Supplier, as: 'supplier', attributes: ['id', 'supplierCode', 'companyName'] },
        { model: PurchaseOrder, as: 'purchaseOrder', attributes: ['id', 'poNumber'] },
        { model: User, as: 'paidByUser', attributes: ['id', 'firstName', 'lastName'] }
      ],
      limit,
      offset: (page - 1) * limit,
      order: [['paymentDate', 'DESC']]
    });

    return {
      payments: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    };
  }

  async getSupplierPaymentById(id) {
    const payment = await SupplierPayment.findByPk(id, {
      include: [
        { model: Supplier, as: 'supplier' },
        { model: PurchaseOrder, as: 'purchaseOrder' },
        { model: User, as: 'paidByUser', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'approvedByUser', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });

    return payment;
  }

  async createSupplierPayment(data, createdBy) {
    const transaction = await sequelize.transaction();

    try {
      const { supplierId, purchaseOrderId, amount, paymentMethod, ...paymentData } = data;

      // Generate payment number
      const count = await SupplierPayment.count({ transaction });
      const paymentNumber = `SPAY${new Date().getFullYear()}${String(count + 1).padStart(6, '0')}`;

      const payment = await SupplierPayment.create({
        paymentNumber,
        supplierId,
        purchaseOrderId,
        amount,
        paymentMethod,
        paymentDate: paymentData.paymentDate || new Date(),
        referenceNumber: paymentData.referenceNumber,
        bankName: paymentData.bankName,
        chequeNumber: paymentData.chequeNumber,
        chequeDate: paymentData.chequeDate,
        transactionId: paymentData.transactionId,
        notes: paymentData.notes,
        status: 'pending',
        createdBy
      }, { transaction });

      await transaction.commit();

      return this.getSupplierPaymentById(payment.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async approveSupplierPayment(id, approvedBy) {
    const payment = await SupplierPayment.findByPk(id);

    if (!payment) {
      throw new AppError('Payment not found', 404, 'NOT_FOUND');
    }

    if (payment.status !== 'pending') {
      throw new AppError('Only pending payments can be approved', 400, 'INVALID_STATUS');
    }

    await payment.update({
      status: 'approved',
      approvedBy,
      approvedAt: new Date()
    });

    return this.getSupplierPaymentById(id);
  }

  async processSupplierPayment(id, processedBy) {
    const payment = await SupplierPayment.findByPk(id);

    if (!payment) {
      throw new AppError('Payment not found', 404, 'NOT_FOUND');
    }

    if (payment.status !== 'approved') {
      throw new AppError('Only approved payments can be processed', 400, 'INVALID_STATUS');
    }

    await payment.update({
      status: 'completed',
      processedAt: new Date(),
      processedBy
    });

    return this.getSupplierPaymentById(id);
  }

  async getSupplierLedger(supplierId, options = {}) {
    const { startDate, endDate } = options;

    const where = { supplierId };
    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate[Op.gte] = new Date(startDate);
      if (endDate) where.paymentDate[Op.lte] = new Date(endDate);
    }

    const payments = await SupplierPayment.findAll({
      where: { ...where, status: 'completed' },
      order: [['paymentDate', 'ASC']]
    });

    const purchaseOrders = await PurchaseOrder.findAll({
      where: {
        supplierId,
        status: { [Op.notIn]: ['draft', 'cancelled'] },
        ...(startDate || endDate ? {
          orderDate: {
            ...(startDate && { [Op.gte]: new Date(startDate) }),
            ...(endDate && { [Op.lte]: new Date(endDate) })
          }
        } : {})
      },
      order: [['orderDate', 'ASC']]
    });

    const entries = [];
    let runningBalance = 0;

    const allEntries = [
      ...purchaseOrders.map(po => ({
        date: po.orderDate,
        type: 'purchase_order',
        reference: po.poNumber,
        debit: 0,
        credit: parseFloat(po.totalAmount),
        description: `PO ${po.poNumber}`
      })),
      ...payments.map(pay => ({
        date: pay.paymentDate,
        type: 'payment',
        reference: pay.paymentNumber,
        debit: parseFloat(pay.amount),
        credit: 0,
        description: `Payment ${pay.paymentNumber} - ${pay.paymentMethod}`
      }))
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    for (const entry of allEntries) {
      runningBalance += entry.credit - entry.debit;
      entries.push({
        ...entry,
        balance: runningBalance
      });
    }

    return {
      supplierId,
      entries,
      totalPurchases: entries.reduce((sum, e) => sum + e.credit, 0),
      totalPayments: entries.reduce((sum, e) => sum + e.debit, 0),
      outstandingBalance: runningBalance
    };
  }
}

module.exports = new PaymentsService();
