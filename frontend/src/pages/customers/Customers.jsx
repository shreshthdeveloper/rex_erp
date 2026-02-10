import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Eye, Search, Users, Mail, Phone, MapPin, DollarSign } from 'lucide-react';
import { customersAPI } from '../../services/api';
import { Card, CardHeader, CardTitle, CardBody, Button, Badge, TableSkeleton } from '../../components/ui';

export default function Customers() {
  const [filters, setFilters] = useState({
    search: '',
  });
  const [page, setPage] = useState(1);
  
  const { data, isLoading } = useQuery({
    queryKey: ['customers', filters, page],
    queryFn: () => customersAPI.getAll({ ...filters, page, limit: 20 }),
  });
  
  const customers = data?.data?.data?.customers || data?.data?.customers || [];
  const totalPages = data?.data?.data?.pagination?.totalPages || data?.data?.pagination?.totalPages || 1;
  const totalRecords = data?.data?.data?.pagination?.total || data?.data?.pagination?.total || customers.length;
  
  const stats = {
    total: totalRecords,
    active: customers.filter(c => c.is_active).length,
    totalRevenue: customers.reduce((sum, c) => sum + parseFloat(c.total_revenue || 0), 0),
    avgOrderValue: customers.length > 0 
      ? customers.reduce((sum, c) => sum + parseFloat(c.average_order_value || 0), 0) / customers.length 
      : 0,
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500 mt-1">Manage your customer database</p>
        </div>
        <Link to="/customers/new">
          <Button variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </Link>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-500">Total Customers</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                <p className="text-sm text-gray-500">Active Customers</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Total Revenue</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">${stats.avgOrderValue.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Avg Order Value</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
      
      {/* Search */}
      <Card>
        <CardBody>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </CardBody>
      </Card>
      
      {/* Customers Table */}
      <Card>
        <CardBody className="p-0">
          {isLoading ? (
            <TableSkeleton rows={10} columns={6} />
          ) : customers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
              <p className="text-gray-500 mb-4">Get started by adding your first customer</p>
              <Link to="/customers/new">
                <Button variant="primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Customer
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Customer</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Contact</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Location</th>
                    <th className="text-center py-4 px-6 text-sm font-medium text-gray-500">Orders</th>
                    <th className="text-right py-4 px-6 text-sm font-medium text-gray-500">Total Spent</th>
                    <th className="text-center py-4 px-6 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-right py-4 px-6 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-600 font-semibold">
                              {customer.name?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <Link to={`/customers/${customer.id}`} className="font-medium text-gray-900 hover:text-primary-600">
                              {customer.name}
                            </Link>
                            {customer.company && (
                              <p className="text-sm text-gray-500">{customer.company}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          {customer.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="w-3 h-3" />
                              {customer.email}
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="w-3 h-3" />
                              {customer.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {customer.city ? (
                          <div className="flex items-center gap-2 text-gray-500">
                            <MapPin className="w-4 h-4" />
                            {customer.city}, {customer.country || ''}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <Badge variant="secondary">{customer.order_count || 0}</Badge>
                      </td>
                      <td className="py-4 px-6 text-right font-semibold text-gray-900">
                        ${parseFloat(customer.total_spent || 0).toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <Badge variant={customer.is_active ? 'success' : 'secondary'}>
                          {customer.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link
                          to={`/customers/${customer.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
