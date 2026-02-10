const { Unit, Product } = require('../../models');
const { Op } = require('sequelize');

// Get all units
const getUnits = async (filters = {}) => {
  const { search, is_active, page = 1, limit = 50 } = filters;
  
  const where = {};
  
  if (search) {
    where[Op.or] = [
      { unit_name: { [Op.like]: `%${search}%` } },
      { short_name: { [Op.like]: `%${search}%` } }
    ];
  }
  
  if (is_active !== undefined) {
    where.is_active = is_active === 'true' || is_active === true;
  }
  
  const offset = (page - 1) * limit;
  
  const { count, rows } = await Unit.findAndCountAll({
    where,
    include: [{
      model: Unit,
      as: 'baseUnit',
      attributes: ['id', 'unit_name', 'short_name']
    }],
    order: [['unit_name', 'ASC']],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });
  
  return {
    units: rows.map(unit => ({
      id: unit.id,
      name: unit.unit_name,
      short_name: unit.short_name,
      description: unit.description,
      base_unit_id: unit.base_unit_id,
      base_unit: unit.baseUnit ? {
        id: unit.baseUnit.id,
        name: unit.baseUnit.unit_name,
        short_name: unit.baseUnit.short_name
      } : null,
      conversion_factor: unit.conversion_factor,
      is_active: unit.is_active,
      created_at: unit.created_at,
      updated_at: unit.updated_at
    })),
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    }
  };
};

// Get unit by ID
const getUnitById = async (id) => {
  const unit = await Unit.findByPk(id, {
    include: [{
      model: Unit,
      as: 'baseUnit',
      attributes: ['id', 'unit_name', 'short_name']
    }]
  });
  
  if (!unit) {
    throw new Error('Unit not found');
  }
  
  return {
    id: unit.id,
    name: unit.unit_name,
    short_name: unit.short_name,
    description: unit.description,
    base_unit_id: unit.base_unit_id,
    base_unit: unit.baseUnit ? {
      id: unit.baseUnit.id,
      name: unit.baseUnit.unit_name,
      short_name: unit.baseUnit.short_name
    } : null,
    conversion_factor: unit.conversion_factor,
    is_active: unit.is_active,
    created_at: unit.created_at,
    updated_at: unit.updated_at
  };
};

// Create unit
const createUnit = async (data) => {
  // Check if short_name already exists
  const existingUnit = await Unit.findOne({ where: { short_name: data.short_name } });
  if (existingUnit) {
    throw new Error('A unit with this short name already exists');
  }
  
  const unit = await Unit.create({
    unit_name: data.unit_name,
    short_name: data.short_name,
    description: data.description,
    base_unit_id: data.base_unit_id,
    conversion_factor: data.conversion_factor || 1,
    is_active: data.is_active !== undefined ? data.is_active : true
  });
  
  return {
    id: unit.id,
    name: unit.unit_name,
    short_name: unit.short_name,
    description: unit.description,
    base_unit_id: unit.base_unit_id,
    conversion_factor: unit.conversion_factor,
    is_active: unit.is_active
  };
};

// Update unit
const updateUnit = async (id, data) => {
  const unit = await Unit.findByPk(id);
  
  if (!unit) {
    throw new Error('Unit not found');
  }
  
  const updateData = {};
  
  if (data.unit_name) updateData.unit_name = data.unit_name;
  if (data.short_name) {
    // Check if new short_name already exists (for different unit)
    const existingUnit = await Unit.findOne({
      where: {
        short_name: data.short_name,
        id: { [Op.ne]: id }
      }
    });
    if (existingUnit) {
      throw new Error('A unit with this short name already exists');
    }
    updateData.short_name = data.short_name;
  }
  if (data.description !== undefined) updateData.description = data.description;
  if (data.base_unit_id !== undefined) updateData.base_unit_id = data.base_unit_id;
  if (data.conversion_factor !== undefined) updateData.conversion_factor = data.conversion_factor;
  if (data.is_active !== undefined) updateData.is_active = data.is_active;
  
  await unit.update(updateData);
  
  return {
    id: unit.id,
    name: unit.unit_name,
    short_name: unit.short_name,
    description: unit.description,
    base_unit_id: unit.base_unit_id,
    conversion_factor: unit.conversion_factor,
    is_active: unit.is_active
  };
};

// Delete unit
const deleteUnit = async (id) => {
  const unit = await Unit.findByPk(id);
  
  if (!unit) {
    throw new Error('Unit not found');
  }
  
  // Check if unit has products
  const productCount = await Product.count({ where: { unit_id: id } });
  if (productCount > 0) {
    throw new Error(`Cannot delete unit with ${productCount} associated products`);
  }
  
  // Check if unit is used as base for other units
  const derivedCount = await Unit.count({ where: { base_unit_id: id } });
  if (derivedCount > 0) {
    throw new Error(`Cannot delete unit that is used as base for ${derivedCount} other units`);
  }
  
  await unit.destroy();
  
  return { message: 'Unit deleted successfully' };
};

module.exports = {
  getUnits,
  getUnitById,
  createUnit,
  updateUnit,
  deleteUnit
};
