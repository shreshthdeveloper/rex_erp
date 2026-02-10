const dispatchService = require('./dispatch.service');
const { AppError } = require('../../middleware/error.middleware');

// ==================== DISPATCHES ====================

exports.getDispatches = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status, warehouseId, carrierId, startDate, endDate } = req.query;
    const result = await dispatchService.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      status,
      warehouseId: warehouseId ? parseInt(warehouseId) : undefined,
      carrierId: carrierId ? parseInt(carrierId) : undefined,
      startDate,
      endDate
    });

    res.json({
      success: true,
      data: {
        dispatches: result.dispatches,
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

exports.getDispatchById = async (req, res, next) => {
  try {
    const dispatch = await dispatchService.findById(req.params.id);
    if (!dispatch) {
      throw new AppError('Dispatch not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: dispatch,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.createDispatch = async (req, res, next) => {
  try {
    const dispatch = await dispatchService.create(req.body, req.user.id);
    res.status(201).json({
      success: true,
      data: dispatch,
      message: 'Dispatch created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.startPicking = async (req, res, next) => {
  try {
    const dispatch = await dispatchService.startPicking(req.params.id, req.user.id);
    res.json({
      success: true,
      data: dispatch,
      message: 'Picking started',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.updatePickedQuantities = async (req, res, next) => {
  try {
    const dispatch = await dispatchService.updatePickedQuantities(
      req.params.id,
      req.body.items,
      req.user.id
    );
    res.json({
      success: true,
      data: dispatch,
      message: 'Picked quantities updated',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.completePicking = async (req, res, next) => {
  try {
    const dispatch = await dispatchService.completePicking(req.params.id);
    res.json({
      success: true,
      data: dispatch,
      message: 'Picking completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.startPacking = async (req, res, next) => {
  try {
    const dispatch = await dispatchService.startPacking(req.params.id, req.user.id);
    res.json({
      success: true,
      data: dispatch,
      message: 'Packing started',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.updatePackedQuantities = async (req, res, next) => {
  try {
    const { items, totalPackages, totalWeight, dimensions } = req.body;
    const dispatch = await dispatchService.updatePackedQuantities(
      req.params.id,
      items,
      { totalPackages, totalWeight, dimensions }
    );
    res.json({
      success: true,
      data: dispatch,
      message: 'Packed quantities updated',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.completePacking = async (req, res, next) => {
  try {
    const dispatch = await dispatchService.completePacking(req.params.id);
    res.json({
      success: true,
      data: dispatch,
      message: 'Packing completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.ship = async (req, res, next) => {
  try {
    const dispatch = await dispatchService.ship(req.params.id, req.body, req.user.id);
    res.json({
      success: true,
      data: dispatch,
      message: 'Dispatch shipped successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.addTrackingUpdate = async (req, res, next) => {
  try {
    const trackingUpdate = await dispatchService.addTrackingUpdate(
      req.params.id,
      req.body,
      req.user.id
    );
    res.status(201).json({
      success: true,
      data: trackingUpdate,
      message: 'Tracking update added',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.markDelivered = async (req, res, next) => {
  try {
    const dispatch = await dispatchService.markDelivered(req.params.id, req.body, req.user.id);
    res.json({
      success: true,
      data: dispatch,
      message: 'Dispatch marked as delivered',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.getTrackingHistory = async (req, res, next) => {
  try {
    const history = await dispatchService.getTrackingHistory(req.params.id);
    res.json({
      success: true,
      data: history,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

// ==================== CARRIERS ====================

exports.getCarriers = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, isActive } = req.query;
    const result = await dispatchService.getCarriers({
      page: parseInt(page),
      limit: parseInt(limit),
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined
    });

    res.json({
      success: true,
      data: result.carriers,
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

exports.createCarrier = async (req, res, next) => {
  try {
    const carrier = await dispatchService.createCarrier(req.body);
    res.status(201).json({
      success: true,
      data: carrier,
      message: 'Carrier created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.updateCarrier = async (req, res, next) => {
  try {
    const carrier = await dispatchService.updateCarrier(req.params.id, req.body);
    res.json({
      success: true,
      data: carrier,
      message: 'Carrier updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};
