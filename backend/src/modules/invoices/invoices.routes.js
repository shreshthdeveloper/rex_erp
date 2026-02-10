const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();
const invoicesController = require('./invoices.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');

// Apply authentication to all routes
router.use(authenticate);

// Get aging report (before :id routes)
router.get('/aging',
  authorize('invoice_read'),
  [
    query('asOfDate').optional().isISO8601()
  ],
  validate,
  invoicesController.getAgingReport
);

// Get all invoices
router.get('/',
  authorize('invoice_read'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim(),
    query('status').optional().isIn(['unpaid', 'sent', 'partial', 'paid', 'overdue', 'void']),
    query('customerId').optional().isInt(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('overdue').optional().isIn(['true', 'false'])
  ],
  validate,
  invoicesController.getInvoices
);

// Create invoice
router.post('/',
  authorize('invoice_create'),
  [
    body('customerId').isInt().withMessage('Customer ID is required'),
    body('dueDate').isISO8601().withMessage('Due date is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.productId').isInt().withMessage('Product ID is required'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Unit price is required'),
    body('items.*.description').optional().trim(),
    body('items.*.taxPercent').optional().isFloat({ min: 0, max: 100 }),
    body('items.*.discountAmount').optional().isFloat({ min: 0 }),
    body('discountAmount').optional().isFloat({ min: 0 }),
    body('shippingAmount').optional().isFloat({ min: 0 }),
    body('notes').optional().trim(),
    body('termsAndConditions').optional().trim()
  ],
  validate,
  invoicesController.createInvoice
);

// Get invoice by ID
router.get('/:id',
  authorize('invoice_read'),
  [
    param('id').isInt().withMessage('Invoice ID must be an integer')
  ],
  validate,
  invoicesController.getInvoiceById
);

// Update invoice
router.put('/:id',
  authorize('invoice_update'),
  [
    param('id').isInt().withMessage('Invoice ID must be an integer'),
    body('notes').optional().trim(),
    body('termsAndConditions').optional().trim(),
    body('dueDate').optional().isISO8601()
  ],
  validate,
  invoicesController.updateInvoice
);

// Mark invoice as sent
router.post('/:id/send',
  authorize('invoice_update'),
  [
    param('id').isInt().withMessage('Invoice ID must be an integer'),
    body('to').optional().isEmail().withMessage('Invalid email'),
    body('cc').optional().isEmail(),
    body('subject').optional().trim(),
    body('message').optional().trim()
  ],
  validate,
  invoicesController.sendInvoice
);

// Mark as sent (without email)
router.post('/:id/mark-sent',
  authorize('invoice_update'),
  [
    param('id').isInt().withMessage('Invoice ID must be an integer')
  ],
  validate,
  invoicesController.markAsSent
);

// Void invoice
router.post('/:id/void',
  authorize('invoice_delete'),
  [
    param('id').isInt().withMessage('Invoice ID must be an integer'),
    body('reason').trim().notEmpty().withMessage('Void reason is required')
  ],
  validate,
  invoicesController.voidInvoice
);

// Generate PDF
router.get('/:id/pdf',
  authorize('invoice_read'),
  [
    param('id').isInt().withMessage('Invoice ID must be an integer')
  ],
  validate,
  invoicesController.generatePDF
);

module.exports = router;
