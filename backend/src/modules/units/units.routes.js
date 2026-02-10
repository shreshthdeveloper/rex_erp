const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();
const unitsController = require('./units.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');

// Apply authentication to all routes
router.use(authenticate);

// Get all units
router.get('/',
  authorize('inventory_read'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim(),
    query('is_active').optional().isBoolean()
  ],
  validate,
  unitsController.getUnits
);

// Get unit by ID
router.get('/:id',
  authorize('inventory_read'),
  [
    param('id').isInt().withMessage('Unit ID must be an integer')
  ],
  validate,
  unitsController.getUnitById
);

// Create unit
router.post('/',
  authorize('inventory_create'),
  [
    body('unit_name').trim().notEmpty().withMessage('Unit name is required'),
    body('short_name').trim().notEmpty().withMessage('Short name is required').isLength({ max: 10 }).withMessage('Short name must be at most 10 characters'),
    body('description').optional().trim(),
    body('base_unit_id').optional().isInt().withMessage('Base unit ID must be an integer'),
    body('conversion_factor').optional().isFloat({ min: 0 }).withMessage('Conversion factor must be a positive number'),
    body('is_active').optional().isBoolean()
  ],
  validate,
  unitsController.createUnit
);

// Update unit
router.put('/:id',
  authorize('inventory_update'),
  [
    param('id').isInt().withMessage('Unit ID must be an integer'),
    body('unit_name').optional().trim().notEmpty().withMessage('Unit name cannot be empty'),
    body('short_name').optional().trim().notEmpty().withMessage('Short name cannot be empty').isLength({ max: 10 }).withMessage('Short name must be at most 10 characters'),
    body('description').optional().trim(),
    body('base_unit_id').optional().isInt(),
    body('conversion_factor').optional().isFloat({ min: 0 }),
    body('is_active').optional().isBoolean()
  ],
  validate,
  unitsController.updateUnit
);

// Delete unit
router.delete('/:id',
  authorize('inventory_delete'),
  [
    param('id').isInt().withMessage('Unit ID must be an integer')
  ],
  validate,
  unitsController.deleteUnit
);

module.exports = router;
