# ERP Backend System

Multi-Warehouse B2B Distribution ERP System built with Node.js, Express, and MySQL.

## Installation

```bash
npm install
```

## Configuration

1. Copy `.env.example` to `.env`
2. Update database credentials and other configuration
3. Create MySQL database: `erp_system`

## Database Setup

```bash
# Run migrations
npm run db:migrate

# Run seed data
npm run db:seed
```

## Running the Application

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## API Documentation

API Base URL: `http://localhost:3000/api/v1`

### Authentication
- POST `/auth/login` - Login
- POST `/auth/logout` - Logout
- POST `/auth/refresh-token` - Refresh JWT token
- POST `/auth/forgot-password` - Request password reset
- POST `/auth/reset-password` - Reset password
- POST `/auth/change-password` - Change password
- GET `/auth/me` - Get current user

### Features
- JWT-based authentication
- Role-Based Access Control (RBAC)
- Multi-warehouse inventory management
- Product catalog with variants
- Sales order processing
- Purchase order management
- Payment tracking
- Shipping integration
- Returns and RMA
- Comprehensive reporting

## Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   ├── middleware/       # Express middleware
│   ├── models/          # Sequelize models
│   ├── modules/         # Feature modules
│   ├── utils/           # Utility functions
│   ├── app.js           # Express app setup
│   └── server.js        # Server entry point
├── tests/               # Test files
├── uploads/             # File uploads
├── logs/                # Application logs
└── package.json
```

## License

ISC
