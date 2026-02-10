import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Eye, Search, Building2, Mail, Phone, MapPin, Package } from 'lucide-react';
import { suppliersAPI } from '../../services/api';
import { Card, CardHeader, CardTitle, CardBody, Button, Badge, TableSkeleton } from '../../components/ui';

export default function Suppliers() {
  const [filters, setFilters] = useState({
    search: '',
  });
  const [page, setPage] = useState(1);
  
  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', filters, page],
    queryFn: () => suppliersAPI.getAll({ ...filters, page, limit: 20 }),
  });
  
  const suppliers = data?.data?.data?.suppliers || data?.data?.suppliers || [];
  const totalPages = data?.data?.data?.pagination?.totalPages || data?.data?.pagination?.totalPages || 1;
  const totalRecords = data?.data?.data?.pagination?.total || data?.data?.pagination?.total || suppliers.length;
  
  const stats = {
    total: totalRecords,
    active: suppliers.filter(s => s.is_active).length,
    totalProducts: suppliers.reduce((sum, s) => sum + (s.product_count || 0), 0),
    totalPurchases: suppliers.reduce((sum, s) => sum + parseFloat(s.total_purchases || 0), 0),
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-gray-500 mt-1">Manage your supplier network</p>
        </div>
        <Link to="/suppliers/new">
          <Button variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            Add Supplier
          </Button>
        </Link>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-500">Total Suppliers</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                <p className="text-sm text-gray-500">Active Suppliers</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
                <p className="text-sm text-gray-500">Products Supplied</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">${stats.totalPurchases.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Total Purchases</p>
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
              placeholder="Search suppliers..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </CardBody>
      </Card>
      
      {/* Suppliers Table */}
      <Card>
        <CardBody className="p-0">
          {isLoading ? (
            <TableSkeleton rows={10} columns={6} />
          ) : suppliers.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No suppliers found</h3>
              <p className="text-gray-500 mb-4">Get started by adding your first supplier</p>
              <Link to="/suppliers/new">
                <Button variant="primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Supplier
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Supplier</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Contact</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Location</th>
                    <th className="text-center py-4 px-6 text-sm font-medium text-gray-500">Products</th>
                    <th className="text-right py-4 px-6 text-sm font-medium text-gray-500">Total Purchases</th>
                    <th className="text-center py-4 px-6 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-right py-4 px-6 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((supplier) => (
                    <tr key={supplier.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <Link to={`/suppliers/${supplier.id}`} className="font-medium text-gray-900 hover:text-primary-600">
                              {supplier.name}
                            </Link>
                            {supplier.contact_person && (
                              <p className="text-sm text-gray-500">{supplier.contact_person}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          {supplier.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="w-3 h-3" />
                              {supplier.email}
                            </div>
                          )}
                          {supplier.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="w-3 h-3" />
                              {supplier.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {supplier.city ? (
                          <div className="flex items-center gap-2 text-gray-500">
                            <MapPin className="w-4 h-4" />
                            {supplier.city}, {supplier.country || ''}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <Badge variant="secondary">{supplier.product_count || 0}</Badge>
                      </td>
                      <td className="py-4 px-6 text-right font-semibold text-gray-900">
                        ${parseFloat(supplier.total_purchases || 0).toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <Badge variant={supplier.is_active ? 'success' : 'secondary'}>
                          {supplier.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link
                          to={`/suppliers/${supplier.id}`}
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
