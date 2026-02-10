const { Op } = require('sequelize');
const {
  CustomerPayment,
  Invoice,
  Customer,
  SupplierPayment,
  Supplier,
  PurchaseOrder,
  PaymentMethod,
  User,
  sequelize
} = require('../../models');
const { AppError } = require('../../middleware/error.middleware');

class PaymentsService {
  async resolvePaymentMethodId(paymentMethod) {
    if (!paymentMethod) return null;
    if (Number.isInteger(paymentMethod)) return paymentMethod;
    const method = await PaymentMethod.findOne({
      where: {
        [Op.or]: [
          { method_name: paymentMethod },
          { method_type: paymentMethod.toUpperCase() }
        ]
      }
    });
    return method ? method.id : null;
  }

  // ==================== CUSTOMER PAYMENTS ====================

  async getCustomerPayments(options = {}) {
    const { page = 1, limit = 20, search, customerId, paymentMethod, startDate, endDate } = options;

    const where = {};
    if (search) {
      where.payment_number = { [Op.like]: `%${search}%` };
    }
    if (customerId) where.customer_id = customerId;
    if (paymentMethod) {
      const methodId = await this.resolvePaymentMethodId(paymentMethod);
      if (methodId) where.payment_method_id = methodId;
    }
    if (startDate || endDate) {
      where.payment_date = {};
      if (startDate) where.payment_date[Op.gte] = new Date(startDate);
      if (endDate) where.payment_date[Op.lte] = new Date(endDate);
    }

    const { rows, count } = await CustomerPayment.findAndCountAll({
      where,
      include: [
        { model: Customer, attributes: ['id', 'customer_code', 'company_name'] },
        { model: Invoice, attributes: ['id', 'invoice_number', 'total_amount', 'balance_amount'] },
        { model: PaymentMethod, attributes: ['id', 'method_name', 'method_type'] },
        { model: User, as: 'creator', attributes: ['id', 'first_name', 'last_name'] }
      ],
      limit,
      offset: (page - 1) * limit,
      order: [['payment_date', 'DESC']]
    });

    return {
      payments: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    };
  }

  async getCustomerPaymentById(id) {
    const payment = await CustomerPayment.findByPk(id, {
      include: [
        { model: Customer },
        { model: Invoice },
        { model: PaymentMethod, attributes: ['id', 'method_name', 'method_type'] },
        { model: User, as: 'creator', attributes: ['id', 'first_name', 'last_name'] }
      ]
    });

    return payment;
  }

  async createCustomerPayment(data, receivedBy) {
    const transaction = await sequelize.transaction();

    try {
      const customerId = data.customerId || data.customer_id;
      const invoiceId = data.invoiceId || data.invoice_id;
      const amount = data.amount;
      const paymentMethod = data.paymentMethod || data.payment_method_id;
      const paymentMethodId = await this.resolvePaymentMethodId(paymentMethod);
      if (!paymentMethodId) {
        throw new AppError('Invalid payment method', 400, 'INVALID_PAYMENT_METHOD');
      }
      const paymentData = data;

      // Get invoice
      const invoice = await Invoice.findByPk(invoiceId, { transaction });
      if (!invoice) {
        throw new AppError('Invoice not found', 404, 'NOT_FOUND');
      }

      if (invoice.customer_id !== customerId) {
        throw new AppError('Invoice does not belong to this customer', 400, 'INVALID_INVOICE');
      }

      if (amount > invoice.balance_amount) {
        throw new AppError(`Payment amount exceeds balance. Max: ${invoice.balance_amount}`, 400, 'EXCESS_AMOUNT');
      }

      // Generate payment number
      const count = await CustomerPayment.count({ transaction });
      const paymentNumber = `PAY${new Date().getFullYear()}${String(count + 1).padStart(6, '0')}`;

      const payment = await CustomerPayment.create({
        payment_number: paymentNumber,
        customer_id: customerId,
        invoice_id: invoiceId,
        payment_method_id: paymentMethodId,
        amount,
        payment_date: paymentData.paymentDate || new Date(),
        reference_number: paymentData.referenceNumber,
        notes: paymentData.notes,
        status: (typeof paymentMethod === 'string' && paymentMethod.toLowerCase() === 'cheque') ? 'PENDING' : 'COMPLETED',
        created_by: receivedBy
      }, { transaction });

      // Update invoice
      const newPaidAmount = parseFloat(invoice.paid_amount) + parseFloat(amount);
      const newBalanceAmount = parseFloat(invoice.total_amount) - newPaidAmount;

      await invoice.update({
        paid_amount: newPaidAmount,
        balance_amount: newBalanceAmount,
        payment_status: newBalanceAmount <= 0 ? 'PAID' : 'PARTIALLY_PAID'
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
      const payment = await CustomerPayment.findByPk(id, {
        include: [{ model: Invoice }],
        transaction
      });

      if (!payment) {
        throw new AppError('Payment not found', 404, 'NOT_FOUND');
      }

      if (payment.status === 'COMPLETED') {
        throw new AppError('Cannot update completed payment', 400, 'INVALID_STATUS');
      }

      if (status === 'bounced' && payment.status === 'PENDING') {
        // Reverse the payment from invoice
        const invoice = payment.Invoice;
        const newPaidAmount = parseFloat(invoice.paid_amount) - parseFloat(payment.amount);
        const newBalanceAmount = parseFloat(invoice.total_amount) - newPaidAmount;

        await invoice.update({
          paid_amount: newPaidAmount,
          balance_amount: newBalanceAmount,
          payment_status: newPaidAmount <= 0 ? 'UNPAID' : 'PARTIALLY_PAID'
        }, { transaction });
      }

      await payment.update({
        status: status.toUpperCase(),
        status_notes: notes
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

    const where = { customer_id: customerId };
    if (startDate || endDate) {
      where.payment_date = {};
      if (startDate) where.payment_date[Op.gte] = new Date(startDate);
      if (endDate) where.payment_date[Op.lte] = new Date(endDate);
    }

    const payments = await CustomerPayment.findAll({
      where,
      include: [{ model: Invoice, attributes: ['invoice_number'] }],
      order: [['payment_date', 'ASC']]
    });

    const invoices = await Invoice.findAll({
      where: {
        customer_id: customerId,
        payment_status: { [Op.ne]: 'REFUNDED' },
        ...(startDate || endDate ? {
          invoice_date: {
            ...(startDate && { [Op.gte]: new Date(startDate) }),
            ...(endDate && { [Op.lte]: new Date(endDate) })
          }
        } : {})
      },
      order: [['invoice_date', 'ASC']]
    });

    // Build ledger entries
    const entries = [];
    let runningBalance = 0;

    // Combine invoices and payments
    const allEntries = [
      ...invoices.map(inv => ({
        date: inv.invoice_date,
        type: 'invoice',
        reference: inv.invoice_number,
        debit: parseFloat(inv.total_amount),
        credit: 0,
        description: `Invoice ${inv.invoice_number}`
      })),
      ...payments.map(pay => ({
        date: pay.payment_date,
        type: 'payment',
        reference: pay.payment_number,
        debit: 0,
        credit: parseFloat(pay.amount),
        description: `Payment ${pay.payment_number}`
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
      where.payment_number = { [Op.like]: `%${search}%` };
    }
    if (supplierId) where.supplier_id = supplierId;
    if (paymentMethod) {
      const methodId = await this.resolvePaymentMethodId(paymentMethod);
      if (methodId) where.payment_method_id = methodId;
    }
    if (startDate || endDate) {
      where.payment_date = {};
      if (startDate) where.payment_date[Op.gte] = new Date(startDate);
      if (endDate) where.payment_date[Op.lte] = new Date(endDate);
    }

    const { rows, count } = await SupplierPayment.findAndCountAll({
      where,
      include: [
        { model: Supplier, attributes: ['id', 'supplier_code', 'company_name'] },
        { model: PurchaseOrder, attributes: ['id', 'po_number'] },
        { model: PaymentMethod, attributes: ['id', 'method_name', 'method_type'] },
        { model: User, as: 'creator', attributes: ['id', 'first_name', 'last_name'] }
      ],
      limit,
      offset: (page - 1) * limit,
      order: [['payment_date', 'DESC']]
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
        { model: Supplier },
        { model: PurchaseOrder },
        { model: PaymentMethod, attributes: ['id', 'method_name', 'method_type'] },
        { model: User, as: 'creator', attributes: ['id', 'first_name', 'last_name'] },
        { model: User, as: 'approver', attributes: ['id', 'first_name', 'last_name'] },
        { model: User, as: 'processor', attributes: ['id', 'first_name', 'last_name'] }
      ]
    });

    return payment;
  }

  async createSupplierPayment(data, createdBy) {
    const transaction = await sequelize.transaction();

    try {
      const supplierId = data.supplierId || data.supplier_id;
      const purchaseOrderId = data.purchaseOrderId || data.purchase_order_id;
      const amount = data.amount;
      const paymentMethod = data.paymentMethod || data.payment_method_id;
      const paymentMethodId = await this.resolvePaymentMethodId(paymentMethod);
      if (!paymentMethodId) {
        throw new AppError('Invalid payment method', 400, 'INVALID_PAYMENT_METHOD');
      }
      const paymentData = data;

      // Generate payment number
      const count = await SupplierPayment.count({ transaction });
      const paymentNumber = `SPAY${new Date().getFullYear()}${String(count + 1).padStart(6, '0')}`;

      const payment = await SupplierPayment.create({
        payment_number: paymentNumber,
        supplier_id: supplierId,
        purchase_order_id: purchaseOrderId,
        payment_method_id: paymentMethodId,
        amount,
        payment_date: paymentData.paymentDate || new Date(),
        reference_number: paymentData.referenceNumber,
        notes: paymentData.notes,
        status: 'PENDING',
        created_by: createdBy
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

    if (payment.status !== 'PENDING') {
      throw new AppError('Only pending payments can be approved', 400, 'INVALID_STATUS');
    }

    await payment.update({
      status: 'PENDING',
      approved_by: approvedBy,
      approved_at: new Date()
    });

    return this.getSupplierPaymentById(id);
  }

  async processSupplierPayment(id, processedBy) {
    const payment = await SupplierPayment.findByPk(id);

    if (!payment) {
      throw new AppError('Payment not found', 404, 'NOT_FOUND');
    }

    if (payment.status !== 'PENDING') {
      throw new AppError('Only approved payments can be processed', 400, 'INVALID_STATUS');
    }

    await payment.update({
      status: 'COMPLETED',
      processed_at: new Date(),
      processed_by: processedBy
    });

    return this.getSupplierPaymentById(id);
  }

  async getSupplierLedger(supplierId, options = {}) {
    const { startDate, endDate } = options;

    const where = { supplier_id: supplierId };
    if (startDate || endDate) {
      where.payment_date = {};
      if (startDate) where.payment_date[Op.gte] = new Date(startDate);
      if (endDate) where.payment_date[Op.lte] = new Date(endDate);
    }

    const payments = await SupplierPayment.findAll({
      where: { ...where, status: 'COMPLETED' },
      order: [['payment_date', 'ASC']]
    });

    const purchaseOrders = await PurchaseOrder.findAll({
      where: {
        supplier_id: supplierId,
        status: { [Op.notIn]: ['DRAFT', 'CANCELLED'] },
        ...(startDate || endDate ? {
          order_date: {
            ...(startDate && { [Op.gte]: new Date(startDate) }),
            ...(endDate && { [Op.lte]: new Date(endDate) })
          }
        } : {})
      },
      order: [['order_date', 'ASC']]
    });

    const entries = [];
    let runningBalance = 0;

    const allEntries = [
      ...purchaseOrders.map(po => ({
        date: po.order_date,
        type: 'purchase_order',
        reference: po.po_number,
        debit: 0,
        credit: parseFloat(po.total_amount),
        description: `PO ${po.po_number}`
      })),
      ...payments.map(pay => ({
        date: pay.payment_date,
        type: 'payment',
        reference: pay.payment_number,
        debit: parseFloat(pay.amount),
        credit: 0,
        description: `Payment ${pay.payment_number}`
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
