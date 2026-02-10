const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();
const dispatchController = require('./dispatch.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');

// Apply authentication to all routes
router.use(authenticate);

// ==================== CARRIERS ====================

router.get('/carriers',
  authorize('dispatch_read'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('isActive').optional().isIn(['true', 'false'])
  ],
  validate,
  dispatchController.getCarriers
);

router.post('/carriers',
  authorize('dispatch_create'),
  [
    body('name').trim().notEmpty().withMessage('Carrier name is required'),
    body('code').trim().notEmpty().withMessage('Carrier code is required'),
    body('trackingUrl').optional().trim(),
    body('contactPhone').optional().trim(),
    body('contactEmail').optional().isEmail(),
    body('isActive').optional().isBoolean()
  ],
  validate,
  dispatchController.createCarrier
);

router.put('/carriers/:id',
  authorize('dispatch_update'),
  [
    param('id').isInt().withMessage('Carrier ID must be an integer'),
    body('name').optional().trim(),
    body('trackingUrl').optional().trim(),
    body('contactPhone').optional().trim(),
    body('contactEmail').optional().isEmail(),
    body('isActive').optional().isBoolean()
  ],
  validate,
  dispatchController.updateCarrier
);

// ==================== DISPATCHES ====================

router.get('/',
  authorize('dispatch_read'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim(),
    query('status').optional().isIn(['pending', 'picking', 'picked', 'packing', 'packed', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled']),
    query('warehouseId').optional().isInt(),
    query('carrierId').optional().isInt(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  validate,
  dispatchController.getDispatches
);

router.post('/',
  authorize('dispatch_create'),
  [
    body('salesOrderId').isInt().withMessage('Sales Order ID is required'),
    body('carrierId').optional().isInt(),
    body('shippingMethod').optional().trim(),
    body('expectedDeliveryDate').optional().isISO8601(),
    body('shippingAddress').optional().trim(),
    body('contactName').optional().trim(),
    body('contactPhone').optional().trim(),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.productId').isInt().withMessage('Product ID is required'),
    body('items.*.dispatchQuantity').optional().isInt({ min: 1 }),
    body('notes').optional().trim()
  ],
  validate,
  dispatchController.createDispatch
);

router.get('/:id',
  authorize('dispatch_read'),
  [
    param('id').isInt().withMessage('Dispatch ID must be an integer')
  ],
  validate,
  dispatchController.getDispatchById
);

router.patch('/:id/status',
  authorize('dispatch_update'),
  [
    param('id').isInt().withMessage('Dispatch ID must be an integer'),
    body('status').notEmpty().withMessage('Status is required')
  ],
  validate,
  dispatchController.updateStatus
);

router.get('/:id/tracking',
  authorize('dispatch_read'),
  [
    param('id').isInt().withMessage('Dispatch ID must be an integer')
  ],
  validate,
  dispatchController.getTrackingHistory
);

// Picking workflow
router.post('/:id/start-picking',
  authorize('dispatch_update'),
  [
    param('id').isInt().withMessage('Dispatch ID must be an integer')
  ],
  validate,
  dispatchController.startPicking
);

router.put('/:id/picking',
  authorize('dispatch_update'),
  [
    param('id').isInt().withMessage('Dispatch ID must be an integer'),
    body('items').isArray({ min: 1 }),
    body('items.*.productId').isInt(),
    body('items.*.pickedQuantity').isInt({ min: 0 })
  ],
  validate,
  dispatchController.updatePickedQuantities
);

router.post('/:id/complete-picking',
  authorize('dispatch_update'),
  [
    param('id').isInt().withMessage('Dispatch ID must be an integer')
  ],
  validate,
  dispatchController.completePicking
);

// Packing workflow
router.post('/:id/start-packing',
  authorize('dispatch_update'),
  [
    param('id').isInt().withMessage('Dispatch ID must be an integer')
  ],
  validate,
  dispatchController.startPacking
);

router.put('/:id/packing',
  authorize('dispatch_update'),
  [
    param('id').isInt().withMessage('Dispatch ID must be an integer'),
    body('items').isArray({ min: 1 }),
    body('items.*.productId').isInt(),
    body('items.*.packedQuantity').isInt({ min: 0 }),
    body('totalPackages').optional().isInt({ min: 1 }),
    body('totalWeight').optional().isFloat({ min: 0 }),
    body('dimensions').optional().trim()
  ],
  validate,
  dispatchController.updatePackedQuantities
);

router.post('/:id/complete-packing',
  authorize('dispatch_update'),
  [
    param('id').isInt().withMessage('Dispatch ID must be an integer')
  ],
  validate,
  dispatchController.completePacking
);

// Shipping
router.post('/:id/ship',
  authorize('dispatch_update'),
  [
    param('id').isInt().withMessage('Dispatch ID must be an integer'),
    body('trackingNumber').optional().trim(),
    body('awbNumber').optional().trim(),
    body('vehicleNumber').optional().trim(),
    body('driverName').optional().trim(),
    body('driverPhone').optional().trim()
  ],
  validate,
  dispatchController.ship
);

// Tracking
router.post('/:id/tracking',
  authorize('dispatch_update'),
  [
    param('id').isInt().withMessage('Dispatch ID must be an integer'),
    body('status').isIn(['in_transit', 'out_for_delivery', 'delivered', 'exception']).withMessage('Valid status is required'),
    body('location').trim().notEmpty().withMessage('Location is required'),
    body('description').optional().trim(),
    body('timestamp').optional().isISO8601()
  ],
  validate,
  dispatchController.addTrackingUpdate
);

// Mark delivered
router.post('/:id/delivered',
  authorize('dispatch_update'),
  [
    param('id').isInt().withMessage('Dispatch ID must be an integer'),
    body('receivedBy').optional().trim(),
    body('notes').optional().trim(),
    body('location').optional().trim()
  ],
  validate,
  dispatchController.markDelivered
);

// Delivery
router.post('/:id/deliver',
  authorize('dispatch_update'),
  [
    param('id').isInt().withMessage('Dispatch ID must be an integer'),
    body('receivedBy').trim().notEmpty().withMessage('Receiver name is required'),
    body('location').optional().trim(),
    body('notes').optional().trim(),
    body('proofOfDelivery').optional().trim()
  ],
  validate,
  dispatchController.markDelivered
);

module.exports = router;
