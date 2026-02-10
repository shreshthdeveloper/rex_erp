const { Product, Category, Inventory } = require('../../models');
const { Op } = require('sequelize');
const { AppError } = require('../../middleware/error.middleware');

class ProductsService {
  async create(data) {
    // Generate SKU if not provided
    if (!data.sku) {
      const count = await Product.count();
      data.sku = `SKU${String(count + 1).padStart(8, '0')}`;
    }
    
    // Generate slug from product name
    if (!data.slug && data.product_name) {
      data.slug = data.product_name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }

    // Set product_type if not provided
    if (!data.product_type) {
      data.product_type = 'SINGLE';
    }
    
    const product = await Product.create(data);
    return this.findById(product.id);
  }
  
  async findAll({ page, limit, search, category_id, is_active }) {
    const where = {};
    
    if (search) {
      where[Op.or] = [
        { sku: { [Op.like]: `%${search}%` } },
        { product_name: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (category_id) {
      where.category_id = category_id;
    }
    
    if (is_active !== undefined) {
      where.is_active = is_active;
    }
    
    // Only show parent products and single products (not variant children)
    where.parent_product_id = null;
    
    const { count, rows } = await Product.findAndCountAll({
      where,
      limit,
      offset: (page - 1) * limit,
      include: [
        { model: Category, attributes: ['id', 'category_name'] },
        { model: Product, as: 'variants' }
      ],
      order: [['created_at', 'DESC']]
    });
    
    return {
      products: rows.map(p => ({
        ...p.toJSON(),
        name: p.product_name,
        category_name: p.Category?.category_name || null,
        stock_quantity: 0, // Will be calculated from inventory
        variants_count: p.variants?.length || 0
      })),
      total: count
    };
  }
  
  async findById(id) {
    return await Product.findByPk(id, {
      include: [
        { model: Category },
        { model: Product, as: 'variants' },
        { model: Inventory, include: ['Warehouse'] }
      ]
    });
  }
  
  async update(id, data) {
    const product = await Product.findByPk(id);
    
    if (!product) {
      throw new AppError('Product not found', 404, 'NOT_FOUND');
    }
    
    await product.update(data);
    return this.findById(id);
  }
  
  async delete(id) {
    const product = await Product.findByPk(id);
    
    if (!product) {
      throw new AppError('Product not found', 404, 'NOT_FOUND');
    }
    
    // Soft delete
    await product.update({ is_active: false });
    return true;
  }
  
  async getInventory(productId) {
    const inventory = await Inventory.findAll({
      where: { product_id: productId },
      include: ['Warehouse']
    });
    
    return inventory;
  }
}

module.exports = new ProductsService();
