const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();
const inventoryController = require('./inventory.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');

// Apply authentication to all routes
router.use(authenticate);

// ==================== INVENTORY TRANSACTIONS ====================

// Get all inventory transactions
router.get('/transactions',
  authorize('inventory_read'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 200 }),
    query('warehouseId').optional().isInt(),
    query('productId').optional().isInt(),
    query('type').optional().isIn(['inward', 'outward', 'adjustment', 'transfer_in', 'transfer_out']),
    query('referenceType').optional().isIn(['manual', 'purchase', 'sale', 'adjustment', 'transfer', 'return']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  validate,
  inventoryController.getTransactions
);

// Create inward entry
router.post('/inward',
  authorize('inventory_create'),
  [
    body('warehouseId').isInt().withMessage('Warehouse ID is required'),
    body('productId').isInt().withMessage('Product ID is required'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('referenceType').optional().isIn(['manual', 'purchase', 'return']),
    body('referenceId').optional().isInt(),
    body('notes').optional().trim(),
    body('batchNumber').optional().trim(),
    body('expiryDate').optional().isISO8601()
  ],
  validate,
  inventoryController.createInwardEntry
);

// Create outward entry
router.post('/outward',
  authorize('inventory_create'),
  [
    body('warehouseId').isInt().withMessage('Warehouse ID is required'),
    body('productId').isInt().withMessage('Product ID is required'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('referenceType').optional().isIn(['manual', 'sale', 'adjustment']),
    body('referenceId').optional().isInt(),
    body('notes').optional().trim()
  ],
  validate,
  inventoryController.createOutwardEntry
);

// ==================== STOCK ADJUSTMENTS ====================

// Get all stock adjustments
router.get('/adjustments',
  authorize('inventory_read'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['pending', 'approved', 'rejected']),
    query('warehouseId').optional().isInt(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  validate,
  inventoryController.getAdjustments
);

// Create stock adjustment
router.post('/adjustments',
  authorize('inventory_create'),
  [
    body('warehouseId').isInt().withMessage('Warehouse ID is required'),
    body('reason').trim().notEmpty().withMessage('Reason is required'),
    body('notes').optional().trim(),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.productId').isInt().withMessage('Product ID is required for each item'),
    body('items.*.adjustedQuantity').isInt({ min: 0 }).withMessage('Adjusted quantity must be non-negative'),
    body('items.*.reason').optional().trim()
  ],
  validate,
  inventoryController.createAdjustment
);

// Get stock adjustment by ID
router.get('/adjustments/:id',
  authorize('inventory_read'),
  [
    param('id').isInt().withMessage('Adjustment ID must be an integer')
  ],
  validate,
  inventoryController.getAdjustmentById
);

// Approve stock adjustment
router.post('/adjustments/:id/approve',
  authorize('inventory_approve'),
  [
    param('id').isInt().withMessage('Adjustment ID must be an integer'),
    body('notes').optional().trim()
  ],
  validate,
  inventoryController.approveAdjustment
);

// Reject stock adjustment
router.post('/adjustments/:id/reject',
  authorize('inventory_approve'),
  [
    param('id').isInt().withMessage('Adjustment ID must be an integer'),
    body('notes').optional().trim()
  ],
  validate,
  inventoryController.rejectAdjustment
);

// ==================== WAREHOUSE TRANSFERS ====================

// Get all transfers
router.get('/transfers',
  authorize('inventory_read'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['pending', 'approved', 'in_transit', 'completed', 'cancelled']),
    query('sourceWarehouseId').optional().isInt(),
    query('destinationWarehouseId').optional().isInt(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  validate,
  inventoryController.getTransfers
);

// Create transfer request
router.post('/transfers',
  authorize('inventory_create'),
  [
    body('sourceWarehouseId').isInt().withMessage('Source warehouse ID is required'),
    body('destinationWarehouseId').isInt().withMessage('Destination warehouse ID is required'),
    body('notes').optional().trim(),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.productId').isInt().withMessage('Product ID is required for each item'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('items.*.notes').optional().trim()
  ],
  validate,
  inventoryController.createTransfer
);

// Get transfer by ID
router.get('/transfers/:id',
  authorize('inventory_read'),
  [
    param('id').isInt().withMessage('Transfer ID must be an integer')
  ],
  validate,
  inventoryController.getTransferById
);

// Approve transfer
router.post('/transfers/:id/approve',
  authorize('inventory_approve'),
  [
    param('id').isInt().withMessage('Transfer ID must be an integer')
  ],
  validate,
  inventoryController.approveTransfer
);

// Ship transfer
router.post('/transfers/:id/ship',
  authorize('inventory_update'),
  [
    param('id').isInt().withMessage('Transfer ID must be an integer')
  ],
  validate,
  inventoryController.shipTransfer
);

// Receive transfer
router.post('/transfers/:id/receive',
  authorize('inventory_update'),
  [
    param('id').isInt().withMessage('Transfer ID must be an integer'),
    body('items').optional().isArray(),
    body('items.*.productId').optional().isInt(),
    body('items.*.receivedQuantity').optional().isInt({ min: 0 })
  ],
  validate,
  inventoryController.receiveTransfer
);

// ==================== LOW STOCK & VALUATION ====================

// Get low stock items
router.get('/low-stock',
  authorize('inventory_read'),
  [
    query('warehouseId').optional().isInt()
  ],
  validate,
  inventoryController.getLowStockItems
);

// Get inventory valuation
router.get('/valuation',
  authorize('inventory_read'),
  [
    query('warehouseId').optional().isInt()
  ],
  validate,
  inventoryController.getInventoryValuation
);

module.exports = router;
