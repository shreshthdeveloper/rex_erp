import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Calendar,
  Filter,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { dashboardAPI } from '../services/api';
import { formatCurrency, formatNumber } from '../utils/helpers';
import { Card, CardHeader, CardTitle, CardBody, Badge, Button, Dropdown, DropdownItem } from '../components/ui';

// Sample data for charts (will be replaced with API data)
const revenueData = [
  { name: 'Jan', revenue: 4000, orders: 240 },
  { name: 'Feb', revenue: 3000, orders: 198 },
  { name: 'Mar', revenue: 5000, orders: 320 },
  { name: 'Apr', revenue: 4500, orders: 280 },
  { name: 'May', revenue: 6000, orders: 400 },
  { name: 'Jun', revenue: 5500, orders: 350 },
  { name: 'Jul', revenue: 7000, orders: 450 },
];

const categoryData = [
  { name: 'Electronics', value: 4000, color: '#6366f1' },
  { name: 'Clothing', value: 3000, color: '#8b5cf6' },
  { name: 'Food', value: 2000, color: '#ec4899' },
  { name: 'Others', value: 1000, color: '#14b8a6' },
];

const topProducts = [
  { id: 1, name: 'Wireless Headphones', sku: 'WH-001', sales: 245, revenue: 24500, trend: 12 },
  { id: 2, name: 'Smart Watch Pro', sku: 'SW-002', sales: 189, revenue: 37800, trend: 8 },
  { id: 3, name: 'USB-C Hub', sku: 'UH-003', sales: 156, revenue: 7800, trend: -3 },
  { id: 4, name: 'Mechanical Keyboard', sku: 'MK-004', sales: 134, revenue: 13400, trend: 15 },
  { id: 5, name: 'Laptop Stand', sku: 'LS-005', sales: 112, revenue: 5600, trend: 5 },
];

const recentOrders = [
  { id: 'ORD-001', customer: 'John Doe', total: 1250, status: 'completed', date: '2024-01-15' },
  { id: 'ORD-002', customer: 'Jane Smith', total: 890, status: 'processing', date: '2024-01-15' },
  { id: 'ORD-003', customer: 'Bob Johnson', total: 2100, status: 'pending', date: '2024-01-14' },
  { id: 'ORD-004', customer: 'Alice Brown', total: 450, status: 'shipped', date: '2024-01-14' },
  { id: 'ORD-005', customer: 'Charlie Wilson', total: 3200, status: 'completed', date: '2024-01-13' },
];

function StatCard({ title, value, change, changeType, icon: Icon, color }) {
  const isPositive = changeType === 'positive';
  
  return (
    <Card className="relative overflow-hidden">
      <CardBody>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
            <div className="flex items-center gap-1 mt-2">
              {isPositive ? (
                <ArrowUpRight className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {change}
              </span>
              <span className="text-sm text-gray-500">vs last month</span>
            </div>
          </div>
          <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
        {/* Background decoration */}
        <div className={`absolute -right-8 -bottom-8 w-32 h-32 rounded-full opacity-10 ${color}`} />
      </CardBody>
    </Card>
  );
}

function getStatusColor(status) {
  switch (status) {
    case 'completed':
      return 'success';
    case 'processing':
      return 'warning';
    case 'pending':
      return 'secondary';
    case 'shipped':
      return 'primary';
    case 'cancelled':
      return 'danger';
    default:
      return 'secondary';
  }
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 125430,
    totalOrders: 1847,
    totalProducts: 432,
    totalCustomers: 2156,
    revenueChange: '+12.5%',
    ordersChange: '+8.2%',
    productsChange: '+3.1%',
    customersChange: '+15.3%',
  });
  const [dateRange, setDateRange] = useState('7d');
  
  useEffect(() => {
    // Fetch dashboard data
    const fetchData = async () => {
      try {
        const response = await dashboardAPI.getStats();
        if (response.data) {
          setStats(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      }
    };
    
    fetchData();
  }, [dateRange]);
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back! Here's what's happening with your business.</p>
        </div>
        <div className="flex items-center gap-3">
          <Dropdown
            trigger={
              <Button variant="secondary" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                Last 7 days
              </Button>
            }
          >
            <DropdownItem onClick={() => setDateRange('7d')}>Last 7 days</DropdownItem>
            <DropdownItem onClick={() => setDateRange('30d')}>Last 30 days</DropdownItem>
            <DropdownItem onClick={() => setDateRange('90d')}>Last 90 days</DropdownItem>
            <DropdownItem onClick={() => setDateRange('1y')}>Last year</DropdownItem>
          </Dropdown>
          <Button variant="primary" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          change={stats.revenueChange}
          changeType="positive"
          icon={DollarSign}
          color="bg-gradient-to-br from-primary-500 to-primary-600"
        />
        <StatCard
          title="Total Orders"
          value={formatNumber(stats.totalOrders)}
          change={stats.ordersChange}
          changeType="positive"
          icon={ShoppingCart}
          color="bg-gradient-to-br from-green-500 to-green-600"
        />
        <StatCard
          title="Total Products"
          value={formatNumber(stats.totalProducts)}
          change={stats.productsChange}
          changeType="positive"
          icon={Package}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
        />
        <StatCard
          title="Total Customers"
          value={formatNumber(stats.totalCustomers)}
          change={stats.customersChange}
          changeType="positive"
          icon={Users}
          color="bg-gradient-to-br from-orange-500 to-orange-600"
        />
      </div>
      
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Revenue Overview</CardTitle>
              <Dropdown
                trigger={
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreHorizontal className="w-5 h-5 text-gray-500" />
                  </button>
                }
              >
                <DropdownItem>View Report</DropdownItem>
                <DropdownItem>Export Data</DropdownItem>
              </Dropdown>
            </div>
          </CardHeader>
          <CardBody>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(value) => `$${value / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    }}
                    formatter={(value) => [formatCurrency(value), 'Revenue']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
        
        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    }}
                    formatter={(value) => [formatCurrency(value), 'Sales']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {categoryData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-gray-600">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
      
      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Top Selling Products</CardTitle>
              <Link to="/inventory/products" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                View All
              </Link>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                      Product
                    </th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                      Sales
                    </th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                      Revenue
                    </th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                      Trend
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {topProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.sku}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm text-gray-900">{product.sales}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(product.revenue)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className={`inline-flex items-center gap-1 ${product.trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {product.trend >= 0 ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          <span className="text-sm font-medium">{Math.abs(product.trend)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
        
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Orders</CardTitle>
              <Link to="/sales/orders" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                View All
              </Link>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                      Order
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                      Customer
                    </th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                      Total
                    </th>
                    <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <Link to={`/sales/orders/${order.id}`} className="text-sm font-medium text-primary-600 hover:text-primary-700">
                          {order.id}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">{order.customer}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(order.total)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge color={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </div>
      
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link
              to="/sales/orders/new"
              className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all group"
            >
              <div className="p-3 rounded-lg bg-primary-100 text-primary-600 group-hover:bg-primary-200 transition-colors">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-gray-700 mt-2">New Order</span>
            </Link>
            <Link
              to="/inventory/products/new"
              className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all group"
            >
              <div className="p-3 rounded-lg bg-green-100 text-green-600 group-hover:bg-green-200 transition-colors">
                <Package className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-gray-700 mt-2">Add Product</span>
            </Link>
            <Link
              to="/customers/new"
              className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all group"
            >
              <div className="p-3 rounded-lg bg-purple-100 text-purple-600 group-hover:bg-purple-200 transition-colors">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-gray-700 mt-2">Add Customer</span>
            </Link>
            <Link
              to="/reports"
              className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all group"
            >
              <div className="p-3 rounded-lg bg-orange-100 text-orange-600 group-hover:bg-orange-200 transition-colors">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-gray-700 mt-2">View Reports</span>
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
