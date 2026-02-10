const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();
const returnsController = require('./returns.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');

// Apply authentication to all routes
router.use(authenticate);

// Get return analytics (before :id routes)
router.get('/analytics',
  authorize('return_read'),
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('warehouseId').optional().isInt()
  ],
  validate,
  returnsController.getReturnAnalytics
);

// Get all returns
router.get('/',
  authorize('return_read'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim(),
    query('status').optional().isIn(['pending', 'approved', 'rejected', 'received', 'inspected', 'processed', 'refunded', 'replaced']),
    query('customerId').optional().isInt(),
    query('warehouseId').optional().isInt(),
    query('returnType').optional().isIn(['refund', 'replacement', 'credit']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  validate,
  returnsController.getReturns
);

// Create return
router.post('/',
  authorize('return_create'),
  [
    body('salesOrderId').isInt().withMessage('Sales Order ID is required'),
    body('returnType').optional().isIn(['refund', 'replacement', 'credit']),
    body('reason').trim().notEmpty().withMessage('Reason is required'),
    body('customerNotes').optional().trim(),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.productId').isInt().withMessage('Product ID is required'),
    body('items.*.returnQuantity').isInt({ min: 1 }).withMessage('Return quantity must be at least 1'),
    body('items.*.reason').optional().trim(),
    body('items.*.condition').optional().isIn(['unopened', 'opened', 'damaged', 'defective'])
  ],
  validate,
  returnsController.createReturn
);

// Get return by ID
router.get('/:id',
  authorize('return_read'),
  [
    param('id').isInt().withMessage('Return ID must be an integer')
  ],
  validate,
  returnsController.getReturnById
);

// Approve return
router.post('/:id/approve',
  authorize('return_approve'),
  [
    param('id').isInt().withMessage('Return ID must be an integer')
  ],
  validate,
  returnsController.approveReturn
);

// Reject return
router.post('/:id/reject',
  authorize('return_approve'),
  [
    param('id').isInt().withMessage('Return ID must be an integer'),
    body('reason').trim().notEmpty().withMessage('Rejection reason is required')
  ],
  validate,
  returnsController.rejectReturn
);

// Receive return
router.post('/:id/receive',
  authorize('return_update'),
  [
    param('id').isInt().withMessage('Return ID must be an integer')
  ],
  validate,
  returnsController.receiveReturn
);

// Inspect items
router.post('/:id/inspect',
  authorize('return_update'),
  [
    param('id').isInt().withMessage('Return ID must be an integer'),
    body('items').isArray({ min: 1 }),
    body('items.*.productId').isInt(),
    body('items.*.acceptedQuantity').optional().isInt({ min: 0 }),
    body('items.*.rejectedQuantity').optional().isInt({ min: 0 }),
    body('items.*.restockable').optional().isBoolean(),
    body('items.*.notes').optional().trim(),
    body('notes').optional().trim()
  ],
  validate,
  returnsController.inspectItems
);

// Process return (update inventory)
router.post('/:id/process',
  authorize('return_update'),
  [
    param('id').isInt().withMessage('Return ID must be an integer')
  ],
  validate,
  returnsController.processReturn
);

// Issue refund
router.post('/:id/refund',
  authorize('return_approve'),
  [
    param('id').isInt().withMessage('Return ID must be an integer'),
    body('refundMethod').isIn(['original_payment', 'bank_transfer', 'credit_note']).withMessage('Valid refund method is required'),
    body('refundReference').optional().trim(),
    body('deductions').optional().isFloat({ min: 0 }),
    body('notes').optional().trim()
  ],
  validate,
  returnsController.issueRefund
);

// Issue replacement
router.post('/:id/replacement',
  authorize('return_approve'),
  [
    param('id').isInt().withMessage('Return ID must be an integer'),
    body('replacementOrderId').optional().isInt(),
    body('notes').optional().trim()
  ],
  validate,
  returnsController.issueReplacement
);

module.exports = router;
