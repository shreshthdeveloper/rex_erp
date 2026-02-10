# ERP Backend - Setup Guide

## 🚀 Quick Start Guide

Follow these steps to get your ERP backend up and running.

### Prerequisites

- Node.js 18+ and npm
- MySQL 8.0+
- Git (optional)

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Configure Environment

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and update the following required values:
```env
# Database - Update these with your MySQL credentials
DB_HOST=localhost
DB_PORT=3306
DB_NAME=erp_system
DB_USER=root
DB_PASSWORD=your_mysql_password

# JWT Secrets - Change these to secure random strings
JWT_SECRET=your-secret-key-change-this
JWT_REFRESH_SECRET=your-refresh-secret-change-this
```

### Step 3: Create Database

Open MySQL and create the database:

```sql
CREATE DATABASE erp_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Or using command line:
```bash
mysql -u root -p -e "CREATE DATABASE erp_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### Step 4: Run Migrations

This will create all database tables:

```bash
npm run db:migrate
```

### Step 5: Seed Initial Data

This will populate the database with:
- Roles and Permissions
- Countries and States
- Tax Rates
- Payment Methods
- Default Admin User

```bash
npm run db:seed
```

**Default Admin Credentials:**
- Email: `admin@erp.com`
- Password: `Admin@123`

⚠️ **Important:** Change the admin password after first login!

### Step 6: Start the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:3000`

### Step 7: Test the API

#### Health Check
```bash
curl http://localhost:3000/health
```

#### Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@erp.com",
    "password": "Admin@123"
  }'
```

You should receive a response with `accessToken` and `refreshToken`.

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication

All protected endpoints require a Bearer token in the Authorization header:

```bash
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Available Endpoints

#### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout
- `POST /auth/refresh-token` - Refresh JWT token
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password
- `POST /auth/change-password` - Change password (requires auth)
- `GET /auth/me` - Get current user (requires auth)

#### Customers
- `POST /customers` - Create customer
- `GET /customers` - List customers (with pagination)
- `GET /customers/:id` - Get customer details
- `PUT /customers/:id` - Update customer
- `DELETE /customers/:id` - Delete customer
- `GET /customers/:id/credit-status` - Get credit status

#### Products
- `POST /products` - Create product
- `GET /products` - List products (with pagination)
- `GET /products/:id` - Get product details
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Delete product
- `GET /products/:id/inventory` - Get product inventory

#### Sales Orders
- `POST /sales-orders` - Create order
- `GET /sales-orders` - List orders (with pagination)
- `GET /sales-orders/:id` - Get order details
- `PUT /sales-orders/:id/status` - Update order status
- `POST /sales-orders/:id/cancel` - Cancel order

## 🧪 Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm test -- --coverage
```

## 🔧 Development

### File Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.js   # Sequelize configuration
│   │   ├── auth.js       # JWT configuration
│   │   ├── constants.js  # App constants
│   │   └── logger.js     # Winston logger
│   ├── middleware/       # Express middleware
│   │   ├── auth.middleware.js
│   │   ├── rbac.middleware.js
│   │   ├── validation.middleware.js
│   │   ├── error.middleware.js
│   │   └── audit.middleware.js
│   ├── models/          # Sequelize models
│   │   ├── index.js     # Model associations
│   │   ├── User.js
│   │   ├── Customer.js
│   │   └── ...
│   ├── modules/         # Feature modules
│   │   ├── auth/
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   └── auth.routes.js
│   │   ├── customers/
│   │   ├── products/
│   │   └── sales/
│   ├── utils/           # Utility functions
│   │   ├── emailService.js
│   │   ├── smsService.js
│   │   ├── taxCalculator.js
│   │   ├── barcodeGenerator.js
│   │   └── creditManager.js
│   ├── scripts/         # Database scripts
│   │   ├── migrate.js
│   │   └── seed.js
│   ├── app.js           # Express app setup
│   └── server.js        # Server entry point
├── tests/               # Test files
├── uploads/             # File uploads
├── logs/                # Application logs
└── package.json
```

### Adding New Modules

To add a new module (e.g., "warehouses"):

1. Create directory:
```bash
mkdir -p src/modules/warehouses
```

2. Create files:
- `warehouses.service.js` - Business logic
- `warehouses.controller.js` - Request handlers
- `warehouses.routes.js` - Route definitions

3. Register routes in `src/app.js`:
```javascript
const warehousesRoutes = require('./modules/warehouses/warehouses.routes');
app.use(`/api/v1/warehouses`, warehousesRoutes);
```

## 🔒 Security

### Best Practices Implemented

1. **JWT Authentication** - Secure token-based auth
2. **Password Hashing** - BCrypt with salt rounds
3. **Rate Limiting** - Prevent brute force attacks
4. **Helmet.js** - Security headers
5. **CORS** - Controlled cross-origin access
6. **Input Validation** - Express-validator
7. **SQL Injection Prevention** - Sequelize parameterized queries
8. **Audit Logging** - Track all critical operations

### Securing Production

Before deploying to production:

1. Change all default passwords
2. Use strong JWT secrets (32+ random characters)
3. Enable HTTPS
4. Set secure environment variables
5. Enable database backups
6. Configure firewall rules
7. Set appropriate CORS origins
8. Enable rate limiting
9. Use environment-specific configs

## 📊 Database

### Backup

```bash
# Backup database
mysqldump -u root -p erp_system > backup_$(date +%Y%m%d).sql

# Restore database
mysql -u root -p erp_system < backup_20260209.sql
```

### Reset Database

⚠️ **Warning:** This will delete all data!

```bash
# Drop and recreate database
mysql -u root -p -e "DROP DATABASE IF EXISTS erp_system;"
mysql -u root -p -e "CREATE DATABASE erp_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Run migrations and seed
npm run db:migrate
npm run db:seed
```

## 🐛 Troubleshooting

### Database Connection Error

**Problem:** `Error: ER_ACCESS_DENIED_ERROR`

**Solution:** 
- Check MySQL is running: `mysql -V`
- Verify credentials in `.env`
- Ensure database exists

### Port Already in Use

**Problem:** `Error: EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port in .env
PORT=3001
```

### JWT Token Errors

**Problem:** `Invalid token` or `Token expired`

**Solution:**
- Check `JWT_SECRET` matches between login and verification
- Token expires in 15 minutes by default - use refresh token
- Ensure `Authorization: Bearer TOKEN` header is correct

### Sequelize Sync Errors

**Problem:** `SequelizeDatabaseError: Table doesn't exist`

**Solution:**
```bash
# Run migrations
npm run db:migrate
```

## 📈 Performance

### Optimization Tips

1. **Enable Caching** - Use Redis for frequently accessed data
2. **Database Indexing** - Already configured on foreign keys
3. **Pagination** - Always use pagination for list endpoints
4. **Compression** - Already enabled via gzip
5. **Connection Pooling** - Configured in database.js

### Monitoring

- Check logs in `logs/` directory
- Use `GET /health` endpoint for health checks
- Monitor database connections
- Track API response times

## 🚢 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong JWT secrets
- [ ] Configure database connection pooling
- [ ] Enable HTTPS
- [ ] Set up reverse proxy (nginx)
- [ ] Configure process manager (PM2)
- [ ] Enable automated backups
- [ ] Set up monitoring and alerts
- [ ] Configure logging to external service
- [ ] Implement rate limiting per user
- [ ] Review and update CORS settings

### PM2 Deployment

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start src/server.js --name erp-backend

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup
```

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review error logs in `logs/`
3. Check database connection
4. Verify environment variables

## 🎉 You're All Set!

Your ERP backend is now running and ready to handle requests. Start building your frontend or test the API using tools like Postman or curl.

**Next Steps:**
1. Change the default admin password
2. Create some test data (customers, products)
3. Test creating a sales order
4. Implement additional modules as needed

Happy coding! 🚀
