# API Implementation Guide for Copilot

## Quick Start for Developers

This guide provides everything needed to implement the ERP API using GitHub Copilot or any AI coding assistant.

---

## Project Setup

```bash
# Initialize project
mkdir erp-backend && cd erp-backend
npm init -y

# Install dependencies
npm install express mysql2 sequelize bcrypt jsonwebtoken
npm install joi express-validator cors helmet morgan winston
npm install dotenv multer aws-sdk nodemailer twilio
npm install bwip-js pdfkit axios

# Dev dependencies
npm install --save-dev nodemon jest supertest eslint
```

## Environment Variables (.env)

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=erp_system
DB_USER=root
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email (SendGrid/SMTP)
EMAIL_SERVICE=sendgrid
EMAIL_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@yourcompany.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890

# AWS S3 (for file uploads)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Folder Structure

```
erp-backend/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   ├── auth.js
│   │   └── constants.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── rbac.middleware.js
│   │   ├── validation.middleware.js
│   │   └── error.middleware.js
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   ├── auth.routes.js
│   │   │   └── auth.validator.js
│   │   ├── users/
│   │   ├── customers/
│   │   ├── products/
│   │   ├── inventory/
│   │   ├── sales/
│   │   ├── purchase/
│   │   ├── payments/
│   │   ├── dispatch/
│   │   ├── returns/
│   │   └── reports/
│   ├── models/
│   │   ├── index.js
│   │   ├── User.js
│   │   ├── Customer.js
│   │   ├── Product.js
│   │   └── ...
│   ├── utils/
│   │   ├── logger.js
│   │   ├── emailService.js
│   │   ├── smsService.js
│   │   ├── taxCalculator.js
│   │   └── barcodeGenerator.js
│   └── app.js
├── tests/
├── .env
├── .env.example
├── .eslintrc.json
├── .gitignore
├── package.json
└── README.md
```

---

## Sample Code Templates for Copilot

### 1. Database Configuration (src/config/database.js)

```javascript
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    pool: {
      max: 20,
      min: 5,
      acquire: 60000,
      idle: 10000
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      charset: 'utf8mb4',
      supportBigNumbers: true,
      bigNumberStrings: true
    }
  }
);

// Test connection
sequelize.authenticate()
  .then(() => console.log('Database connected successfully'))
  .catch(err => console.error('Database connection error:', err));

module.exports = sequelize;
```

### 2. Authentication Middleware (src/middleware/auth.middleware.js)

```javascript
const jwt = require('jsonwebtoken');
const { AppError } = require('./error.middleware');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return next(new AppError('Access token required', 401, 'UNAUTHORIZED'));
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(new AppError('Invalid or expired token', 403, 'FORBIDDEN'));
    }
    
    req.user = decoded;
    next();
  });
};

module.exports = { authenticateToken };
```

### 3. RBAC Middleware (src/middleware/rbac.middleware.js)

```javascript
const { AppError } = require('./error.middleware');
const { User, Role, Permission } = require('../models');

const requirePermission = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      const user = await User.findByPk(req.user.userId, {
        include: [{
          model: Role,
          include: [Permission]
        }]
      });
      
      if (!user) {
        return next(new AppError('User not found', 404, 'NOT_FOUND'));
      }
      
      const userPermissions = user.roles
        .flatMap(role => role.permissions)
        .map(perm => perm.permission_name);
      
      const hasPermission = requiredPermissions.some(perm => 
        userPermissions.includes(perm)
      );
      
      if (!hasPermission) {
        return next(new AppError(
          'Insufficient permissions', 
          403, 
          'FORBIDDEN'
        ));
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { requirePermission };
```

### 4. Error Handler Middleware (src/middleware/error.middleware.js)

```javascript
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  let error = { ...err };
  error.message = err.message;
  
  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    const messages = err.errors.map(e => e.message);
    error = new AppError(messages.join(', '), 400, 'VALIDATION_ERROR');
  }
  
  // Sequelize unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0].path;
    error = new AppError(`${field} already exists`, 409, 'DUPLICATE_ERROR');
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token', 401, 'INVALID_TOKEN');
  }
  
  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired', 401, 'TOKEN_EXPIRED');
  }
  
  const statusCode = error.statusCode || 500;
  const code = error.code || 'INTERNAL_SERVER_ERROR';
  
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: error.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    },
    timestamp: new Date().toISOString()
  });
};

module.exports = { AppError, errorHandler };
```

### 5. Sample Controller (src/modules/customers/customers.controller.js)

```javascript
const customersService = require('./customers.service');
const { AppError } = require('../../middleware/error.middleware');

// Create customer
exports.createCustomer = async (req, res, next) => {
  try {
    const customer = await customersService.create(req.body);
    
    res.status(201).json({
      success: true,
      data: customer,
      message: 'Customer created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

// Get all customers
exports.getCustomers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, isActive } = req.query;
    
    const result = await customersService.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      isActive: isActive === 'true'
    });
    
    res.json({
      success: true,
      data: result.customers,
      pagination: {
        total: result.total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(result.total / limit)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

// Get customer by ID
exports.getCustomerById = async (req, res, next) => {
  try {
    const customer = await customersService.findById(req.params.id);
    
    if (!customer) {
      throw new AppError('Customer not found', 404, 'NOT_FOUND');
    }
    
    res.json({
      success: true,
      data: customer,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

// Update customer
exports.updateCustomer = async (req, res, next) => {
  try {
    const customer = await customersService.update(req.params.id, req.body);
    
    res.json({
      success: true,
      data: customer,
      message: 'Customer updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

// Delete customer
exports.deleteCustomer = async (req, res, next) => {
  try {
    await customersService.delete(req.params.id);
    
    res.json({
      success: true,
      message: 'Customer deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};
```

### 6. Sample Service (src/modules/customers/customers.service.js)

```javascript
const { Customer, Country, State } = require('../../models');
const { Op } = require('sequelize');

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
  
  async findAll({ page, limit, search, isActive }) {
    const where = {};
    
    if (search) {
      where[Op.or] = [
        { company_name: { [Op.like]: `%${search}%` } },
        { customer_code: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (isActive !== undefined) {
      where.is_active = isActive;
    }
    
    const { count, rows } = await Customer.findAndCountAll({
      where,
      include: [
        { model: Country, as: 'billingCountry', attributes: ['id', 'name', 'code'] },
        { model: State, as: 'billingState', attributes: ['id', 'name', 'code'] }
      ],
      limit,
      offset: (page - 1) * limit,
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
      throw new Error('Customer not found');
    }
    
    await customer.update(data);
    return this.findById(id);
  }
  
  async delete(id) {
    const customer = await Customer.findByPk(id);
    
    if (!customer) {
      throw new Error('Customer not found');
    }
    
    // Soft delete
    await customer.update({ is_active: false });
    return true;
  }
}

module.exports = new CustomersService();
```

### 7. Sample Routes (src/modules/customers/customers.routes.js)

```javascript
const express = require('express');
const router = express.Router();
const customersController = require('./customers.controller');
const { authenticateToken } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/rbac.middleware');
const { validateCustomer } = require('./customers.validator');

// All routes require authentication
router.use(authenticateToken);

// Create customer
router.post(
  '/',
  requirePermission('CUSTOMER_CREATE'),
  validateCustomer,
  customersController.createCustomer
);

// Get all customers
router.get(
  '/',
  requirePermission('CUSTOMER_VIEW'),
  customersController.getCustomers
);

// Get customer by ID
router.get(
  '/:id',
  requirePermission('CUSTOMER_VIEW'),
  customersController.getCustomerById
);

// Update customer
router.put(
  '/:id',
  requirePermission('CUSTOMER_UPDATE'),
  validateCustomer,
  customersController.updateCustomer
);

// Delete customer
router.delete(
  '/:id',
  requirePermission('CUSTOMER_DELETE'),
  customersController.deleteCustomer
);

module.exports = router;
```

---

## Critical Business Logic Examples

### Tax Calculation Engine

```javascript
// src/utils/taxCalculator.js
class TaxCalculator {
  static async calculateOrderTax(order) {
    const { customer, warehouse, items } = order;
    
    const customerCountry = await Country.findByPk(customer.billing_country_id);
    const warehouseCountry = await Country.findByPk(warehouse.country_id);
    
    if (customerCountry.tax_system === 'GST' && 
        customer.billing_country_id === warehouse.country_id) {
      
      // India GST calculation
      if (customer.billing_state_id === warehouse.state_id) {
        // Intrastate: CGST + SGST
        return this.calculateIntrastateTax(items);
      } else {
        // Interstate: IGST
        return this.calculateInterstateTax(items);
      }
    } else if (customerCountry.tax_system === 'SALES_TAX') {
      // USA Sales Tax
      return this.calculateSalesTax(items, customer.billing_state_id);
    }
    
    return { taxAmount: 0, taxDetails: [] };
  }
  
  static calculateIntrastateTax(items) {
    const cgstRate = 9; // 9%
    const sgstRate = 9; // 9%
    
    let totalTax = 0;
    const taxDetails = [];
    
    items.forEach(item => {
      const taxableAmount = item.quantity * item.unit_price;
      const cgst = (taxableAmount * cgstRate) / 100;
      const sgst = (taxableAmount * sgstRate) / 100;
      
      totalTax += cgst + sgst;
      
      taxDetails.push({
        productId: item.product_id,
        taxableAmount,
        cgst,
        sgst,
        totalTax: cgst + sgst
      });
    });
    
    return { taxAmount: totalTax, taxDetails };
  }
  
  static async calculateSalesTax(items, stateId) {
    const taxRate = await TaxRate.findOne({
      where: {
        state_id: stateId,
        tax_type: 'SALES_TAX',
        is_active: true
      }
    });
    
    if (!taxRate) return { taxAmount: 0, taxDetails: [] };
    
    let totalTax = 0;
    const taxDetails = [];
    
    items.forEach(item => {
      const taxableAmount = item.quantity * item.unit_price;
      const tax = (taxableAmount * taxRate.rate) / 100;
      
      totalTax += tax;
      
      taxDetails.push({
        productId: item.product_id,
        taxableAmount,
        salesTax: tax,
        rate: taxRate.rate
      });
    });
    
    return { taxAmount: totalTax, taxDetails };
  }
}

module.exports = TaxCalculator;
```

### Credit Limit Check

```javascript
// src/utils/creditManager.js
class CreditManager {
  static async checkCreditLimit(customerId, newOrderTotal) {
    const customer = await Customer.findByPk(customerId);
    
    if (customer.payment_terms === 'IMMEDIATE') {
      return { approved: true };
    }
    
    // Get unpaid invoices
    const unpaidInvoices = await Invoice.findAll({
      where: {
        customer_id: customerId,
        status: { [Op.in]: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] }
      }
    });
    
    const totalOutstanding = unpaidInvoices.reduce(
      (sum, inv) => sum + parseFloat(inv.balance_amount), 
      0
    );
    
    const totalExposure = totalOutstanding + newOrderTotal;
    
    if (totalExposure > customer.credit_limit) {
      return {
        approved: false,
        reason: 'CREDIT_LIMIT_EXCEEDED',
        details: {
          creditLimit: customer.credit_limit,
          currentOutstanding: totalOutstanding,
          newOrderTotal,
          totalExposure,
          amountOver: totalExposure - customer.credit_limit
        }
      };
    }
    
    return { approved: true };
  }
}

module.exports = CreditManager;
```

---

## Testing Examples

### Unit Test Example

```javascript
// tests/services/customers.service.test.js
const customersService = require('../../src/modules/customers/customers.service');
const { Customer } = require('../../src/models');

jest.mock('../../src/models');

describe('CustomersService', () => {
  describe('create', () => {
    it('should create a customer with generated code', async () => {
      Customer.count.mockResolvedValue(5);
      Customer.create.mockResolvedValue({ id: 1 });
      Customer.findByPk.mockResolvedValue({
        id: 1,
        customer_code: 'CUST000006',
        company_name: 'Test Company'
      });
      
      const result = await customersService.create({
        company_name: 'Test Company',
        email: 'test@example.com'
      });
      
      expect(result.customer_code).toBe('CUST000006');
      expect(Customer.create).toHaveBeenCalled();
    });
  });
  
  describe('findAll', () => {
    it('should return paginated customers', async () => {
      Customer.findAndCountAll.mockResolvedValue({
        count: 50,
        rows: [{ id: 1 }, { id: 2 }]
      });
      
      const result = await customersService.findAll({
        page: 1,
        limit: 20
      });
      
      expect(result.total).toBe(50);
      expect(result.customers).toHaveLength(2);
    });
  });
});
```

### Integration Test Example

```javascript
// tests/integration/auth.test.js
const request = require('supertest');
const app = require('../../src/app');
const { User } = require('../../src/models');

describe('Auth API', () => {
  beforeAll(async () => {
    // Setup test database
  });
  
  afterAll(async () => {
    // Cleanup
  });
  
  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'password123'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');
    });
    
    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'wrongpassword'
        });
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
```

---

## Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations run successfully
- [ ] Seed data loaded
- [ ] All tests passing
- [ ] SSL certificates configured
- [ ] Rate limiting enabled
- [ ] Logging configured
- [ ] Error monitoring setup (Sentry, etc.)
- [ ] Database backups scheduled
- [ ] PM2/Docker configured for production

---

## Common Copilot Prompts

When using GitHub Copilot, use these prompts:

```
// Create a controller for sales orders with full CRUD operations
// Include authentication, RBAC, validation, and error handling

// Create a service to handle inventory reservations with transaction support
// Handle race conditions and concurrent updates

// Create a tax calculation function for both GST and Sales Tax
// Support intrastate, interstate calculations

// Create a payment allocation service
// Handle partial payments, advances, and overpayments across multiple invoices

// Create a warehouse transfer service
// Handle approval workflow, shipping, receiving, and discrepancy management
```

---

This guide provides complete templates and examples for implementing every part of the ERP system. Copy and paste these examples as starting points, then let Copilot expand them with full implementations.

