const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();
const warehousesController = require('./warehouses.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');

// Apply authentication to all routes
router.use(authenticate);

// Create warehouse
router.post('/',
  authorize('warehouse_create'),
  [
    body('name').trim().notEmpty().withMessage('Warehouse name is required'),
    body('address').trim().notEmpty().withMessage('Address is required'),
    body('city').trim().notEmpty().withMessage('City is required'),
    body('stateId').optional().isInt().withMessage('State ID must be an integer'),
    body('countryId').isInt().withMessage('Country ID is required'),
    body('pincode').optional().trim(),
    body('contactPerson').optional().trim(),
    body('contactPhone').optional().trim(),
    body('contactEmail').optional().isEmail().withMessage('Invalid email format'),
    body('isActive').optional().isBoolean()
  ],
  validate,
  warehousesController.createWarehouse
);

// Get all warehouses
router.get('/',
  authorize('warehouse_read'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim(),
    query('isActive').optional().isIn(['true', 'false']),
    query('countryId').optional().isInt()
  ],
  validate,
  warehousesController.getWarehouses
);

// Get warehouse by ID
router.get('/:id',
  authorize('warehouse_read'),
  [
    param('id').isInt().withMessage('Warehouse ID must be an integer')
  ],
  validate,
  warehousesController.getWarehouseById
);

// Update warehouse
router.put('/:id',
  authorize('warehouse_update'),
  [
    param('id').isInt().withMessage('Warehouse ID must be an integer'),
    body('name').optional().trim().notEmpty().withMessage('Warehouse name cannot be empty'),
    body('address').optional().trim(),
    body('city').optional().trim(),
    body('stateId').optional().isInt(),
    body('countryId').optional().isInt(),
    body('pincode').optional().trim(),
    body('contactPerson').optional().trim(),
    body('contactPhone').optional().trim(),
    body('contactEmail').optional().isEmail(),
    body('isActive').optional().isBoolean()
  ],
  validate,
  warehousesController.updateWarehouse
);

// Delete warehouse
router.delete('/:id',
  authorize('warehouse_delete'),
  [
    param('id').isInt().withMessage('Warehouse ID must be an integer')
  ],
  validate,
  warehousesController.deleteWarehouse
);

// Get warehouse inventory
router.get('/:id/inventory',
  authorize('inventory_read'),
  [
    param('id').isInt().withMessage('Warehouse ID must be an integer'),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 200 }),
    query('search').optional().trim(),
    query('lowStock').optional().isIn(['true', 'false'])
  ],
  validate,
  warehousesController.getWarehouseInventory
);

// Get warehouse transfers
router.get('/:id/transfers',
  authorize('inventory_read'),
  [
    param('id').isInt().withMessage('Warehouse ID must be an integer'),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('direction').optional().isIn(['inbound', 'outbound']),
    query('status').optional()
  ],
  validate,
  warehousesController.getWarehouseTransfers
);

module.exports = router;
