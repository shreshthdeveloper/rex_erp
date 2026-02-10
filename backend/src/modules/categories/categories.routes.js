const express = require('express');
const router = express.Router();
const categoriesController = require('./categories.controller');
const { authenticateToken } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/rbac.middleware');
const { body } = require('express-validator');
const { validate } = require('../../middleware/validation.middleware');

// Validation rules
const categoryValidation = [
  body('category_name').notEmpty().trim(),
  body('slug').optional().trim(),
  body('parent_id').optional().custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    if (Number.isInteger(Number(value)) && Number(value) >= 1) return true;
    throw new Error('Parent ID must be a positive integer');
  }),
  body('description').optional().trim(),
  body('is_active').optional().isBoolean()
];

const attributeValidation = [
  body('attribute_name').notEmpty().trim(),
  body('attribute_type').isIn(['TEXT', 'NUMBER', 'SELECT', 'MULTISELECT', 'COLOR']),
  body('is_variant_attribute').optional().isBoolean(),
  body('is_filterable').optional().isBoolean(),
  body('is_required').optional().isBoolean(),
  body('display_order').optional().isInt()
];

const attributeValueValidation = [
  body('value').notEmpty().trim(),
  body('display_value').optional().trim(),
  body('color_code').optional().matches(/^#[0-9A-Fa-f]{6}$/),
  body('display_order').optional().isInt()
];

// All routes require authentication
router.use(authenticateToken);

// Category routes
router.post('/', requirePermission('CATEGORY_CREATE'), categoryValidation, validate, categoriesController.createCategory);
router.get('/', requirePermission('CATEGORY_VIEW'), categoriesController.getCategories);
router.get('/:id', requirePermission('CATEGORY_VIEW'), categoriesController.getCategoryById);
router.put('/:id', requirePermission('CATEGORY_UPDATE'), categoryValidation, validate, categoriesController.updateCategory);
router.delete('/:id', requirePermission('CATEGORY_DELETE'), categoriesController.deleteCategory);

// Attribute routes
router.post('/attributes', requirePermission('CATEGORY_CREATE'), attributeValidation, validate, categoriesController.createAttribute);
router.get('/attributes', requirePermission('CATEGORY_VIEW'), categoriesController.getAttributes);
router.get('/attributes/:id', requirePermission('CATEGORY_VIEW'), categoriesController.getAttributeById);
router.put('/attributes/:id', requirePermission('CATEGORY_UPDATE'), attributeValidation, validate, categoriesController.updateAttribute);
router.delete('/attributes/:id', requirePermission('CATEGORY_DELETE'), categoriesController.deleteAttribute);

// Attribute value routes
router.post('/attributes/:id/values', requirePermission('CATEGORY_CREATE'), attributeValueValidation, validate, categoriesController.addAttributeValue);
router.put('/attributes/:id/values/:valueId', requirePermission('CATEGORY_UPDATE'), attributeValueValidation, validate, categoriesController.updateAttributeValue);
router.delete('/attributes/:id/values/:valueId', requirePermission('CATEGORY_DELETE'), categoriesController.deleteAttributeValue);

module.exports = router;
