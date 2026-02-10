const suppliersService = require('./suppliers.service');
const { AppError } = require('../../middleware/error.middleware');

exports.createSupplier = async (req, res, next) => {
  try {
    const supplier = await suppliersService.create(req.body);
    res.status(201).json({
      success: true,
      data: supplier,
      message: 'Supplier created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.getSuppliers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, isActive } = req.query;
    const result = await suppliersService.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined
    });

    res.json({
      success: true,
      data: {
        suppliers: result.suppliers,
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

exports.getSupplierById = async (req, res, next) => {
  try {
    const supplier = await suppliersService.findById(req.params.id);
    if (!supplier) {
      throw new AppError('Supplier not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: supplier,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.updateSupplier = async (req, res, next) => {
  try {
    const supplier = await suppliersService.update(req.params.id, req.body);
    res.json({
      success: true,
      data: supplier,
      message: 'Supplier updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteSupplier = async (req, res, next) => {
  try {
    await suppliersService.delete(req.params.id);
    res.json({
      success: true,
      message: 'Supplier deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.getSupplierPurchaseOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const result = await suppliersService.getPurchaseOrders(req.params.id, {
      page: parseInt(page),
      limit: parseInt(limit),
      status
    });

    res.json({
      success: true,
      data: result.purchaseOrders,
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

exports.getSupplierPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await suppliersService.getPayments(req.params.id, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: result.payments,
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

exports.getSupplierLedger = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const result = await suppliersService.getLedger(req.params.id, { startDate, endDate });

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};
