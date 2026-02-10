const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');
const logger = require('./config/logger');

// Import routes
const authRoutes = require('./modules/auth/auth.routes');
const customersRoutes = require('./modules/customers/customers.routes');
const productsRoutes = require('./modules/products/products.routes');
const salesRoutes = require('./modules/sales/sales.routes');
const usersRoutes = require('./modules/users/users.routes');
const suppliersRoutes = require('./modules/suppliers/suppliers.routes');
const categoriesRoutes = require('./modules/categories/categories.routes');
const brandsRoutes = require('./modules/brands/brands.routes');
const unitsRoutes = require('./modules/units/units.routes');
const warehousesRoutes = require('./modules/warehouses/warehouses.routes');
const inventoryRoutes = require('./modules/inventory/inventory.routes');
const invoicesRoutes = require('./modules/invoices/invoices.routes');
const purchaseRoutes = require('./modules/purchase/purchase.routes');
const grnRoutes = require('./modules/grn/grn.routes');
const paymentsRoutes = require('./modules/payments/payments.routes');
const dispatchRoutes = require('./modules/dispatch/dispatch.routes');
const returnsRoutes = require('./modules/returns/returns.routes');
const barcodesRoutes = require('./modules/barcodes/barcodes.routes');
const notificationsRoutes = require('./modules/notifications/notifications.routes');
const reportsRoutes = require('./modules/reports/reports.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');
const locationsRoutes = require('./modules/locations/locations.routes');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API routes
const API_VERSION = process.env.API_VERSION || 'v1';

app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/customers`, customersRoutes);
app.use(`/api/${API_VERSION}/products`, productsRoutes);
app.use(`/api/${API_VERSION}/sales-orders`, salesRoutes);
app.use(`/api/${API_VERSION}/users`, usersRoutes);
app.use(`/api/${API_VERSION}/suppliers`, suppliersRoutes);
app.use(`/api/${API_VERSION}/categories`, categoriesRoutes);
app.use(`/api/${API_VERSION}/brands`, brandsRoutes);
app.use(`/api/${API_VERSION}/units`, unitsRoutes);
app.use(`/api/${API_VERSION}/warehouses`, warehousesRoutes);
app.use(`/api/${API_VERSION}/inventory`, inventoryRoutes);
app.use(`/api/${API_VERSION}/invoices`, invoicesRoutes);
app.use(`/api/${API_VERSION}/purchase-orders`, purchaseRoutes);
app.use(`/api/${API_VERSION}/grn`, grnRoutes);
app.use(`/api/${API_VERSION}/payments`, paymentsRoutes);
app.use(`/api/${API_VERSION}/dispatch`, dispatchRoutes);
app.use(`/api/${API_VERSION}/returns`, returnsRoutes);
app.use(`/api/${API_VERSION}/barcodes`, barcodesRoutes);
app.use(`/api/${API_VERSION}/notifications`, notificationsRoutes);
app.use(`/api/${API_VERSION}/reports`, reportsRoutes);
app.use(`/api/${API_VERSION}/dashboard`, dashboardRoutes);
app.use(`/api/${API_VERSION}/locations`, locationsRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
