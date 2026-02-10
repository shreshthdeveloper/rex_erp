import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, startOfMonth, subMonths } from 'date-fns';
import {
  BarChart3, TrendingUp, TrendingDown, Download, Calendar, DollarSign,
  ShoppingCart, Package, Users, Building2, FileText, PieChart
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart as RechartsPieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { reportsAPI, dashboardAPI } from '../services/api';
import { Card, CardHeader, CardTitle, CardBody, Button, Badge } from '../components/ui';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Reports() {
  const [dateRange, setDateRange] = useState('30d');
  const [reportType, setReportType] = useState('overview');
  
  const getDateRange = () => {
    const end = new Date();
    let start;
    switch (dateRange) {
      case '7d': start = subDays(end, 7); break;
      case '30d': start = subDays(end, 30); break;
      case '90d': start = subDays(end, 90); break;
      case 'thisMonth':
        start = startOfMonth(end);
        break;
      case 'lastMonth':
        start = startOfMonth(subMonths(end, 1));
        break;
      default: start = subDays(end, 30);
    }
    return {
      start_date: format(start, 'yyyy-MM-dd'),
      end_date: format(end, 'yyyy-MM-dd'),
    };
  };
  
  const { data: dashboardData } = useQuery({
    queryKey: ['reports', 'dashboard', dateRange],
    queryFn: () => dashboardAPI.getStats(),
  });
  
  const { data: salesData } = useQuery({
    queryKey: ['reports', 'sales', dateRange],
    queryFn: () => reportsAPI.getSalesSummary(getDateRange()),
  });
  
  const { data: inventoryData } = useQuery({
    queryKey: ['reports', 'inventory'],
    queryFn: () => reportsAPI.getInventorySummary(),
  });
  
  const dashboard = dashboardData?.data || {};
  const sales = salesData?.data || {};
  const inventory = inventoryData?.data || {};
  
  // Mock chart data
  const revenueChartData = sales.dailyRevenue || [
    { date: 'Mon', revenue: 4000, orders: 24 },
    { date: 'Tue', revenue: 3000, orders: 18 },
    { date: 'Wed', revenue: 5000, orders: 30 },
    { date: 'Thu', revenue: 4500, orders: 27 },
    { date: 'Fri', revenue: 6000, orders: 35 },
    { date: 'Sat', revenue: 5500, orders: 32 },
    { date: 'Sun', revenue: 3500, orders: 20 },
  ];
  
  const categoryData = inventory.categoryBreakdown || [
    { name: 'Electronics', value: 35 },
    { name: 'Clothing', value: 25 },
    { name: 'Home & Garden', value: 20 },
    { name: 'Sports', value: 12 },
    { name: 'Other', value: 8 },
  ];
  
  const topProducts = sales.topProducts || [
    { name: 'Product A', sales: 1200, revenue: 24000 },
    { name: 'Product B', sales: 980, revenue: 19600 },
    { name: 'Product C', sales: 850, revenue: 17000 },
    { name: 'Product D', sales: 720, revenue: 14400 },
    { name: 'Product E', sales: 650, revenue: 13000 },
  ];
  
  const topCustomers = sales.topCustomers || [
    { name: 'Customer 1', orders: 45, revenue: 12500 },
    { name: 'Customer 2', orders: 38, revenue: 10200 },
    { name: 'Customer 3', orders: 32, revenue: 8900 },
    { name: 'Customer 4', orders: 28, revenue: 7500 },
    { name: 'Customer 5', orders: 25, revenue: 6800 },
  ];
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500 mt-1">Business insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
          </select>
          <Button variant="secondary">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      {/* Report Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'sales', label: 'Sales', icon: ShoppingCart },
          { id: 'inventory', label: 'Inventory', icon: Package },
          { id: 'customers', label: 'Customers', icon: Users },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setReportType(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              reportType === tab.id
                ? 'bg-primary-50 text-primary-600'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${(dashboard.totalRevenue || 125400).toLocaleString()}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600">+12.5%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(dashboard.totalOrders || 1284).toLocaleString()}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600">+8.2%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg Order Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${(dashboard.avgOrderValue || 97.65).toFixed(2)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-600">-2.1%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">New Customers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(dashboard.newCustomers || 89).toLocaleString()}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600">+15.3%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
      
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    fill="url(#colorRevenue)"
                    strokeWidth={2}
                  />
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
        
        {/* Orders Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Orders Trend</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Bar dataKey="orders" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>
      
      {/* Second Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
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
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
        
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-gray-50">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between px-6 py-3">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-medium flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-gray-900">{product.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${product.revenue.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">{product.sales} sales</p>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
        
        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Customers</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-gray-50">
              {topCustomers.map((customer, index) => (
                <div key={index} className="flex items-center justify-between px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 text-xs font-semibold">
                        {customer.name.charAt(0)}
                      </span>
                    </div>
                    <span className="text-gray-900">{customer.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${customer.revenue.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">{customer.orders} orders</p>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
      
      {/* Inventory Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Summary</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{inventory.totalProducts || 1245}</p>
              <p className="text-sm text-gray-500">Total Products</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{inventory.totalStock || 45680}</p>
              <p className="text-sm text-gray-500">Total Stock Units</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">{inventory.lowStock || 23}</p>
              <p className="text-sm text-gray-500">Low Stock Items</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">{inventory.outOfStock || 5}</p>
              <p className="text-sm text-gray-500">Out of Stock</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
