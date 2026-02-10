const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const barcodesController = require('./barcodes.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');

// Apply authentication to all routes
router.use(authenticate);

// Generate barcode for a product
router.post(
  '/generate/:productId',
  authorize('inventory_view', 'inventory_edit'),
  [
    param('productId').isInt().withMessage('Product ID must be an integer')
  ],
  validate,
  barcodesController.generateProductBarcode
);

// Generate barcodes in bulk
router.post(
  '/generate-bulk',
  authorize('inventory_edit'),
  [
    body('productIds').isArray({ min: 1 }).withMessage('Product IDs array is required'),
    body('productIds.*').isInt().withMessage('Each product ID must be an integer')
  ],
  validate,
  barcodesController.generateBulkBarcodes
);

// Lookup barcode
router.get(
  '/lookup/:barcode',
  authorize('inventory_view', 'sales_view', 'dispatch_view'),
  [
    param('barcode').notEmpty().withMessage('Barcode is required')
  ],
  validate,
  barcodesController.lookupBarcode
);

// Validate barcode
router.get(
  '/validate/:barcode',
  authorize('inventory_view', 'sales_view', 'dispatch_view'),
  [
    param('barcode').notEmpty().withMessage('Barcode is required')
  ],
  validate,
  barcodesController.validateBarcode
);

// Scan barcode
router.post(
  '/scan',
  authorize('inventory_view', 'dispatch_view', 'dispatch_edit'),
  [
    body('barcode').notEmpty().withMessage('Barcode is required'),
    body('scanType').isIn(['pick', 'pack', 'receive', 'count', 'transfer', 'other'])
      .withMessage('Valid scan type is required'),
    body('warehouseId').optional().isInt().withMessage('Warehouse ID must be an integer'),
    body('referenceType').optional().isString(),
    body('referenceId').optional().isInt(),
    body('location').optional().isString(),
    body('notes').optional().isString()
  ],
  validate,
  barcodesController.scanBarcode
);

// Get scan history
router.get(
  '/scan-history',
  authorize('inventory_view', 'reports_view'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('barcode').optional().isString(),
    query('scanType').optional().isIn(['pick', 'pack', 'receive', 'count', 'transfer', 'other']),
    query('entityType').optional().isIn(['product', 'sales_order', 'dispatch']),
    query('warehouseId').optional().isInt(),
    query('scannedBy').optional().isInt(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  validate,
  barcodesController.getScanHistory
);

// Pick item by barcode scan
router.post(
  '/pick',
  authorize('dispatch_edit'),
  [
    body('dispatchId').isInt().withMessage('Dispatch ID is required'),
    body('barcode').notEmpty().withMessage('Barcode is required'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
  ],
  validate,
  barcodesController.pickByBarcode
);

// Print barcode labels
router.post(
  '/print-labels',
  authorize('inventory_view', 'inventory_edit'),
  [
    body('productIds').isArray({ min: 1 }).withMessage('Product IDs array is required'),
    body('productIds.*').isInt().withMessage('Each product ID must be an integer'),
    body('format').optional().isIn(['pdf', 'zpl', 'png']).withMessage('Invalid format'),
    body('size').optional().isString(),
    body('quantity').optional().isInt({ min: 1, max: 100 })
  ],
  validate,
  barcodesController.printBarcodeLabels
);

module.exports = router;
