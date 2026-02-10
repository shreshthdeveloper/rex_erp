const { SalesOrder, SalesOrderItem, Customer, Product, Warehouse, Inventory, Invoice, InvoiceItem, Payment, sequelize } = require('../../models');
const { AppError } = require('../../middleware/error.middleware');
const { Op } = require('sequelize');
const TaxCalculator = require('../../utils/taxCalculator');
const CreditManager = require('../../utils/creditManager');

class SalesOrdersService {
  async create(data) {
    const transaction = await sequelize.transaction();
    
    try {
      // Generate order number
      if (!data.order_number) {
        const count = await SalesOrder.count();
        data.order_number = `SO${new Date().getFullYear()}${String(count + 1).padStart(6, '0')}`;
      }

      // Get customer and warehouse
      const customer = await Customer.findByPk(data.customer_id, {
        include: ['billingCountry', 'billingState']
      });
      const warehouse = await Warehouse.findByPk(data.warehouse_id, {
        include: ['Country', 'State']
      });

      if (!customer || !warehouse) {
        throw new AppError('Customer or warehouse not found', 404, 'NOT_FOUND');
      }

      // Check credit limit
      const subtotal = data.items.reduce((sum, item) => {
        return sum + (item.quantity * item.unit_price);
      }, 0);

      const creditCheck = await CreditManager.checkCreditLimit(customer.id, subtotal);
      
      if (!creditCheck.approved && customer.payment_terms !== 'IMMEDIATE') {
        throw new AppError(creditCheck.message, 400, 'CREDIT_LIMIT_EXCEEDED');
      }

      // Check inventory and reserve stock
      for (const item of data.items) {
        if (!item.quantity || item.quantity <= 0) {
          throw new AppError('Item quantity must be greater than 0', 400, 'INVALID_QUANTITY');
        }
        const inventory = await Inventory.findOne({
          where: {
            product_id: item.product_id,
            warehouse_id: data.warehouse_id
          },
          transaction,
          lock: transaction.LOCK.UPDATE
        });

        const available = inventory.quantity_available - inventory.quantity_reserved;
        if (!inventory || available < item.quantity) {
          throw new AppError(
            `Insufficient inventory for product ID ${item.product_id}`,
            400,
            'INSUFFICIENT_INVENTORY'
          );
        }

        // Reserve inventory
        await inventory.update({
          quantity_available: inventory.quantity_available - item.quantity,
          quantity_reserved: inventory.quantity_reserved + item.quantity
        }, { transaction });
      }

      // Calculate tax
      const taxResult = await TaxCalculator.calculateOrderTax({
        customer,
        warehouse,
        items: data.items
      });

      // Calculate totals
      const discount_amount = data.discount_amount || 0;
      const shipping_amount = data.shipping_amount || 0;
      const total_amount = subtotal + taxResult.taxAmount - discount_amount + shipping_amount;

      // Set payment terms and due date
      const payment_terms = customer.payment_terms;
      let due_date = new Date();
      
      if (payment_terms === 'NET_30') due_date.setDate(due_date.getDate() + 30);
      else if (payment_terms === 'NET_60') due_date.setDate(due_date.getDate() + 60);
      else if (payment_terms === 'NET_90') due_date.setDate(due_date.getDate() + 90);

      // Create sales order
      const order = await SalesOrder.create({
        ...data,
        subtotal_amount: subtotal,
        tax_amount: taxResult.taxAmount,
        total_amount,
        payment_terms,
        due_date,
        status: 'PENDING',
        payment_status: 'UNPAID'
      }, { transaction });

      // Create order items
      for (const item of data.items) {
        const product = await Product.findByPk(item.product_id);
        
        const subtotal = item.quantity * item.unit_price;
        const discount_amount = item.discount_amount || 0;
        const tax_amount = (subtotal - discount_amount) * (item.tax_percent || 0) / 100;
        const total = subtotal - discount_amount + tax_amount;

        await SalesOrderItem.create({
          sales_order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_amount,
          tax_percent: item.tax_percent || 0,
          tax_amount,
          subtotal,
          total
        }, { transaction });
      }

      await transaction.commit();

      return await this.findById(order.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findAll({ page, limit, search, status, customer_id }) {
    const where = {};
    
    if (search) {
      where.order_number = { [Op.like]: `%${search}%` };
    }
    
    if (status) {
      where.status = status;
    }
    
    if (customer_id) {
      where.customer_id = customer_id;
    }

    const { count, rows } = await SalesOrder.findAndCountAll({
      where,
      limit,
      offset: (page - 1) * limit,
      include: [
        { model: Customer, attributes: ['customer_code', 'company_name'] },
        { model: Warehouse, attributes: ['warehouse_code', 'warehouse_name'] }
      ],
      order: [['created_at', 'DESC']]
    });

    return {
      orders: rows,
      total: count
    };
  }

  async findById(id) {
    return await SalesOrder.findByPk(id, {
      include: [
        { model: Customer },
        { model: Warehouse },
        {
          model: SalesOrderItem,
          as: 'items',
          include: [{ model: Product }]
        }
      ]
    });
  }

  async updateStatus(id, status) {
    const order = await SalesOrder.findByPk(id);
    
    if (!order) {
      throw new AppError('Order not found', 404, 'NOT_FOUND');
    }

    await order.update({ status });
    return await this.findById(id);
  }

  async cancelOrder(id) {
    const transaction = await sequelize.transaction();
    
    try {
      const order = await SalesOrder.findByPk(id, {
        include: [{ model: SalesOrderItem, as: 'items' }],
        transaction
      });

      if (!order) {
        throw new AppError('Order not found', 404, 'NOT_FOUND');
      }

      if (['SHIPPED', 'DELIVERED'].includes(order.status)) {
        throw new AppError('Cannot cancel shipped or delivered order', 400, 'INVALID_STATUS');
      }

      // Release reserved inventory
      for (const item of order.items) {
        const inventory = await Inventory.findOne({
          where: {
            product_id: item.product_id,
            warehouse_id: order.warehouse_id
          },
          transaction
        });

        if (inventory) {
          await inventory.update({
            quantity_available: inventory.quantity_available + item.quantity,
            quantity_reserved: inventory.quantity_reserved - item.quantity
          }, { transaction });
        }
      }

      await order.update({ status: 'CANCELLED' }, { transaction });
      await transaction.commit();

      return await this.findById(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async deleteOrder(id) {
    // Soft-delete by cancelling and releasing inventory
    return this.cancelOrder(id);
  }

  async confirmOrder(id, confirmedBy) {
    const order = await SalesOrder.findByPk(id);
    
    if (!order) {
      throw new AppError('Order not found', 404, 'NOT_FOUND');
    }

    if (order.status !== 'PENDING') {
      throw new AppError('Only pending orders can be confirmed', 400, 'INVALID_STATUS');
    }

    await order.update({
      status: 'CONFIRMED',
      confirmed_by: confirmedBy,
      confirmed_at: new Date()
    });

    return await this.findById(id);
  }

  async holdOrder(id, holdReason) {
    const order = await SalesOrder.findByPk(id);
    
    if (!order) {
      throw new AppError('Order not found', 404, 'NOT_FOUND');
    }

    if (['SHIPPED', 'DELIVERED', 'CANCELLED'].includes(order.status)) {
      throw new AppError('Cannot hold this order', 400, 'INVALID_STATUS');
    }

    await order.update({
      status: 'ON_HOLD',
      hold_reason: holdReason
    });

    return await this.findById(id);
  }

  async releaseHold(id) {
    const order = await SalesOrder.findByPk(id);
    
    if (!order) {
      throw new AppError('Order not found', 404, 'NOT_FOUND');
    }

    if (order.status !== 'ON_HOLD') {
      throw new AppError('Order is not on hold', 400, 'INVALID_STATUS');
    }

    await order.update({
      status: 'CONFIRMED',
      hold_reason: null
    });

    return await this.findById(id);
  }

  async generateInvoice(id, createdBy) {
    const transaction = await sequelize.transaction();

    try {
      const order = await SalesOrder.findByPk(id, {
        include: [
          { model: Customer },
          { model: SalesOrderItem, as: 'items', include: [{ model: Product }] }
        ],
        transaction
      });

      if (!order) {
        throw new AppError('Order not found', 404, 'NOT_FOUND');
      }

      if (!['CONFIRMED', 'PROCESSING'].includes(order.status)) {
        throw new AppError('Order must be confirmed to generate invoice', 400, 'INVALID_STATUS');
      }

      // Check if invoice already exists
      const existingInvoice = await Invoice.findOne({
        where: { salesOrderId: id },
        transaction
      });

      if (existingInvoice) {
        throw new AppError('Invoice already exists for this order', 400, 'INVOICE_EXISTS');
      }

      // Generate invoice number
      const count = await Invoice.count({ transaction });
      const invoiceNumber = `INV${new Date().getFullYear()}${String(count + 1).padStart(6, '0')}`;

      // Create invoice
      const invoice = await Invoice.create({
        invoiceNumber,
        salesOrderId: id,
        customerId: order.customer_id,
        invoiceDate: new Date(),
        dueDate: order.due_date,
        subtotalAmount: order.subtotal_amount,
        discountAmount: order.discount_amount || 0,
        taxAmount: order.tax_amount,
        shippingAmount: order.shipping_amount || 0,
        totalAmount: order.total_amount,
        paidAmount: 0,
        balanceAmount: order.total_amount,
        status: 'unpaid',
        paymentTerms: order.payment_terms,
        notes: order.notes,
        createdBy
      }, { transaction });

      // Create invoice items
      for (const item of order.items) {
        await InvoiceItem.create({
          invoiceId: invoice.id,
          productId: item.product_id,
          description: item.Product ? item.Product.name : '',
          quantity: item.quantity,
          unitPrice: item.unit_price,
          discountPercent: 0,
          discountAmount: item.discount_amount || 0,
          taxPercent: item.tax_percent || 0,
          taxAmount: item.tax_amount || 0,
          totalAmount: item.total,
          hsnCode: item.Product ? item.Product.hsn_code : null
        }, { transaction });
      }

      // Update order status
      await order.update({
        status: 'PROCESSING',
        invoice_id: invoice.id
      }, { transaction });

      await transaction.commit();

      return invoice;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getPaymentHistory(id) {
    const order = await SalesOrder.findByPk(id);
    
    if (!order) {
      throw new AppError('Order not found', 404, 'NOT_FOUND');
    }

    // Get associated invoice
    const invoice = await Invoice.findOne({
      where: { salesOrderId: id }
    });

    if (!invoice) {
      return {
        orderId: id,
        payments: [],
        totalPaid: 0,
        balance: order.total_amount
      };
    }

    const payments = await Payment.findAll({
      where: { invoiceId: invoice.id },
      order: [['paymentDate', 'DESC']]
    });

    return {
      orderId: id,
      invoiceId: invoice.id,
      payments,
      totalPaid: payments.reduce((sum, p) => sum + parseFloat(p.amount), 0),
      balance: invoice.balanceAmount
    };
  }

  async getOverdueOrders() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orders = await SalesOrder.findAll({
      where: {
        due_date: { [Op.lt]: today },
        payment_status: { [Op.ne]: 'PAID' },
        status: { [Op.notIn]: ['CANCELLED', 'DELIVERED'] }
      },
      include: [
        { model: Customer, attributes: ['customer_code', 'company_name', 'email'] },
        { model: Warehouse, attributes: ['warehouse_code', 'warehouse_name'] }
      ],
      order: [['due_date', 'ASC']]
    });

    return orders.map(order => ({
      ...order.toJSON(),
      daysOverdue: Math.floor((today - new Date(order.due_date)) / (1000 * 60 * 60 * 24))
    }));
  }

  async getOrderTimeline(id) {
    const order = await SalesOrder.findByPk(id, {
      include: [
        { model: Invoice.sequelize?.models?.Invoice }
      ]
    });

    if (!order) {
      throw new AppError('Order not found', 404, 'NOT_FOUND');
    }

    const timeline = [];

    // Order created
    timeline.push({
      event: 'Order Created',
      date: order.created_at,
      status: 'PENDING',
      description: `Order ${order.order_number} created`
    });

    // Order confirmed
    if (order.confirmed_at) {
      timeline.push({
        event: 'Order Confirmed',
        date: order.confirmed_at,
        status: 'CONFIRMED',
        description: 'Order confirmed and ready for processing'
      });
    }

    // Check for invoice
    const invoice = await Invoice.findOne({ where: { salesOrderId: id } });
    if (invoice) {
      timeline.push({
        event: 'Invoice Generated',
        date: invoice.createdAt,
        status: 'INVOICED',
        description: `Invoice ${invoice.invoiceNumber} generated`
      });
    }

    // Status changes would be tracked via audit log in production
    if (order.status === 'SHIPPED') {
      timeline.push({
        event: 'Order Shipped',
        date: order.shipped_at || order.updated_at,
        status: 'SHIPPED',
        description: 'Order has been shipped'
      });
    }

    if (order.status === 'DELIVERED') {
      timeline.push({
        event: 'Order Delivered',
        date: order.delivered_at || order.updated_at,
        status: 'DELIVERED',
        description: 'Order has been delivered'
      });
    }

    if (order.status === 'CANCELLED') {
      timeline.push({
        event: 'Order Cancelled',
        date: order.updated_at,
        status: 'CANCELLED',
        description: 'Order has been cancelled'
      });
    }

    return timeline.sort((a, b) => new Date(a.date) - new Date(b.date));
  }
}

module.exports = new SalesOrdersService();
