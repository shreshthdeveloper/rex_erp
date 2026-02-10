const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();
const grnController = require('./grn.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');

// Apply authentication to all routes
router.use(authenticate);

// Get all discrepancies (before :id routes)
router.get('/discrepancies',
  authorize('grn_read'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validate,
  grnController.getDiscrepancies
);

// Get all GRNs
router.get('/',
  authorize('grn_read'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim(),
    query('status').optional().isIn(['pending_verification', 'verified', 'rejected']),
    query('purchaseOrderId').optional().isInt(),
    query('warehouseId').optional().isInt(),
    query('supplierId').optional().isInt(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  validate,
  grnController.getGRNs
);

// Create GRN
router.post('/',
  authorize('grn_create'),
  [
    body('purchaseOrderId').isInt().withMessage('Purchase Order ID is required'),
    body('invoiceNumber').optional().trim(),
    body('invoiceDate').optional().isISO8601(),
    body('deliveryNoteNumber').optional().trim(),
    body('vehicleNumber').optional().trim(),
    body('driverName').optional().trim(),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.productId').isInt().withMessage('Product ID is required'),
    body('items.*.acceptedQuantity').optional().isInt({ min: 0 }),
    body('items.*.rejectedQuantity').optional().isInt({ min: 0 }),
    body('items.*.rejectionReason').optional().trim(),
    body('items.*.batchNumber').optional().trim(),
    body('items.*.expiryDate').optional().isISO8601(),
    body('notes').optional().trim()
  ],
  validate,
  grnController.createGRN
);

// Get GRN by ID
router.get('/:id',
  authorize('grn_read'),
  [
    param('id').isInt().withMessage('GRN ID must be an integer')
  ],
  validate,
  grnController.getGRNById
);

// Verify GRN
router.post('/:id/verify',
  authorize('grn_approve'),
  [
    param('id').isInt().withMessage('GRN ID must be an integer'),
    body('notes').optional().trim()
  ],
  validate,
  grnController.verifyGRN
);

// Report discrepancy
router.post('/:id/discrepancy',
  authorize('grn_update'),
  [
    param('id').isInt().withMessage('GRN ID must be an integer'),
    body('details').trim().notEmpty().withMessage('Discrepancy details are required')
  ],
  validate,
  grnController.reportDiscrepancy
);

module.exports = router;
