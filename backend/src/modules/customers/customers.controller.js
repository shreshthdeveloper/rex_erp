const customersService = require('./customers.service');
const { AppError } = require('../../middleware/error.middleware');

exports.createCustomer = async (req, res, next) => {
  try {
    const customer = await customersService.create(req.body);
    
    res.status(201).json({
      success: true,
      data: customer,
      message: 'Customer created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.getCustomers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, is_active } = req.query;
    
    const result = await customersService.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      is_active: is_active === 'true'
    });
    
    res.json({
      success: true,
      data: {
        customers: result.customers,
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

exports.getCustomerById = async (req, res, next) => {
  try {
    const customer = await customersService.findById(req.params.id);
    
    if (!customer) {
      throw new AppError('Customer not found', 404, 'NOT_FOUND');
    }
    
    res.json({
      success: true,
      data: customer,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.updateCustomer = async (req, res, next) => {
  try {
    const customer = await customersService.update(req.params.id, req.body);
    
    res.json({
      success: true,
      data: customer,
      message: 'Customer updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteCustomer = async (req, res, next) => {
  try {
    await customersService.delete(req.params.id);
    
    res.json({
      success: true,
      message: 'Customer deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.getCreditStatus = async (req, res, next) => {
  try {
    const creditManager = require('../../utils/creditManager');
    const status = await creditManager.getCreditStatus(req.params.id);
    
    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};
