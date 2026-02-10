const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();
const purchaseController = require('./purchase.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');

// Apply authentication to all routes
router.use(authenticate);

// Get all purchase orders
router.get('/',
  authorize('purchase_read'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim(),
    query('status').optional().isIn(['draft', 'pending', 'approved', 'rejected', 'sent', 'partial', 'completed', 'cancelled']),
    query('supplierId').optional().isInt(),
    query('warehouseId').optional().isInt(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  validate,
  purchaseController.getPurchaseOrders
);

// Create purchase order
router.post('/',
  authorize('purchase_create'),
  [
    body('supplierId').isInt().withMessage('Supplier ID is required'),
    body('warehouseId').isInt().withMessage('Warehouse ID is required'),
    body('expectedDeliveryDate').optional().isISO8601(),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.productId').isInt().withMessage('Product ID is required'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Unit price is required'),
    body('items.*.taxPercent').optional().isFloat({ min: 0, max: 100 }),
    body('discountAmount').optional().isFloat({ min: 0 }),
    body('shippingAmount').optional().isFloat({ min: 0 }),
    body('paymentTerms').optional().trim(),
    body('shippingMethod').optional().trim(),
    body('notes').optional().trim()
  ],
  validate,
  purchaseController.createPurchaseOrder
);

// Get purchase order by ID
router.get('/:id',
  authorize('purchase_read'),
  [
    param('id').isInt().withMessage('Purchase Order ID must be an integer')
  ],
  validate,
  purchaseController.getPurchaseOrderById
);

// Update purchase order
router.put('/:id',
  authorize('purchase_update'),
  [
    param('id').isInt().withMessage('Purchase Order ID must be an integer'),
    body('expectedDeliveryDate').optional().isISO8601(),
    body('items').optional().isArray({ min: 1 }),
    body('items.*.productId').optional().isInt(),
    body('items.*.quantity').optional().isInt({ min: 1 }),
    body('items.*.unitPrice').optional().isFloat({ min: 0 }),
    body('paymentTerms').optional().trim(),
    body('shippingMethod').optional().trim(),
    body('notes').optional().trim()
  ],
  validate,
  purchaseController.updatePurchaseOrder
);

// Submit for approval
router.post('/:id/submit',
  authorize('purchase_update'),
  [
    param('id').isInt().withMessage('Purchase Order ID must be an integer')
  ],
  validate,
  purchaseController.submitForApproval
);

// Approve purchase order
router.post('/:id/approve',
  authorize('purchase_approve'),
  [
    param('id').isInt().withMessage('Purchase Order ID must be an integer')
  ],
  validate,
  purchaseController.approvePurchaseOrder
);

// Reject purchase order
router.post('/:id/reject',
  authorize('purchase_approve'),
  [
    param('id').isInt().withMessage('Purchase Order ID must be an integer'),
    body('reason').trim().notEmpty().withMessage('Rejection reason is required')
  ],
  validate,
  purchaseController.rejectPurchaseOrder
);

// Send to supplier
router.post('/:id/send',
  authorize('purchase_update'),
  [
    param('id').isInt().withMessage('Purchase Order ID must be an integer')
  ],
  validate,
  purchaseController.sendToSupplier
);

// Cancel purchase order
router.post('/:id/cancel',
  authorize('purchase_update'),
  [
    param('id').isInt().withMessage('Purchase Order ID must be an integer'),
    body('reason').trim().notEmpty().withMessage('Cancellation reason is required')
  ],
  validate,
  purchaseController.cancelPurchaseOrder
);

// Get GRN history
router.get('/:id/grn-history',
  authorize('purchase_read'),
  [
    param('id').isInt().withMessage('Purchase Order ID must be an integer')
  ],
  validate,
  purchaseController.getGRNHistory
);

module.exports = router;
