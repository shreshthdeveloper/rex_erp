const warehousesService = require('./warehouses.service');
const { AppError } = require('../../middleware/error.middleware');

exports.createWarehouse = async (req, res, next) => {
  try {
    const warehouse = await warehousesService.create(req.body);
    res.status(201).json({
      success: true,
      data: warehouse,
      message: 'Warehouse created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.getWarehouses = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, isActive, countryId } = req.query;
    const result = await warehousesService.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      countryId: countryId ? parseInt(countryId) : undefined
    });

    res.json({
      success: true,
      data: {
        warehouses: result.warehouses,
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

exports.getWarehouseById = async (req, res, next) => {
  try {
    const warehouse = await warehousesService.findById(req.params.id);
    if (!warehouse) {
      throw new AppError('Warehouse not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: warehouse,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.updateWarehouse = async (req, res, next) => {
  try {
    const warehouse = await warehousesService.update(req.params.id, req.body);
    res.json({
      success: true,
      data: warehouse,
      message: 'Warehouse updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteWarehouse = async (req, res, next) => {
  try {
    await warehousesService.delete(req.params.id);
    res.json({
      success: true,
      message: 'Warehouse deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.getWarehouseInventory = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search, lowStock } = req.query;
    const result = await warehousesService.getInventory(req.params.id, {
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      lowStock
    });

    res.json({
      success: true,
      data: result.inventory,
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

exports.getWarehouseTransfers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, direction, status } = req.query;
    const result = await warehousesService.getTransfers(req.params.id, {
      page: parseInt(page),
      limit: parseInt(limit),
      direction,
      status
    });

    res.json({
      success: true,
      data: result.transfers,
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
