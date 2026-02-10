const returnsService = require('./returns.service');
const { AppError } = require('../../middleware/error.middleware');

exports.getReturns = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status, customerId, warehouseId, returnType, startDate, endDate } = req.query;
    const result = await returnsService.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      status,
      customerId: customerId ? parseInt(customerId) : undefined,
      warehouseId: warehouseId ? parseInt(warehouseId) : undefined,
      returnType,
      startDate,
      endDate
    });

    res.json({
      success: true,
      data: {
        returns: result.returns,
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

exports.getReturnById = async (req, res, next) => {
  try {
    const returnOrder = await returnsService.findById(req.params.id);
    if (!returnOrder) {
      throw new AppError('Return not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: returnOrder,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.createReturn = async (req, res, next) => {
  try {
    const returnOrder = await returnsService.create(req.body, req.user.id);
    res.status(201).json({
      success: true,
      data: returnOrder,
      message: 'Return request created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.approveReturn = async (req, res, next) => {
  try {
    const returnOrder = await returnsService.approve(req.params.id, req.user.id);
    res.json({
      success: true,
      data: returnOrder,
      message: 'Return approved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.rejectReturn = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const returnOrder = await returnsService.reject(req.params.id, req.user.id, reason);
    res.json({
      success: true,
      data: returnOrder,
      message: 'Return rejected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.receiveReturn = async (req, res, next) => {
  try {
    const returnOrder = await returnsService.receiveReturn(req.params.id, req.user.id);
    res.json({
      success: true,
      data: returnOrder,
      message: 'Return received',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.inspectItems = async (req, res, next) => {
  try {
    const returnOrder = await returnsService.inspectItems(req.params.id, req.body, req.user.id);
    res.json({
      success: true,
      data: returnOrder,
      message: 'Inspection completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.processReturn = async (req, res, next) => {
  try {
    const returnOrder = await returnsService.processReturn(req.params.id, req.user.id);
    res.json({
      success: true,
      data: returnOrder,
      message: 'Return processed and inventory updated',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.issueRefund = async (req, res, next) => {
  try {
    const returnOrder = await returnsService.issueRefund(req.params.id, req.body, req.user.id);
    res.json({
      success: true,
      data: returnOrder,
      message: 'Refund issued successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.issueReplacement = async (req, res, next) => {
  try {
    const returnOrder = await returnsService.issueReplacement(req.params.id, req.body, req.user.id);
    res.json({
      success: true,
      data: returnOrder,
      message: 'Replacement order created',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.getReturnAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate, warehouseId } = req.query;
    const analytics = await returnsService.getReturnAnalytics({
      startDate,
      endDate,
      warehouseId: warehouseId ? parseInt(warehouseId) : undefined
    });
    res.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};
