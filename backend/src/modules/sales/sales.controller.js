const salesService = require('./sales.service');

exports.createOrder = async (req, res, next) => {
  try {
    const order = await salesService.create(req.body);
    
    res.status(201).json({
      success: true,
      data: order,
      message: 'Sales order created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status, customer_id } = req.query;
    
    const result = await salesService.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      status,
      customer_id
    });
    
    res.json({
      success: true,
      data: {
        orders: result.orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: result.total,
          totalPages: Math.ceil(result.total / limit)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const order = await salesService.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Order not found' }
      });
    }
    
    res.json({
      success: true,
      data: order,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await salesService.updateStatus(req.params.id, status);
    
    res.json({
      success: true,
      data: order,
      message: 'Order status updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await salesService.cancelOrder(req.params.id);
    
    res.json({
      success: true,
      data: order,
      message: 'Order cancelled successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.confirmOrder = async (req, res, next) => {
  try {
    const order = await salesService.confirmOrder(req.params.id, req.user.id);
    
    res.json({
      success: true,
      data: order,
      message: 'Order confirmed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.holdOrder = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const order = await salesService.holdOrder(req.params.id, reason);
    
    res.json({
      success: true,
      data: order,
      message: 'Order placed on hold',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.releaseHold = async (req, res, next) => {
  try {
    const order = await salesService.releaseHold(req.params.id);
    
    res.json({
      success: true,
      data: order,
      message: 'Order released from hold',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.generateInvoice = async (req, res, next) => {
  try {
    const invoice = await salesService.generateInvoice(req.params.id, req.user.id);
    
    res.status(201).json({
      success: true,
      data: invoice,
      message: 'Invoice generated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.getPaymentHistory = async (req, res, next) => {
  try {
    const history = await salesService.getPaymentHistory(req.params.id);
    
    res.json({
      success: true,
      data: history,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.getOverdueOrders = async (req, res, next) => {
  try {
    const orders = await salesService.getOverdueOrders();
    
    res.json({
      success: true,
      data: orders,
      count: orders.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.getOrderTimeline = async (req, res, next) => {
  try {
    const timeline = await salesService.getOrderTimeline(req.params.id);
    
    res.json({
      success: true,
      data: timeline,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};