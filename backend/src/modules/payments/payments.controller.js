const paymentsService = require('./payments.service');
const { AppError } = require('../../middleware/error.middleware');

// ==================== CUSTOMER PAYMENTS ====================

exports.getCustomerPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, customerId, paymentMethod, startDate, endDate } = req.query;
    const result = await paymentsService.getCustomerPayments({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      customerId: customerId ? parseInt(customerId) : undefined,
      paymentMethod,
      startDate,
      endDate
    });

    res.json({
      success: true,
      data: {
        payments: result.payments,
        pagination: {
          page: result.page,
          limit,
          total: result.total,
          totalPages: result.totalPages
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.getCustomerPaymentById = async (req, res, next) => {
  try {
    const payment = await paymentsService.getCustomerPaymentById(req.params.id);
    if (!payment) {
      throw new AppError('Payment not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: payment,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.createCustomerPayment = async (req, res, next) => {
  try {
    const payment = await paymentsService.createCustomerPayment(req.body, req.user.id);
    res.status(201).json({
      success: true,
      data: payment,
      message: 'Payment recorded successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.updatePaymentStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const payment = await paymentsService.updatePaymentStatus(req.params.id, status, notes);
    res.json({
      success: true,
      data: payment,
      message: 'Payment status updated',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.getCustomerLedger = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const ledger = await paymentsService.getCustomerLedger(req.params.customerId, {
      startDate,
      endDate
    });
    res.json({
      success: true,
      data: ledger,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

// ==================== SUPPLIER PAYMENTS ====================

exports.getSupplierPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, supplierId, paymentMethod, startDate, endDate } = req.query;
    const result = await paymentsService.getSupplierPayments({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      supplierId: supplierId ? parseInt(supplierId) : undefined,
      paymentMethod,
      startDate,
      endDate
    });

    res.json({
      success: true,
      data: {
        payments: result.payments,
        pagination: {
          page: result.page,
          limit,
          total: result.total,
          totalPages: result.totalPages
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.getSupplierPaymentById = async (req, res, next) => {
  try {
    const payment = await paymentsService.getSupplierPaymentById(req.params.id);
    if (!payment) {
      throw new AppError('Payment not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: payment,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.createSupplierPayment = async (req, res, next) => {
  try {
    const payment = await paymentsService.createSupplierPayment(req.body, req.user.id);
    res.status(201).json({
      success: true,
      data: payment,
      message: 'Supplier payment created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.approveSupplierPayment = async (req, res, next) => {
  try {
    const payment = await paymentsService.approveSupplierPayment(req.params.id, req.user.id);
    res.json({
      success: true,
      data: payment,
      message: 'Payment approved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.processSupplierPayment = async (req, res, next) => {
  try {
    const payment = await paymentsService.processSupplierPayment(req.params.id, req.user.id);
    res.json({
      success: true,
      data: payment,
      message: 'Payment processed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.getSupplierLedger = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const ledger = await paymentsService.getSupplierLedger(req.params.supplierId, {
      startDate,
      endDate
    });
    res.json({
      success: true,
      data: ledger,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};
