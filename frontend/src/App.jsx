import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { MainLayout } from './components/layout';
import { useAuthStore } from './store/authStore';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// Dashboard
import Dashboard from './pages/Dashboard';

// Sales Module
import SalesOrders from './pages/sales/SalesOrders';
import SalesOrderDetail from './pages/sales/SalesOrderDetail';
import CreateSalesOrder from './pages/sales/CreateSalesOrder';
import Invoices from './pages/sales/Invoices';
import InvoiceDetail from './pages/sales/InvoiceDetail';
import SalesReturns from './pages/sales/SalesReturns';

// Purchase Module
import PurchaseOrders from './pages/purchase/PurchaseOrders';
import PurchaseOrderDetail from './pages/purchase/PurchaseOrderDetail';
import CreatePurchaseOrder from './pages/purchase/CreatePurchaseOrder';
import GRNList from './pages/purchase/GRNList';
import GRNDetail from './pages/purchase/GRNDetail';
import CreateGRN from './pages/purchase/CreateGRN';

// Inventory Module
import Products from './pages/inventory/Products';
import ProductDetail from './pages/inventory/ProductDetail';
import CreateProduct from './pages/inventory/CreateProduct';
import Categories from './pages/inventory/Categories';
import Brands from './pages/inventory/Brands';
import Units from './pages/inventory/Units';
import StockMovements from './pages/inventory/StockMovements';
import StockAdjustments from './pages/inventory/StockAdjustments';
import Warehouses from './pages/inventory/Warehouses';
import WarehouseDetail from './pages/inventory/WarehouseDetail';

// Dispatch Module
import Dispatches from './pages/dispatch/Dispatches';
import DispatchDetail from './pages/dispatch/DispatchDetail';
import CreateDispatch from './pages/dispatch/CreateDispatch';

// Payments Module
import Payments from './pages/payments/Payments';
import PaymentDetail from './pages/payments/PaymentDetail';
import CreatePayment from './pages/payments/CreatePayment';

// Customers & Suppliers
import Customers from './pages/customers/Customers';
import CustomerDetail from './pages/customers/CustomerDetail';
import CreateCustomer from './pages/customers/CreateCustomer';
import Suppliers from './pages/suppliers/Suppliers';
import SupplierDetail from './pages/suppliers/SupplierDetail';
import CreateSupplier from './pages/suppliers/CreateSupplier';

// Reports
import Reports from './pages/Reports';

// Users & Settings
import Users from './pages/users/Users';
import UserDetail from './pages/users/UserDetail';
import CreateUser from './pages/users/CreateUser';
import Settings from './pages/Settings';
import Profile from './pages/Profile';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Protected Route wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

// Public Route wrapper (redirects to dashboard if authenticated)
function PublicRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } />
          <Route path="/forgot-password" element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          } />
          
          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            {/* Dashboard */}
            <Route index element={<Dashboard />} />
            
            {/* Sales */}
            <Route path="sales">
              <Route path="orders" element={<SalesOrders />} />
              <Route path="orders/new" element={<CreateSalesOrder />} />
              <Route path="orders/:id" element={<SalesOrderDetail />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="invoices/:id" element={<InvoiceDetail />} />
              <Route path="returns" element={<SalesReturns />} />
            </Route>
            
            {/* Purchase */}
            <Route path="purchase">
              <Route path="orders" element={<PurchaseOrders />} />
              <Route path="orders/new" element={<CreatePurchaseOrder />} />
              <Route path="orders/:id" element={<PurchaseOrderDetail />} />
              <Route path="grn" element={<GRNList />} />
              <Route path="grn/new" element={<CreateGRN />} />
              <Route path="grn/:id" element={<GRNDetail />} />
            </Route>
            
            {/* Inventory */}
            <Route path="inventory">
              <Route path="products" element={<Products />} />
              <Route path="products/new" element={<CreateProduct />} />
              <Route path="products/:id" element={<ProductDetail />} />
              <Route path="categories" element={<Categories />} />
              <Route path="brands" element={<Brands />} />
              <Route path="units" element={<Units />} />
              <Route path="stock" element={<StockMovements />} />
              <Route path="adjustments" element={<StockAdjustments />} />
              <Route path="warehouses" element={<Warehouses />} />
              <Route path="warehouses/:id" element={<WarehouseDetail />} />
            </Route>
            
            {/* Dispatch */}
            <Route path="dispatch">
              <Route index element={<Dispatches />} />
              <Route path="new" element={<CreateDispatch />} />
              <Route path=":id" element={<DispatchDetail />} />
            </Route>
            
            {/* Payments */}
            <Route path="payments">
              <Route index element={<Payments />} />
              <Route path="new" element={<CreatePayment />} />
              <Route path=":id" element={<PaymentDetail />} />
            </Route>
            
            {/* Customers */}
            <Route path="customers">
              <Route index element={<Customers />} />
              <Route path="new" element={<CreateCustomer />} />
              <Route path=":id" element={<CustomerDetail />} />
            </Route>
            
            {/* Suppliers */}
            <Route path="suppliers">
              <Route index element={<Suppliers />} />
              <Route path="new" element={<CreateSupplier />} />
              <Route path=":id" element={<SupplierDetail />} />
            </Route>
            
            {/* Reports */}
            <Route path="reports" element={<Reports />} />
            
            {/* Users */}
            <Route path="users">
              <Route index element={<Users />} />
              <Route path="new" element={<CreateUser />} />
              <Route path=":id" element={<UserDetail />} />
            </Route>
            
            {/* Settings */}
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          
          {/* Catch all - redirect to dashboard or login */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#1f2937',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            borderRadius: '0.5rem',
            padding: '0.75rem 1rem',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </QueryClientProvider>
  );
}

export default App
