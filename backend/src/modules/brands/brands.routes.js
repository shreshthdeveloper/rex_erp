const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();
const brandsController = require('./brands.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');

// Apply authentication to all routes
router.use(authenticate);

// Get all brands
router.get('/',
  authorize('inventory_read'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim(),
    query('is_active').optional().isBoolean()
  ],
  validate,
  brandsController.getBrands
);

// Get brand by ID
router.get('/:id',
  authorize('inventory_read'),
  [
    param('id').isInt().withMessage('Brand ID must be an integer')
  ],
  validate,
  brandsController.getBrandById
);

// Create brand
router.post('/',
  authorize('inventory_create'),
  [
    body('brand_name').trim().notEmpty().withMessage('Brand name is required'),
    body('description').optional().trim(),
    body('logo_url').optional().trim().isURL().withMessage('Invalid logo URL'),
    body('website').optional().trim().isURL().withMessage('Invalid website URL'),
    body('is_active').optional().isBoolean()
  ],
  validate,
  brandsController.createBrand
);

// Update brand
router.put('/:id',
  authorize('inventory_update'),
  [
    param('id').isInt().withMessage('Brand ID must be an integer'),
    body('brand_name').optional().trim().notEmpty().withMessage('Brand name cannot be empty'),
    body('description').optional().trim(),
    body('logo_url').optional().trim(),
    body('website').optional().trim(),
    body('is_active').optional().isBoolean()
  ],
  validate,
  brandsController.updateBrand
);

// Delete brand
router.delete('/:id',
  authorize('inventory_delete'),
  [
    param('id').isInt().withMessage('Brand ID must be an integer')
  ],
  validate,
  brandsController.deleteBrand
);

module.exports = router;
