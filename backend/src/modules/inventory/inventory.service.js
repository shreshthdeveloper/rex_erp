const { Op } = require('sequelize');
const sequelize = require('../../config/database');
const {
  Inventory,
  InventoryTransaction,
  StockAdjustment,
  StockAdjustmentItem,
  WarehouseTransfer,
  WarehouseTransferItem,
  Product,
  Warehouse,
  User
} = require('../../models');
const { AppError } = require('../../middleware/error.middleware');

class InventoryService {
  // ==================== INVENTORY TRANSACTIONS ====================

  async getTransactions(options = {}) {
    const {
      page = 1,
      limit = 50,
      warehouseId,
      productId,
      type,
      referenceType,
      startDate,
      endDate
    } = options;

    const where = {};
    if (warehouseId) where.warehouse_id = warehouseId;
    if (productId) where.product_id = productId;
    if (type) where.transaction_type = type.toUpperCase();
    if (referenceType) where.reference_type = referenceType.toUpperCase();
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at[Op.gte] = new Date(startDate);
      if (endDate) where.created_at[Op.lte] = new Date(endDate);
    }

    const { rows, count } = await InventoryTransaction.findAndCountAll({
      where,
      include: [
        { model: Product, attributes: ['id', 'product_name', 'sku'] },
        { model: Warehouse, attributes: ['id', 'warehouse_name', 'warehouse_code'] },
        { model: User, as: 'creator', attributes: ['id', 'first_name', 'last_name'] }
      ],
      limit,
      offset: (page - 1) * limit,
      order: [['created_at', 'DESC']]
    });

    return {
      transactions: rows.map(t => ({
        ...t.toJSON(),
        product_name: t.Product?.product_name,
        warehouse_name: t.Warehouse?.warehouse_name,
        created_by_name: t.creator ? `${t.creator.first_name} ${t.creator.last_name}` : null
      })),
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    };
  }

  async createInwardEntry(data, createdBy) {
    const t = await sequelize.transaction();

    try {
      const { warehouseId, productId, quantity, referenceType, referenceId, notes, batchNumber, expiryDate } = data;

      // Get or create inventory record
      let [inventory, created] = await Inventory.findOrCreate({
        where: { product_id: productId, warehouse_id: warehouseId },
        defaults: {
          product_id: productId,
          warehouse_id: warehouseId,
          quantity_available: 0,
          quantity_reserved: 0,
          quantity_damaged: 0,
          reorder_point: 10
        },
        transaction: t
      });

      const previousQuantity = inventory.quantity_available;
      const newQuantity = previousQuantity + quantity;

      await inventory.update({
        quantity_available: newQuantity,
        last_restocked_at: new Date()
      }, { transaction: t });

      // Create transaction record
      const inventoryTransaction = await InventoryTransaction.create({
        warehouse_id: warehouseId,
        product_id: productId,
        transaction_type: 'INWARD',
        quantity,
        reference_type: referenceType?.toUpperCase() || 'ADJUSTMENT',
        reference_id: referenceId,
        quantity_before: previousQuantity,
        quantity_after: newQuantity,
        notes,
        created_by: createdBy
      }, { transaction: t });

      await t.commit();

      return inventoryTransaction;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async createOutwardEntry(data, createdBy) {
    const t = await sequelize.transaction();

    try {
      const { warehouseId, productId, quantity, referenceType, referenceId, notes } = data;

      if (quantity <= 0) {
        throw new AppError('Quantity must be greater than 0', 400, 'INVALID_QUANTITY');
      }

      // Get inventory record
      const inventory = await Inventory.findOne({
        where: { warehouse_id: warehouseId, product_id: productId },
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (!inventory) {
        throw new AppError('No inventory found for this product in the warehouse', 400, 'NO_INVENTORY');
      }

      const availableQty = inventory.quantity_available - inventory.quantity_reserved;
      if (availableQty < quantity) {
        throw new AppError(`Insufficient stock. Available: ${availableQty}`, 400, 'INSUFFICIENT_STOCK');
      }

      const previousQuantity = inventory.quantity_available;
      const newQuantity = previousQuantity - quantity;

      await inventory.update({
        quantity_available: newQuantity
      }, { transaction: t });

      // Create transaction record
      const inventoryTransaction = await InventoryTransaction.create({
        warehouse_id: warehouseId,
        product_id: productId,
        transaction_type: 'OUTWARD',
        quantity,
        reference_type: referenceType?.toUpperCase() || 'ADJUSTMENT',
        reference_id: referenceId,
        quantity_before: previousQuantity,
        quantity_after: newQuantity,
        notes,
        created_by: createdBy
      }, { transaction: t });

      await t.commit();

      return inventoryTransaction;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  // ==================== STOCK ADJUSTMENTS ====================

  async getAdjustments(options = {}) {
    const { page = 1, limit = 20, status, warehouseId, startDate, endDate } = options;

    const where = {};
    if (status) where.status = status.toUpperCase();
    if (warehouseId) where.warehouse_id = warehouseId;
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at[Op.gte] = new Date(startDate);
      if (endDate) where.created_at[Op.lte] = new Date(endDate);
    }

    const { rows, count } = await StockAdjustment.findAndCountAll({
      where,
      include: [
        { model: Warehouse, attributes: ['id', 'warehouse_name', 'warehouse_code'] },
        { model: User, as: 'creator', attributes: ['id', 'first_name', 'last_name'] },
        { model: User, as: 'approver', attributes: ['id', 'first_name', 'last_name'] }
      ],
      limit,
      offset: (page - 1) * limit,
      order: [['created_at', 'DESC']]
    });

    return {
      adjustments: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    };
  }

  async createAdjustment(data, createdBy) {
    const t = await sequelize.transaction();

    try {
      const { warehouseId, reason, notes, items } = data;
      const adjustmentType = (data.adjustment_type || data.adjustmentType || 'OTHER').toUpperCase();

      // Generate adjustment number
      const count = await StockAdjustment.count({ transaction: t });
      const adjustmentNumber = `ADJ${String(count + 1).padStart(6, '0')}`;

      const adjustment = await StockAdjustment.create({
        adjustment_number: adjustmentNumber,
        warehouse_id: warehouseId,
        adjustment_type: adjustmentType,
        reason,
        notes,
        status: 'PENDING_APPROVAL',
        total_items: items.length,
        created_by: createdBy
      }, { transaction: t });

      // Create adjustment items
      for (const item of items) {
        const inventory = await Inventory.findOne({
          where: { warehouse_id: warehouseId, product_id: item.productId },
          transaction: t,
          lock: t.LOCK.UPDATE
        });

        const quantityBefore = inventory ? inventory.quantity_available : 0;
        const quantityAfter = item.adjustedQuantity;
        const quantityAdjusted = quantityAfter - quantityBefore;

        await StockAdjustmentItem.create({
          stock_adjustment_id: adjustment.id,
          product_id: item.productId,
          quantity_before: quantityBefore,
          quantity_adjusted: quantityAdjusted,
          quantity_after: quantityAfter,
          reason: item.reason
        }, { transaction: t });
      }

      await t.commit();

      return this.getAdjustmentById(adjustment.id);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async getAdjustmentById(id) {
    const adjustment = await StockAdjustment.findByPk(id, {
      include: [
        { model: Warehouse, attributes: ['id', 'warehouse_name', 'warehouse_code'] },
        { model: User, as: 'creator', attributes: ['id', 'first_name', 'last_name'] },
        { model: User, as: 'approver', attributes: ['id', 'first_name', 'last_name'] },
        {
          model: StockAdjustmentItem,
          as: 'items',
          include: [{ model: Product, attributes: ['id', 'product_name', 'sku'] }]
        }
      ]
    });

    return adjustment;
  }

  async approveAdjustment(id, approvedBy, approvalNotes) {
    const t = await sequelize.transaction();

    try {
      const adjustment = await StockAdjustment.findByPk(id, {
        include: [{ model: StockAdjustmentItem, as: 'items' }],
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (!adjustment) {
        throw new AppError('Stock adjustment not found', 404, 'NOT_FOUND');
      }

      if (adjustment.status !== 'PENDING_APPROVAL') {
        throw new AppError('Only pending adjustments can be approved', 400, 'INVALID_STATUS');
      }

      // Apply adjustments to inventory
      for (const item of adjustment.items) {
        let inventory = await Inventory.findOne({
          where: { warehouse_id: adjustment.warehouse_id, product_id: item.product_id },
          transaction: t,
          lock: t.LOCK.UPDATE
        });

        if (inventory) {
          await inventory.update({
            quantity_available: item.quantity_after
          }, { transaction: t });
        } else {
          inventory = await Inventory.create({
            warehouse_id: adjustment.warehouse_id,
            product_id: item.product_id,
            quantity_available: item.quantity_after,
            quantity_reserved: 0,
            quantity_damaged: 0,
            reorder_point: 10
          }, { transaction: t });
        }

        // Create transaction record
        await InventoryTransaction.create({
          warehouse_id: adjustment.warehouse_id,
          product_id: item.product_id,
          transaction_type: 'ADJUSTMENT',
          quantity: Math.abs(item.quantity_adjusted),
          reference_type: 'ADJUSTMENT',
          reference_id: adjustment.id,
          quantity_before: item.quantity_before,
          quantity_after: item.quantity_after,
          notes: adjustment.reason,
          created_by: approvedBy
        }, { transaction: t });
      }

      await adjustment.update({
        status: 'APPROVED',
        approved_by: approvedBy,
        approved_at: new Date(),
        notes: approvalNotes || adjustment.notes
      }, { transaction: t });

      await t.commit();

      return this.getAdjustmentById(id);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async rejectAdjustment(id, rejectedBy, rejectionNotes) {
    const adjustment = await StockAdjustment.findByPk(id);

    if (!adjustment) {
      throw new AppError('Stock adjustment not found', 404, 'NOT_FOUND');
    }

    if (adjustment.status !== 'PENDING_APPROVAL') {
      throw new AppError('Only pending adjustments can be rejected', 400, 'INVALID_STATUS');
    }

    await adjustment.update({
      status: 'REJECTED',
      approved_by: rejectedBy,
      approved_at: new Date(),
      notes: rejectionNotes || adjustment.notes
    });

    return this.getAdjustmentById(id);
  }

  // ==================== WAREHOUSE TRANSFERS ====================

  async getTransfers(options = {}) {
    const { page = 1, limit = 20, status, sourceWarehouseId, destinationWarehouseId, startDate, endDate } = options;

    const where = {};
    if (status) {
      const statusMap = {
        pending: 'PENDING_APPROVAL',
        approved: 'APPROVED',
        in_transit: 'IN_TRANSIT',
        completed: 'COMPLETED',
        cancelled: 'CANCELLED'
      };
      where.status = statusMap[status] || status.toUpperCase();
    }
    if (sourceWarehouseId) where.from_warehouse_id = sourceWarehouseId;
    if (destinationWarehouseId) where.to_warehouse_id = destinationWarehouseId;
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at[Op.gte] = new Date(startDate);
      if (endDate) where.created_at[Op.lte] = new Date(endDate);
    }

    const { rows, count } = await WarehouseTransfer.findAndCountAll({
      where,
      include: [
        { model: Warehouse, as: 'fromWarehouse', attributes: ['id', 'warehouse_name', 'warehouse_code'] },
        { model: Warehouse, as: 'toWarehouse', attributes: ['id', 'warehouse_name', 'warehouse_code'] },
        { model: User, as: 'creator', attributes: ['id', 'first_name', 'last_name'] }
      ],
      limit,
      offset: (page - 1) * limit,
      order: [['created_at', 'DESC']]
    });

    return {
      transfers: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    };
  }

  async createTransfer(data, createdBy) {
    const t = await sequelize.transaction();

    try {
      const { sourceWarehouseId, destinationWarehouseId, notes, items } = data;

      if (sourceWarehouseId === destinationWarehouseId) {
        throw new AppError('Source and destination warehouses must be different', 400, 'SAME_WAREHOUSE');
      }

      let totalQuantity = 0;

      // Validate source inventory
      for (const item of items) {
        const inventory = await Inventory.findOne({
          where: { warehouse_id: sourceWarehouseId, product_id: item.productId },
          transaction: t,
          lock: t.LOCK.UPDATE
        });

        if (!inventory) {
          throw new AppError(`Product ${item.productId} not found in source warehouse`, 400, 'NO_INVENTORY');
        }

        const available = inventory.quantity_available - inventory.quantity_reserved;
        if (available < item.quantity) {
          throw new AppError(`Insufficient stock for product ${item.productId}. Available: ${available}`, 400, 'INSUFFICIENT_STOCK');
        }
        totalQuantity += item.quantity;
      }

      // Generate transfer number
      const count = await WarehouseTransfer.count({ transaction: t });
      const transferNumber = `TRF${String(count + 1).padStart(6, '0')}`;

      const transfer = await WarehouseTransfer.create({
        transfer_number: transferNumber,
        from_warehouse_id: sourceWarehouseId,
        to_warehouse_id: destinationWarehouseId,
        status: 'PENDING_APPROVAL',
        notes,
        total_items: items.length,
        total_quantity: totalQuantity,
        created_by: createdBy
      }, { transaction: t });

      // Create transfer items
      for (const item of items) {
        await WarehouseTransferItem.create({
          warehouse_transfer_id: transfer.id,
          product_id: item.productId,
          quantity_requested: item.quantity,
          notes: item.notes
        }, { transaction: t });
      }

      await t.commit();

      return this.getTransferById(transfer.id);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async getTransferById(id) {
    const transfer = await WarehouseTransfer.findByPk(id, {
      include: [
        { model: Warehouse, as: 'fromWarehouse' },
        { model: Warehouse, as: 'toWarehouse' },
        { model: User, as: 'creator', attributes: ['id', 'first_name', 'last_name'] },
        { model: User, as: 'approver', attributes: ['id', 'first_name', 'last_name'] },
        { model: User, as: 'receiver', attributes: ['id', 'first_name', 'last_name'] },
        {
          model: WarehouseTransferItem,
          as: 'items',
          include: [{ model: Product, attributes: ['id', 'product_name', 'sku'] }]
        }
      ]
    });

    return transfer;
  }

  async approveTransfer(id, approvedBy) {
    const t = await sequelize.transaction();

    try {
      const transfer = await WarehouseTransfer.findByPk(id, {
        include: [{ model: WarehouseTransferItem, as: 'items' }],
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (!transfer) {
        throw new AppError('Transfer not found', 404, 'NOT_FOUND');
      }

      if (transfer.status !== 'PENDING_APPROVAL') {
        throw new AppError('Only pending transfers can be approved', 400, 'INVALID_STATUS');
      }

      // Reserve stock at source warehouse
      for (const item of transfer.items) {
        const inventory = await Inventory.findOne({
          where: { warehouse_id: transfer.from_warehouse_id, product_id: item.product_id },
          transaction: t,
          lock: t.LOCK.UPDATE
        });

        const available = inventory.quantity_available - inventory.quantity_reserved;
        if (available < item.quantity_requested) {
          throw new AppError(`Insufficient stock for product ${item.productId}`, 400, 'INSUFFICIENT_STOCK');
        }

        await inventory.update({
          quantity_reserved: inventory.quantity_reserved + item.quantity_requested
        }, { transaction: t });
      }

      await transfer.update({
        status: 'APPROVED',
        approved_by: approvedBy,
        approved_at: new Date()
      }, { transaction: t });

      await t.commit();

      return this.getTransferById(id);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async shipTransfer(id, shippedBy) {
    const transfer = await WarehouseTransfer.findByPk(id, {
      include: [{ model: WarehouseTransferItem, as: 'items' }]
    });

    if (!transfer) {
      throw new AppError('Transfer not found', 404, 'NOT_FOUND');
    }

    if (transfer.status !== 'APPROVED') {
      throw new AppError('Only approved transfers can be shipped', 400, 'INVALID_STATUS');
    }

    await transfer.update({
      status: 'IN_TRANSIT',
      shipped_at: new Date(),
      shipped_by: shippedBy
    });

    for (const item of transfer.items) {
      await item.update({ quantity_shipped: item.quantity_requested });
    }

    return this.getTransferById(id);
  }

  async receiveTransfer(id, receivedBy, receivedItems) {
    const t = await sequelize.transaction();

    try {
      const transfer = await WarehouseTransfer.findByPk(id, {
        include: [{ model: WarehouseTransferItem, as: 'items' }],
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (!transfer) {
        throw new AppError('Transfer not found', 404, 'NOT_FOUND');
      }

      if (transfer.status !== 'IN_TRANSIT') {
        throw new AppError('Only in-transit transfers can be received', 400, 'INVALID_STATUS');
      }

      // Process each item
      for (const item of transfer.items) {
        const receivedItem = receivedItems?.find(ri => ri.productId === item.product_id);
        const receivedQty = receivedItem ? receivedItem.receivedQuantity : item.quantity_shipped || item.quantity_requested;

        // Update source warehouse - reduce quantity and reserved
        const sourceInventory = await Inventory.findOne({
          where: { warehouse_id: transfer.from_warehouse_id, product_id: item.product_id },
          transaction: t,
          lock: t.LOCK.UPDATE
        });

        if (sourceInventory) {
          await sourceInventory.update({
            quantity_available: sourceInventory.quantity_available - item.quantity_requested,
            quantity_reserved: sourceInventory.quantity_reserved - item.quantity_requested
          }, { transaction: t });

          // Create outward transaction
          await InventoryTransaction.create({
            warehouse_id: transfer.from_warehouse_id,
            product_id: item.product_id,
            transaction_type: 'TRANSFER_OUT',
            quantity: item.quantity_requested,
            reference_type: 'TRANSFER',
            reference_id: transfer.id,
            quantity_before: sourceInventory.quantity_available,
            quantity_after: sourceInventory.quantity_available - item.quantity_requested,
            notes: `Transfer to ${transfer.to_warehouse_id}`,
            created_by: receivedBy
          }, { transaction: t });
        }

        // Update destination warehouse
        let destInventory = await Inventory.findOne({
          where: { warehouse_id: transfer.to_warehouse_id, product_id: item.product_id },
          transaction: t,
          lock: t.LOCK.UPDATE
        });

        const prevQty = destInventory ? destInventory.quantity_available : 0;

        if (destInventory) {
          await destInventory.update({
            quantity_available: destInventory.quantity_available + receivedQty
          }, { transaction: t });
        } else {
          destInventory = await Inventory.create({
            warehouse_id: transfer.to_warehouse_id,
            product_id: item.product_id,
            quantity_available: receivedQty,
            quantity_reserved: 0,
            quantity_damaged: 0,
            reorder_point: 10
          }, { transaction: t });
        }

        // Create inward transaction
        await InventoryTransaction.create({
          warehouse_id: transfer.to_warehouse_id,
          product_id: item.product_id,
          transaction_type: 'TRANSFER_IN',
          quantity: receivedQty,
          reference_type: 'TRANSFER',
          reference_id: transfer.id,
          quantity_before: prevQty,
          quantity_after: prevQty + receivedQty,
          notes: `Transfer from ${transfer.from_warehouse_id}`,
          created_by: receivedBy
        }, { transaction: t });

        // Update item received quantity
        await WarehouseTransferItem.update(
          { quantity_received: receivedQty },
          { where: { id: item.id }, transaction: t }
        );
      }

      await transfer.update({
        status: 'COMPLETED',
        received_by: receivedBy,
        received_at: new Date()
      }, { transaction: t });

      await t.commit();

      return this.getTransferById(id);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  // ==================== LOW STOCK ALERTS ====================

  async getLowStockItems(warehouseId) {
    const where = { quantity_available: { [Op.lte]: sequelize.col('reorder_point') } };
    if (warehouseId) where.warehouse_id = warehouseId;

    const items = await Inventory.findAll({
      where,
      include: [
        { model: Product, attributes: ['id', 'product_name', 'sku'] },
        { model: Warehouse, attributes: ['id', 'warehouse_name', 'warehouse_code'] }
      ],
      order: [
        [sequelize.literal('quantity_available - reorder_point'), 'ASC']
      ]
    });

    return items;
  }

  // ==================== INVENTORY VALUATION ====================

  async getInventoryValuation(warehouseId) {
    const where = {};
    if (warehouseId) where.warehouse_id = warehouseId;

    const inventory = await Inventory.findAll({
      where,
      include: [
        { model: Product, attributes: ['id', 'product_name', 'sku', 'cost_price', 'selling_price'] },
        { model: Warehouse, attributes: ['id', 'warehouse_name', 'warehouse_code'] }
      ]
    });

    let totalCostValue = 0;
    let totalRetailValue = 0;

    const items = inventory.map(inv => {
      const costValue = inv.quantity_available * (inv.Product?.cost_price || 0);
      const retailValue = inv.quantity_available * (inv.Product?.selling_price || 0);
      totalCostValue += costValue;
      totalRetailValue += retailValue;

      return {
        warehouse: inv.Warehouse,
        product: inv.Product,
        quantity: inv.quantity_available,
        costValue,
        retailValue
      };
    });

    return {
      items,
      summary: {
        totalCostValue,
        totalRetailValue,
        potentialProfit: totalRetailValue - totalCostValue
      }
    };
  }
}

module.exports = new InventoryService();
