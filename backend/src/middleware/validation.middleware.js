const { validationResult } = require('express-validator');
const { AppError } = require('./error.middleware');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => `${err.param}: ${err.msg}`).join(', ');
    return next(new AppError(errorMessages, 400, 'VALIDATION_ERROR'));
  }
  
  next();
};

const validatePagination = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  
  if (page < 1) {
    return next(new AppError('Page must be greater than 0', 400, 'VALIDATION_ERROR'));
  }
  
  if (limit < 1 || limit > 100) {
    return next(new AppError('Limit must be between 1 and 100', 400, 'VALIDATION_ERROR'));
  }
  
  req.pagination = {
    page,
    limit,
    offset: (page - 1) * limit
  };
  
  next();
};

module.exports = { validate, validatePagination };
