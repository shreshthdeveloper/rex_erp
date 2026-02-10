import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.post('/auth/change-password', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data)
};

// Users API
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  updateStatus: (id, status) => api.patch(`/users/${id}/status`, { status }),
  getRoles: () => api.get('/users/roles'),
  getPermissions: () => api.get('/users/permissions')
};

// Customers API
export const customersAPI = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
  getContacts: (id) => api.get(`/customers/${id}/contacts`),
  addContact: (id, data) => api.post(`/customers/${id}/contacts`, data),
  getAddresses: (id) => api.get(`/customers/${id}/addresses`),
  addAddress: (id, data) => api.post(`/customers/${id}/addresses`, data),
  getCreditInfo: (id) => api.get(`/customers/${id}/credit`),
  updateCreditLimit: (id, data) => api.put(`/customers/${id}/credit`, data)
};

// Countries & States (Locations) API
export const countriesAPI = {
  getAll: () => api.get('/locations/countries'),
  getStates: (countryId) => api.get(`/locations/countries/${countryId}/states`),
};

export const statesAPI = {
  getAll: (params) => api.get('/locations/states', { params }),
};

// Suppliers API
export const suppliersAPI = {
  getAll: (params) => api.get('/suppliers', { params }),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
  getProducts: (id) => api.get(`/suppliers/${id}/products`),
  getPurchaseHistory: (id) => api.get(`/suppliers/${id}/purchase-history`)
};

// Products API
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  updateStock: (id, data) => api.patch(`/products/${id}/stock`, data),
  getPriceHistory: (id) => api.get(`/products/${id}/price-history`),
  updatePrice: (id, data) => api.put(`/products/${id}/price`, data),
  bulkUpdate: (data) => api.patch('/products/bulk-update', data)
};

// Categories API
export const categoriesAPI = {
  getAll: (params) => api.get('/categories', { params }),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
  getAttributes: (id) => api.get(`/categories/${id}/attributes`),
  addAttribute: (id, data) => api.post(`/categories/${id}/attributes`, data)
};

// Brands API
export const brandsAPI = {
  getAll: (params) => api.get('/brands', { params }),
  getById: (id) => api.get(`/brands/${id}`),
  create: (data) => api.post('/brands', data),
  update: (id, data) => api.put(`/brands/${id}`, data),
  delete: (id) => api.delete(`/brands/${id}`)
};

// Units API
export const unitsAPI = {
  getAll: (params) => api.get('/units', { params }),
  getById: (id) => api.get(`/units/${id}`),
  create: (data) => api.post('/units', data),
  update: (id, data) => api.put(`/units/${id}`, data),
  delete: (id) => api.delete(`/units/${id}`)
};

// Warehouses API
export const warehousesAPI = {
  getAll: (params) => api.get('/warehouses', { params }),
  getById: (id) => api.get(`/warehouses/${id}`),
  create: (data) => api.post('/warehouses', data),
  update: (id, data) => api.put(`/warehouses/${id}`, data),
  delete: (id) => api.delete(`/warehouses/${id}`),
  getInventory: (id, params) => api.get(`/warehouses/${id}/inventory`, { params }),
  getTransfers: (id, params) => api.get(`/warehouses/${id}/transfers`, { params })
};

// Inventory API
export const inventoryAPI = {
  getTransactions: (params) => api.get('/inventory/transactions', { params }),
  createInward: (data) => api.post('/inventory/inward', data),
  createOutward: (data) => api.post('/inventory/outward', data),
  getAdjustments: (params) => api.get('/inventory/adjustments', { params }),
  getAdjustmentById: (id) => api.get(`/inventory/adjustments/${id}`),
  createAdjustment: (data) => api.post('/inventory/adjustments', data),
  approveAdjustment: (id, data) => api.post(`/inventory/adjustments/${id}/approve`, data),
  rejectAdjustment: (id, data) => api.post(`/inventory/adjustments/${id}/reject`, data),
  getTransfers: (params) => api.get('/inventory/transfers', { params }),
  getTransferById: (id) => api.get(`/inventory/transfers/${id}`),
  createTransfer: (data) => api.post('/inventory/transfers', data),
  approveTransfer: (id) => api.post(`/inventory/transfers/${id}/approve`),
  shipTransfer: (id) => api.post(`/inventory/transfers/${id}/ship`),
  receiveTransfer: (id, data) => api.post(`/inventory/transfers/${id}/receive`, data),
  getLowStock: (params) => api.get('/inventory/low-stock', { params }),
  getValuation: (params) => api.get('/inventory/valuation', { params })
};

// Sales Orders API
export const salesAPI = {
  getAll: (params) => api.get('/sales-orders', { params }),
  getById: (id) => api.get(`/sales-orders/${id}`),
  create: (data) => api.post('/sales-orders', data),
  update: (id, data) => api.put(`/sales-orders/${id}`, data),
  delete: (id) => api.delete(`/sales-orders/${id}`),
  confirm: (id) => api.post(`/sales-orders/${id}/confirm`),
  hold: (id, data) => api.post(`/sales-orders/${id}/hold`, data),
  releaseHold: (id) => api.post(`/sales-orders/${id}/release-hold`),
  cancel: (id, data) => api.post(`/sales-orders/${id}/cancel`, data),
  generateInvoice: (id) => api.post(`/sales-orders/${id}/generate-invoice`),
  getPaymentHistory: (id) => api.get(`/sales-orders/${id}/payment-history`),
  getTimeline: (id) => api.get(`/sales-orders/${id}/timeline`),
  getOverdue: (params) => api.get('/sales-orders/overdue', { params })
};

// Invoices API
export const invoicesAPI = {
  getAll: (params) => api.get('/invoices', { params }),
  getById: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', data),
  update: (id, data) => api.put(`/invoices/${id}`, data),
  send: (id) => api.post(`/invoices/${id}/send`),
  void: (id, data) => api.post(`/invoices/${id}/void`, data),
  getAgingReport: () => api.get('/invoices/aging'),
  downloadPDF: (id) => api.get(`/invoices/${id}/pdf`, { responseType: 'blob' })
};

// Purchase Orders API
export const purchaseAPI = {
  getAll: (params) => api.get('/purchase-orders', { params }),
  getById: (id) => api.get(`/purchase-orders/${id}`),
  create: (data) => api.post('/purchase-orders', data),
  update: (id, data) => api.put(`/purchase-orders/${id}`, data),
  delete: (id) => api.delete(`/purchase-orders/${id}`),
  submitForApproval: (id) => api.post(`/purchase-orders/${id}/submit`),
  approve: (id) => api.post(`/purchase-orders/${id}/approve`),
  reject: (id, data) => api.post(`/purchase-orders/${id}/reject`, data),
  sendToSupplier: (id) => api.post(`/purchase-orders/${id}/send`),
  cancel: (id, data) => api.post(`/purchase-orders/${id}/cancel`, data),
  getGRNHistory: (id) => api.get(`/purchase-orders/${id}/grn-history`)
};

// GRN API
export const grnAPI = {
  getAll: (params) => api.get('/grn', { params }),
  getById: (id) => api.get(`/grn/${id}`),
  create: (data) => api.post('/grn', data),
  verify: (id, data) => api.post(`/grn/${id}/verify`, data),
  reportDiscrepancy: (id, data) => api.post(`/grn/${id}/discrepancy`, data),
  getDiscrepancies: (params) => api.get('/grn/discrepancies', { params })
};

// Payments API
export const paymentsAPI = {
  // Customer Payments
  getCustomerPayments: (params) => api.get('/payments/customer', { params }),
  getCustomerPaymentById: (id) => api.get(`/payments/customer/${id}`),
  createCustomerPayment: (data) => api.post('/payments/customer', data),
  updatePaymentStatus: (id, data) => api.put(`/payments/customer/${id}/status`, data),
  getCustomerLedger: (customerId) => api.get(`/payments/customer/ledger/${customerId}`),
  
  // Supplier Payments
  getSupplierPayments: (params) => api.get('/payments/supplier', { params }),
  getSupplierPaymentById: (id) => api.get(`/payments/supplier/${id}`),
  createSupplierPayment: (data) => api.post('/payments/supplier', data),
  approveSupplierPayment: (id) => api.post(`/payments/supplier/${id}/approve`),
  processSupplierPayment: (id) => api.post(`/payments/supplier/${id}/process`),
  getSupplierLedger: (supplierId) => api.get(`/payments/supplier/ledger/${supplierId}`)
};

// Dispatch API
export const dispatchAPI = {
  getAll: (params) => api.get('/dispatch', { params }),
  getById: (id) => api.get(`/dispatch/${id}`),
  create: (data) => api.post('/dispatch', data),
  updateStatus: (id, status) => api.patch(`/dispatch/${id}/status`, { status }),
  startPicking: (id) => api.post(`/dispatch/${id}/start-picking`),
  updatePicked: (id, data) => api.put(`/dispatch/${id}/picking`, data),
  completePicking: (id) => api.post(`/dispatch/${id}/complete-picking`),
  startPacking: (id) => api.post(`/dispatch/${id}/start-packing`),
  updatePacked: (id, data) => api.put(`/dispatch/${id}/packing`, data),
  completePacking: (id) => api.post(`/dispatch/${id}/complete-packing`),
  ship: (id, data) => api.post(`/dispatch/${id}/ship`, data),
  addTracking: (id, data) => api.post(`/dispatch/${id}/tracking`, data),
  markDelivered: (id, data) => api.post(`/dispatch/${id}/delivered`, data),
  getTracking: (id) => api.get(`/dispatch/${id}/tracking`),
  getCarriers: () => api.get('/dispatch/carriers'),
  createCarrier: (data) => api.post('/dispatch/carriers', data)
};

// Returns API
export const returnsAPI = {
  getAll: (params) => api.get('/returns', { params }),
  getById: (id) => api.get(`/returns/${id}`),
  create: (data) => api.post('/returns', data),
  approve: (id) => api.post(`/returns/${id}/approve`),
  reject: (id, data) => api.post(`/returns/${id}/reject`, data),
  receive: (id, data) => api.post(`/returns/${id}/receive`, data),
  inspect: (id, data) => api.post(`/returns/${id}/inspect`, data),
  process: (id, data) => api.post(`/returns/${id}/process`, data),
  issueRefund: (id, data) => api.post(`/returns/${id}/refund`, data),
  issueReplacement: (id, data) => api.post(`/returns/${id}/replacement`, data),
  getAnalytics: (params) => api.get('/returns/analytics', { params })
};

// Barcodes API
export const barcodesAPI = {
  generate: (productId) => api.post(`/barcodes/generate/${productId}`),
  generateBulk: (data) => api.post('/barcodes/generate-bulk', data),
  lookup: (barcode) => api.get(`/barcodes/lookup/${barcode}`),
  validate: (barcode) => api.get(`/barcodes/validate/${barcode}`),
  scan: (data) => api.post('/barcodes/scan', data),
  getScanHistory: (params) => api.get('/barcodes/scan-history', { params }),
  pick: (data) => api.post('/barcodes/pick', data),
  printLabels: (data) => api.post('/barcodes/print-labels', data)
};

// Reports API
export const reportsAPI = {
  // Sales Reports
  getSalesSummary: (params) => api.get('/reports/sales/summary', { params }),
  getSalesByPeriod: (params) => api.get('/reports/sales/by-period', { params }),
  getSalesByProduct: (params) => api.get('/reports/sales/by-product', { params }),
  getSalesByCustomer: (params) => api.get('/reports/sales/by-customer', { params }),
  
  // Inventory Reports
  getInventorySummary: (params) => api.get('/reports/inventory/summary', { params }),
  getInventoryByWarehouse: () => api.get('/reports/inventory/by-warehouse'),
  getLowStockReport: (params) => api.get('/reports/inventory/low-stock', { params }),
  getInventoryMovement: (params) => api.get('/reports/inventory/movement', { params }),
  
  // Financial Reports
  getReceivablesAging: () => api.get('/reports/financial/receivables-aging'),
  getPayablesAging: () => api.get('/reports/financial/payables-aging'),
  getProfitLoss: (params) => api.get('/reports/financial/profit-loss', { params }),
  getTaxReport: (params) => api.get('/reports/financial/tax', { params }),
  
  // Purchase Reports
  getPurchaseSummary: (params) => api.get('/reports/purchase/summary', { params }),
  getPurchasesBySupplier: (params) => api.get('/reports/purchase/by-supplier', { params })
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getActivities: (params) => api.get('/dashboard/activities', { params }),
  getSalesChart: (params) => api.get('/dashboard/charts/sales', { params }),
  getTasks: () => api.get('/dashboard/tasks'),
  getTopProducts: (params) => api.get('/dashboard/top-products', { params }),
  getTopCustomers: (params) => api.get('/dashboard/top-customers', { params }),
  getWarehouseStats: () => api.get('/dashboard/warehouses')
};

// Notifications API
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  getById: (id) => api.get(`/notifications/${id}`),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
  deleteAll: (params) => api.delete('/notifications', { params }),
  getStats: () => api.get('/notifications/stats'),
  getPreferences: () => api.get('/notifications/preferences'),
  updatePreferences: (data) => api.put('/notifications/preferences', data)
};

// Settings API
export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.patch('/settings', data),
  getCompany: () => api.get('/settings/company'),
  updateCompany: (data) => api.patch('/settings/company', data)
};

// Stock Movements API
export const stockMovementsAPI = {
  getAll: (params) => api.get('/inventory/transactions', { params }),
  getById: (id) => api.get(`/inventory/transactions/${id}`),
  create: (data) => api.post('/inventory/transactions', data),
  getByProduct: (productId, params) => api.get(`/inventory/transactions/product/${productId}`, { params }),
  getByWarehouse: (warehouseId, params) => api.get(`/inventory/transactions/warehouse/${warehouseId}`, { params }),
};

// Aliases for backward compatibility
export const dispatchesAPI = dispatchAPI;
export const salesOrdersAPI = salesAPI;
export const purchaseOrdersAPI = purchaseAPI;
