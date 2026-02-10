const grnService = require('./grn.service');
const { AppError } = require('../../middleware/error.middleware');

exports.getGRNs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status, purchaseOrderId, warehouseId, supplierId, startDate, endDate } = req.query;
    const result = await grnService.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      status,
      purchaseOrderId: purchaseOrderId ? parseInt(purchaseOrderId) : undefined,
      warehouseId: warehouseId ? parseInt(warehouseId) : undefined,
      supplierId: supplierId ? parseInt(supplierId) : undefined,
      startDate,
      endDate
    });

    res.json({
      success: true,
      data: {
        grns: result.grns,
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

exports.getGRNById = async (req, res, next) => {
  try {
    const grn = await grnService.findById(req.params.id);
    if (!grn) {
      throw new AppError('GRN not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: grn,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.createGRN = async (req, res, next) => {
  try {
    const grn = await grnService.create(req.body, req.user.id);
    res.status(201).json({
      success: true,
      data: grn,
      message: 'GRN created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.verifyGRN = async (req, res, next) => {
  try {
    const grn = await grnService.verify(req.params.id, req.user.id, req.body);
    res.json({
      success: true,
      data: grn,
      message: 'GRN verified and inventory updated',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.reportDiscrepancy = async (req, res, next) => {
  try {
    const grn = await grnService.reportDiscrepancy(req.params.id, req.body, req.user.id);
    res.json({
      success: true,
      data: grn,
      message: 'Discrepancy reported successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.getDiscrepancies = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await grnService.getDiscrepancies({
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: result.discrepancies,
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
