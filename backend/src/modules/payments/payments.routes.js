const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();
const paymentsController = require('./payments.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');

// Apply authentication to all routes
router.use(authenticate);

// ==================== CUSTOMER PAYMENTS ====================

// Get customer ledger (before :id routes)
router.get('/customer/ledger/:customerId',
  authorize('payment_read'),
  [
    param('customerId').isInt().withMessage('Customer ID must be an integer'),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  validate,
  paymentsController.getCustomerLedger
);

// Get all customer payments
router.get('/customer',
  authorize('payment_read'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim(),
    query('customerId').optional().isInt(),
    query('paymentMethod').optional().isIn(['cash', 'cheque', 'bank_transfer', 'upi', 'card', 'online']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  validate,
  paymentsController.getCustomerPayments
);

// Create customer payment
router.post('/customer',
  authorize('payment_create'),
  [
    body('customerId').isInt().withMessage('Customer ID is required'),
    body('invoiceId').isInt().withMessage('Invoice ID is required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('paymentMethod').isIn(['cash', 'cheque', 'bank_transfer', 'upi', 'card', 'online']).withMessage('Valid payment method is required'),
    body('paymentDate').optional().isISO8601(),
    body('referenceNumber').optional().trim(),
    body('bankName').optional().trim(),
    body('chequeNumber').optional().trim(),
    body('chequeDate').optional().isISO8601(),
    body('transactionId').optional().trim(),
    body('notes').optional().trim()
  ],
  validate,
  paymentsController.createCustomerPayment
);

// Get customer payment by ID
router.get('/customer/:id',
  authorize('payment_read'),
  [
    param('id').isInt().withMessage('Payment ID must be an integer')
  ],
  validate,
  paymentsController.getCustomerPaymentById
);

// Update customer payment status
router.put('/customer/:id/status',
  authorize('payment_update'),
  [
    param('id').isInt().withMessage('Payment ID must be an integer'),
    body('status').isIn(['completed', 'bounced', 'cancelled']).withMessage('Valid status is required'),
    body('notes').optional().trim()
  ],
  validate,
  paymentsController.updatePaymentStatus
);

// ==================== SUPPLIER PAYMENTS ====================

// Get supplier ledger (before :id routes)
router.get('/supplier/ledger/:supplierId',
  authorize('payment_read'),
  [
    param('supplierId').isInt().withMessage('Supplier ID must be an integer'),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  validate,
  paymentsController.getSupplierLedger
);

// Get all supplier payments
router.get('/supplier',
  authorize('payment_read'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim(),
    query('supplierId').optional().isInt(),
    query('paymentMethod').optional().isIn(['cheque', 'bank_transfer', 'neft', 'rtgs', 'imps']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  validate,
  paymentsController.getSupplierPayments
);

// Create supplier payment
router.post('/supplier',
  authorize('payment_create'),
  [
    body('supplierId').isInt().withMessage('Supplier ID is required'),
    body('purchaseOrderId').optional().isInt(),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('paymentMethod').isIn(['cheque', 'bank_transfer', 'neft', 'rtgs', 'imps']).withMessage('Valid payment method is required'),
    body('paymentDate').optional().isISO8601(),
    body('referenceNumber').optional().trim(),
    body('bankName').optional().trim(),
    body('chequeNumber').optional().trim(),
    body('chequeDate').optional().isISO8601(),
    body('transactionId').optional().trim(),
    body('notes').optional().trim()
  ],
  validate,
  paymentsController.createSupplierPayment
);

// Get supplier payment by ID
router.get('/supplier/:id',
  authorize('payment_read'),
  [
    param('id').isInt().withMessage('Payment ID must be an integer')
  ],
  validate,
  paymentsController.getSupplierPaymentById
);

// Approve supplier payment
router.post('/supplier/:id/approve',
  authorize('payment_approve'),
  [
    param('id').isInt().withMessage('Payment ID must be an integer')
  ],
  validate,
  paymentsController.approveSupplierPayment
);

// Process supplier payment
router.post('/supplier/:id/process',
  authorize('payment_approve'),
  [
    param('id').isInt().withMessage('Payment ID must be an integer')
  ],
  validate,
  paymentsController.processSupplierPayment
);

module.exports = router;
