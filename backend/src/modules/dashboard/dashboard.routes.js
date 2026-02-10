const express = require('express');
const router = express.Router();
const { query } = require('express-validator');
const dashboardController = require('./dashboard.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');

// Apply authentication to all routes
router.use(authenticate);

// Get overview statistics
router.get(
  '/stats',
  dashboardController.getOverviewStats
);

// Get recent activities
router.get(
  '/activities',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('type').optional().isString(),
    query('userId').optional().isInt()
  ],
  validate,
  dashboardController.getRecentActivities
);

// Get sales chart data
router.get(
  '/charts/sales',
  [
    query('period').optional().isIn(['last7days', 'last30days', 'last90days', 'thisYear']),
    query('groupBy').optional().isIn(['day', 'week', 'month'])
  ],
  validate,
  dashboardController.getSalesChartData
);

// Get pending tasks
router.get(
  '/tasks',
  dashboardController.getPendingTasks
);

// Get top products
router.get(
  '/top-products',
  [
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('period').optional().isIn(['thisWeek', 'thisMonth', 'thisYear'])
  ],
  validate,
  dashboardController.getTopProducts
);

// Get top customers
router.get(
  '/top-customers',
  [
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('period').optional().isIn(['thisWeek', 'thisMonth', 'thisYear'])
  ],
  validate,
  dashboardController.getTopCustomers
);

// Get warehouse statistics
router.get(
  '/warehouses',
  authorize('warehouse_view', 'reports_view'),
  dashboardController.getWarehouseStats
);

module.exports = router;
