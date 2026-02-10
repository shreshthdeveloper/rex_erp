const invoicesService = require('./invoices.service');
const { AppError } = require('../../middleware/error.middleware');

exports.getInvoices = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status, customerId, startDate, endDate, overdue } = req.query;
    const result = await invoicesService.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      status,
      customerId: customerId ? parseInt(customerId) : undefined,
      startDate,
      endDate,
      overdue
    });

    res.json({
      success: true,
      data: result.invoices,
      pagination: {
        page: result.page,
        limit,
        total: result.total,
        totalPages: result.totalPages
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await invoicesService.findById(req.params.id);
    if (!invoice) {
      throw new AppError('Invoice not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: invoice,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.createInvoice = async (req, res, next) => {
  try {
    const invoice = await invoicesService.create(req.body, req.user.id);
    res.status(201).json({
      success: true,
      data: invoice,
      message: 'Invoice created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.updateInvoice = async (req, res, next) => {
  try {
    const invoice = await invoicesService.update(req.params.id, req.body);
    res.json({
      success: true,
      data: invoice,
      message: 'Invoice updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.markAsSent = async (req, res, next) => {
  try {
    const invoice = await invoicesService.markAsSent(req.params.id, req.user.id);
    res.json({
      success: true,
      data: invoice,
      message: 'Invoice marked as sent',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.voidInvoice = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const invoice = await invoicesService.voidInvoice(req.params.id, reason, req.user.id);
    res.json({
      success: true,
      data: invoice,
      message: 'Invoice voided successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.getAgingReport = async (req, res, next) => {
  try {
    const { asOfDate } = req.query;
    const report = await invoicesService.getAgingReport(asOfDate);
    res.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.generatePDF = async (req, res, next) => {
  try {
    const result = await invoicesService.generatePDF(req.params.id);
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.sendInvoice = async (req, res, next) => {
  try {
    const result = await invoicesService.sendInvoice(req.params.id, req.body);
    res.json({
      success: true,
      data: result,
      message: 'Invoice sent successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};
