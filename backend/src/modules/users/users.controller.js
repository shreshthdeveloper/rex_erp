const usersService = require('./users.service');
const { AppError } = require('../../middleware/error.middleware');

exports.createUser = async (req, res, next) => {
  try {
    const user = await usersService.create(req.body);
    res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, isActive, roleId } = req.query;
    const result = await usersService.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      roleId: roleId ? parseInt(roleId) : undefined
    });

    res.json({
      success: true,
      data: {
        users: result.users,
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

exports.getUserById = async (req, res, next) => {
  try {
    const user = await usersService.findById(req.params.id);
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: user,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const user = await usersService.update(req.params.id, req.body);
    res.json({
      success: true,
      data: user,
      message: 'User updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    await usersService.delete(req.params.id);
    res.json({
      success: true,
      message: 'User deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.updateUserRoles = async (req, res, next) => {
  try {
    const { role_ids } = req.body;
    const user = await usersService.updateRoles(req.params.id, role_ids);
    res.json({
      success: true,
      data: user,
      message: 'User roles updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.activateUser = async (req, res, next) => {
  try {
    const user = await usersService.activate(req.params.id);
    res.json({
      success: true,
      data: user,
      message: 'User activated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

exports.deactivateUser = async (req, res, next) => {
  try {
    const user = await usersService.deactivate(req.params.id);
    res.json({
      success: true,
      data: user,
      message: 'User deactivated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};
