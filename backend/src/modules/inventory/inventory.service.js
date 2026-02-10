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

      // Get inventory record
      const inventory = await Inventory.findOne({
        where: { warehouse_id: warehouseId, product_id: productId },
        transaction: t
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

      // Generate adjustment number
      const count = await StockAdjustment.count({ transaction });
      const adjustmentNumber = `ADJ${String(count + 1).padStart(6, '0')}`;

      const adjustment = await StockAdjustment.create({
        adjustmentNumber,
        warehouseId,
        adjustmentDate: new Date(),
        reason,
        notes,
        status: 'pending',
        createdBy
      }, { transaction });

      // Create adjustment items
      for (const item of items) {
        const inventory = await Inventory.findOne({
          where: { warehouseId, productId: item.productId },
          transaction
        });

        await StockAdjustmentItem.create({
          adjustmentId: adjustment.id,
          productId: item.productId,
          previousQuantity: inventory ? inventory.quantity : 0,
          adjustedQuantity: item.adjustedQuantity,
          difference: item.adjustedQuantity - (inventory ? inventory.quantity : 0),
          reason: item.reason
        }, { transaction });
      }

      await transaction.commit();

      return this.getAdjustmentById(adjustment.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getAdjustmentById(id) {
    const adjustment = await StockAdjustment.findByPk(id, {
      include: [
        { model: Warehouse, as: 'warehouse' },
        { model: User, as: 'createdByUser', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'approvedByUser', attributes: ['id', 'firstName', 'lastName'] },
        {
          model: StockAdjustmentItem,
          as: 'items',
          include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'sku'] }]
        }
      ]
    });

    return adjustment;
  }

  async approveAdjustment(id, approvedBy, approvalNotes) {
    const transaction = await sequelize.transaction();

    try {
      const adjustment = await StockAdjustment.findByPk(id, {
        include: [{ model: StockAdjustmentItem, as: 'items' }],
        transaction
      });

      if (!adjustment) {
        throw new AppError('Stock adjustment not found', 404, 'NOT_FOUND');
      }

      if (adjustment.status !== 'pending') {
        throw new AppError('Only pending adjustments can be approved', 400, 'INVALID_STATUS');
      }

      // Apply adjustments to inventory
      for (const item of adjustment.items) {
        let inventory = await Inventory.findOne({
          where: { warehouseId: adjustment.warehouseId, productId: item.productId },
          transaction
        });

        if (inventory) {
          await inventory.update({
            quantity: item.adjustedQuantity
          }, { transaction });
        } else {
          inventory = await Inventory.create({
            warehouseId: adjustment.warehouseId,
            productId: item.productId,
            quantity: item.adjustedQuantity,
            reservedQuantity: 0,
            reorderLevel: 10,
            maxStockLevel: 1000
          }, { transaction });
        }

        // Create transaction record
        await InventoryTransaction.create({
          warehouseId: adjustment.warehouseId,
          productId: item.productId,
          transactionType: 'adjustment',
          quantity: Math.abs(item.difference),
          referenceType: 'adjustment',
          referenceId: adjustment.id,
          previousQuantity: item.previousQuantity,
          newQuantity: item.adjustedQuantity,
          notes: adjustment.reason,
          createdBy: approvedBy
        }, { transaction });
      }

      await adjustment.update({
        status: 'approved',
        approvedBy,
        approvedAt: new Date(),
        approvalNotes
      }, { transaction });

      await transaction.commit();

      return this.getAdjustmentById(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async rejectAdjustment(id, rejectedBy, rejectionNotes) {
    const adjustment = await StockAdjustment.findByPk(id);

    if (!adjustment) {
      throw new AppError('Stock adjustment not found', 404, 'NOT_FOUND');
    }

    if (adjustment.status !== 'pending') {
      throw new AppError('Only pending adjustments can be rejected', 400, 'INVALID_STATUS');
    }

    await adjustment.update({
      status: 'rejected',
      approvedBy: rejectedBy,
      approvedAt: new Date(),
      approvalNotes: rejectionNotes
    });

    return this.getAdjustmentById(id);
  }

  // ==================== WAREHOUSE TRANSFERS ====================

  async getTransfers(options = {}) {
    const { page = 1, limit = 20, status, sourceWarehouseId, destinationWarehouseId, startDate, endDate } = options;

    const where = {};
    if (status) where.status = status;
    if (sourceWarehouseId) where.sourceWarehouseId = sourceWarehouseId;
    if (destinationWarehouseId) where.destinationWarehouseId = destinationWarehouseId;
    if (startDate || endDate) {
      where.transferDate = {};
      if (startDate) where.transferDate[Op.gte] = new Date(startDate);
      if (endDate) where.transferDate[Op.lte] = new Date(endDate);
    }

    const { rows, count } = await WarehouseTransfer.findAndCountAll({
      where,
      include: [
        { model: Warehouse, as: 'sourceWarehouse', attributes: ['id', 'name', 'code'] },
        { model: Warehouse, as: 'destinationWarehouse', attributes: ['id', 'name', 'code'] },
        { model: User, as: 'createdByUser', attributes: ['id', 'firstName', 'lastName'] }
      ],
      limit,
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']]
    });

    return {
      transfers: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    };
  }

  async createTransfer(data, createdBy) {
    const transaction = await sequelize.transaction();

    try {
      const { sourceWarehouseId, destinationWarehouseId, notes, items } = data;

      if (sourceWarehouseId === destinationWarehouseId) {
        throw new AppError('Source and destination warehouses must be different', 400, 'SAME_WAREHOUSE');
      }

      // Validate source inventory
      for (const item of items) {
        const inventory = await Inventory.findOne({
          where: { warehouseId: sourceWarehouseId, productId: item.productId },
          transaction
        });

        if (!inventory) {
          throw new AppError(`Product ${item.productId} not found in source warehouse`, 400, 'NO_INVENTORY');
        }

        const available = inventory.quantity - inventory.reservedQuantity;
        if (available < item.quantity) {
          throw new AppError(`Insufficient stock for product ${item.productId}. Available: ${available}`, 400, 'INSUFFICIENT_STOCK');
        }
      }

      // Generate transfer number
      const count = await WarehouseTransfer.count({ transaction });
      const transferNumber = `TRF${String(count + 1).padStart(6, '0')}`;

      const transfer = await WarehouseTransfer.create({
        transferNumber,
        sourceWarehouseId,
        destinationWarehouseId,
        transferDate: new Date(),
        status: 'pending',
        notes,
        createdBy
      }, { transaction });

      // Create transfer items
      for (const item of items) {
        await WarehouseTransferItem.create({
          transferId: transfer.id,
          productId: item.productId,
          quantity: item.quantity,
          notes: item.notes
        }, { transaction });
      }

      await transaction.commit();

      return this.getTransferById(transfer.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getTransferById(id) {
    const transfer = await WarehouseTransfer.findByPk(id, {
      include: [
        { model: Warehouse, as: 'sourceWarehouse' },
        { model: Warehouse, as: 'destinationWarehouse' },
        { model: User, as: 'createdByUser', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'approvedByUser', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'receivedByUser', attributes: ['id', 'firstName', 'lastName'] },
        {
          model: WarehouseTransferItem,
          as: 'items',
          include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'sku'] }]
        }
      ]
    });

    return transfer;
  }

  async approveTransfer(id, approvedBy) {
    const transaction = await sequelize.transaction();

    try {
      const transfer = await WarehouseTransfer.findByPk(id, {
        include: [{ model: WarehouseTransferItem, as: 'items' }],
        transaction
      });

      if (!transfer) {
        throw new AppError('Transfer not found', 404, 'NOT_FOUND');
      }

      if (transfer.status !== 'pending') {
        throw new AppError('Only pending transfers can be approved', 400, 'INVALID_STATUS');
      }

      // Reserve stock at source warehouse
      for (const item of transfer.items) {
        const inventory = await Inventory.findOne({
          where: { warehouseId: transfer.sourceWarehouseId, productId: item.productId },
          transaction
        });

        const available = inventory.quantity - inventory.reservedQuantity;
        if (available < item.quantity) {
          throw new AppError(`Insufficient stock for product ${item.productId}`, 400, 'INSUFFICIENT_STOCK');
        }

        await inventory.update({
          reservedQuantity: inventory.reservedQuantity + item.quantity
        }, { transaction });
      }

      await transfer.update({
        status: 'approved',
        approvedBy,
        approvedAt: new Date()
      }, { transaction });

      await transaction.commit();

      return this.getTransferById(id);
    } catch (error) {
      await transaction.rollback();
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

    if (transfer.status !== 'approved') {
      throw new AppError('Only approved transfers can be shipped', 400, 'INVALID_STATUS');
    }

    await transfer.update({
      status: 'in_transit',
      shippedAt: new Date()
    });

    return this.getTransferById(id);
  }

  async receiveTransfer(id, receivedBy, receivedItems) {
    const transaction = await sequelize.transaction();

    try {
      const transfer = await WarehouseTransfer.findByPk(id, {
        include: [{ model: WarehouseTransferItem, as: 'items' }],
        transaction
      });

      if (!transfer) {
        throw new AppError('Transfer not found', 404, 'NOT_FOUND');
      }

      if (transfer.status !== 'in_transit') {
        throw new AppError('Only in-transit transfers can be received', 400, 'INVALID_STATUS');
      }

      // Process each item
      for (const item of transfer.items) {
        const receivedItem = receivedItems?.find(ri => ri.productId === item.productId);
        const receivedQty = receivedItem ? receivedItem.receivedQuantity : item.quantity;

        // Update source warehouse - reduce quantity and reserved
        const sourceInventory = await Inventory.findOne({
          where: { warehouseId: transfer.sourceWarehouseId, productId: item.productId },
          transaction
        });

        if (sourceInventory) {
          await sourceInventory.update({
            quantity: sourceInventory.quantity - item.quantity,
            reservedQuantity: sourceInventory.reservedQuantity - item.quantity
          }, { transaction });

          // Create outward transaction
          await InventoryTransaction.create({
            warehouseId: transfer.sourceWarehouseId,
            productId: item.productId,
            transactionType: 'transfer_out',
            quantity: item.quantity,
            referenceType: 'transfer',
            referenceId: transfer.id,
            previousQuantity: sourceInventory.quantity,
            newQuantity: sourceInventory.quantity - item.quantity,
            notes: `Transfer to ${transfer.destinationWarehouseId}`,
            createdBy: receivedBy
          }, { transaction });
        }

        // Update destination warehouse
        let destInventory = await Inventory.findOne({
          where: { warehouseId: transfer.destinationWarehouseId, productId: item.productId },
          transaction
        });

        const prevQty = destInventory ? destInventory.quantity : 0;

        if (destInventory) {
          await destInventory.update({
            quantity: destInventory.quantity + receivedQty
          }, { transaction });
        } else {
          destInventory = await Inventory.create({
            warehouseId: transfer.destinationWarehouseId,
            productId: item.productId,
            quantity: receivedQty,
            reservedQuantity: 0,
            reorderLevel: 10,
            maxStockLevel: 1000
          }, { transaction });
        }

        // Create inward transaction
        await InventoryTransaction.create({
          warehouseId: transfer.destinationWarehouseId,
          productId: item.productId,
          transactionType: 'transfer_in',
          quantity: receivedQty,
          referenceType: 'transfer',
          referenceId: transfer.id,
          previousQuantity: prevQty,
          newQuantity: prevQty + receivedQty,
          notes: `Transfer from ${transfer.sourceWarehouseId}`,
          createdBy: receivedBy
        }, { transaction });

        // Update item received quantity
        await WarehouseTransferItem.update(
          { receivedQuantity: receivedQty },
          { where: { id: item.id }, transaction }
        );
      }

      await transfer.update({
        status: 'completed',
        receivedBy,
        receivedAt: new Date()
      }, { transaction });

      await transaction.commit();

      return this.getTransferById(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ==================== LOW STOCK ALERTS ====================

  async getLowStockItems(warehouseId) {
    const where = { quantity: { [Op.lte]: sequelize.col('reorderLevel') } };
    if (warehouseId) where.warehouseId = warehouseId;

    const items = await Inventory.findAll({
      where,
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'sku'] },
        { model: Warehouse, as: 'warehouse', attributes: ['id', 'name', 'code'] }
      ],
      order: [
        [sequelize.literal('quantity - reorderLevel'), 'ASC']
      ]
    });

    return items;
  }

  // ==================== INVENTORY VALUATION ====================

  async getInventoryValuation(warehouseId) {
    const where = {};
    if (warehouseId) where.warehouseId = warehouseId;

    const inventory = await Inventory.findAll({
      where,
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'sku', 'purchasePrice', 'sellingPrice'] },
        { model: Warehouse, as: 'warehouse', attributes: ['id', 'name', 'code'] }
      ]
    });

    let totalCostValue = 0;
    let totalRetailValue = 0;

    const items = inventory.map(inv => {
      const costValue = inv.quantity * (inv.product.purchasePrice || 0);
      const retailValue = inv.quantity * (inv.product.sellingPrice || 0);
      totalCostValue += costValue;
      totalRetailValue += retailValue;

      return {
        warehouse: inv.warehouse,
        product: inv.product,
        quantity: inv.quantity,
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
