const express = require('express');
const router = express.Router();
const { query, body } = require('express-validator');
const reportsController = require('./reports.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');

// Apply authentication to all routes
router.use(authenticate);

// Common date validation
const dateValidation = [
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date')
];

// ============ SALES REPORTS ============

router.get(
  '/sales/summary',
  authorize('reports_view', 'sales_view'),
  [
    ...dateValidation,
    query('warehouseId').optional().isInt(),
    query('customerId').optional().isInt()
  ],
  validate,
  reportsController.getSalesSummary
);

router.get(
  '/sales/by-period',
  authorize('reports_view', 'sales_view'),
  [
    ...dateValidation,
    query('groupBy').optional().isIn(['day', 'week', 'month', 'year']),
    query('warehouseId').optional().isInt()
  ],
  validate,
  reportsController.getSalesByPeriod
);

router.get(
  '/sales/by-product',
  authorize('reports_view', 'sales_view'),
  [
    ...dateValidation,
    query('warehouseId').optional().isInt(),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validate,
  reportsController.getSalesByProduct
);

router.get(
  '/sales/by-customer',
  authorize('reports_view', 'sales_view'),
  [
    ...dateValidation,
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validate,
  reportsController.getSalesByCustomer
);

// ============ INVENTORY REPORTS ============

router.get(
  '/inventory/summary',
  authorize('reports_view', 'inventory_view'),
  [
    query('warehouseId').optional().isInt(),
    query('categoryId').optional().isInt()
  ],
  validate,
  reportsController.getInventorySummary
);

router.get(
  '/inventory/by-warehouse',
  authorize('reports_view', 'inventory_view'),
  reportsController.getInventoryByWarehouse
);

router.get(
  '/inventory/low-stock',
  authorize('reports_view', 'inventory_view'),
  [
    query('warehouseId').optional().isInt(),
    query('threshold').optional().isInt({ min: 0 })
  ],
  validate,
  reportsController.getLowStockReport
);

router.get(
  '/inventory/movement',
  authorize('reports_view', 'inventory_view'),
  [
    ...dateValidation,
    query('warehouseId').optional().isInt(),
    query('productId').optional().isInt()
  ],
  validate,
  reportsController.getInventoryMovement
);

// ============ FINANCIAL REPORTS ============

router.get(
  '/financial/receivables-aging',
  authorize('reports_view', 'accounts_view'),
  reportsController.getReceivablesAgingReport
);

router.get(
  '/financial/payables-aging',
  authorize('reports_view', 'accounts_view'),
  reportsController.getPayablesAgingReport
);

router.get(
  '/financial/profit-loss',
  authorize('reports_view', 'accounts_view'),
  [
    ...dateValidation
  ],
  validate,
  reportsController.getProfitAndLossReport
);

router.get(
  '/financial/tax',
  authorize('reports_view', 'accounts_view'),
  [
    ...dateValidation
  ],
  validate,
  reportsController.getTaxReport
);

// ============ PURCHASE REPORTS ============

router.get(
  '/purchase/summary',
  authorize('reports_view', 'purchase_view'),
  [
    ...dateValidation,
    query('supplierId').optional().isInt()
  ],
  validate,
  reportsController.getPurchaseSummary
);

router.get(
  '/purchase/by-supplier',
  authorize('reports_view', 'purchase_view'),
  [
    ...dateValidation,
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validate,
  reportsController.getPurchasesBySupplier
);

// ============ CUSTOM REPORTS ============

router.post(
  '/custom',
  authorize('reports_view'),
  [
    body('entity').isIn(['sales', 'inventory', 'purchase', 'customer', 'supplier'])
      .withMessage('Invalid entity'),
    body('metrics').isArray({ min: 1 }).withMessage('At least one metric required'),
    body('groupBy').optional().isString(),
    body('filters').optional().isObject(),
    body('sortBy').optional().isString(),
    body('limit').optional().isInt({ min: 1, max: 1000 })
  ],
  validate,
  reportsController.generateCustomReport
);

module.exports = router;
