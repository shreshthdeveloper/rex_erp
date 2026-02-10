const jwt = require('jsonwebtoken');
const { AppError } = require('./error.middleware');
const { User } = require('../models');
const authConfig = require('../config/auth');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return next(new AppError('Access token required', 401, 'UNAUTHORIZED'));
    }
    
    const decoded = jwt.verify(token, authConfig.jwtSecret);
    
    // Check if user still exists and is active
    const user = await User.findByPk(decoded.userId);
    
    if (!user || !user.is_active) {
      return next(new AppError('User not found or inactive', 401, 'UNAUTHORIZED'));
    }
    
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      roles: decoded.roles
    };
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token', 403, 'FORBIDDEN'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expired', 403, 'FORBIDDEN'));
    }
    next(error);
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      const decoded = jwt.verify(token, authConfig.jwtSecret);
      const user = await User.findByPk(decoded.userId);
      
      if (user && user.is_active) {
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          roles: decoded.roles
        };
      }
    }
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

module.exports = { 
  authenticateToken, 
  optionalAuth,
  authenticate: authenticateToken,  // Alias for backward compatibility
  authorize: require('./rbac.middleware').requirePermission  // Alias
};
