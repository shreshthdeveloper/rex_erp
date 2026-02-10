# API Testing Guide

## Quick API Testing Examples

Base URL: `http://localhost:3000/api/v1`

---

## 1. Authentication

### Register a New User

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "Password123",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 2,
      "email": "john.doe@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "phone": "+1234567890",
      "is_active": true
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "15m"
  },
  "message": "User registered successfully"
}
```

### Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@erp.com",
    "password": "Admin@123"
  }'
```

**Save the `accessToken` from response for subsequent requests!**

### Get Current User

```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 2. Customers

### Create Customer

```bash
curl -X POST http://localhost:3000/api/v1/customers \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Acme Corporation",
    "contact_person": "Jane Smith",
    "email": "jane@acme.com",
    "phone": "+1234567890",
    "billing_address_line1": "123 Main St",
    "billing_city": "New York",
    "billing_country_id": 2,
    "billing_state_id": 2,
    "billing_postal_code": "10001",
    "credit_limit": 50000,
    "payment_terms": "NET_30"
  }'
```

### List Customers

```bash
curl -X GET "http://localhost:3000/api/v1/customers?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Customer by ID

```bash
curl -X GET http://localhost:3000/api/v1/customers/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Update Customer

```bash
curl -X PUT http://localhost:3000/api/v1/customers/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "credit_limit": 75000
  }'
```

### Get Customer Credit Status

```bash
curl -X GET http://localhost:3000/api/v1/customers/1/credit-status \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 3. Products

### Create Product

```bash
curl -X POST http://localhost:3000/api/v1/products \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "Laptop - Dell XPS 15",
    "cost_price": 1200,
    "selling_price": 1500,
    "mrp": 1800,
    "hsn_code": "8471",
    "weight": 2.5,
    "reorder_level": 10,
    "is_taxable": true,
    "track_inventory": true
  }'
```

### List Products

```bash
curl -X GET "http://localhost:3000/api/v1/products?page=1&limit=20&search=laptop" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Product Details

```bash
curl -X GET http://localhost:3000/api/v1/products/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Product Inventory

```bash
curl -X GET http://localhost:3000/api/v1/products/1/inventory \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 4. Sales Orders

### Create Sales Order

```bash
curl -X POST http://localhost:3000/api/v1/sales-orders \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 1,
    "warehouse_id": 1,
    "items": [
      {
        "product_id": 1,
        "quantity": 2,
        "unit_price": 1500,
        "tax_percent": 18
      },
      {
        "product_id": 2,
        "quantity": 1,
        "unit_price": 500,
        "tax_percent": 18
      }
    ],
    "discount_amount": 100,
    "shipping_amount": 50,
    "notes": "Urgent delivery required"
  }'
```

**Note:** This will:
- Check customer credit limit
- Verify inventory availability
- Reserve stock
- Calculate taxes automatically
- Generate order number

### List Sales Orders

```bash
curl -X GET "http://localhost:3000/api/v1/sales-orders?page=1&limit=20&status=PENDING" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Order Details

```bash
curl -X GET http://localhost:3000/api/v1/sales-orders/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Update Order Status

```bash
curl -X PUT http://localhost:3000/api/v1/sales-orders/1/status \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "CONFIRMED"
  }'
```

### Cancel Order

```bash
curl -X POST http://localhost:3000/api/v1/sales-orders/1/cancel \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Note:** This will release reserved inventory back to available stock.

---

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `500` - Internal Server Error

---

## Common Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "timestamp": "2026-02-09T10:30:00.000Z"
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required"
  },
  "timestamp": "2026-02-09T10:30:00.000Z"
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  },
  "timestamp": "2026-02-09T10:30:00.000Z"
}
```

---

## Testing Workflow

### Complete Order Workflow

1. **Login and get token**
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@erp.com","password":"Admin@123"}' \
  | jq -r '.data.accessToken')

echo "Token: $TOKEN"
```

2. **Create a customer**
```bash
curl -X POST http://localhost:3000/api/v1/customers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Test Company",
    "email": "test@company.com",
    "billing_country_id": 1,
    "credit_limit": 100000,
    "payment_terms": "NET_30"
  }'
```

3. **Create a product**
```bash
curl -X POST http://localhost:3000/api/v1/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "Test Product",
    "selling_price": 1000
  }'
```

4. **Create a sales order**
```bash
curl -X POST http://localhost:3000/api/v1/sales-orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 1,
    "warehouse_id": 1,
    "items": [
      {
        "product_id": 1,
        "quantity": 5,
        "unit_price": 1000,
        "tax_percent": 18
      }
    ]
  }'
```

---

## Postman Collection

You can import these examples into Postman:

1. Create a new Postman Collection
2. Add environment variable `base_url` = `http://localhost:3000/api/v1`
3. Add environment variable `token` (will be set after login)
4. Import the requests above

Or use this template:

**Collection Variables:**
- `base_url`: `http://localhost:3000/api/v1`
- `token`: (empty, will be set dynamically)

**Authorization:**
- Type: Bearer Token
- Token: `{{token}}`

---

## Advanced Testing with Scripts

### Bash Script for Complete Flow

```bash
#!/bin/bash

BASE_URL="http://localhost:3000/api/v1"

# 1. Login
echo "Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@erp.com","password":"Admin@123"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken')
echo "Token obtained: ${TOKEN:0:20}..."

# 2. Create Customer
echo "Creating customer..."
CUSTOMER=$(curl -s -X POST "$BASE_URL/customers" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Auto Test Company",
    "email": "auto@test.com",
    "billing_country_id": 1,
    "credit_limit": 50000
  }')

CUSTOMER_ID=$(echo $CUSTOMER | jq -r '.data.id')
echo "Customer created: ID $CUSTOMER_ID"

# 3. Create Product
echo "Creating product..."
PRODUCT=$(curl -s -X POST "$BASE_URL/products" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "Auto Test Product",
    "selling_price": 999
  }')

PRODUCT_ID=$(echo $PRODUCT | jq -r '.data.id')
echo "Product created: ID $PRODUCT_ID"

# 4. Create Order
echo "Creating order..."
ORDER=$(curl -s -X POST "$BASE_URL/sales-orders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"customer_id\": $CUSTOMER_ID,
    \"warehouse_id\": 1,
    \"items\": [
      {
        \"product_id\": $PRODUCT_ID,
        \"quantity\": 2,
        \"unit_price\": 999,
        \"tax_percent\": 18
      }
    ]
  }")

ORDER_ID=$(echo $ORDER | jq -r '.data.id')
ORDER_NUMBER=$(echo $ORDER | jq -r '.data.order_number')
echo "Order created: $ORDER_NUMBER (ID: $ORDER_ID)"

echo "✓ Test workflow completed successfully!"
```

Save this as `test-api.sh`, make it executable (`chmod +x test-api.sh`), and run it (`./test-api.sh`).

---

## Notes

- Replace `YOUR_ACCESS_TOKEN` with actual token from login response
- Tokens expire in 15 minutes by default - use refresh token if expired
- All IDs in examples (customer_id, product_id, etc.) should match actual IDs in your database
- Make sure to run migrations and seed before testing

Happy Testing! 🚀
