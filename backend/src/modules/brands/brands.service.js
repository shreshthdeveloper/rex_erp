const { Brand, Product } = require('../../models');
const { Op } = require('sequelize');

// Generate slug from name
const generateSlug = (name) => {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
};

// Get all brands
const getBrands = async (filters = {}) => {
  const { search, is_active, page = 1, limit = 50 } = filters;
  
  const where = {};
  
  if (search) {
    where[Op.or] = [
      { brand_name: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } }
    ];
  }
  
  if (is_active !== undefined) {
    where.is_active = is_active === 'true' || is_active === true;
  }
  
  const offset = (page - 1) * limit;
  
  const { count, rows } = await Brand.findAndCountAll({
    where,
    order: [['brand_name', 'ASC']],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });
  
  return {
    brands: rows.map(brand => ({
      id: brand.id,
      name: brand.brand_name,
      slug: brand.slug,
      description: brand.description,
      logo_url: brand.logo_url,
      website: brand.website,
      is_active: brand.is_active,
      created_at: brand.created_at,
      updated_at: brand.updated_at
    })),
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    }
  };
};

// Get brand by ID
const getBrandById = async (id) => {
  const brand = await Brand.findByPk(id);
  
  if (!brand) {
    throw new Error('Brand not found');
  }
  
  return {
    id: brand.id,
    name: brand.brand_name,
    slug: brand.slug,
    description: brand.description,
    logo_url: brand.logo_url,
    website: brand.website,
    is_active: brand.is_active,
    created_at: brand.created_at,
    updated_at: brand.updated_at
  };
};

// Create brand
const createBrand = async (data) => {
  const slug = data.slug || generateSlug(data.brand_name);
  
  // Check if slug already exists
  const existingBrand = await Brand.findOne({ where: { slug } });
  if (existingBrand) {
    throw new Error('A brand with this name already exists');
  }
  
  const brand = await Brand.create({
    brand_name: data.brand_name,
    slug,
    description: data.description,
    logo_url: data.logo_url,
    website: data.website,
    is_active: data.is_active !== undefined ? data.is_active : true
  });
  
  return {
    id: brand.id,
    name: brand.brand_name,
    slug: brand.slug,
    description: brand.description,
    logo_url: brand.logo_url,
    website: brand.website,
    is_active: brand.is_active
  };
};

// Update brand
const updateBrand = async (id, data) => {
  const brand = await Brand.findByPk(id);
  
  if (!brand) {
    throw new Error('Brand not found');
  }
  
  const updateData = {};
  
  if (data.brand_name) {
    updateData.brand_name = data.brand_name;
    updateData.slug = data.slug || generateSlug(data.brand_name);
    
    // Check if new slug already exists (for different brand)
    const existingBrand = await Brand.findOne({
      where: {
        slug: updateData.slug,
        id: { [Op.ne]: id }
      }
    });
    if (existingBrand) {
      throw new Error('A brand with this name already exists');
    }
  }
  
  if (data.description !== undefined) updateData.description = data.description;
  if (data.logo_url !== undefined) updateData.logo_url = data.logo_url;
  if (data.website !== undefined) updateData.website = data.website;
  if (data.is_active !== undefined) updateData.is_active = data.is_active;
  
  await brand.update(updateData);
  
  return {
    id: brand.id,
    name: brand.brand_name,
    slug: brand.slug,
    description: brand.description,
    logo_url: brand.logo_url,
    website: brand.website,
    is_active: brand.is_active
  };
};

// Delete brand
const deleteBrand = async (id) => {
  const brand = await Brand.findByPk(id);
  
  if (!brand) {
    throw new Error('Brand not found');
  }
  
  // Check if brand has products
  const productCount = await Product.count({ where: { brand_id: id } });
  if (productCount > 0) {
    throw new Error(`Cannot delete brand with ${productCount} associated products`);
  }
  
  await brand.destroy();
  
  return { message: 'Brand deleted successfully' };
};

module.exports = {
  getBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand
};
