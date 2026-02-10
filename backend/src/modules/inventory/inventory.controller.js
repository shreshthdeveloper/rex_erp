const inventoryService = require('./inventory.service');
const { AppError } = require('../../middleware/error.middleware');

// ==================== INVENTORY TRANSACTIONS ====================

exports.getTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, warehouseId, productId, type, referenceType, startDate, endDate } = req.query;
    const result = await inventoryService.getTransactions({
      page: parseInt(page),
      limit: parseInt(limit),
      warehouseId: warehouseId ? parseInt(warehouseId) : undefined,
      productId: productId ? parseInt(productId) : undefined,
      type,
      referenceType,
      startDate,
      endDate
    });

    res.json({
      success: true,
      data: {
        transactions: result.transactions,
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

exports.createInwardEntry = async (req, res, next) => {
  try {
    const transaction = await inventoryService.createInwardEntry(req.body, req.user.id);
    res.status(201).json({
      success: true,
      data: transaction,
      message: 'Inward entry created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.createOutwardEntry = async (req, res, next) => {
  try {
    const transaction = await inventoryService.createOutwardEntry(req.body, req.user.id);
    res.status(201).json({
      success: true,
      data: transaction,
      message: 'Outward entry created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

// ==================== STOCK ADJUSTMENTS ====================

exports.getAdjustments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, warehouseId, startDate, endDate } = req.query;
    const result = await inventoryService.getAdjustments({
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      warehouseId: warehouseId ? parseInt(warehouseId) : undefined,
      startDate,
      endDate
    });

    res.json({
      success: true,
      data: {
        adjustments: result.adjustments,
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

exports.createAdjustment = async (req, res, next) => {
  try {
    const adjustment = await inventoryService.createAdjustment(req.body, req.user.id);
    res.status(201).json({
      success: true,
      data: adjustment,
      message: 'Stock adjustment created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.getAdjustmentById = async (req, res, next) => {
  try {
    const adjustment = await inventoryService.getAdjustmentById(req.params.id);
    if (!adjustment) {
      throw new AppError('Stock adjustment not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: adjustment,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.approveAdjustment = async (req, res, next) => {
  try {
    const adjustment = await inventoryService.approveAdjustment(
      req.params.id,
      req.user.id,
      req.body.notes
    );

    res.json({
      success: true,
      data: adjustment,
      message: 'Stock adjustment approved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.rejectAdjustment = async (req, res, next) => {
  try {
    const adjustment = await inventoryService.rejectAdjustment(
      req.params.id,
      req.user.id,
      req.body.notes
    );

    res.json({
      success: true,
      data: adjustment,
      message: 'Stock adjustment rejected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

// ==================== WAREHOUSE TRANSFERS ====================

exports.getTransfers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, sourceWarehouseId, destinationWarehouseId, startDate, endDate } = req.query;
    const result = await inventoryService.getTransfers({
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      sourceWarehouseId: sourceWarehouseId ? parseInt(sourceWarehouseId) : undefined,
      destinationWarehouseId: destinationWarehouseId ? parseInt(destinationWarehouseId) : undefined,
      startDate,
      endDate
    });

    res.json({
      success: true,
      data: {
        transfers: result.transfers,
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

exports.createTransfer = async (req, res, next) => {
  try {
    const transfer = await inventoryService.createTransfer(req.body, req.user.id);
    res.status(201).json({
      success: true,
      data: transfer,
      message: 'Transfer request created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.getTransferById = async (req, res, next) => {
  try {
    const transfer = await inventoryService.getTransferById(req.params.id);
    if (!transfer) {
      throw new AppError('Transfer not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: transfer,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.approveTransfer = async (req, res, next) => {
  try {
    const transfer = await inventoryService.approveTransfer(req.params.id, req.user.id);
    res.json({
      success: true,
      data: transfer,
      message: 'Transfer approved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.shipTransfer = async (req, res, next) => {
  try {
    const transfer = await inventoryService.shipTransfer(req.params.id, req.user.id);
    res.json({
      success: true,
      data: transfer,
      message: 'Transfer shipped successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.receiveTransfer = async (req, res, next) => {
  try {
    const transfer = await inventoryService.receiveTransfer(
      req.params.id,
      req.user.id,
      req.body.items
    );

    res.json({
      success: true,
      data: transfer,
      message: 'Transfer received successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

// ==================== LOW STOCK & VALUATION ====================

exports.getLowStockItems = async (req, res, next) => {
  try {
    const { warehouseId } = req.query;
    const items = await inventoryService.getLowStockItems(
      warehouseId ? parseInt(warehouseId) : undefined
    );

    res.json({
      success: true,
      data: items,
      count: items.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.getInventoryValuation = async (req, res, next) => {
  try {
    const { warehouseId } = req.query;
    const valuation = await inventoryService.getInventoryValuation(
      warehouseId ? parseInt(warehouseId) : undefined
    );

    res.json({
      success: true,
      data: valuation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};
