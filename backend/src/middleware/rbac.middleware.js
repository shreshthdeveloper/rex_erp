const { AppError } = require('./error.middleware');
const { User, Role, Permission } = require('../models');

const requirePermission = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      }
      
      const user = await User.findByPk(req.user.userId, {
        include: [
          {
            model: Role,
            through: { attributes: [] },
            include: [
              {
                model: Permission,
                through: { attributes: [] }
              }
            ]
          }
        ]
      });
      
      if (!user) {
        return next(new AppError('User not found', 404, 'NOT_FOUND'));
      }
      
      // Super admin has all permissions
      const isSuperAdmin = user.Roles?.some(role => role.role_name === 'SUPER_ADMIN');
      if (isSuperAdmin) {
        return next();
      }
      
      // Check if user has any of the required permissions
      const userPermissions = new Set();
      user.Roles?.forEach(role => {
        role.Permissions?.forEach(permission => {
          userPermissions.add(permission.permission_name);
        });
      });
      
      const hasPermission = requiredPermissions.some(permission => 
        userPermissions.has(permission)
      );
      
      if (!hasPermission) {
        return next(new AppError(
          'Insufficient permissions',
          403,
          'FORBIDDEN'
        ));
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

const requireRole = (...requiredRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      }
      
      const user = await User.findByPk(req.user.userId, {
        include: [
          {
            model: Role,
            through: { attributes: [] }
          }
        ]
      });
      
      if (!user) {
        return next(new AppError('User not found', 404, 'NOT_FOUND'));
      }
      
      const userRoles = user.Roles?.map(role => role.role_name) || [];
      const hasRole = requiredRoles.some(role => userRoles.includes(role));
      
      if (!hasRole) {
        return next(new AppError(
          'Insufficient role privileges',
          403,
          'FORBIDDEN'
        ));
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { requirePermission, requireRole };
