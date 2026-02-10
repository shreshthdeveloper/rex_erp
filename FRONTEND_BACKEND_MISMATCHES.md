# 🔄 Frontend-Backend Synchronization Issues

**Generated:** February 9, 2026  
**Analysis:** Frontend pages vs Backend routes and models

---

## 🔴 CRITICAL MISMATCHES

### 1. **Customers Page - Field Name Mismatches**

**Frontend:** `frontend/src/pages/customers/Customers.jsx`
- Expects: `customer.name`, `customer.company`, `customer.city`, `customer.country`, `customer.order_count`, `customer.total_spent`, `customer.total_revenue`, `customer.average_order_value`
- Backend Model: Uses `company_name`, `contact_person`, `billing_city`, `billing_country_id` (not `name`, `company`, `city`, `country`)
- **Impact:** Customer list won't display correctly, stats will be broken

**Frontend:** `frontend/src/pages/customers/CreateCustomer.jsx`
- Sends: `company_name`, `contact_person`, `billing_address_line1`, `billing_city`, `billing_state_id`, `billing_country_id`, `postal_code`
- Backend expects: `company_name`, `email`, `billing_country_id` (required)
- **Issue:** Frontend sends `postal_code` but backend expects `billing_postal_code`
- **Impact:** Postal code won't be saved

---

### 2. **Sales Orders - API Endpoint Mismatches**

**Frontend:** `frontend/src/pages/sales/SalesOrders.jsx`
- Calls: `salesAPI.getAll()`, `salesAPI.delete()`
- Backend Route: `GET /sales-orders`, `DELETE /sales-orders/:id` (doesn't exist!)
- **Issue:** Backend doesn't have DELETE route for sales orders
- **Impact:** Delete functionality will fail

**Frontend:** `frontend/src/pages/sales/SalesOrders.jsx:72`
- Calls: `salesAPI.delete(order.id)`
- Backend: No DELETE route defined in `sales.routes.js`
- **Impact:** Delete button will cause 404 error

**Frontend:** `frontend/src/pages/sales/SalesOrders.jsx:64`
- Expects response: `data?.data?.orders`, `data?.data?.pagination`
- Backend returns: `{ orders: [...], total: count }` (no nested `data.data`)
- **Impact:** Orders won't display, pagination broken

**Frontend:** `frontend/src/pages/sales/SalesOrders.jsx:104-105`
- Expects: `row.customer_name`, `row.customer_email`
- Backend returns: `Customer.company_name`, `Customer.email` (nested object)
- **Impact:** Customer info won't display in table

**Frontend:** `frontend/src/pages/sales/CreateSalesOrder.jsx:148`
- Sends: `customer_id`, `warehouse_id`, `items[]`, `shipping_address{}`, `subtotal`, `tax_amount`, `total_amount`
- Backend expects: `customer_id`, `warehouse_id`, `items[]` (with `product_id`, `quantity`, `unit_price`, `tax_percent`)
- **Issue:** Frontend sends `shipping_address` object but backend expects flat fields (`shipping_address_line1`, `shipping_city`, etc.)
- **Impact:** Shipping address won't be saved

**Frontend:** `frontend/src/pages/sales/CreateSalesOrder.jsx:86`
- Expects: `customersData?.data?.customers`
- Backend returns: `{ customers: [...], total: count }` (no nested `data.data`)
- **Impact:** Customer dropdown won't populate

**Frontend:** `frontend/src/pages/sales/CreateSalesOrder.jsx:131-135`
- Sends item: `product_id`, `product_name`, `sku`, `quantity`, `unit_price`
- Backend expects: `product_id`, `quantity`, `unit_price`, `tax_percent` (optional)
- **Issue:** Frontend doesn't send `tax_percent` per item
- **Impact:** Tax calculation might be incorrect

---

### 3. **Payments Page - API Structure Mismatch**

**Frontend:** `frontend/src/pages/payments/Payments.jsx:19`
- Calls: `paymentsAPI.getAll({ ...filters, page, limit: 20 })`
- **Issue:** Backend has separate endpoints: `/payments/customer` and `/payments/supplier` (no unified `/payments`)
- **Impact:** API call will fail with 404

**Frontend:** `frontend/src/pages/payments/Payments.jsx:22`
- Expects: `data?.data?.payments`
- Backend returns: `{ payments: [...], total: count }` (no nested `data.data`)
- **Impact:** Payments won't display

**Frontend:** `frontend/src/pages/payments/Payments.jsx:46-48`
- Expects: `payment.type` (RECEIVED, MADE, REFUND)
- Backend: Customer payments don't have `type` field, only `payment_method`
- **Impact:** Type filtering won't work

**Frontend:** `frontend/src/pages/payments/Payments.jsx:218-228`
- Expects: `payment.invoice`, `payment.invoice_id`, `payment.purchase_order`, `payment.purchase_order_id`
- Backend: CustomerPayment has `invoiceId` (camelCase), not `invoice_id`
- **Impact:** Invoice/PO links won't work

---

### 4. **Dispatch Page - Field Name Mismatches**

**Frontend:** `frontend/src/pages/dispatch/Dispatches.jsx:18`
- Calls: `dispatchesAPI.getAll({ ...filters, page, limit: 20 })`
- Backend: `GET /dispatch` (correct)

**Frontend:** `frontend/src/pages/dispatch/Dispatches.jsx:21`
- Expects: `data?.data?.dispatches`
- Backend returns: `{ dispatches: [...], total: count }` (no nested `data.data`)
- **Impact:** Dispatches won't display

**Frontend:** `frontend/src/pages/dispatch/Dispatches.jsx:185`
- Expects: `dispatch.dispatch_number`
- Backend Model: Uses `dispatch_number` (correct, but need to verify)

**Frontend:** `frontend/src/pages/dispatch/Dispatches.jsx:189-194`
- Expects: `dispatch.sales_order?.order_number`, `dispatch.sales_order?.customer?.name`
- Backend: Need to verify if includes are set up correctly
- **Impact:** Order and customer info might not display

---

### 5. **Warehouses Page - Field Name Issues**

**Frontend:** `frontend/src/pages/inventory/Warehouses.jsx:34`
- Expects: `data?.data?.warehouses`
- Backend returns: `{ warehouses: [...], total: count }` (no nested `data.data`)
- **Impact:** Warehouses won't display

**Frontend:** `frontend/src/pages/inventory/Warehouses.jsx:120-131`
- Sends: `warehouse_name`, `warehouse_code`, `address_line1`, `city`, `state_id`, `country_id`, `postal_code`, `phone`, `email`
- Backend Model: Uses `warehouse_name`, `warehouse_code`, `address_line1`, `city`, `state_id`, `country_id`, `postal_code`, `phone`, `email` (correct)
- **Note:** Frontend form uses `state` but sends `state_id` - this is correct

**Frontend:** `frontend/src/pages/inventory/Warehouses.jsx:270`
- Expects: `warehouse.State?.name`
- Backend: Need to verify if State association is included
- **Impact:** State name might not display

---

### 6. **Purchase Orders - Response Structure**

**Frontend:** `frontend/src/pages/purchase/PurchaseOrders.jsx:62`
- Expects: `data?.data?.orders`, `data?.data?.pagination`
- Backend returns: `{ orders: [...], total: count }` (no nested `data.data`, no `pagination` object)
- **Impact:** Orders won't display, pagination broken

**Frontend:** `frontend/src/pages/purchase/PurchaseOrders.jsx:84-85`
- Expects: `row.supplier_name`, `row.supplier_email`
- Backend: Need to verify if Supplier is included and field names
- **Impact:** Supplier info might not display

---

## 🟠 HIGH PRIORITY MISMATCHES

### 7. **API Response Structure Inconsistency**

**Problem:** Frontend expects nested `data.data` structure but backend returns flat structure

**Examples:**
- Frontend expects: `response.data.data.customers`
- Backend returns: `response.data.customers`

**Affected Pages:**
- Customers.jsx
- SalesOrders.jsx
- PurchaseOrders.jsx
- Payments.jsx
- Dispatches.jsx
- Warehouses.jsx

**Fix:** Either:
1. Update backend to wrap responses in `{ data: { data: {...} } }`
2. Update frontend to use `response.data` instead of `response.data.data`

---

### 8. **Field Naming Convention Mismatch**

**Problem:** Frontend uses camelCase, backend models use snake_case

**Examples:**
- Frontend: `customer.name`, `customer.company`
- Backend: `customer.company_name`, `customer.contact_person`

**Affected:**
- All customer-related pages
- Product pages (need to verify)
- Order pages

---

### 9. **Missing API Endpoints**

**Frontend calls but backend doesn't have:**
1. `DELETE /sales-orders/:id` - SalesOrders.jsx:72
2. `GET /payments` (unified) - Payments.jsx:19 (backend has separate customer/supplier endpoints)
3. `PATCH /users/:id/status` - May be called from Users page (need to verify)

---

### 10. **Missing Response Fields**

**Frontend expects but backend doesn't return:**
1. `customer.name` - Should be `company_name`
2. `customer.company` - Should be `contact_person` or separate field
3. `customer.order_count` - Not calculated/returned
4. `customer.total_spent` - Not calculated/returned
5. `customer.total_revenue` - Not calculated/returned
6. `customer.average_order_value` - Not calculated/returned
7. `payment.type` - Not in CustomerPayment model
8. `order.customer_name`, `order.customer_email` - Need to include Customer in response

---

## 🟡 MEDIUM PRIORITY MISMATCHES

### 11. **Pagination Structure**

**Frontend expects:**
```javascript
{
  pagination: {
    total: 100,
    pages: 5,
    page: 1,
    limit: 20
  }
}
```

**Backend returns:**
```javascript
{
  total: 100,
  page: 1,
  totalPages: 5
}
```

**Fix:** Standardize pagination response structure

---

### 12. **Status Values Mismatch**

**Sales Orders:**
- Frontend expects: `completed`, `processing`, `pending`, `shipped`, `cancelled`
- Backend uses: `PENDING`, `CONFIRMED`, `PROCESSING`, `PACKED`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `ON_HOLD`
- **Impact:** Status badges won't match

**Payments:**
- Frontend expects: `PENDING`, `COMPLETED`, `FAILED`, `REFUNDED`
- Backend uses: `pending`, `completed`, `bounced`, `cancelled` (lowercase)
- **Impact:** Status filtering won't work

**Dispatches:**
- Frontend expects: `PENDING`, `IN_TRANSIT`, `DELIVERED`, `CANCELLED`
- Backend uses: `pending`, `picking`, `picked`, `packing`, `packed`, `shipped`, `in_transit`, `out_for_delivery`, `delivered`, `cancelled` (lowercase)
- **Impact:** Status filtering won't work

---

### 13. **Date Format Issues**

**Frontend:** Uses `date-fns` format function
**Backend:** Returns ISO date strings
- Should be compatible, but need to verify timezone handling

---

### 14. **Missing Include Associations**

**Frontend expects nested objects but backend might not include them:**
1. `order.customer` - Need to verify if Customer is included
2. `order.items` - Need to verify if SalesOrderItems are included
3. `dispatch.sales_order` - Need to verify if SalesOrder is included
4. `dispatch.sales_order.customer` - Need nested includes
5. `warehouse.State` - Need to verify if State is included

---

## 📋 SUMMARY TABLE

| Page | Issue Type | Severity | Description |
|------|-----------|----------|-------------|
| Customers.jsx | Field Names | 🔴 Critical | Expects `name`, `company` but backend has `company_name`, `contact_person` |
| Customers.jsx | Response Structure | 🔴 Critical | Expects `data.data.customers` but backend returns `data.customers` |
| CreateCustomer.jsx | Field Name | 🔴 Critical | Sends `postal_code` but backend expects `billing_postal_code` |
| SalesOrders.jsx | Missing Route | 🔴 Critical | Calls DELETE but route doesn't exist |
| SalesOrders.jsx | Response Structure | 🔴 Critical | Expects nested `data.data` structure |
| SalesOrders.jsx | Field Names | 🔴 Critical | Expects `customer_name` but backend returns nested `Customer.company_name` |
| CreateSalesOrder.jsx | Field Structure | 🔴 Critical | Sends `shipping_address{}` object but backend expects flat fields |
| CreateSalesOrder.jsx | Missing Field | 🔴 Critical | Doesn't send `tax_percent` per item |
| Payments.jsx | Missing Route | 🔴 Critical | Calls `/payments` but backend has `/payments/customer` and `/payments/supplier` |
| Payments.jsx | Missing Field | 🔴 Critical | Expects `payment.type` but backend doesn't have this field |
| Dispatches.jsx | Response Structure | 🔴 Critical | Expects nested `data.data` structure |
| Warehouses.jsx | Response Structure | 🔴 Critical | Expects nested `data.data` structure |
| PurchaseOrders.jsx | Response Structure | 🔴 Critical | Expects nested `data.data` structure |
| All Pages | Status Values | 🟠 High | Case mismatch (uppercase vs lowercase) |
| All Pages | Pagination | 🟠 High | Structure mismatch |

---

## 🎯 RECOMMENDED FIXES

### Priority 1: Fix Response Structure (Affects All Pages)
1. Create response wrapper middleware that standardizes all responses
2. Or update frontend API service to handle both structures

### Priority 2: Fix Field Name Mismatches
1. Create mapping layer in frontend API service
2. Or update backend to return camelCase field names
3. Or update frontend to use snake_case consistently

### Priority 3: Add Missing Routes
1. Add `DELETE /sales-orders/:id` route
2. Create unified `/payments` endpoint or update frontend to use separate endpoints

### Priority 4: Add Missing Fields
1. Add calculated fields to backend responses (`order_count`, `total_spent`, etc.)
2. Add `type` field to payment responses
3. Ensure all includes are properly set up

### Priority 5: Standardize Status Values
1. Decide on case convention (uppercase vs lowercase)
2. Map status values consistently
3. Update frontend status configs

---

## 📝 NOTES

- Many issues stem from inconsistent naming conventions (camelCase vs snake_case)
- Response structure mismatch affects almost every page
- Some frontend code assumes fields that don't exist in backend models
- Need to verify all includes/associations are properly configured in backend

---

**Last Updated:** February 9, 2026
