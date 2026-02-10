const { User, Role, Permission } = require('../../models');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');

class UsersService {
  async create(data) {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    data.password_hash = await bcrypt.hash(data.password, salt);
    delete data.password;

    const user = await User.create(data);

    // Assign roles if provided
    if (data.role_ids && data.role_ids.length > 0) {
      const roles = await Role.findAll({ where: { id: data.role_ids } });
      await user.setRoles(roles);
    }

    return this.findById(user.id);
  }

  async findAll({ page = 1, limit = 20, search, isActive, roleId }) {
    const where = {};
    const offset = (page - 1) * limit;

    if (search) {
      where[Op.or] = [
        { email: { [Op.like]: `%${search}%` } },
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name: { [Op.like]: `%${search}%` } }
      ];
    }

    if (isActive !== undefined) {
      where.is_active = isActive;
    }

    const include = [{
      model: Role,
      through: { attributes: [] },
      ...(roleId && { where: { id: roleId } })
    }];

    const { count, rows } = await User.findAndCountAll({
      where,
      include,
      attributes: { exclude: ['password_hash'] },
      limit,
      offset,
      order: [['created_at', 'DESC']],
      distinct: true
    });

    return {
      users: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    };
  }

  async findById(id) {
    return await User.findByPk(id, {
      attributes: { exclude: ['password_hash'] },
      include: [{
        model: Role,
        through: { attributes: [] },
        include: [{
          model: Permission,
          through: { attributes: [] }
        }]
      }]
    });
  }

  async update(id, data) {
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('User not found');
    }

    // Hash new password if provided
    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      data.password_hash = await bcrypt.hash(data.password, salt);
      delete data.password;
    }

    await user.update(data);
    return this.findById(id);
  }

  async delete(id) {
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('User not found');
    }

    // Soft delete
    await user.update({ is_active: false });
    return true;
  }

  async updateRoles(id, roleIds) {
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('User not found');
    }

    const roles = await Role.findAll({ where: { id: roleIds } });
    await user.setRoles(roles);

    return this.findById(id);
  }

  async activate(id) {
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('User not found');
    }

    await user.update({ is_active: true });
    return this.findById(id);
  }

  async deactivate(id) {
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('User not found');
    }

    await user.update({ is_active: false });
    return this.findById(id);
  }
}

module.exports = new UsersService();
