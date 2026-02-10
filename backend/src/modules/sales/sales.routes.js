const express = require('express');
const router = express.Router();
const salesController = require('./sales.controller');
const { authenticateToken } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/rbac.middleware');
const { body, param } = require('express-validator');
const { validate } = require('../../middleware/validation.middleware');

const orderValidation = [
  body('customer_id').isInt().withMessage('Customer ID is required'),
  body('warehouse_id').isInt().withMessage('Warehouse ID is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  validate
];

const idValidation = [
  param('id').isInt().withMessage('Order ID must be an integer'),
  validate
];

router.use(authenticateToken);

// CRUD operations
router.post('/', requirePermission('ORDER_CREATE'), orderValidation, salesController.createOrder);
router.get('/', requirePermission('ORDER_VIEW'), salesController.getOrders);
router.get('/overdue', requirePermission('ORDER_VIEW'), salesController.getOverdueOrders);
router.get('/:id', requirePermission('ORDER_VIEW'), idValidation, salesController.getOrderById);
router.put('/:id/status', requirePermission('ORDER_UPDATE'), idValidation, salesController.updateOrderStatus);

// Order actions
router.post('/:id/confirm', requirePermission('ORDER_APPROVE'), idValidation, salesController.confirmOrder);
router.post('/:id/hold', requirePermission('ORDER_UPDATE'), idValidation, [
  body('reason').trim().notEmpty().withMessage('Hold reason is required'),
  validate
], salesController.holdOrder);
router.post('/:id/release-hold', requirePermission('ORDER_UPDATE'), idValidation, salesController.releaseHold);
router.post('/:id/cancel', requirePermission('ORDER_UPDATE'), idValidation, salesController.cancelOrder);
router.post('/:id/generate-invoice', requirePermission('INVOICE_CREATE'), idValidation, salesController.generateInvoice);

// Order info
router.get('/:id/payment-history', requirePermission('ORDER_VIEW'), idValidation, salesController.getPaymentHistory);
router.get('/:id/timeline', requirePermission('ORDER_VIEW'), idValidation, salesController.getOrderTimeline);

module.exports = router;
