const { Customer, Country, State } = require('../../models');
const { Op } = require('sequelize');
const { AppError } = require('../../middleware/error.middleware');

class CustomersService {
  async create(data) {
    // Generate customer code if not provided
    if (!data.customer_code) {
      const count = await Customer.count();
      data.customer_code = `CUST${String(count + 1).padStart(6, '0')}`;
    }
    
    const customer = await Customer.create(data);
    return this.findById(customer.id);
  }
  
  async findAll({ page, limit, search, is_active }) {
    const where = {};
    
    if (search) {
      where[Op.or] = [
        { customer_code: { [Op.like]: `%${search}%` } },
        { company_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { contact_person: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (is_active !== undefined) {
      where.is_active = is_active;
    }
    
    const { count, rows } = await Customer.findAndCountAll({
      where,
      limit,
      offset: (page - 1) * limit,
      include: [
        { model: Country, as: 'billingCountry', attributes: ['name', 'code'] },
        { model: State, as: 'billingState', attributes: ['name', 'code'] }
      ],
      order: [['created_at', 'DESC']]
    });
    
    return {
      customers: rows,
      total: count
    };
  }
  
  async findById(id) {
    return await Customer.findByPk(id, {
      include: [
        { model: Country, as: 'billingCountry' },
        { model: State, as: 'billingState' },
        { model: Country, as: 'shippingCountry' },
        { model: State, as: 'shippingState' }
      ]
    });
  }
  
  async update(id, data) {
    const customer = await Customer.findByPk(id);
    
    if (!customer) {
      throw new AppError('Customer not found', 404, 'NOT_FOUND');
    }
    
    await customer.update(data);
    return this.findById(id);
  }
  
  async delete(id) {
    const customer = await Customer.findByPk(id);
    
    if (!customer) {
      throw new AppError('Customer not found', 404, 'NOT_FOUND');
    }
    
    // Soft delete
    await customer.update({ is_active: false });
    return true;
  }
}

module.exports = new CustomersService();
