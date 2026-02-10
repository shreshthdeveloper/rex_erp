const express = require('express');
const router = express.Router();
const usersController = require('./users.controller');
const { authenticateToken } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/rbac.middleware');
const { body } = require('express-validator');
const { validate } = require('../../middleware/validation.middleware');

// Validation rules
const createUserValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('first_name').notEmpty().trim(),
  body('last_name').optional().trim(),
  body('phone').optional().trim()
];

const updateUserValidation = [
  body('email').optional().isEmail().normalizeEmail(),
  body('password').optional().isLength({ min: 8 }),
  body('first_name').optional().trim(),
  body('last_name').optional().trim(),
  body('phone').optional().trim()
];

// All routes require authentication
router.use(authenticateToken);

// Create user
router.post('/', requirePermission('USER_CREATE'), createUserValidation, validate, usersController.createUser);

// Get all users
router.get('/', requirePermission('USER_VIEW'), usersController.getUsers);

// Get user by ID
router.get('/:id', requirePermission('USER_VIEW'), usersController.getUserById);

// Update user
router.put('/:id', requirePermission('USER_UPDATE'), updateUserValidation, validate, usersController.updateUser);

// Delete user
router.delete('/:id', requirePermission('USER_DELETE'), usersController.deleteUser);

// Update user roles
router.put('/:id/roles', requirePermission('USER_UPDATE'), usersController.updateUserRoles);

// Activate user
router.put('/:id/activate', requirePermission('USER_UPDATE'), usersController.activateUser);

// Deactivate user
router.put('/:id/deactivate', requirePermission('USER_UPDATE'), usersController.deactivateUser);

module.exports = router;
