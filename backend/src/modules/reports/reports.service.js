const { Op, fn, col, literal } = require('sequelize');
const {
  SalesOrder,
  SalesOrderItem,
  Invoice,
  PurchaseOrder,
  PurchaseOrderItem,
  Payment,
  SupplierPayment,
  Product,
  Customer,
  Supplier,
  Inventory,
  InventoryTransaction,
  Warehouse,
  Category,
  User,
  sequelize
} = require('../../models');
const { AppError } = require('../../middleware/error.middleware');

class ReportsService {
  // ============ SALES REPORTS ============
  
  async getSalesSummary(options = {}) {
    const { startDate, endDate, warehouseId, customerId } = options;

    const where = { status: { [Op.in]: ['confirmed', 'completed', 'invoiced', 'shipped', 'delivered'] } };
    if (startDate) where.order_date = { ...(where.order_date || {}), [Op.gte]: new Date(startDate) };
    if (endDate) where.order_date = { ...(where.order_date || {}), [Op.lte]: new Date(endDate) };
    if (warehouseId) where.warehouse_id = warehouseId;
    if (customerId) where.customer_id = customerId;

    const [summary] = await SalesOrder.findAll({
      where,
      attributes: [
        [fn('COUNT', col('id')), 'totalOrders'],
        [fn('SUM', col('total_amount')), 'totalRevenue'],
        [fn('SUM', col('tax_amount')), 'totalTax'],
        [fn('SUM', col('discount_amount')), 'totalDiscount'],
        [fn('AVG', col('total_amount')), 'averageOrderValue']
      ],
      raw: true
    });

    // Get order status distribution
    const statusDistribution = await SalesOrder.findAll({
      where,
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count'],
        [fn('SUM', col('total_amount')), 'amount']
      ],
      group: ['status'],
      raw: true
    });

    return { summary, statusDistribution };
  }

  async getSalesByPeriod(options = {}) {
    const { startDate, endDate, groupBy = 'day', warehouseId } = options;

    const where = { status: { [Op.in]: ['confirmed', 'completed', 'invoiced', 'shipped', 'delivered'] } };
    if (startDate) where.order_date = { ...(where.order_date || {}), [Op.gte]: new Date(startDate) };
    if (endDate) where.order_date = { ...(where.order_date || {}), [Op.lte]: new Date(endDate) };
    if (warehouseId) where.warehouse_id = warehouseId;

    let dateFormat;
    switch (groupBy) {
      case 'month': dateFormat = '%Y-%m'; break;
      case 'week': dateFormat = '%Y-%u'; break;
      case 'year': dateFormat = '%Y'; break;
      default: dateFormat = '%Y-%m-%d';
    }

    const sales = await SalesOrder.findAll({
      where,
      attributes: [
        [fn('DATE_FORMAT', col('order_date'), dateFormat), 'period'],
        [fn('COUNT', col('id')), 'orders'],
        [fn('SUM', col('total_amount')), 'revenue'],
        [fn('AVG', col('total_amount')), 'averageOrderValue']
      ],
      group: [fn('DATE_FORMAT', col('order_date'), dateFormat)],
      order: [[fn('DATE_FORMAT', col('order_date'), dateFormat), 'ASC']],
      raw: true
    });

    return { sales, groupBy };
  }

  async getSalesByProduct(options = {}) {
    const { startDate, endDate, warehouseId, limit = 20 } = options;

    const orderWhere = { status: { [Op.in]: ['confirmed', 'completed', 'invoiced', 'shipped', 'delivered'] } };
    if (startDate) orderWhere.order_date = { ...(orderWhere.order_date || {}), [Op.gte]: new Date(startDate) };
    if (endDate) orderWhere.order_date = { ...(orderWhere.order_date || {}), [Op.lte]: new Date(endDate) };
    if (warehouseId) orderWhere.warehouse_id = warehouseId;

    const products = await SalesOrderItem.findAll({
      attributes: [
        'product_id',
        [fn('SUM', col('SalesOrderItem.quantity')), 'totalQuantity'],
        [fn('SUM', col('SalesOrderItem.line_total')), 'totalRevenue'],
        [fn('COUNT', fn('DISTINCT', col('SalesOrderItem.sales_order_id'))), 'orderCount']
      ],
      include: [
        {
          model: SalesOrder,
          as: 'salesOrder',
          where: orderWhere,
          attributes: []
        },
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'sku']
        }
      ],
      group: ['SalesOrderItem.product_id', 'product.id'],
      order: [[literal('totalRevenue'), 'DESC']],
      limit,
      raw: true,
      nest: true
    });

    return { products };
  }

  async getSalesByCustomer(options = {}) {
    const { startDate, endDate, limit = 20 } = options;

    const where = { status: { [Op.in]: ['confirmed', 'completed', 'invoiced', 'shipped', 'delivered'] } };
    if (startDate) where.order_date = { ...(where.order_date || {}), [Op.gte]: new Date(startDate) };
    if (endDate) where.order_date = { ...(where.order_date || {}), [Op.lte]: new Date(endDate) };

    const customers = await SalesOrder.findAll({
      where,
      attributes: [
        'customer_id',
        [fn('COUNT', col('SalesOrder.id')), 'totalOrders'],
        [fn('SUM', col('total_amount')), 'totalRevenue'],
        [fn('AVG', col('total_amount')), 'averageOrderValue']
      ],
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'company_name', 'customer_code']
        }
      ],
      group: ['customer_id', 'customer.id'],
      order: [[literal('totalRevenue'), 'DESC']],
      limit,
      raw: true,
      nest: true
    });

    return { customers };
  }

  // ============ INVENTORY REPORTS ============

  async getInventorySummary(options = {}) {
    const { warehouseId, categoryId } = options;

    const where = {};
    if (warehouseId) where.warehouse_id = warehouseId;

    const productWhere = {};
    if (categoryId) productWhere.category_id = categoryId;

    const summary = await Inventory.findAll({
      where,
      attributes: [
        [fn('COUNT', fn('DISTINCT', col('Inventory.product_id'))), 'totalProducts'],
        [fn('SUM', col('quantity')), 'totalQuantity'],
        [fn('SUM', col('reserved_quantity')), 'totalReserved'],
        [fn('SUM', literal('quantity * average_cost')), 'totalValue']
      ],
      include: [
        {
          model: Product,
          as: 'product',
          where: Object.keys(productWhere).length > 0 ? productWhere : undefined,
          attributes: []
        }
      ],
      raw: true
    });

    return { summary: summary[0] };
  }

  async getInventoryByWarehouse() {
    const warehouses = await Warehouse.findAll({
      attributes: ['id', 'name', 'code'],
      include: [
        {
          model: Inventory,
          as: 'inventories',
          attributes: []
        }
      ],
      group: ['Warehouse.id'],
      raw: true
    });

    const warehouseStats = await Inventory.findAll({
      attributes: [
        'warehouse_id',
        [fn('COUNT', fn('DISTINCT', col('product_id'))), 'productCount'],
        [fn('SUM', col('quantity')), 'totalQuantity'],
        [fn('SUM', col('reserved_quantity')), 'reservedQuantity'],
        [fn('SUM', literal('quantity * average_cost')), 'totalValue']
      ],
      group: ['warehouse_id'],
      raw: true
    });

    return { warehouses: warehouseStats };
  }

  async getLowStockReport(options = {}) {
    const { warehouseId, threshold } = options;

    const where = {};
    if (warehouseId) where.warehouse_id = warehouseId;

    const lowStock = await Inventory.findAll({
      where: {
        ...where,
        [Op.and]: [
          literal('quantity <= reorder_point')
        ]
      },
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'sku']
        },
        {
          model: Warehouse,
          as: 'warehouse',
          attributes: ['id', 'name', 'code']
        }
      ],
      order: [[literal('quantity / NULLIF(reorder_point, 0)'), 'ASC']]
    });

    return { lowStockItems: lowStock };
  }

  async getInventoryMovement(options = {}) {
    const { startDate, endDate, warehouseId, productId } = options;

    const where = {};
    if (startDate) where.transaction_date = { ...(where.transaction_date || {}), [Op.gte]: new Date(startDate) };
    if (endDate) where.transaction_date = { ...(where.transaction_date || {}), [Op.lte]: new Date(endDate) };
    if (warehouseId) where.warehouse_id = warehouseId;
    if (productId) where.product_id = productId;

    // Group by transaction type
    const byType = await InventoryTransaction.findAll({
      where,
      attributes: [
        'transaction_type',
        [fn('COUNT', col('id')), 'count'],
        [fn('SUM', col('quantity')), 'totalQuantity'],
        [fn('SUM', col('total_value')), 'totalValue']
      ],
      group: ['transaction_type'],
      raw: true
    });

    // Inward vs Outward
    const inward = byType.filter(t => ['PURCHASE', 'RETURN_IN', 'ADJUSTMENT_IN', 'TRANSFER_IN'].includes(t.transaction_type));
    const outward = byType.filter(t => ['SALE', 'RETURN_OUT', 'ADJUSTMENT_OUT', 'TRANSFER_OUT'].includes(t.transaction_type));

    return {
      byType,
      summary: {
        totalInward: inward.reduce((sum, t) => sum + parseFloat(t.totalQuantity || 0), 0),
        totalOutward: outward.reduce((sum, t) => sum + parseFloat(t.totalQuantity || 0), 0),
        inwardValue: inward.reduce((sum, t) => sum + parseFloat(t.totalValue || 0), 0),
        outwardValue: outward.reduce((sum, t) => sum + parseFloat(t.totalValue || 0), 0)
      }
    };
  }

  // ============ FINANCIAL REPORTS ============

  async getReceivablesAgingReport(options = {}) {
    const today = new Date();
    
    const aging = await Invoice.findAll({
      where: {
        payment_status: { [Op.in]: ['UNPAID', 'PARTIALLY_PAID'] },
        balance_amount: { [Op.gt]: 0 }
      },
      attributes: [
        'id',
        'invoice_number',
        'customer_id',
        'invoice_date',
        'due_date',
        'total_amount',
        'paid_amount',
        'balance_amount',
        [
          literal(`DATEDIFF('${today.toISOString().split('T')[0]}', due_date)`),
          'daysOverdue'
        ]
      ],
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'company_name', 'customer_code']
        }
      ],
      order: [['due_date', 'ASC']]
    });

    // Categorize by aging buckets
    const buckets = {
      current: [],     // Not yet due
      days1_30: [],    // 1-30 days overdue
      days31_60: [],   // 31-60 days
      days61_90: [],   // 61-90 days
      over90: []       // Over 90 days
    };

    aging.forEach(inv => {
      const days = inv.getDataValue('daysOverdue');
      if (days <= 0) buckets.current.push(inv);
      else if (days <= 30) buckets.days1_30.push(inv);
      else if (days <= 60) buckets.days31_60.push(inv);
      else if (days <= 90) buckets.days61_90.push(inv);
      else buckets.over90.push(inv);
    });

    const summary = {
      current: buckets.current.reduce((sum, i) => sum + parseFloat(i.balance_amount), 0),
      days1_30: buckets.days1_30.reduce((sum, i) => sum + parseFloat(i.balance_amount), 0),
      days31_60: buckets.days31_60.reduce((sum, i) => sum + parseFloat(i.balance_amount), 0),
      days61_90: buckets.days61_90.reduce((sum, i) => sum + parseFloat(i.balance_amount), 0),
      over90: buckets.over90.reduce((sum, i) => sum + parseFloat(i.balance_amount), 0),
      total: aging.reduce((sum, i) => sum + parseFloat(i.balance_amount), 0)
    };

    return { buckets, summary };
  }

  async getPayablesAgingReport() {
    const today = new Date();
    
    const aging = await PurchaseOrder.findAll({
      where: {
        status: { [Op.in]: ['received', 'partially_received'] },
        payment_status: { [Op.in]: ['unpaid', 'partially_paid'] }
      },
      attributes: [
        'id',
        'po_number',
        'supplier_id',
        'order_date',
        'total_amount',
        [
          literal(`DATEDIFF('${today.toISOString().split('T')[0]}', order_date)`),
          'daysOutstanding'
        ]
      ],
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'company_name', 'supplier_code']
        }
      ],
      order: [['order_date', 'ASC']]
    });

    return { payables: aging };
  }

  async getProfitAndLossReport(options = {}) {
    const { startDate, endDate } = options;

    const salesWhere = { status: { [Op.in]: ['confirmed', 'completed', 'invoiced', 'shipped', 'delivered'] } };
    if (startDate) salesWhere.order_date = { ...(salesWhere.order_date || {}), [Op.gte]: new Date(startDate) };
    if (endDate) salesWhere.order_date = { ...(salesWhere.order_date || {}), [Op.lte]: new Date(endDate) };

    // Revenue
    const [revenue] = await SalesOrder.findAll({
      where: salesWhere,
      attributes: [
        [fn('SUM', col('subtotal')), 'grossRevenue'],
        [fn('SUM', col('discount_amount')), 'discounts'],
        [fn('SUM', col('total_amount')), 'netRevenue'],
        [fn('SUM', col('tax_amount')), 'taxCollected']
      ],
      raw: true
    });

    // Cost of Goods Sold (from inventory transactions)
    const cogsWhere = { transaction_type: 'SALE' };
    if (startDate) cogsWhere.transaction_date = { ...(cogsWhere.transaction_date || {}), [Op.gte]: new Date(startDate) };
    if (endDate) cogsWhere.transaction_date = { ...(cogsWhere.transaction_date || {}), [Op.lte]: new Date(endDate) };

    const [cogs] = await InventoryTransaction.findAll({
      where: cogsWhere,
      attributes: [
        [fn('SUM', col('total_value')), 'costOfGoodsSold']
      ],
      raw: true
    });

    // Purchases
    const purchaseWhere = { status: { [Op.in]: ['received', 'partially_received'] } };
    if (startDate) purchaseWhere.order_date = { ...(purchaseWhere.order_date || {}), [Op.gte]: new Date(startDate) };
    if (endDate) purchaseWhere.order_date = { ...(purchaseWhere.order_date || {}), [Op.lte]: new Date(endDate) };

    const [purchases] = await PurchaseOrder.findAll({
      where: purchaseWhere,
      attributes: [
        [fn('SUM', col('total_amount')), 'totalPurchases']
      ],
      raw: true
    });

    const grossProfit = parseFloat(revenue.netRevenue || 0) - parseFloat(cogs.costOfGoodsSold || 0);
    const grossMargin = revenue.netRevenue ? (grossProfit / parseFloat(revenue.netRevenue)) * 100 : 0;

    return {
      revenue: {
        gross: parseFloat(revenue.grossRevenue || 0),
        discounts: parseFloat(revenue.discounts || 0),
        net: parseFloat(revenue.netRevenue || 0),
        taxCollected: parseFloat(revenue.taxCollected || 0)
      },
      costOfGoodsSold: parseFloat(cogs.costOfGoodsSold || 0),
      grossProfit,
      grossMargin: grossMargin.toFixed(2),
      purchases: parseFloat(purchases.totalPurchases || 0),
      period: { startDate, endDate }
    };
  }

  async getTaxReport(options = {}) {
    const { startDate, endDate } = options;

    const where = { payment_status: { [Op.in]: ['PAID', 'PARTIALLY_PAID', 'UNPAID'] } };
    if (startDate) where.invoice_date = { ...(where.invoice_date || {}), [Op.gte]: new Date(startDate) };
    if (endDate) where.invoice_date = { ...(where.invoice_date || {}), [Op.lte]: new Date(endDate) };

    // Tax collected from invoices
    const taxCollected = await Invoice.findAll({
      where,
      attributes: [
        [fn('SUM', col('tax_amount')), 'totalTaxCollected'],
        [fn('COUNT', col('id')), 'invoiceCount']
      ],
      raw: true
    });

    // Tax by rate (assuming tax items are stored)
    const byMonth = await Invoice.findAll({
      where,
      attributes: [
        [fn('DATE_FORMAT', col('invoice_date'), '%Y-%m'), 'month'],
        [fn('SUM', col('tax_amount')), 'taxAmount'],
        [fn('SUM', col('total_amount')), 'totalAmount']
      ],
      group: [fn('DATE_FORMAT', col('invoice_date'), '%Y-%m')],
      order: [[fn('DATE_FORMAT', col('invoice_date'), '%Y-%m'), 'ASC']],
      raw: true
    });

    return {
      summary: taxCollected[0],
      byMonth,
      period: { startDate, endDate }
    };
  }

  // ============ PURCHASE REPORTS ============

  async getPurchaseSummary(options = {}) {
    const { startDate, endDate, supplierId } = options;

    const where = { status: { [Op.in]: ['approved', 'sent', 'received', 'partially_received'] } };
    if (startDate) where.order_date = { ...(where.order_date || {}), [Op.gte]: new Date(startDate) };
    if (endDate) where.order_date = { ...(where.order_date || {}), [Op.lte]: new Date(endDate) };
    if (supplierId) where.supplier_id = supplierId;

    const [summary] = await PurchaseOrder.findAll({
      where,
      attributes: [
        [fn('COUNT', col('id')), 'totalOrders'],
        [fn('SUM', col('total_amount')), 'totalAmount'],
        [fn('SUM', col('tax_amount')), 'totalTax'],
        [fn('AVG', col('total_amount')), 'averageOrderValue']
      ],
      raw: true
    });

    return { summary };
  }

  async getPurchasesBySupplier(options = {}) {
    const { startDate, endDate, limit = 20 } = options;

    const where = { status: { [Op.in]: ['approved', 'sent', 'received', 'partially_received'] } };
    if (startDate) where.order_date = { ...(where.order_date || {}), [Op.gte]: new Date(startDate) };
    if (endDate) where.order_date = { ...(where.order_date || {}), [Op.lte]: new Date(endDate) };

    const suppliers = await PurchaseOrder.findAll({
      where,
      attributes: [
        'supplier_id',
        [fn('COUNT', col('PurchaseOrder.id')), 'totalOrders'],
        [fn('SUM', col('total_amount')), 'totalAmount']
      ],
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'company_name', 'supplier_code']
        }
      ],
      group: ['supplier_id', 'supplier.id'],
      order: [[literal('totalAmount'), 'DESC']],
      limit,
      raw: true,
      nest: true
    });

    return { suppliers };
  }

  // ============ CUSTOM REPORTS ============

  async generateCustomReport(reportConfig) {
    const { entity, metrics, groupBy, filters, sortBy, limit } = reportConfig;

    // This would be a more complex implementation for custom reports
    // For now, return a placeholder
    return {
      message: 'Custom report generation',
      config: reportConfig,
      generatedAt: new Date()
    };
  }
}

module.exports = new ReportsService();
