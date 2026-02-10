const { Op } = require('sequelize');
const {
  PurchaseOrder,
  PurchaseOrderItem,
  Supplier,
  Product,
  Warehouse,
  GRN,
  User,
  sequelize
} = require('../../models');
const { AppError } = require('../../middleware/error.middleware');

class PurchaseOrdersService {
  async findAll(options = {}) {
    const { page = 1, limit = 20, search, status, supplierId, warehouseId, startDate, endDate } = options;

    const where = {};
    if (search) {
      where.poNumber = { [Op.like]: `%${search}%` };
    }
    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;
    if (warehouseId) where.warehouseId = warehouseId;
    if (startDate || endDate) {
      where.orderDate = {};
      if (startDate) where.orderDate[Op.gte] = new Date(startDate);
      if (endDate) where.orderDate[Op.lte] = new Date(endDate);
    }

    const { rows, count } = await PurchaseOrder.findAndCountAll({
      where,
      include: [
        { model: Supplier, as: 'supplier', attributes: ['id', 'supplierCode', 'companyName'] },
        { model: Warehouse, as: 'warehouse', attributes: ['id', 'code', 'name'] },
        { model: User, as: 'createdByUser', attributes: ['id', 'firstName', 'lastName'] }
      ],
      limit,
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']]
    });

    return {
      purchaseOrders: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    };
  }

  async findById(id) {
    const po = await PurchaseOrder.findByPk(id, {
      include: [
        { model: Supplier, as: 'supplier' },
        { model: Warehouse, as: 'warehouse' },
        { model: User, as: 'createdByUser', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'approvedByUser', attributes: ['id', 'firstName', 'lastName'] },
        {
          model: PurchaseOrderItem,
          as: 'items',
          include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'sku'] }]
        },
        { model: GRN, as: 'grns', attributes: ['id', 'grnNumber', 'status', 'createdAt'] }
      ]
    });

    return po;
  }

  async create(data, createdBy) {
    const transaction = await sequelize.transaction();

    try {
      const { supplierId, warehouseId, items, ...poData } = data;

      // Generate PO number
      const count = await PurchaseOrder.count({ transaction });
      const poNumber = `PO${new Date().getFullYear()}${String(count + 1).padStart(6, '0')}`;

      // Calculate totals
      let subtotalAmount = 0;
      let taxAmount = 0;

      for (const item of items) {
        const itemSubtotal = item.quantity * item.unitPrice;
        const itemTax = itemSubtotal * (item.taxPercent || 0) / 100;
        subtotalAmount += itemSubtotal;
        taxAmount += itemTax;
      }

      const discountAmount = poData.discountAmount || 0;
      const shippingAmount = poData.shippingAmount || 0;
      const totalAmount = subtotalAmount - discountAmount + taxAmount + shippingAmount;

      const po = await PurchaseOrder.create({
        poNumber,
        supplierId,
        warehouseId,
        orderDate: poData.orderDate || new Date(),
        expectedDeliveryDate: poData.expectedDeliveryDate,
        subtotalAmount,
        discountAmount,
        taxAmount,
        shippingAmount,
        totalAmount,
        status: 'draft',
        paymentTerms: poData.paymentTerms,
        shippingMethod: poData.shippingMethod,
        notes: poData.notes,
        createdBy
      }, { transaction });

      // Create PO items
      for (const item of items) {
        const itemSubtotal = item.quantity * item.unitPrice;
        const itemTax = itemSubtotal * (item.taxPercent || 0) / 100;
        const itemTotal = itemSubtotal + itemTax;

        await PurchaseOrderItem.create({
          purchaseOrderId: po.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxPercent: item.taxPercent || 0,
          taxAmount: itemTax,
          totalAmount: itemTotal,
          receivedQuantity: 0,
          notes: item.notes
        }, { transaction });
      }

      await transaction.commit();

      return this.findById(po.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async update(id, data) {
    const transaction = await sequelize.transaction();

    try {
      const po = await PurchaseOrder.findByPk(id, { transaction });

      if (!po) {
        throw new AppError('Purchase order not found', 404, 'NOT_FOUND');
      }

      if (!['draft', 'pending'].includes(po.status)) {
        throw new AppError('Only draft or pending POs can be updated', 400, 'INVALID_STATUS');
      }

      const { items, ...poData } = data;

      if (items) {
        // Delete existing items and recreate
        await PurchaseOrderItem.destroy({
          where: { purchaseOrderId: id },
          transaction
        });

        let subtotalAmount = 0;
        let taxAmount = 0;

        for (const item of items) {
          const itemSubtotal = item.quantity * item.unitPrice;
          const itemTax = itemSubtotal * (item.taxPercent || 0) / 100;
          subtotalAmount += itemSubtotal;
          taxAmount += itemTax;

          await PurchaseOrderItem.create({
            purchaseOrderId: id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxPercent: item.taxPercent || 0,
            taxAmount: itemTax,
            totalAmount: itemSubtotal + itemTax,
            receivedQuantity: 0,
            notes: item.notes
          }, { transaction });
        }

        const discountAmount = poData.discountAmount || po.discountAmount;
        const shippingAmount = poData.shippingAmount || po.shippingAmount;
        const totalAmount = subtotalAmount - discountAmount + taxAmount + shippingAmount;

        poData.subtotalAmount = subtotalAmount;
        poData.taxAmount = taxAmount;
        poData.totalAmount = totalAmount;
      }

      await po.update(poData, { transaction });
      await transaction.commit();

      return this.findById(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async submitForApproval(id) {
    const po = await PurchaseOrder.findByPk(id);

    if (!po) {
      throw new AppError('Purchase order not found', 404, 'NOT_FOUND');
    }

    if (po.status !== 'draft') {
      throw new AppError('Only draft POs can be submitted for approval', 400, 'INVALID_STATUS');
    }

    await po.update({
      status: 'pending',
      submittedAt: new Date()
    });

    return this.findById(id);
  }

  async approve(id, approvedBy) {
    const po = await PurchaseOrder.findByPk(id);

    if (!po) {
      throw new AppError('Purchase order not found', 404, 'NOT_FOUND');
    }

    if (po.status !== 'pending') {
      throw new AppError('Only pending POs can be approved', 400, 'INVALID_STATUS');
    }

    await po.update({
      status: 'approved',
      approvedBy,
      approvedAt: new Date()
    });

    return this.findById(id);
  }

  async reject(id, rejectedBy, rejectionReason) {
    const po = await PurchaseOrder.findByPk(id);

    if (!po) {
      throw new AppError('Purchase order not found', 404, 'NOT_FOUND');
    }

    if (po.status !== 'pending') {
      throw new AppError('Only pending POs can be rejected', 400, 'INVALID_STATUS');
    }

    await po.update({
      status: 'rejected',
      approvedBy: rejectedBy,
      approvedAt: new Date(),
      rejectionReason
    });

    return this.findById(id);
  }

  async sendToSupplier(id, sentBy) {
    const po = await PurchaseOrder.findByPk(id);

    if (!po) {
      throw new AppError('Purchase order not found', 404, 'NOT_FOUND');
    }

    if (po.status !== 'approved') {
      throw new AppError('Only approved POs can be sent to supplier', 400, 'INVALID_STATUS');
    }

    await po.update({
      status: 'sent',
      sentToSupplierAt: new Date(),
      sentBy
    });

    return this.findById(id);
  }

  async cancel(id, cancelledBy, cancellationReason) {
    const po = await PurchaseOrder.findByPk(id);

    if (!po) {
      throw new AppError('Purchase order not found', 404, 'NOT_FOUND');
    }

    if (['completed', 'cancelled'].includes(po.status)) {
      throw new AppError('Cannot cancel this PO', 400, 'INVALID_STATUS');
    }

    // Check if any GRN exists
    const grnCount = await GRN.count({ where: { purchaseOrderId: id } });
    if (grnCount > 0) {
      throw new AppError('Cannot cancel PO with existing GRNs', 400, 'HAS_GRN');
    }

    await po.update({
      status: 'cancelled',
      cancelledBy,
      cancelledAt: new Date(),
      cancellationReason
    });

    return this.findById(id);
  }

  async getGRNHistory(id) {
    const po = await PurchaseOrder.findByPk(id, {
      include: [
        { model: PurchaseOrderItem, as: 'items', include: [{ model: Product, as: 'product' }] }
      ]
    });

    if (!po) {
      throw new AppError('Purchase order not found', 404, 'NOT_FOUND');
    }

    const grns = await GRN.findAll({
      where: { purchaseOrderId: id },
      order: [['createdAt', 'DESC']]
    });

    return {
      purchaseOrder: {
        id: po.id,
        poNumber: po.poNumber,
        status: po.status
      },
      items: po.items.map(item => ({
        productId: item.productId,
        product: item.product,
        orderedQuantity: item.quantity,
        receivedQuantity: item.receivedQuantity,
        pendingQuantity: item.quantity - item.receivedQuantity
      })),
      grns
    };
  }
}

module.exports = new PurchaseOrdersService();
