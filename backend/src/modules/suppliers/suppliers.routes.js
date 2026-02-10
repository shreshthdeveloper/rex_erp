const express = require('express');
const router = express.Router();
const suppliersController = require('./suppliers.controller');
const { authenticateToken } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/rbac.middleware');
const { body } = require('express-validator');
const { validate } = require('../../middleware/validation.middleware');

// Validation rules
const supplierValidation = [
  body('company_name').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('country_id').isInt({ min: 1 }),
  body('contact_person').optional().trim(),
  body('phone').optional().trim(),
  body('address_line1').optional().trim(),
  body('city').optional().trim(),
  body('postal_code').optional().trim(),
  body('tax_id').optional().trim(),
  body('payment_terms').optional().isIn(['IMMEDIATE', 'NET_30', 'NET_60', 'NET_90', 'CUSTOM'])
];

// All routes require authentication
router.use(authenticateToken);

// Create supplier
router.post('/', requirePermission('SUPPLIER_CREATE'), supplierValidation, validate, suppliersController.createSupplier);

// Get all suppliers
router.get('/', requirePermission('SUPPLIER_VIEW'), suppliersController.getSuppliers);

// Get supplier by ID
router.get('/:id', requirePermission('SUPPLIER_VIEW'), suppliersController.getSupplierById);

// Update supplier
router.put('/:id', requirePermission('SUPPLIER_UPDATE'), supplierValidation, validate, suppliersController.updateSupplier);

// Delete supplier
router.delete('/:id', requirePermission('SUPPLIER_DELETE'), suppliersController.deleteSupplier);

// Get supplier's purchase orders
router.get('/:id/purchase-orders', requirePermission('SUPPLIER_VIEW'), suppliersController.getSupplierPurchaseOrders);

// Get supplier's payments
router.get('/:id/payments', requirePermission('SUPPLIER_VIEW'), suppliersController.getSupplierPayments);

// Get supplier ledger
router.get('/:id/ledger', requirePermission('SUPPLIER_VIEW'), suppliersController.getSupplierLedger);

module.exports = router;
