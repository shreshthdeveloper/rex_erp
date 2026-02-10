const express = require('express');
const router = express.Router();
const productsController = require('./products.controller');
const { authenticateToken } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/rbac.middleware');
const { body } = require('express-validator');
const { validate } = require('../../middleware/validation.middleware');

const productValidation = [
  body('product_name').notEmpty().withMessage('Product name is required'),
  body('selling_price').isFloat({ min: 0 }).withMessage('Selling price must be a positive number'),
  validate
];

router.use(authenticateToken);

router.post('/', requirePermission('PRODUCT_CREATE'), productValidation, productsController.createProduct);
router.get('/', requirePermission('PRODUCT_VIEW'), productsController.getProducts);
router.get('/:id', requirePermission('PRODUCT_VIEW'), productsController.getProductById);
router.put('/:id', requirePermission('PRODUCT_UPDATE'), productValidation, productsController.updateProduct);
router.delete('/:id', requirePermission('PRODUCT_DELETE'), productsController.deleteProduct);
router.get('/:id/inventory', requirePermission('PRODUCT_VIEW'), productsController.getProductInventory);

module.exports = router;
