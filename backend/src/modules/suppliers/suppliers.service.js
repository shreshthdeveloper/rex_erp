const { Supplier, Country, State, PurchaseOrder, SupplierPayment } = require('../../models');
const { Op } = require('sequelize');

class SuppliersService {
  async create(data) {
    // Generate supplier code if not provided
    if (!data.supplier_code) {
      const count = await Supplier.count();
      data.supplier_code = `SUP${String(count + 1).padStart(6, '0')}`;
    }

    const supplier = await Supplier.create(data);
    return this.findById(supplier.id);
  }

  async findAll({ page = 1, limit = 20, search, isActive }) {
    const where = {};
    const offset = (page - 1) * limit;

    if (search) {
      where[Op.or] = [
        { supplier_code: { [Op.like]: `%${search}%` } },
        { company_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { contact_person: { [Op.like]: `%${search}%` } }
      ];
    }

    if (isActive !== undefined) {
      where.is_active = isActive;
    }

    const { count, rows } = await Supplier.findAndCountAll({
      where,
      include: [
        { model: Country, attributes: ['id', 'name', 'code'] },
        { model: State, attributes: ['id', 'name', 'code'] }
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    return {
      suppliers: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    };
  }

  async findById(id) {
    return await Supplier.findByPk(id, {
      include: [
        { model: Country, attributes: ['id', 'name', 'code', 'currency_code'] },
        { model: State, attributes: ['id', 'name', 'code'] }
      ]
    });
  }

  async update(id, data) {
    const supplier = await Supplier.findByPk(id);
    if (!supplier) {
      throw new Error('Supplier not found');
    }

    await supplier.update(data);
    return this.findById(id);
  }

  async delete(id) {
    const supplier = await Supplier.findByPk(id);
    if (!supplier) {
      throw new Error('Supplier not found');
    }

    // Soft delete
    await supplier.update({ is_active: false });
    return true;
  }

  async getPurchaseOrders(supplierId, { page = 1, limit = 20, status }) {
    const where = { supplier_id: supplierId };
    const offset = (page - 1) * limit;

    if (status) {
      where.status = status;
    }

    const { count, rows } = await PurchaseOrder.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    return {
      purchaseOrders: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    };
  }

  async getPayments(supplierId, { page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;

    const { count, rows } = await SupplierPayment.findAndCountAll({
      where: { supplier_id: supplierId },
      limit,
      offset,
      order: [['payment_date', 'DESC']]
    });

    return {
      payments: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    };
  }

  async getLedger(supplierId, { startDate, endDate }) {
    const supplier = await Supplier.findByPk(supplierId);
    if (!supplier) {
      throw new Error('Supplier not found');
    }

    const whereClause = { supplier_id: supplierId };
    if (startDate && endDate) {
      whereClause.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Get all purchase orders
    const purchaseOrders = await PurchaseOrder.findAll({
      where: whereClause,
      attributes: ['id', 'po_number', 'total_amount', 'status', 'created_at'],
      order: [['created_at', 'ASC']]
    });

    // Get all payments
    const payments = await SupplierPayment.findAll({
      where: whereClause,
      attributes: ['id', 'payment_number', 'amount', 'payment_date', 'status'],
      order: [['payment_date', 'ASC']]
    });

    // Combine and sort
    const ledger = [];
    let balance = 0;

    purchaseOrders.forEach(po => {
      balance += parseFloat(po.total_amount);
      ledger.push({
        date: po.created_at,
        type: 'PURCHASE_ORDER',
        reference: po.po_number,
        debit: parseFloat(po.total_amount),
        credit: 0,
        balance
      });
    });

    payments.forEach(payment => {
      if (payment.status === 'COMPLETED') {
        balance -= parseFloat(payment.amount);
        ledger.push({
          date: payment.payment_date,
          type: 'PAYMENT',
          reference: payment.payment_number,
          debit: 0,
          credit: parseFloat(payment.amount),
          balance
        });
      }
    });

    // Sort by date
    ledger.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Recalculate running balance
    let runningBalance = 0;
    ledger.forEach(entry => {
      runningBalance += entry.debit - entry.credit;
      entry.balance = runningBalance;
    });

    return {
      supplier: {
        id: supplier.id,
        supplier_code: supplier.supplier_code,
        company_name: supplier.company_name
      },
      ledger,
      totalDebit: ledger.reduce((sum, e) => sum + e.debit, 0),
      totalCredit: ledger.reduce((sum, e) => sum + e.credit, 0),
      closingBalance: runningBalance
    };
  }
}

module.exports = new SuppliersService();
