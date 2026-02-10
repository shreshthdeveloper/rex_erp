const { Op } = require('sequelize');
const {
  Dispatch,
  DispatchItem,
  SalesOrder,
  SalesOrderItem,
  ShippingCarrier,
  TrackingUpdate,
  Customer,
  Warehouse,
  Product,
  Inventory,
  InventoryTransaction,
  User,
  sequelize
} = require('../../models');
const { AppError } = require('../../middleware/error.middleware');

class DispatchService {
  // ==================== DISPATCHES ====================

  async findAll(options = {}) {
    const { page = 1, limit = 20, search, status, warehouseId, carrierId, startDate, endDate } = options;

    const where = {};
    if (search) {
      where[Op.or] = [
        { dispatchNumber: { [Op.like]: `%${search}%` } },
        { trackingNumber: { [Op.like]: `%${search}%` } }
      ];
    }
    if (status) where.status = status;
    if (warehouseId) where.warehouseId = warehouseId;
    if (carrierId) where.carrierId = carrierId;
    if (startDate || endDate) {
      where.dispatchDate = {};
      if (startDate) where.dispatchDate[Op.gte] = new Date(startDate);
      if (endDate) where.dispatchDate[Op.lte] = new Date(endDate);
    }

    const { rows, count } = await Dispatch.findAndCountAll({
      where,
      include: [
        { model: SalesOrder, as: 'salesOrder', attributes: ['id', 'order_number'] },
        { model: Customer, as: 'customer', attributes: ['id', 'customerCode', 'companyName'] },
        { model: Warehouse, as: 'warehouse', attributes: ['id', 'code', 'name'] },
        { model: ShippingCarrier, as: 'carrier', attributes: ['id', 'name', 'code'] }
      ],
      limit,
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']]
    });

    return {
      dispatches: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    };
  }

  async findById(id) {
    const dispatch = await Dispatch.findByPk(id, {
      include: [
        { model: SalesOrder, as: 'salesOrder' },
        { model: Customer, as: 'customer' },
        { model: Warehouse, as: 'warehouse' },
        { model: ShippingCarrier, as: 'carrier' },
        { model: User, as: 'pickedByUser', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'packedByUser', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'shippedByUser', attributes: ['id', 'firstName', 'lastName'] },
        {
          model: DispatchItem,
          as: 'items',
          include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'sku'] }]
        },
        {
          model: TrackingUpdate,
          as: 'trackingUpdates',
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    return dispatch;
  }

  async create(data, createdBy) {
    const transaction = await sequelize.transaction();

    try {
      const { salesOrderId, items, ...dispatchData } = data;

      // Get sales order
      const salesOrder = await SalesOrder.findByPk(salesOrderId, {
        include: [{ model: SalesOrderItem, as: 'items' }],
        transaction
      });

      if (!salesOrder) {
        throw new AppError('Sales order not found', 404, 'NOT_FOUND');
      }

      if (!['CONFIRMED', 'PROCESSING'].includes(salesOrder.status)) {
        throw new AppError('Sales order is not ready for dispatch', 400, 'INVALID_STATUS');
      }

      // Generate dispatch number
      const count = await Dispatch.count({ transaction });
      const dispatchNumber = `DSP${new Date().getFullYear()}${String(count + 1).padStart(6, '0')}`;

      const dispatch = await Dispatch.create({
        dispatchNumber,
        salesOrderId,
        customerId: salesOrder.customer_id,
        warehouseId: salesOrder.warehouse_id,
        dispatchDate: dispatchData.dispatchDate || new Date(),
        carrierId: dispatchData.carrierId,
        shippingMethod: dispatchData.shippingMethod,
        expectedDeliveryDate: dispatchData.expectedDeliveryDate,
        shippingAddress: dispatchData.shippingAddress || salesOrder.shipping_address,
        shippingCity: dispatchData.shippingCity,
        shippingState: dispatchData.shippingState,
        shippingPincode: dispatchData.shippingPincode,
        shippingCountry: dispatchData.shippingCountry,
        contactName: dispatchData.contactName,
        contactPhone: dispatchData.contactPhone,
        notes: dispatchData.notes,
        status: 'pending',
        createdBy
      }, { transaction });

      // Create dispatch items
      for (const item of items) {
        const soItem = salesOrder.items.find(si => si.product_id === item.productId);
        if (!soItem) {
          throw new AppError(`Product ${item.productId} not in sales order`, 400, 'INVALID_PRODUCT');
        }

        await DispatchItem.create({
          dispatchId: dispatch.id,
          productId: item.productId,
          orderedQuantity: soItem.quantity,
          dispatchQuantity: item.dispatchQuantity || soItem.quantity,
          pickedQuantity: 0,
          packedQuantity: 0,
          notes: item.notes
        }, { transaction });
      }

      await transaction.commit();

      return this.findById(dispatch.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async startPicking(id, pickedBy) {
    const dispatch = await Dispatch.findByPk(id);

    if (!dispatch) {
      throw new AppError('Dispatch not found', 404, 'NOT_FOUND');
    }

    if (dispatch.status !== 'pending') {
      throw new AppError('Dispatch is not in pending status', 400, 'INVALID_STATUS');
    }

    await dispatch.update({
      status: 'picking',
      pickingStartedAt: new Date(),
      pickedBy
    });

    return this.findById(id);
  }

  async updatePickedQuantities(id, items, pickedBy) {
    const transaction = await sequelize.transaction();

    try {
      const dispatch = await Dispatch.findByPk(id, {
        include: [{ model: DispatchItem, as: 'items' }],
        transaction
      });

      if (!dispatch) {
        throw new AppError('Dispatch not found', 404, 'NOT_FOUND');
      }

      if (dispatch.status !== 'picking') {
        throw new AppError('Dispatch is not in picking status', 400, 'INVALID_STATUS');
      }

      for (const item of items) {
        const dispatchItem = dispatch.items.find(di => di.productId === item.productId);
        if (dispatchItem) {
          await DispatchItem.update(
            {
              pickedQuantity: item.pickedQuantity,
              pickingNotes: item.notes
            },
            { where: { id: dispatchItem.id }, transaction }
          );
        }
      }

      await dispatch.update({
        pickedBy,
        pickingCompletedAt: new Date()
      }, { transaction });

      await transaction.commit();

      return this.findById(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async completePicking(id) {
    const dispatch = await Dispatch.findByPk(id, {
      include: [{ model: DispatchItem, as: 'items' }]
    });

    if (!dispatch) {
      throw new AppError('Dispatch not found', 404, 'NOT_FOUND');
    }

    // Verify all items are picked
    const unpicked = dispatch.items.filter(item => item.pickedQuantity < item.dispatchQuantity);
    if (unpicked.length > 0) {
      // Allow partial picking
    }

    await dispatch.update({
      status: 'picked',
      pickingCompletedAt: new Date()
    });

    return this.findById(id);
  }

  async startPacking(id, packedBy) {
    const dispatch = await Dispatch.findByPk(id);

    if (!dispatch) {
      throw new AppError('Dispatch not found', 404, 'NOT_FOUND');
    }

    if (dispatch.status !== 'picked') {
      throw new AppError('Dispatch has not completed picking', 400, 'INVALID_STATUS');
    }

    await dispatch.update({
      status: 'packing',
      packingStartedAt: new Date(),
      packedBy
    });

    return this.findById(id);
  }

  async updatePackedQuantities(id, items, packingData) {
    const transaction = await sequelize.transaction();

    try {
      const dispatch = await Dispatch.findByPk(id, {
        include: [{ model: DispatchItem, as: 'items' }],
        transaction
      });

      if (!dispatch) {
        throw new AppError('Dispatch not found', 404, 'NOT_FOUND');
      }

      if (dispatch.status !== 'packing') {
        throw new AppError('Dispatch is not in packing status', 400, 'INVALID_STATUS');
      }

      for (const item of items) {
        const dispatchItem = dispatch.items.find(di => di.productId === item.productId);
        if (dispatchItem) {
          await DispatchItem.update(
            {
              packedQuantity: item.packedQuantity,
              packageNumber: item.packageNumber,
              packingNotes: item.notes
            },
            { where: { id: dispatchItem.id }, transaction }
          );
        }
      }

      await dispatch.update({
        totalPackages: packingData.totalPackages,
        totalWeight: packingData.totalWeight,
        dimensions: packingData.dimensions
      }, { transaction });

      await transaction.commit();

      return this.findById(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async completePacking(id) {
    const dispatch = await Dispatch.findByPk(id);

    if (!dispatch) {
      throw new AppError('Dispatch not found', 404, 'NOT_FOUND');
    }

    await dispatch.update({
      status: 'packed',
      packingCompletedAt: new Date()
    });

    return this.findById(id);
  }

  async ship(id, shippingData, shippedBy) {
    const transaction = await sequelize.transaction();

    try {
      const dispatch = await Dispatch.findByPk(id, {
        include: [
          { model: DispatchItem, as: 'items' },
          { model: SalesOrder, as: 'salesOrder' }
        ],
        transaction
      });

      if (!dispatch) {
        throw new AppError('Dispatch not found', 404, 'NOT_FOUND');
      }

      if (dispatch.status !== 'packed') {
        throw new AppError('Dispatch has not completed packing', 400, 'INVALID_STATUS');
      }

      // Deduct inventory
      for (const item of dispatch.items) {
        const inventory = await Inventory.findOne({
          where: { warehouseId: dispatch.warehouseId, productId: item.productId },
          transaction
        });

        if (inventory) {
          const prevQty = inventory.quantity;
          const newQty = prevQty - item.packedQuantity;

          await inventory.update({
            quantity: newQty,
            reservedQuantity: Math.max(0, inventory.reservedQuantity - item.packedQuantity)
          }, { transaction });

          // Create inventory transaction
          await InventoryTransaction.create({
            warehouseId: dispatch.warehouseId,
            productId: item.productId,
            transactionType: 'outward',
            quantity: item.packedQuantity,
            referenceType: 'dispatch',
            referenceId: dispatch.id,
            previousQuantity: prevQty,
            newQuantity: newQty,
            notes: `Dispatch ${dispatch.dispatchNumber}`,
            createdBy: shippedBy
          }, { transaction });
        }
      }

      await dispatch.update({
        status: 'shipped',
        trackingNumber: shippingData.trackingNumber,
        awbNumber: shippingData.awbNumber,
        shippedAt: new Date(),
        shippedBy,
        vehicleNumber: shippingData.vehicleNumber,
        driverName: shippingData.driverName,
        driverPhone: shippingData.driverPhone
      }, { transaction });

      // Update sales order status
      await dispatch.salesOrder.update({
        status: 'SHIPPED'
      }, { transaction });

      // Create initial tracking update
      await TrackingUpdate.create({
        dispatchId: dispatch.id,
        status: 'shipped',
        location: dispatch.warehouse?.name || 'Warehouse',
        description: 'Shipment dispatched',
        timestamp: new Date(),
        createdBy: shippedBy
      }, { transaction });

      await transaction.commit();

      return this.findById(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async addTrackingUpdate(id, updateData, createdBy) {
    const dispatch = await Dispatch.findByPk(id);

    if (!dispatch) {
      throw new AppError('Dispatch not found', 404, 'NOT_FOUND');
    }

    if (!['shipped', 'in_transit', 'out_for_delivery'].includes(dispatch.status)) {
      throw new AppError('Cannot add tracking update to this dispatch', 400, 'INVALID_STATUS');
    }

    const trackingUpdate = await TrackingUpdate.create({
      dispatchId: id,
      status: updateData.status,
      location: updateData.location,
      description: updateData.description,
      timestamp: updateData.timestamp || new Date(),
      createdBy
    });

    // Update dispatch status if needed
    if (['in_transit', 'out_for_delivery'].includes(updateData.status)) {
      await dispatch.update({ status: updateData.status });
    }

    return trackingUpdate;
  }

  async markDelivered(id, deliveryData, deliveredBy) {
    const transaction = await sequelize.transaction();

    try {
      const dispatch = await Dispatch.findByPk(id, {
        include: [{ model: SalesOrder, as: 'salesOrder' }],
        transaction
      });

      if (!dispatch) {
        throw new AppError('Dispatch not found', 404, 'NOT_FOUND');
      }

      if (!['shipped', 'in_transit', 'out_for_delivery'].includes(dispatch.status)) {
        throw new AppError('Cannot mark as delivered', 400, 'INVALID_STATUS');
      }

      await dispatch.update({
        status: 'delivered',
        deliveredAt: new Date(),
        receivedBy: deliveryData.receivedBy,
        deliveryNotes: deliveryData.notes,
        proofOfDelivery: deliveryData.proofOfDelivery
      }, { transaction });

      // Update sales order
      await dispatch.salesOrder.update({
        status: 'DELIVERED'
      }, { transaction });

      // Create tracking update
      await TrackingUpdate.create({
        dispatchId: id,
        status: 'delivered',
        location: deliveryData.location || 'Destination',
        description: `Delivered. Received by: ${deliveryData.receivedBy}`,
        timestamp: new Date(),
        createdBy: deliveredBy
      }, { transaction });

      await transaction.commit();

      return this.findById(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getTrackingHistory(id) {
    const dispatch = await Dispatch.findByPk(id, {
      include: [
        {
          model: TrackingUpdate,
          as: 'trackingUpdates',
          order: [['timestamp', 'ASC']]
        }
      ]
    });

    if (!dispatch) {
      throw new AppError('Dispatch not found', 404, 'NOT_FOUND');
    }

    return {
      dispatchId: id,
      dispatchNumber: dispatch.dispatchNumber,
      trackingNumber: dispatch.trackingNumber,
      currentStatus: dispatch.status,
      history: dispatch.trackingUpdates
    };
  }

  // ==================== SHIPPING CARRIERS ====================

  async getCarriers(options = {}) {
    const { page = 1, limit = 50, isActive } = options;

    const where = {};
    if (isActive !== undefined) where.isActive = isActive;

    const { rows, count } = await ShippingCarrier.findAndCountAll({
      where,
      limit,
      offset: (page - 1) * limit,
      order: [['name', 'ASC']]
    });

    return {
      carriers: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    };
  }

  async createCarrier(data) {
    const carrier = await ShippingCarrier.create(data);
    return carrier;
  }

  async updateCarrier(id, data) {
    const carrier = await ShippingCarrier.findByPk(id);

    if (!carrier) {
      throw new AppError('Carrier not found', 404, 'NOT_FOUND');
    }

    await carrier.update(data);
    return carrier;
  }
}

module.exports = new DispatchService();
