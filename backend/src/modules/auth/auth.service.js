const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, Role, Permission } = require('../../models');
const { AppError } = require('../../middleware/error.middleware');
const authConfig = require('../../config/auth');
const emailService = require('../../utils/emailService');

class AuthService {
  async register(data) {
    const { email, password, first_name, last_name, phone, role_name } = data;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    
    if (existingUser) {
      throw new AppError('User with this email already exists', 409, 'DUPLICATE_EMAIL');
    }

    // Hash password
    const password_hash = await User.hashPassword(password);

    // Create user
    const user = await User.create({
      email,
      password_hash,
      first_name,
      last_name,
      phone,
      is_active: true
    });

    // Assign role (default to CUSTOMER if not specified)
    const roleName = role_name || 'CUSTOMER';
    const role = await Role.findOne({ where: { role_name: roleName } });
    
    if (role) {
      await user.addRole(role);
    }

    // Generate tokens
    const tokens = this.generateTokens(user, [roleName]);

    return {
      user: this.sanitizeUser(user),
      ...tokens
    };
  }

  async login(email, password) {
    // Find user
    const user = await User.findOne({
      where: { email },
      include: [
        {
          model: Role,
          through: { attributes: [] },
          include: [
            {
              model: Permission,
              through: { attributes: [] }
            }
          ]
        }
      ]
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.is_active) {
      throw new AppError('Account is deactivated', 403, 'ACCOUNT_DEACTIVATED');
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Update last login
    await user.update({ last_login: new Date() });

    // Get user roles
    const roles = user.Roles?.map(role => role.role_name) || [];

    // Generate tokens
    const tokens = this.generateTokens(user, roles);

    return {
      user: this.sanitizeUser(user),
      roles,
      ...tokens
    };
  }

  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, authConfig.jwtRefreshSecret);
      
      const user = await User.findByPk(decoded.userId, {
        include: [
          {
            model: Role,
            through: { attributes: [] }
          }
        ]
      });

      if (!user || !user.is_active) {
        throw new AppError('Invalid refresh token', 401, 'INVALID_TOKEN');
      }

      const roles = user.Roles?.map(role => role.role_name) || [];
      const tokens = this.generateTokens(user, roles);

      return tokens;
    } catch (error) {
      throw new AppError('Invalid refresh token', 401, 'INVALID_TOKEN');
    }
  }

  async forgotPassword(email) {
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      // Don't reveal that user doesn't exist
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Store token (in production, store in separate table with expiry)
    // For now, we'll just send email
    await emailService.sendPasswordReset(user, resetToken);
  }

  async resetPassword(token, newPassword) {
    // Verify token (in production, check against stored hash and expiry)
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // For this implementation, we'll just update the password
    // In production, verify token from database first

    const password_hash = await User.hashPassword(newPassword);
    
    // Update password (you'd find by token hash in production)
    // await user.update({ password_hash });
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    // Verify current password
    const isValidPassword = await user.comparePassword(currentPassword);
    
    if (!isValidPassword) {
      throw new AppError('Current password is incorrect', 401, 'INVALID_PASSWORD');
    }

    // Update password
    const password_hash = await User.hashPassword(newPassword);
    await user.update({ password_hash });
  }

  async getUserProfile(userId) {
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Role,
          through: { attributes: [] }
        }
      ],
      attributes: { exclude: ['password_hash'] }
    });

    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    return user;
  }

  generateTokens(user, roles = []) {
    const payload = {
      userId: user.id,
      email: user.email,
      roles
    };

    const accessToken = jwt.sign(payload, authConfig.jwtSecret, {
      expiresIn: authConfig.jwtExpiresIn
    });

    const refreshToken = jwt.sign(payload, authConfig.jwtRefreshSecret, {
      expiresIn: authConfig.jwtRefreshExpiresIn
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: authConfig.jwtExpiresIn
    };
  }

  sanitizeUser(user) {
    const userObj = user.toJSON();
    delete userObj.password_hash;
    return userObj;
  }
}

module.exports = new AuthService();
