const { Warehouse, Country, State, User, Inventory, Product, WarehouseTransfer } = require('../../models');
const { Op } = require('sequelize');

class WarehousesService {
  async create(data) {
    // Map camelCase to snake_case
    const warehouseData = {
      warehouse_name: data.name || data.warehouse_name,
      warehouse_code: data.code || data.warehouse_code,
      address_line1: data.address || data.address_line1,
      city: data.city,
      state_id: data.stateId || data.state_id,
      country_id: data.countryId || data.country_id,
      postal_code: data.pincode || data.postal_code,
      phone: data.contactPhone || data.phone,
      email: data.contactEmail || data.email,
      manager_id: data.managerId || data.manager_id,
      is_active: data.isActive !== undefined ? data.isActive : true
    };

    // Generate warehouse code if not provided
    if (!warehouseData.warehouse_code) {
      const count = await Warehouse.count();
      warehouseData.warehouse_code = `WH${String(count + 1).padStart(4, '0')}`;
    }

    const warehouse = await Warehouse.create(warehouseData);
    return this.findById(warehouse.id);
  }

  async findAll({ page = 1, limit = 20, search, isActive, countryId }) {
    const where = {};
    const offset = (page - 1) * limit;

    if (search) {
      where[Op.or] = [
        { warehouse_code: { [Op.like]: `%${search}%` } },
        { warehouse_name: { [Op.like]: `%${search}%` } },
        { city: { [Op.like]: `%${search}%` } }
      ];
    }

    if (isActive !== undefined) {
      where.is_active = isActive;
    }

    if (countryId) {
      where.country_id = countryId;
    }

    const { count, rows } = await Warehouse.findAndCountAll({
      where,
      include: [
        { model: Country, attributes: ['id', 'name', 'code'] },
        { model: State, attributes: ['id', 'name', 'code'] },
        { model: User, as: 'manager', attributes: ['id', 'email', 'first_name', 'last_name'] }
      ],
      limit,
      offset,
      order: [['warehouse_name', 'ASC']]
    });

    return {
      warehouses: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    };
  }

  async findById(id) {
    return await Warehouse.findByPk(id, {
      include: [
        { model: Country, attributes: ['id', 'name', 'code', 'currency_code'] },
        { model: State, attributes: ['id', 'name', 'code'] },
        { model: User, as: 'manager', attributes: ['id', 'email', 'first_name', 'last_name'] }
      ]
    });
  }

  async update(id, data) {
    const warehouse = await Warehouse.findByPk(id);
    if (!warehouse) {
      throw new Error('Warehouse not found');
    }

    // Map camelCase to snake_case
    const updateData = {};
    if (data.name !== undefined || data.warehouse_name !== undefined) {
      updateData.warehouse_name = data.name || data.warehouse_name;
    }
    if (data.code !== undefined || data.warehouse_code !== undefined) {
      updateData.warehouse_code = data.code || data.warehouse_code;
    }
    if (data.address !== undefined || data.address_line1 !== undefined) {
      updateData.address_line1 = data.address || data.address_line1;
    }
    if (data.city !== undefined) updateData.city = data.city;
    if (data.stateId !== undefined || data.state_id !== undefined) {
      updateData.state_id = data.stateId || data.state_id;
    }
    if (data.countryId !== undefined || data.country_id !== undefined) {
      updateData.country_id = data.countryId || data.country_id;
    }
    if (data.pincode !== undefined || data.postal_code !== undefined) {
      updateData.postal_code = data.pincode || data.postal_code;
    }
    if (data.contactPhone !== undefined || data.phone !== undefined) {
      updateData.phone = data.contactPhone || data.phone;
    }
    if (data.contactEmail !== undefined || data.email !== undefined) {
      updateData.email = data.contactEmail || data.email;
    }
    if (data.isActive !== undefined || data.is_active !== undefined) {
      updateData.is_active = data.isActive !== undefined ? data.isActive : data.is_active;
    }

    await warehouse.update(updateData);
    return this.findById(id);
  }

  async delete(id) {
    const warehouse = await Warehouse.findByPk(id);
    if (!warehouse) {
      throw new Error('Warehouse not found');
    }

    // Check if has inventory
    const inventoryCount = await Inventory.count({ 
      where: { 
        warehouse_id: id,
        quantity: { [Op.gt]: 0 }
      } 
    });

    if (inventoryCount > 0) {
      throw new Error('Cannot delete warehouse with inventory');
    }

    // Soft delete
    await warehouse.update({ is_active: false });
    return true;
  }

  async getInventory(warehouseId, { page = 1, limit = 50, search, lowStock }) {
    const where = { warehouse_id: warehouseId };
    const offset = (page - 1) * limit;

    const productWhere = {};
    if (search) {
      productWhere[Op.or] = [
        { sku: { [Op.like]: `%${search}%` } },
        { product_name: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Inventory.findAndCountAll({
      where,
      include: [{
        model: Product,
        where: productWhere,
        attributes: ['id', 'sku', 'product_name', 'reorder_level']
      }],
      limit,
      offset,
      order: [[Product, 'product_name', 'ASC']]
    });

    let inventoryData = rows;

    // Filter low stock items
    if (lowStock === 'true') {
      inventoryData = rows.filter(inv => inv.quantity <= inv.Product.reorder_level);
    }

    return {
      inventory: inventoryData.map(inv => ({
        id: inv.id,
        product_id: inv.product_id,
        sku: inv.Product.sku,
        product_name: inv.Product.product_name,
        quantity: inv.quantity,
        reserved_quantity: inv.reserved_quantity,
        available_quantity: inv.quantity - inv.reserved_quantity,
        reorder_level: inv.Product.reorder_level,
        is_low_stock: inv.quantity <= inv.Product.reorder_level
      })),
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    };
  }

  async getTransfers(warehouseId, { page = 1, limit = 20, direction, status }) {
    const offset = (page - 1) * limit;
    
    let where = {};
    if (direction === 'inbound') {
      where.to_warehouse_id = warehouseId;
    } else if (direction === 'outbound') {
      where.from_warehouse_id = warehouseId;
    } else {
      where[Op.or] = [
        { from_warehouse_id: warehouseId },
        { to_warehouse_id: warehouseId }
      ];
    }

    if (status) {
      where.status = status;
    }

    const { count, rows } = await WarehouseTransfer.findAndCountAll({
      where,
      include: [
        { model: Warehouse, as: 'fromWarehouse', attributes: ['id', 'warehouse_code', 'warehouse_name'] },
        { model: Warehouse, as: 'toWarehouse', attributes: ['id', 'warehouse_code', 'warehouse_name'] },
        { model: User, as: 'creator', attributes: ['id', 'first_name', 'last_name'] }
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    return {
      transfers: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    };
  }
}

module.exports = new WarehousesService();
