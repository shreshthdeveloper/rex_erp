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
        { dispatch_number: { [Op.like]: `%${search}%` } },
        { tracking_number: { [Op.like]: `%${search}%` } }
      ];
    }
    if (status) {
      const statusMap = {
        pending: 'PENDING',
        picking: 'PICKING',
        packed: 'PACKED',
        ready_to_ship: 'READY_TO_SHIP',
        shipped: 'SHIPPED',
        in_transit: 'IN_TRANSIT',
        out_for_delivery: 'OUT_FOR_DELIVERY',
        delivered: 'DELIVERED',
        failed: 'FAILED'
      };
      where.status = statusMap[status] || status.toUpperCase();
    }
    if (warehouseId) where.warehouse_id = warehouseId;
    if (carrierId) where.carrier_id = carrierId;
    if (startDate || endDate) {
      where.dispatch_date = {};
      if (startDate) where.dispatch_date[Op.gte] = new Date(startDate);
      if (endDate) where.dispatch_date[Op.lte] = new Date(endDate);
    }

    const { rows, count } = await Dispatch.findAndCountAll({
      where,
      include: [
        { model: SalesOrder, attributes: ['id', 'order_number'], include: [{ model: Customer, attributes: ['id', 'customer_code', 'company_name'] }] },
        { model: Warehouse, attributes: ['id', 'warehouse_code', 'warehouse_name'] },
        { model: ShippingCarrier, attributes: ['id', 'carrier_name', 'carrier_code'] }
      ],
      limit,
      offset: (page - 1) * limit,
      order: [['created_at', 'DESC']]
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
        { model: SalesOrder, include: [{ model: Customer }] },
        { model: Warehouse },
        { model: ShippingCarrier },
        { model: User, as: 'packer', attributes: ['id', 'first_name', 'last_name'] },
        { model: User, as: 'shipper', attributes: ['id', 'first_name', 'last_name'] },
        {
          model: DispatchItem,
          as: 'items',
          include: [{ model: Product, attributes: ['id', 'product_name', 'sku'] }]
        },
        {
          model: TrackingUpdate,
          as: 'trackingUpdates',
          order: [['event_time', 'DESC']]
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
        dispatch_number: dispatchNumber,
        sales_order_id: salesOrderId,
        warehouse_id: salesOrder.warehouse_id,
        carrier_id: dispatchData.carrierId || null,
        dispatch_date: dispatchData.dispatchDate || new Date(),
        expected_delivery_date: dispatchData.expectedDeliveryDate || null,
        notes: dispatchData.notes,
        status: 'PENDING'
      }, { transaction });

      // Create dispatch items
      for (const item of items) {
        const soItem = salesOrder.items.find(si => si.product_id === item.productId);
        if (!soItem) {
          throw new AppError(`Product ${item.productId} not in sales order`, 400, 'INVALID_PRODUCT');
        }

        const requestedQty = item.dispatchQuantity || soItem.quantity;

        await DispatchItem.create({
          dispatch_id: dispatch.id,
          sales_order_item_id: soItem.id,
          product_id: item.productId,
          quantity_ordered: requestedQty,
          quantity_picked: 0,
          quantity_packed: 0,
          quantity_shipped: 0,
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

  async updateStatus(id, status) {
    const dispatch = await Dispatch.findByPk(id);

    if (!dispatch) {
      throw new AppError('Dispatch not found', 404, 'NOT_FOUND');
    }

    const normalized = status ? status.toUpperCase() : '';
    const allowed = ['PENDING', 'PICKING', 'PACKED', 'READY_TO_SHIP', 'SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED'];
    if (!allowed.includes(normalized)) {
      throw new AppError('Invalid status', 400, 'INVALID_STATUS');
    }

    await dispatch.update({ status: normalized });
    return this.findById(id);
  }

  async startPicking(id, pickedBy) {
    const dispatch = await Dispatch.findByPk(id);

    if (!dispatch) {
      throw new AppError('Dispatch not found', 404, 'NOT_FOUND');
    }

    if (dispatch.status !== 'PENDING') {
      throw new AppError('Dispatch is not in pending status', 400, 'INVALID_STATUS');
    }

    await dispatch.update({
      status: 'PICKING'
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

      if (dispatch.status !== 'PICKING') {
        throw new AppError('Dispatch is not in picking status', 400, 'INVALID_STATUS');
      }

      for (const item of items) {
        const dispatchItem = dispatch.items.find(di => di.product_id === item.productId);
        if (dispatchItem) {
          await DispatchItem.update(
            {
              quantity_picked: item.pickedQuantity,
              picked_at: new Date(),
              notes: item.notes
            },
            { where: { id: dispatchItem.id }, transaction }
          );
        }
      }

      await dispatch.update({ status: 'PICKING' }, { transaction });

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
    const unpicked = dispatch.items.filter(item => item.quantity_picked < item.quantity_ordered);
    if (unpicked.length > 0) {
      // Allow partial picking
    }

    await dispatch.update({
      status: 'PACKED'
    });

    return this.findById(id);
  }

  async startPacking(id, packedBy) {
    const dispatch = await Dispatch.findByPk(id);

    if (!dispatch) {
      throw new AppError('Dispatch not found', 404, 'NOT_FOUND');
    }

    if (dispatch.status !== 'PACKED') {
      throw new AppError('Dispatch has not completed picking', 400, 'INVALID_STATUS');
    }

    await dispatch.update({
      status: 'PACKED',
      packed_by: packedBy
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

      if (dispatch.status !== 'PACKED') {
        throw new AppError('Dispatch is not in packing status', 400, 'INVALID_STATUS');
      }

      for (const item of items) {
        const dispatchItem = dispatch.items.find(di => di.product_id === item.productId);
        if (dispatchItem) {
          await DispatchItem.update(
            {
              quantity_packed: item.packedQuantity,
              packed_at: new Date(),
              notes: item.notes
            },
            { where: { id: dispatchItem.id }, transaction }
          );
        }
      }

      await dispatch.update({ status: 'PACKED' }, { transaction });

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
      status: 'READY_TO_SHIP'
    });

    return this.findById(id);
  }

  async ship(id, shippingData, shippedBy) {
    const transaction = await sequelize.transaction();

    try {
      const dispatch = await Dispatch.findByPk(id, {
        include: [
          { model: DispatchItem, as: 'items' },
          { model: SalesOrder }
        ],
        transaction
      });

      if (!dispatch) {
        throw new AppError('Dispatch not found', 404, 'NOT_FOUND');
      }

      if (dispatch.status !== 'READY_TO_SHIP') {
        throw new AppError('Dispatch has not completed packing', 400, 'INVALID_STATUS');
      }

      // Deduct inventory
      for (const item of dispatch.items) {
        const inventory = await Inventory.findOne({
          where: { warehouse_id: dispatch.warehouse_id, product_id: item.product_id },
          transaction,
          lock: transaction.LOCK.UPDATE
        });

        if (inventory) {
          const prevQty = inventory.quantity_available;
          const shippedQty = item.quantity_packed || item.quantity_ordered;
          const newQty = prevQty;

          await inventory.update({
            quantity_reserved: Math.max(0, inventory.quantity_reserved - shippedQty)
          }, { transaction });

          // Create inventory transaction
          await InventoryTransaction.create({
            warehouse_id: dispatch.warehouse_id,
            product_id: item.product_id,
            transaction_type: 'OUTWARD',
            quantity: shippedQty,
            reference_type: 'SALES_ORDER',
            reference_id: dispatch.sales_order_id,
            quantity_before: prevQty,
            quantity_after: newQty,
            notes: `Dispatch ${dispatch.dispatch_number}`,
            created_by: shippedBy
          }, { transaction });

          await item.update({ quantity_shipped: shippedQty }, { transaction });
        }
      }

      await dispatch.update({
        status: 'SHIPPED',
        tracking_number: shippingData.trackingNumber || null,
        shipped_at: new Date(),
        shipped_by: shippedBy
      }, { transaction });

      // Update sales order status
      await dispatch.SalesOrder.update({
        status: 'SHIPPED'
      }, { transaction });

      // Create initial tracking update
      await TrackingUpdate.create({
        dispatch_id: dispatch.id,
        tracking_number: dispatch.tracking_number || shippingData.trackingNumber || `DSP-${dispatch.id}`,
        status: 'SHIPPED',
        location: 'Warehouse',
        description: 'Shipment dispatched',
        event_time: new Date()
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

    if (!['SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(dispatch.status)) {
      throw new AppError('Cannot add tracking update to this dispatch', 400, 'INVALID_STATUS');
    }

    const trackingUpdate = await TrackingUpdate.create({
      dispatch_id: id,
      tracking_number: dispatch.tracking_number || updateData.trackingNumber || `DSP-${dispatch.id}`,
      status: updateData.status.toUpperCase(),
      location: updateData.location,
      description: updateData.description,
      event_time: updateData.timestamp || new Date()
    });

    // Update dispatch status if needed
    if (['in_transit', 'out_for_delivery'].includes(updateData.status)) {
      const nextStatus = updateData.status === 'in_transit' ? 'IN_TRANSIT' : 'OUT_FOR_DELIVERY';
      await dispatch.update({ status: nextStatus });
    }

    return trackingUpdate;
  }

  async markDelivered(id, deliveryData, deliveredBy) {
    const transaction = await sequelize.transaction();

    try {
      const dispatch = await Dispatch.findByPk(id, {
        include: [{ model: SalesOrder }],
        transaction
      });

      if (!dispatch) {
        throw new AppError('Dispatch not found', 404, 'NOT_FOUND');
      }

      if (!['SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(dispatch.status)) {
        throw new AppError('Cannot mark as delivered', 400, 'INVALID_STATUS');
      }

      await dispatch.update({
        status: 'DELIVERED',
        actual_delivery_date: new Date()
      }, { transaction });

      // Update sales order
      await dispatch.SalesOrder.update({
        status: 'DELIVERED'
      }, { transaction });

      // Create tracking update
      await TrackingUpdate.create({
        dispatch_id: id,
        tracking_number: dispatch.tracking_number || `DSP-${dispatch.id}`,
        status: 'DELIVERED',
        location: deliveryData.location || 'Destination',
        description: `Delivered${deliveryData.receivedBy ? `. Received by: ${deliveryData.receivedBy}` : ''}`,
        event_time: new Date()
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
          order: [['event_time', 'ASC']]
        }
      ]
    });

    if (!dispatch) {
      throw new AppError('Dispatch not found', 404, 'NOT_FOUND');
    }

    return {
      dispatchId: id,
      dispatchNumber: dispatch.dispatch_number,
      trackingNumber: dispatch.tracking_number,
      currentStatus: dispatch.status,
      history: dispatch.trackingUpdates
    };
  }

  // ==================== SHIPPING CARRIERS ====================

  async getCarriers(options = {}) {
    const { page = 1, limit = 50, isActive } = options;

    const where = {};
    if (isActive !== undefined) where.is_active = isActive;

    const { rows, count } = await ShippingCarrier.findAndCountAll({
      where,
      limit,
      offset: (page - 1) * limit,
      order: [['carrier_name', 'ASC']]
    });

    return {
      carriers: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    };
  }

  async createCarrier(data) {
    const carrier = await ShippingCarrier.create({
      carrier_name: data.name || data.carrier_name,
      carrier_code: data.code || data.carrier_code,
      tracking_url: data.trackingUrl || data.tracking_url,
      contact_phone: data.contactPhone || data.contact_phone,
      contact_email: data.contactEmail || data.contact_email,
      is_active: data.isActive !== undefined ? data.isActive : data.is_active
    });
    return carrier;
  }

  async updateCarrier(id, data) {
    const carrier = await ShippingCarrier.findByPk(id);

    if (!carrier) {
      throw new AppError('Carrier not found', 404, 'NOT_FOUND');
    }

    await carrier.update({
      carrier_name: data.name || data.carrier_name || carrier.carrier_name,
      carrier_code: data.code || data.carrier_code || carrier.carrier_code,
      tracking_url: data.trackingUrl || data.tracking_url || carrier.tracking_url,
      contact_phone: data.contactPhone || data.contact_phone || carrier.contact_phone,
      contact_email: data.contactEmail || data.contact_email || carrier.contact_email,
      is_active: data.isActive !== undefined ? data.isActive : (data.is_active !== undefined ? data.is_active : carrier.is_active)
    });
    return carrier;
  }
}

module.exports = new DispatchService();
