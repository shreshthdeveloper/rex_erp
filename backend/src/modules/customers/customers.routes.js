const express = require('express');
const router = express.Router();
const customersController = require('./customers.controller');
const { authenticateToken } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/rbac.middleware');
const { body } = require('express-validator');
const { validate } = require('../../middleware/validation.middleware');

// Validation
const customerValidation = [
  body('company_name').notEmpty().withMessage('Company name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('billing_country_id').isInt().withMessage('Billing country is required'),
  validate
];

// All routes require authentication
router.use(authenticateToken);

router.post('/', requirePermission('CUSTOMER_CREATE'), customerValidation, customersController.createCustomer);
router.get('/', requirePermission('CUSTOMER_VIEW'), customersController.getCustomers);
router.get('/:id', requirePermission('CUSTOMER_VIEW'), customersController.getCustomerById);
router.put('/:id', requirePermission('CUSTOMER_UPDATE'), customerValidation, customersController.updateCustomer);
router.delete('/:id', requirePermission('CUSTOMER_DELETE'), customersController.deleteCustomer);
router.get('/:id/credit-status', requirePermission('CUSTOMER_VIEW'), customersController.getCreditStatus);

module.exports = router;
