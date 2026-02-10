const { Op } = require('sequelize');
const {
  GRN,
  GRNItem,
  PurchaseOrder,
  PurchaseOrderItem,
  Product,
  Warehouse,
  Supplier,
  Inventory,
  InventoryTransaction,
  User,
  sequelize
} = require('../../models');
const { AppError } = require('../../middleware/error.middleware');

class GRNService {
  async findAll(options = {}) {
    const { page = 1, limit = 20, search, status, purchaseOrderId, warehouseId, supplierId, startDate, endDate } = options;

    const where = {};
    if (search) {
      where.grnNumber = { [Op.like]: `%${search}%` };
    }
    if (status) where.status = status;
    if (purchaseOrderId) where.purchaseOrderId = purchaseOrderId;
    if (warehouseId) where.warehouseId = warehouseId;
    if (supplierId) where.supplierId = supplierId;
    if (startDate || endDate) {
      where.receivedDate = {};
      if (startDate) where.receivedDate[Op.gte] = new Date(startDate);
      if (endDate) where.receivedDate[Op.lte] = new Date(endDate);
    }

    const { rows, count } = await GRN.findAndCountAll({
      where,
      include: [
        { model: PurchaseOrder, as: 'purchaseOrder', attributes: ['id', 'poNumber'] },
        { model: Supplier, as: 'supplier', attributes: ['id', 'supplierCode', 'companyName'] },
        { model: Warehouse, as: 'warehouse', attributes: ['id', 'code', 'name'] },
        { model: User, as: 'receivedByUser', attributes: ['id', 'firstName', 'lastName'] }
      ],
      limit,
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']]
    });

    return {
      grns: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    };
  }

  async findById(id) {
    const grn = await GRN.findByPk(id, {
      include: [
        { model: PurchaseOrder, as: 'purchaseOrder' },
        { model: Supplier, as: 'supplier' },
        { model: Warehouse, as: 'warehouse' },
        { model: User, as: 'receivedByUser', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'verifiedByUser', attributes: ['id', 'firstName', 'lastName'] },
        {
          model: GRNItem,
          as: 'items',
          include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'sku'] }]
        }
      ]
    });

    return grn;
  }

  async create(data, receivedBy) {
    const transaction = await sequelize.transaction();

    try {
      const { purchaseOrderId, items, ...grnData } = data;

      // Get PO
      const po = await PurchaseOrder.findByPk(purchaseOrderId, {
        include: [{ model: PurchaseOrderItem, as: 'items' }],
        transaction
      });

      if (!po) {
        throw new AppError('Purchase order not found', 404, 'NOT_FOUND');
      }

      if (!['approved', 'sent', 'partial'].includes(po.status)) {
        throw new AppError('Purchase order is not ready for receiving', 400, 'INVALID_STATUS');
      }

      // Generate GRN number
      const count = await GRN.count({ transaction });
      const grnNumber = `GRN${new Date().getFullYear()}${String(count + 1).padStart(6, '0')}`;

      // Calculate totals
      let totalAccepted = 0;
      let totalRejected = 0;

      for (const item of items) {
        totalAccepted += item.acceptedQuantity || 0;
        totalRejected += item.rejectedQuantity || 0;
      }

      const grn = await GRN.create({
        grnNumber,
        purchaseOrderId,
        supplierId: po.supplierId,
        warehouseId: po.warehouseId,
        receivedDate: grnData.receivedDate || new Date(),
        invoiceNumber: grnData.invoiceNumber,
        invoiceDate: grnData.invoiceDate,
        deliveryNoteNumber: grnData.deliveryNoteNumber,
        vehicleNumber: grnData.vehicleNumber,
        driverName: grnData.driverName,
        totalAcceptedQuantity: totalAccepted,
        totalRejectedQuantity: totalRejected,
        status: 'pending_verification',
        notes: grnData.notes,
        receivedBy
      }, { transaction });

      // Create GRN items
      for (const item of items) {
        const poItem = po.items.find(pi => pi.productId === item.productId);
        if (!poItem) {
          throw new AppError(`Product ${item.productId} not found in PO`, 400, 'INVALID_PRODUCT');
        }

        const pendingQty = poItem.quantity - poItem.receivedQuantity;
        const totalReceived = (item.acceptedQuantity || 0) + (item.rejectedQuantity || 0);

        if (totalReceived > pendingQty) {
          throw new AppError(`Received quantity exceeds pending quantity for product ${item.productId}`, 400, 'EXCESS_QUANTITY');
        }

        await GRNItem.create({
          grnId: grn.id,
          productId: item.productId,
          orderedQuantity: poItem.quantity,
          receivedQuantity: totalReceived,
          acceptedQuantity: item.acceptedQuantity || 0,
          rejectedQuantity: item.rejectedQuantity || 0,
          rejectionReason: item.rejectionReason,
          batchNumber: item.batchNumber,
          expiryDate: item.expiryDate,
          notes: item.notes
        }, { transaction });
      }

      await transaction.commit();

      return this.findById(grn.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async verify(id, verifiedBy, verificationData) {
    const transaction = await sequelize.transaction();

    try {
      const grn = await GRN.findByPk(id, {
        include: [
          { model: GRNItem, as: 'items' },
          { model: PurchaseOrder, as: 'purchaseOrder', include: [{ model: PurchaseOrderItem, as: 'items' }] }
        ],
        transaction
      });

      if (!grn) {
        throw new AppError('GRN not found', 404, 'NOT_FOUND');
      }

      if (grn.status !== 'pending_verification') {
        throw new AppError('GRN is not pending verification', 400, 'INVALID_STATUS');
      }

      // Update inventory for accepted items
      for (const item of grn.items) {
        if (item.acceptedQuantity > 0) {
          // Find or create inventory record
          let inventory = await Inventory.findOne({
            where: { warehouseId: grn.warehouseId, productId: item.productId },
            transaction
          });

          const previousQty = inventory ? inventory.quantity : 0;

          if (inventory) {
            await inventory.update({
              quantity: inventory.quantity + item.acceptedQuantity
            }, { transaction });
          } else {
            inventory = await Inventory.create({
              warehouseId: grn.warehouseId,
              productId: item.productId,
              quantity: item.acceptedQuantity,
              reservedQuantity: 0,
              reorderLevel: 10,
              maxStockLevel: 1000,
              batchNumber: item.batchNumber,
              expiryDate: item.expiryDate
            }, { transaction });
          }

          // Create inventory transaction
          await InventoryTransaction.create({
            warehouseId: grn.warehouseId,
            productId: item.productId,
            transactionType: 'inward',
            quantity: item.acceptedQuantity,
            referenceType: 'grn',
            referenceId: grn.id,
            previousQuantity: previousQty,
            newQuantity: previousQty + item.acceptedQuantity,
            batchNumber: item.batchNumber,
            notes: `GRN ${grn.grnNumber}`,
            createdBy: verifiedBy
          }, { transaction });
        }

        // Update PO item received quantity
        const poItem = grn.purchaseOrder.items.find(pi => pi.productId === item.productId);
        if (poItem) {
          await PurchaseOrderItem.update(
            { receivedQuantity: poItem.receivedQuantity + item.acceptedQuantity },
            { where: { id: poItem.id }, transaction }
          );
        }
      }

      // Check if PO is complete
      const updatedPOItems = await PurchaseOrderItem.findAll({
        where: { purchaseOrderId: grn.purchaseOrderId },
        transaction
      });

      const allComplete = updatedPOItems.every(item => item.receivedQuantity >= item.quantity);
      const anyComplete = updatedPOItems.some(item => item.receivedQuantity > 0);

      await grn.purchaseOrder.update({
        status: allComplete ? 'completed' : (anyComplete ? 'partial' : grn.purchaseOrder.status)
      }, { transaction });

      // Update GRN status
      await grn.update({
        status: 'verified',
        verifiedBy,
        verifiedAt: new Date(),
        verificationNotes: verificationData?.notes
      }, { transaction });

      await transaction.commit();

      return this.findById(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async reportDiscrepancy(id, discrepancyData, reportedBy) {
    const grn = await GRN.findByPk(id);

    if (!grn) {
      throw new AppError('GRN not found', 404, 'NOT_FOUND');
    }

    await grn.update({
      hasDiscrepancy: true,
      discrepancyDetails: discrepancyData.details,
      discrepancyReportedBy: reportedBy,
      discrepancyReportedAt: new Date()
    });

    return this.findById(id);
  }

  async getDiscrepancies(options = {}) {
    const { page = 1, limit = 20 } = options;

    const { rows, count } = await GRN.findAndCountAll({
      where: { hasDiscrepancy: true },
      include: [
        { model: Supplier, as: 'supplier', attributes: ['id', 'supplierCode', 'companyName'] },
        { model: Warehouse, as: 'warehouse', attributes: ['id', 'code', 'name'] }
      ],
      limit,
      offset: (page - 1) * limit,
      order: [['discrepancyReportedAt', 'DESC']]
    });

    return {
      discrepancies: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    };
  }
}

module.exports = new GRNService();
