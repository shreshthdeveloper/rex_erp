const { Op, fn, col, literal } = require('sequelize');
const {
  SalesOrder,
  Invoice,
  PurchaseOrder,
  Payment,
  Product,
  Customer,
  Supplier,
  Inventory,
  Dispatch,
  Return,
  AuditLog,
  Notification,
  User,
  Warehouse,
  sequelize
} = require('../../models');

class DashboardService {
  async getOverviewStats(userId, userRole) {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // Sales stats
    const salesStats = await SalesOrder.findOne({
      where: {
        status: { [Op.in]: ['confirmed', 'completed', 'invoiced', 'shipped', 'delivered'] },
        order_date: { [Op.gte]: startOfMonth }
      },
      attributes: [
        [fn('COUNT', col('id')), 'ordersThisMonth'],
        [fn('SUM', col('total_amount')), 'revenueThisMonth']
      ],
      raw: true
    });

    const salesYTD = await SalesOrder.findOne({
      where: {
        status: { [Op.in]: ['confirmed', 'completed', 'invoiced', 'shipped', 'delivered'] },
        order_date: { [Op.gte]: startOfYear }
      },
      attributes: [
        [fn('COUNT', col('id')), 'ordersYTD'],
        [fn('SUM', col('total_amount')), 'revenueYTD']
      ],
      raw: true
    });

    // Pending orders
    const pendingOrders = await SalesOrder.count({
      where: { status: { [Op.in]: ['draft', 'confirmed'] } }
    });

    // Unpaid invoices
    const unpaidInvoices = await Invoice.findOne({
      where: {
        payment_status: { [Op.in]: ['UNPAID', 'PARTIALLY_PAID'] },
        balance_amount: { [Op.gt]: 0 }
      },
      attributes: [
        [fn('COUNT', col('id')), 'count'],
        [fn('SUM', col('balance_amount')), 'totalDue']
      ],
      raw: true
    });

    // Inventory value - need to join with Product to get cost_price
    const inventoryValue = await Inventory.findOne({
      attributes: [
        [fn('SUM', col('quantity_available')), 'totalQuantity']
      ],
      raw: true
    });

    // Low stock items
    const lowStockCount = await Inventory.count({
      where: literal('quantity_available <= reorder_point')
    });

    // Pending dispatches
    const pendingDispatches = await Dispatch.count({
      where: { status: { [Op.in]: ['pending_picking', 'picking', 'picking_complete', 'packing'] } }
    });

    // Active customers
    const activeCustomers = await Customer.count({
      where: { is_active: true }
    });

    // Active suppliers
    const activeSuppliers = await Supplier.count({
      where: { is_active: true }
    });

    return {
      sales: {
        ordersThisMonth: parseInt(salesStats.ordersThisMonth || 0),
        revenueThisMonth: parseFloat(salesStats.revenueThisMonth || 0),
        ordersYTD: parseInt(salesYTD.ordersYTD || 0),
        revenueYTD: parseFloat(salesYTD.revenueYTD || 0)
      },
      orders: {
        pending: pendingOrders
      },
      invoices: {
        unpaidCount: parseInt(unpaidInvoices.count || 0),
        totalDue: parseFloat(unpaidInvoices.totalDue || 0)
      },
      inventory: {
        totalQuantity: parseInt(inventoryValue.totalQuantity || 0),
        lowStockItems: lowStockCount
      },
      dispatch: {
        pending: pendingDispatches
      },
      entities: {
        customers: activeCustomers,
        suppliers: activeSuppliers
      }
    };
  }

  async getRecentActivities(options = {}) {
    const { limit = 20, userId, type } = options;

    const where = {};
    if (userId) where.user_id = userId;
    if (type) where.entity_type = type;

    const activities = await AuditLog.findAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'first_name', 'last_name'] }
      ],
      order: [['created_at', 'DESC']],
      limit
    });

    return { activities };
  }

  async getSalesChartData(options = {}) {
    const { period = 'last30days', groupBy = 'day' } = options;

    let startDate;
    const endDate = new Date();
    
    switch (period) {
      case 'last7days':
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last30days':
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'last90days':
        startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'thisYear':
        startDate = new Date(endDate.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    let dateFormat;
    switch (groupBy) {
      case 'month': dateFormat = '%Y-%m'; break;
      case 'week': dateFormat = '%Y-%u'; break;
      default: dateFormat = '%Y-%m-%d';
    }

    const salesData = await SalesOrder.findAll({
      where: {
        status: { [Op.in]: ['confirmed', 'completed', 'invoiced', 'shipped', 'delivered'] },
        order_date: { [Op.between]: [startDate, endDate] }
      },
      attributes: [
        [fn('DATE_FORMAT', col('order_date'), dateFormat), 'date'],
        [fn('COUNT', col('id')), 'orders'],
        [fn('SUM', col('total_amount')), 'revenue']
      ],
      group: [fn('DATE_FORMAT', col('order_date'), dateFormat)],
      order: [[fn('DATE_FORMAT', col('order_date'), dateFormat), 'ASC']],
      raw: true
    });

    return { chartData: salesData, period, groupBy };
  }

  async getPendingTasks(userId, userRole) {
    const tasks = [];

    // Pending sales orders
    const pendingSalesOrders = await SalesOrder.count({ 
      where: { status: 'draft' } 
    });
    if (pendingSalesOrders > 0) {
      tasks.push({
        type: 'sales_orders',
        title: 'Draft Sales Orders',
        count: pendingSalesOrders,
        priority: 'medium',
        link: '/sales-orders?status=draft'
      });
    }

    // Purchase orders awaiting approval
    const pendingPOs = await PurchaseOrder.count({ 
      where: { status: 'pending_approval' } 
    });
    if (pendingPOs > 0) {
      tasks.push({
        type: 'purchase_orders',
        title: 'POs Awaiting Approval',
        count: pendingPOs,
        priority: 'high',
        link: '/purchase-orders?status=pending_approval'
      });
    }

    // Overdue invoices
    const overdueInvoices = await Invoice.count({ 
      where: { 
        payment_status: { [Op.in]: ['UNPAID', 'PARTIALLY_PAID'] },
        balance_amount: { [Op.gt]: 0 },
        due_date: { [Op.lt]: new Date() }
      } 
    });
    if (overdueInvoices > 0) {
      tasks.push({
        type: 'invoices',
        title: 'Overdue Invoices',
        count: overdueInvoices,
        priority: 'urgent',
        link: '/invoices?status=overdue'
      });
    }

    // Dispatches ready for picking
    const readyForPicking = await Dispatch.count({ 
      where: { status: 'pending_picking' } 
    });
    if (readyForPicking > 0) {
      tasks.push({
        type: 'dispatch',
        title: 'Ready for Picking',
        count: readyForPicking,
        priority: 'high',
        link: '/dispatch?status=pending_picking'
      });
    }

    // Low stock alerts
    const lowStock = await Inventory.count({
      where: literal('quantity <= reorder_point')
    });
    if (lowStock > 0) {
      tasks.push({
        type: 'inventory',
        title: 'Low Stock Items',
        count: lowStock,
        priority: 'medium',
        link: '/inventory?lowStock=true'
      });
    }

    // Pending returns
    const pendingReturns = await Return.count({ 
      where: { status: { [Op.in]: ['pending', 'approved'] } } 
    });
    if (pendingReturns > 0) {
      tasks.push({
        type: 'returns',
        title: 'Pending Returns',
        count: pendingReturns,
        priority: 'medium',
        link: '/returns?status=pending'
      });
    }

    // Unread notifications
    const unreadNotifications = await Notification.count({ 
      where: { user_id: userId, is_read: false } 
    });
    if (unreadNotifications > 0) {
      tasks.push({
        type: 'notifications',
        title: 'Unread Notifications',
        count: unreadNotifications,
        priority: 'low',
        link: '/notifications'
      });
    }

    // Sort by priority
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return { tasks, totalCount: tasks.reduce((sum, t) => sum + t.count, 0) };
  }

  async getTopProducts(options = {}) {
    const { limit = 10, period = 'thisMonth' } = options;

    let startDate;
    const endDate = new Date();

    switch (period) {
      case 'thisWeek':
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'thisMonth':
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
        break;
      case 'thisYear':
        startDate = new Date(endDate.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    }

    // This would need joins with SalesOrderItems - simplified version
    const products = await Product.findAll({
      attributes: ['id', 'name', 'sku'],
      limit,
      order: [['created_at', 'DESC']]
    });

    return { products, period };
  }

  async getTopCustomers(options = {}) {
    const { limit = 10, period = 'thisMonth' } = options;

    let startDate;
    const endDate = new Date();

    switch (period) {
      case 'thisWeek':
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'thisMonth':
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
        break;
      case 'thisYear':
        startDate = new Date(endDate.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    }

    const customers = await SalesOrder.findAll({
      where: {
        status: { [Op.in]: ['confirmed', 'completed', 'invoiced', 'shipped', 'delivered'] },
        order_date: { [Op.between]: [startDate, endDate] }
      },
      attributes: [
        'customer_id',
        [fn('COUNT', col('SalesOrder.id')), 'orderCount'],
        [fn('SUM', col('total_amount')), 'totalRevenue']
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

    return { customers, period };
  }

  async getWarehouseStats() {
    const warehouses = await Warehouse.findAll({
      attributes: ['id', 'name', 'code', 'is_active']
    });

    const stats = await Promise.all(warehouses.map(async (warehouse) => {
      const inventoryStats = await Inventory.findOne({
        where: { warehouse_id: warehouse.id },
        attributes: [
          [fn('COUNT', fn('DISTINCT', col('product_id'))), 'productCount'],
          [fn('SUM', col('quantity')), 'totalQuantity'],
          [fn('SUM', literal('quantity * average_cost')), 'totalValue']
        ],
        raw: true
      });

      const lowStockCount = await Inventory.count({
        where: {
          warehouse_id: warehouse.id,
          [Op.and]: [literal('quantity <= reorder_point')]
        }
      });

      const pendingDispatches = await Dispatch.count({
        where: {
          warehouse_id: warehouse.id,
          status: { [Op.in]: ['pending_picking', 'picking', 'picking_complete', 'packing'] }
        }
      });

      return {
        warehouse: {
          id: warehouse.id,
          name: warehouse.name,
          code: warehouse.code,
          isActive: warehouse.is_active
        },
        inventory: {
          productCount: parseInt(inventoryStats.productCount || 0),
          totalQuantity: parseInt(inventoryStats.totalQuantity || 0),
          totalValue: parseFloat(inventoryStats.totalValue || 0),
          lowStockItems: lowStockCount
        },
        pendingDispatches
      };
    }));

    return { warehouses: stats };
  }
}

module.exports = new DashboardService();
