const { Category, Attribute, AttributeValue, Product } = require('../../models');
const { Op } = require('sequelize');

class CategoriesService {
  async createCategory(data) {
    // Generate slug if not provided
    if (!data.slug) {
      data.slug = data.category_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    const category = await Category.create(data);
    return this.findCategoryById(category.id);
  }

  async findAllCategories({ page = 1, limit = 20, search, parentId, isActive, flat = false }) {
    const where = {};
    const offset = (page - 1) * limit;

    if (search) {
      where[Op.or] = [
        { category_name: { [Op.like]: `%${search}%` } },
        { slug: { [Op.like]: `%${search}%` } }
      ];
    }

    if (parentId !== undefined) {
      where.parent_id = parentId === 'null' ? null : parseInt(parentId);
    }

    if (isActive !== undefined) {
      where.is_active = isActive;
    }

    if (flat) {
      // Return flat list
      const { count, rows } = await Category.findAndCountAll({
        where,
        limit,
        offset,
        order: [['category_name', 'ASC']]
      });

      return {
        categories: rows,
        total: count,
        page,
        totalPages: Math.ceil(count / limit)
      };
    }

    // Return hierarchical structure (only root categories with children)
    where.parent_id = null;
    const { count, rows } = await Category.findAndCountAll({
      where,
      include: [{
        model: Category,
        as: 'children',
        include: [{
          model: Category,
          as: 'children'
        }]
      }],
      limit,
      offset,
      order: [['category_name', 'ASC']]
    });

    return {
      categories: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    };
  }

  async findCategoryById(id) {
    return await Category.findByPk(id, {
      include: [
        { model: Category, as: 'parent' },
        { 
          model: Category, 
          as: 'children',
          include: [{ model: Category, as: 'children' }]
        }
      ]
    });
  }

  async updateCategory(id, data) {
    const category = await Category.findByPk(id);
    if (!category) {
      throw new Error('Category not found');
    }

    // Update slug if name changed and slug not provided
    if (data.category_name && !data.slug) {
      data.slug = data.category_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    // Prevent circular reference
    if (data.parent_id && data.parent_id === id) {
      throw new Error('Category cannot be its own parent');
    }

    await category.update(data);
    return this.findCategoryById(id);
  }

  async deleteCategory(id) {
    const category = await Category.findByPk(id, {
      include: [{ model: Category, as: 'children' }]
    });

    if (!category) {
      throw new Error('Category not found');
    }

    // Check if has children
    if (category.children && category.children.length > 0) {
      throw new Error('Cannot delete category with subcategories');
    }

    // Check if has products
    const productCount = await Product.count({ where: { category_id: id } });
    if (productCount > 0) {
      throw new Error('Cannot delete category with products');
    }

    await category.destroy();
    return true;
  }

  // Attribute methods
  async createAttribute(data) {
    return await Attribute.create(data);
  }

  async findAllAttributes({ page = 1, limit = 20, isVariant }) {
    const where = {};
    const offset = (page - 1) * limit;

    if (isVariant !== undefined) {
      where.is_variant_attribute = isVariant;
    }

    const { count, rows } = await Attribute.findAndCountAll({
      where,
      include: [{
        model: AttributeValue,
        as: 'values',
        order: [['display_order', 'ASC']]
      }],
      limit,
      offset,
      order: [['display_order', 'ASC'], ['attribute_name', 'ASC']]
    });

    return {
      attributes: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    };
  }

  async findAttributeById(id) {
    return await Attribute.findByPk(id, {
      include: [{
        model: AttributeValue,
        as: 'values',
        order: [['display_order', 'ASC']]
      }]
    });
  }

  async updateAttribute(id, data) {
    const attribute = await Attribute.findByPk(id);
    if (!attribute) {
      throw new Error('Attribute not found');
    }

    await attribute.update(data);
    return this.findAttributeById(id);
  }

  async deleteAttribute(id) {
    const attribute = await Attribute.findByPk(id);
    if (!attribute) {
      throw new Error('Attribute not found');
    }

    await attribute.destroy();
    return true;
  }

  async addAttributeValue(attributeId, data) {
    const attribute = await Attribute.findByPk(attributeId);
    if (!attribute) {
      throw new Error('Attribute not found');
    }

    data.attribute_id = attributeId;
    return await AttributeValue.create(data);
  }

  async updateAttributeValue(valueId, data) {
    const value = await AttributeValue.findByPk(valueId);
    if (!value) {
      throw new Error('Attribute value not found');
    }

    await value.update(data);
    return value;
  }

  async deleteAttributeValue(valueId) {
    const value = await AttributeValue.findByPk(valueId);
    if (!value) {
      throw new Error('Attribute value not found');
    }

    await value.destroy();
    return true;
  }
}

module.exports = new CategoriesService();
