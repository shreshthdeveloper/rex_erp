const { Op } = require('sequelize');
const {
  Return,
  ReturnItem,
  SalesOrder,
  SalesOrderItem,
  Customer,
  Product,
  Warehouse,
  Inventory,
  InventoryTransaction,
  Invoice,
  User,
  sequelize
} = require('../../models');
const { AppError } = require('../../middleware/error.middleware');

class ReturnsService {
  async findAll(options = {}) {
    const { page = 1, limit = 20, search, status, customerId, warehouseId, returnType, startDate, endDate } = options;

    const where = {};
    if (search) {
      where.returnNumber = { [Op.like]: `%${search}%` };
    }
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (warehouseId) where.warehouseId = warehouseId;
    if (returnType) where.returnType = returnType;
    if (startDate || endDate) {
      where.returnDate = {};
      if (startDate) where.returnDate[Op.gte] = new Date(startDate);
      if (endDate) where.returnDate[Op.lte] = new Date(endDate);
    }

    const { rows, count } = await Return.findAndCountAll({
      where,
      include: [
        { model: SalesOrder, as: 'salesOrder', attributes: ['id', 'order_number'] },
        { model: Customer, as: 'customer', attributes: ['id', 'customerCode', 'companyName'] },
        { model: Warehouse, as: 'warehouse', attributes: ['id', 'code', 'name'] },
        { model: User, as: 'createdByUser', attributes: ['id', 'firstName', 'lastName'] }
      ],
      limit,
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']]
    });

    return {
      returns: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    };
  }

  async findById(id) {
    const returnOrder = await Return.findByPk(id, {
      include: [
        { model: SalesOrder, as: 'salesOrder' },
        { model: Customer, as: 'customer' },
        { model: Warehouse, as: 'warehouse' },
        { model: User, as: 'createdByUser', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'approvedByUser', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'inspectedByUser', attributes: ['id', 'firstName', 'lastName'] },
        {
          model: ReturnItem,
          as: 'items',
          include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'sku'] }]
        }
      ]
    });

    return returnOrder;
  }

  async create(data, createdBy) {
    const transaction = await sequelize.transaction();

    try {
      const { salesOrderId, items, ...returnData } = data;

      // Get sales order
      const salesOrder = await SalesOrder.findByPk(salesOrderId, {
        include: [{ model: SalesOrderItem, as: 'items' }],
        transaction
      });

      if (!salesOrder) {
        throw new AppError('Sales order not found', 404, 'NOT_FOUND');
      }

      if (!['SHIPPED', 'DELIVERED'].includes(salesOrder.status)) {
        throw new AppError('Cannot create return for this order status', 400, 'INVALID_STATUS');
      }

      // Generate return number (RMA number)
      const count = await Return.count({ transaction });
      const returnNumber = `RMA${new Date().getFullYear()}${String(count + 1).padStart(6, '0')}`;

      // Calculate totals
      let totalAmount = 0;
      for (const item of items) {
        const soItem = salesOrder.items.find(si => si.product_id === item.productId);
        if (soItem) {
          totalAmount += item.returnQuantity * soItem.unit_price;
        }
      }

      const returnOrder = await Return.create({
        returnNumber,
        salesOrderId,
        customerId: salesOrder.customer_id,
        warehouseId: salesOrder.warehouse_id,
        returnDate: returnData.returnDate || new Date(),
        returnType: returnData.returnType || 'refund',
        reason: returnData.reason,
        customerNotes: returnData.customerNotes,
        totalAmount,
        status: 'pending',
        createdBy
      }, { transaction });

      // Create return items
      for (const item of items) {
        const soItem = salesOrder.items.find(si => si.product_id === item.productId);
        
        await ReturnItem.create({
          returnId: returnOrder.id,
          productId: item.productId,
          returnQuantity: item.returnQuantity,
          unitPrice: soItem ? soItem.unit_price : 0,
          reason: item.reason,
          condition: item.condition || 'unopened'
        }, { transaction });
      }

      await transaction.commit();

      return this.findById(returnOrder.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async approve(id, approvedBy) {
    const returnOrder = await Return.findByPk(id);

    if (!returnOrder) {
      throw new AppError('Return not found', 404, 'NOT_FOUND');
    }

    if (returnOrder.status !== 'pending') {
      throw new AppError('Only pending returns can be approved', 400, 'INVALID_STATUS');
    }

    await returnOrder.update({
      status: 'approved',
      approvedBy,
      approvedAt: new Date()
    });

    return this.findById(id);
  }

  async reject(id, rejectedBy, rejectionReason) {
    const returnOrder = await Return.findByPk(id);

    if (!returnOrder) {
      throw new AppError('Return not found', 404, 'NOT_FOUND');
    }

    if (returnOrder.status !== 'pending') {
      throw new AppError('Only pending returns can be rejected', 400, 'INVALID_STATUS');
    }

    await returnOrder.update({
      status: 'rejected',
      approvedBy: rejectedBy,
      approvedAt: new Date(),
      rejectionReason
    });

    return this.findById(id);
  }

  async receiveReturn(id, receivedBy) {
    const returnOrder = await Return.findByPk(id);

    if (!returnOrder) {
      throw new AppError('Return not found', 404, 'NOT_FOUND');
    }

    if (returnOrder.status !== 'approved') {
      throw new AppError('Return must be approved before receiving', 400, 'INVALID_STATUS');
    }

    await returnOrder.update({
      status: 'received',
      receivedAt: new Date(),
      receivedBy
    });

    return this.findById(id);
  }

  async inspectItems(id, inspectionData, inspectedBy) {
    const transaction = await sequelize.transaction();

    try {
      const returnOrder = await Return.findByPk(id, {
        include: [{ model: ReturnItem, as: 'items' }],
        transaction
      });

      if (!returnOrder) {
        throw new AppError('Return not found', 404, 'NOT_FOUND');
      }

      if (returnOrder.status !== 'received') {
        throw new AppError('Return must be received before inspection', 400, 'INVALID_STATUS');
      }

      // Update items with inspection results
      for (const item of inspectionData.items) {
        const returnItem = returnOrder.items.find(ri => ri.productId === item.productId);
        if (returnItem) {
          await ReturnItem.update(
            {
              inspectedQuantity: item.inspectedQuantity || returnItem.returnQuantity,
              acceptedQuantity: item.acceptedQuantity || 0,
              rejectedQuantity: item.rejectedQuantity || 0,
              inspectionNotes: item.notes,
              damageDescription: item.damageDescription,
              restockable: item.restockable !== false
            },
            { where: { id: returnItem.id }, transaction }
          );
        }
      }

      await returnOrder.update({
        status: 'inspected',
        inspectedBy,
        inspectedAt: new Date(),
        inspectionNotes: inspectionData.notes
      }, { transaction });

      await transaction.commit();

      return this.findById(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async processReturn(id, processedBy) {
    const transaction = await sequelize.transaction();

    try {
      const returnOrder = await Return.findByPk(id, {
        include: [{ model: ReturnItem, as: 'items' }],
        transaction
      });

      if (!returnOrder) {
        throw new AppError('Return not found', 404, 'NOT_FOUND');
      }

      if (returnOrder.status !== 'inspected') {
        throw new AppError('Return must be inspected before processing', 400, 'INVALID_STATUS');
      }

      // Add accepted items back to inventory
      for (const item of returnOrder.items) {
        if (item.acceptedQuantity > 0 && item.restockable) {
          let inventory = await Inventory.findOne({
            where: { warehouseId: returnOrder.warehouseId, productId: item.productId },
            transaction
          });

          const prevQty = inventory ? inventory.quantity : 0;

          if (inventory) {
            await inventory.update({
              quantity: inventory.quantity + item.acceptedQuantity
            }, { transaction });
          } else {
            inventory = await Inventory.create({
              warehouseId: returnOrder.warehouseId,
              productId: item.productId,
              quantity: item.acceptedQuantity,
              reservedQuantity: 0,
              reorderLevel: 10,
              maxStockLevel: 1000
            }, { transaction });
          }

          // Create inventory transaction
          await InventoryTransaction.create({
            warehouseId: returnOrder.warehouseId,
            productId: item.productId,
            transactionType: 'inward',
            quantity: item.acceptedQuantity,
            referenceType: 'return',
            referenceId: returnOrder.id,
            previousQuantity: prevQty,
            newQuantity: prevQty + item.acceptedQuantity,
            notes: `Return ${returnOrder.returnNumber}`,
            createdBy: processedBy
          }, { transaction });
        }
      }

      await returnOrder.update({
        status: 'processed',
        processedAt: new Date(),
        processedBy
      }, { transaction });

      await transaction.commit();

      return this.findById(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async issueRefund(id, refundData, processedBy) {
    const transaction = await sequelize.transaction();

    try {
      const returnOrder = await Return.findByPk(id, {
        include: [{ model: ReturnItem, as: 'items' }],
        transaction
      });

      if (!returnOrder) {
        throw new AppError('Return not found', 404, 'NOT_FOUND');
      }

      if (returnOrder.status !== 'processed') {
        throw new AppError('Return must be processed before refund', 400, 'INVALID_STATUS');
      }

      // Calculate refund amount based on accepted items
      let refundAmount = 0;
      for (const item of returnOrder.items) {
        refundAmount += (item.acceptedQuantity || 0) * item.unitPrice;
      }

      // Apply any deductions
      if (refundData.deductions) {
        refundAmount -= refundData.deductions;
      }

      await returnOrder.update({
        status: 'refunded',
        refundAmount,
        refundMethod: refundData.refundMethod,
        refundReference: refundData.refundReference,
        refundedAt: new Date(),
        refundedBy: processedBy,
        refundNotes: refundData.notes
      }, { transaction });

      await transaction.commit();

      return this.findById(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async issueReplacement(id, replacementData, processedBy) {
    const returnOrder = await Return.findByPk(id);

    if (!returnOrder) {
      throw new AppError('Return not found', 404, 'NOT_FOUND');
    }

    if (returnOrder.status !== 'processed') {
      throw new AppError('Return must be processed before replacement', 400, 'INVALID_STATUS');
    }

    await returnOrder.update({
      status: 'replaced',
      replacementOrderId: replacementData.replacementOrderId,
      replacedAt: new Date(),
      replacedBy: processedBy,
      replacementNotes: replacementData.notes
    });

    return this.findById(id);
  }

  async getReturnAnalytics(options = {}) {
    const { startDate, endDate, warehouseId } = options;

    const where = { status: { [Op.ne]: 'rejected' } };
    if (warehouseId) where.warehouseId = warehouseId;
    if (startDate || endDate) {
      where.returnDate = {};
      if (startDate) where.returnDate[Op.gte] = new Date(startDate);
      if (endDate) where.returnDate[Op.lte] = new Date(endDate);
    }

    const returns = await Return.findAll({
      where,
      include: [
        { model: ReturnItem, as: 'items', include: [{ model: Product, as: 'product' }] }
      ]
    });

    // Group by reason
    const byReason = {};
    // Group by product
    const byProduct = {};

    for (const ret of returns) {
      // By reason
      const reason = ret.reason || 'Other';
      if (!byReason[reason]) {
        byReason[reason] = { count: 0, amount: 0 };
      }
      byReason[reason].count++;
      byReason[reason].amount += parseFloat(ret.totalAmount || 0);

      // By product
      for (const item of ret.items) {
        const productId = item.productId;
        if (!byProduct[productId]) {
          byProduct[productId] = {
            product: item.product,
            totalReturns: 0,
            totalQuantity: 0
          };
        }
        byProduct[productId].totalReturns++;
        byProduct[productId].totalQuantity += item.returnQuantity;
      }
    }

    return {
      totalReturns: returns.length,
      totalValue: returns.reduce((sum, r) => sum + parseFloat(r.totalAmount || 0), 0),
      byReason: Object.entries(byReason).map(([reason, data]) => ({ reason, ...data })),
      topReturnedProducts: Object.values(byProduct)
        .sort((a, b) => b.totalQuantity - a.totalQuantity)
        .slice(0, 10)
    };
  }
}

module.exports = new ReturnsService();
