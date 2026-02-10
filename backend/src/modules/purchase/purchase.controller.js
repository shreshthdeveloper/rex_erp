const purchaseService = require('./purchase.service');
const { AppError } = require('../../middleware/error.middleware');

exports.getPurchaseOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status, supplierId, warehouseId, startDate, endDate } = req.query;
    const result = await purchaseService.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      status,
      supplierId: supplierId ? parseInt(supplierId) : undefined,
      warehouseId: warehouseId ? parseInt(warehouseId) : undefined,
      startDate,
      endDate
    });

    res.json({
      success: true,
      data: {
        purchaseOrders: result.purchaseOrders,
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

exports.getPurchaseOrderById = async (req, res, next) => {
  try {
    const po = await purchaseService.findById(req.params.id);
    if (!po) {
      throw new AppError('Purchase order not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: po,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.createPurchaseOrder = async (req, res, next) => {
  try {
    const po = await purchaseService.create(req.body, req.user.id);
    res.status(201).json({
      success: true,
      data: po,
      message: 'Purchase order created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.updatePurchaseOrder = async (req, res, next) => {
  try {
    const po = await purchaseService.update(req.params.id, req.body);
    res.json({
      success: true,
      data: po,
      message: 'Purchase order updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.submitForApproval = async (req, res, next) => {
  try {
    const po = await purchaseService.submitForApproval(req.params.id);
    res.json({
      success: true,
      data: po,
      message: 'Purchase order submitted for approval',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.approvePurchaseOrder = async (req, res, next) => {
  try {
    const po = await purchaseService.approve(req.params.id, req.user.id);
    res.json({
      success: true,
      data: po,
      message: 'Purchase order approved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.rejectPurchaseOrder = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const po = await purchaseService.reject(req.params.id, req.user.id, reason);
    res.json({
      success: true,
      data: po,
      message: 'Purchase order rejected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.sendToSupplier = async (req, res, next) => {
  try {
    const po = await purchaseService.sendToSupplier(req.params.id, req.user.id);
    res.json({
      success: true,
      data: po,
      message: 'Purchase order sent to supplier',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.cancelPurchaseOrder = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const po = await purchaseService.cancel(req.params.id, req.user.id, reason);
    res.json({
      success: true,
      data: po,
      message: 'Purchase order cancelled',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.getGRNHistory = async (req, res, next) => {
  try {
    const history = await purchaseService.getGRNHistory(req.params.id);
    res.json({
      success: true,
      data: history,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};
