const { Op } = require('sequelize');
const {
  Product,
  SalesOrder,
  SalesOrderItem,
  Dispatch,
  DispatchItem,
  Inventory,
  InventoryTransaction,
  Warehouse,
  BarcodeScan,
  User,
  sequelize
} = require('../../models');
const { AppError } = require('../../middleware/error.middleware');
const crypto = require('crypto');

// Map scan types from API to DB enum values
const SCAN_TYPE_MAP = {
  'pick': 'PICKING',
  'pack': 'PACKING',
  'receive': 'INWARD',
  'count': 'INVENTORY_COUNT',
  'transfer': 'TRANSFER',
  'other': 'VERIFICATION'
};

const REFERENCE_TYPE_MAP = {
  'dispatch': 'DISPATCH',
  'sales_order': 'SALES_ORDER',
  'purchase_order': 'PURCHASE_ORDER',
  'grn': 'GRN',
  'transfer': 'TRANSFER',
  'adjustment': 'ADJUSTMENT'
};

class BarcodesService {
  generateBarcodeNumber(type = 'product') {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    const prefixes = {
      product: 'PRD',
      order: 'SOD',
      dispatch: 'DSP',
      location: 'LOC'
    };
    return `${prefixes[type] || 'GEN'}${timestamp}${random}`;
  }

  generateEAN13(productId) {
    // Generate EAN-13 barcode
    // Country code (3) + Manufacturer code (4) + Product code (5) + Check digit (1)
    const countryCode = '890'; // India
    const manufacturerCode = '0001';
    const productCode = String(productId).padStart(5, '0');
    const partialCode = `${countryCode}${manufacturerCode}${productCode}`;
    
    // Calculate check digit
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(partialCode[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    
    return `${partialCode}${checkDigit}`;
  }

  async generateProductBarcode(productId) {
    const product = await Product.findByPk(productId);
    
    if (!product) {
      throw new AppError('Product not found', 404, 'NOT_FOUND');
    }

    // Generate barcode if not exists
    if (!product.barcode) {
      const barcode = this.generateEAN13(productId);
      await product.update({ barcode });
      return { product, barcode, generated: true };
    }

    return { product, barcode: product.barcode, generated: false };
  }

  async generateBulkBarcodes(productIds) {
    const results = [];
    
    for (const productId of productIds) {
      try {
        const result = await this.generateProductBarcode(productId);
        results.push({ productId, ...result, success: true });
      } catch (error) {
        results.push({ productId, success: false, error: error.message });
      }
    }

    return {
      total: productIds.length,
      generated: results.filter(r => r.success && r.generated).length,
      existing: results.filter(r => r.success && !r.generated).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  async lookupBarcode(barcode) {
    // Search in products
    const product = await Product.findOne({
      where: {
        [Op.or]: [
          { barcode },
          { sku: barcode }
        ]
      },
      include: [
        {
          model: Inventory,
          as: 'inventories',
          include: [{ model: Warehouse, as: 'warehouse', attributes: ['id', 'name', 'code'] }]
        }
      ]
    });

    if (product) {
      return {
        type: 'product',
        data: product
      };
    }

    // Search in sales orders
    const salesOrder = await SalesOrder.findOne({
      where: { order_number: barcode }
    });

    if (salesOrder) {
      return {
        type: 'sales_order',
        data: salesOrder
      };
    }

    // Search in dispatches
    const dispatch = await Dispatch.findOne({
      where: {
        [Op.or]: [
          { dispatch_number: barcode },
          { tracking_number: barcode }
        ]
      }
    });

    if (dispatch) {
      return {
        type: 'dispatch',
        data: dispatch
      };
    }

    throw new AppError('Barcode not found', 404, 'NOT_FOUND');
  }

  async scanBarcode(scanData, scannedBy) {
    const { barcode, scanType, warehouseId, referenceType, referenceId, location, quantity = 1 } = scanData;

    // Look up the barcode
    const lookup = await this.lookupBarcode(barcode);

    // Map scan type and reference type to DB enum values
    const dbScanType = SCAN_TYPE_MAP[scanType] || 'VERIFICATION';
    const dbReferenceType = referenceType ? REFERENCE_TYPE_MAP[referenceType] : null;

    // Record scan
    const scan = await BarcodeScan.create({
      barcode,
      scan_type: dbScanType,
      product_id: lookup.type === 'product' ? lookup.data.id : null,
      warehouse_id: warehouseId,
      reference_type: dbReferenceType,
      reference_id: referenceId,
      location,
      quantity,
      scanned_by: scannedBy
    });

    return {
      scan,
      entity: lookup
    };
  }

  async validateBarcode(barcode) {
    try {
      const lookup = await this.lookupBarcode(barcode);
      return {
        valid: true,
        type: lookup.type,
        data: lookup.data
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  async getScanHistory(options = {}) {
    const { page = 1, limit = 50, barcode, scanType, warehouseId, scannedBy, startDate, endDate } = options;

    const where = {};
    if (barcode) where.barcode = barcode;
    if (scanType) where.scan_type = SCAN_TYPE_MAP[scanType] || scanType;
    if (warehouseId) where.warehouse_id = warehouseId;
    if (scannedBy) where.scanned_by = scannedBy;
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at[Op.gte] = new Date(startDate);
      if (endDate) where.created_at[Op.lte] = new Date(endDate);
    }

    const { rows, count } = await BarcodeScan.findAndCountAll({
      where,
      include: [
        { model: Warehouse, as: 'warehouse', attributes: ['id', 'name', 'code'] },
        { model: User, as: 'scanner', attributes: ['id', 'first_name', 'last_name'] }
      ],
      limit,
      offset: (page - 1) * limit,
      order: [['created_at', 'DESC']]
    });

    return {
      scans: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    };
  }

  async pickByBarcode(dispatchId, barcode, quantity, pickedBy) {
    const transaction = await sequelize.transaction();

    try {
      // Find product by barcode
      const product = await Product.findOne({
        where: {
          [Op.or]: [{ barcode }, { sku: barcode }]
        },
        transaction
      });

      if (!product) {
        throw new AppError('Product not found for barcode', 404, 'NOT_FOUND');
      }

      // Find dispatch item
      const dispatch = await Dispatch.findByPk(dispatchId, {
        include: [{ model: DispatchItem, as: 'items' }],
        transaction
      });

      if (!dispatch) {
        throw new AppError('Dispatch not found', 404, 'NOT_FOUND');
      }

      const dispatchItem = dispatch.items.find(item => item.product_id === product.id);
      if (!dispatchItem) {
        throw new AppError('Product not in dispatch', 400, 'INVALID_PRODUCT');
      }

      // Update picked quantity
      const newPickedQty = dispatchItem.picked_quantity + quantity;
      if (newPickedQty > dispatchItem.dispatch_quantity) {
        throw new AppError('Picked quantity exceeds dispatch quantity', 400, 'EXCESS_QUANTITY');
      }

      await DispatchItem.update(
        { picked_quantity: newPickedQty },
        { where: { id: dispatchItem.id }, transaction }
      );

      // Record scan
      await BarcodeScan.create({
        barcode,
        scan_type: 'PICKING',
        product_id: product.id,
        warehouse_id: dispatch.warehouse_id,
        reference_type: 'DISPATCH',
        reference_id: dispatchId,
        quantity,
        scanned_by: pickedBy
      }, { transaction });

      await transaction.commit();

      return {
        product,
        dispatchItem: { ...dispatchItem.toJSON(), picked_quantity: newPickedQty },
        message: `Picked ${quantity} units of ${product.name}`
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async printBarcodeLabels(productIds, options = {}) {
    const { format = 'pdf', size = '2x1', quantity = 1 } = options;

    const products = await Product.findAll({
      where: { id: productIds },
      attributes: ['id', 'name', 'sku', 'barcode']
    });

    // In production, generate actual barcode images/PDFs
    // This returns label data for now
    const labels = products.map(product => ({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      quantity,
      size
    }));

    return {
      format,
      totalLabels: labels.length * quantity,
      labels,
      generatedAt: new Date()
    };
  }
}

module.exports = new BarcodesService();
