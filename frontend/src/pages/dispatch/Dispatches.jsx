import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus, Eye, Search, Filter, Truck, Package, CheckCircle, Clock, XCircle } from 'lucide-react';
import { dispatchAPI } from '../../services/api';
import { Card, CardHeader, CardTitle, CardBody, Button, Badge, TableSkeleton } from '../../components/ui';

export default function Dispatches() {
  const [filters, setFilters] = useState({
    search: '',
    status: '',
  });
  const [page, setPage] = useState(1);
  
  const { data, isLoading } = useQuery({
    queryKey: ['dispatches', filters, page],
    queryFn: () => dispatchAPI.getAll({ ...filters, page, limit: 20 }),
  });
  
  const dispatches = data?.data?.dispatches || [];
  const totalPages = data?.data?.pagination?.totalPages || 1;
  
  const getStatusConfig = (status) => {
    const statuses = {
      PENDING: { label: 'Pending', color: 'warning', icon: Clock },
      IN_TRANSIT: { label: 'In Transit', color: 'info', icon: Truck },
      DELIVERED: { label: 'Delivered', color: 'success', icon: CheckCircle },
      CANCELLED: { label: 'Cancelled', color: 'danger', icon: XCircle },
    };
    return statuses[status] || { label: status, color: 'secondary', icon: Package };
  };
  
  const stats = {
    total: dispatches.length,
    pending: dispatches.filter(d => d.status === 'PENDING').length,
    inTransit: dispatches.filter(d => d.status === 'IN_TRANSIT').length,
    delivered: dispatches.filter(d => d.status === 'DELIVERED').length,
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dispatches</h1>
          <p className="text-gray-500 mt-1">Manage shipments and deliveries</p>
        </div>
        <Link to="/dispatch/new">
          <Button variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            Create Dispatch
          </Button>
        </Link>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Truck className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-500">Total Dispatches</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                <p className="text-sm text-gray-500">Pending</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Truck className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.inTransit}</p>
                <p className="text-sm text-gray-500">In Transit</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.delivered}</p>
                <p className="text-sm text-gray-500">Delivered</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
      
      {/* Filters */}
      <Card>
        <CardBody>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search dispatches..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </CardBody>
      </Card>
      
      {/* Dispatches Table */}
      <Card>
        <CardBody className="p-0">
          {isLoading ? (
            <TableSkeleton rows={10} columns={7} />
          ) : dispatches.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No dispatches found</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first dispatch</p>
              <Link to="/dispatch/new">
                <Button variant="primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Dispatch
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Dispatch #</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Order</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Customer</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Dispatch Date</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Carrier</th>
                    <th className="text-right py-4 px-6 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dispatches.map((dispatch) => {
                    const statusConfig = getStatusConfig(dispatch.status);
                    const StatusIcon = statusConfig.icon;
                    return (
                      <tr key={dispatch.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <Link to={`/dispatch/${dispatch.id}`} className="font-medium text-primary-600 hover:text-primary-700">
                            {dispatch.dispatch_number}
                          </Link>
                        </td>
                        <td className="py-4 px-6">
                          <Link to={`/sales/orders/${dispatch.sales_order_id}`} className="text-gray-900 hover:text-primary-600">
                            {dispatch.SalesOrder?.order_number || '-'}
                          </Link>
                        </td>
                        <td className="py-4 px-6">
                          <p className="font-medium text-gray-900">{dispatch.SalesOrder?.Customer?.company_name || 'N/A'}</p>
                        </td>
                        <td className="py-4 px-6">
                          <Badge variant={statusConfig.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-gray-500">
                          {dispatch.dispatch_date
                            ? format(new Date(dispatch.dispatch_date), 'MMM dd, yyyy')
                            : '-'
                          }
                        </td>
                        <td className="py-4 px-6 text-gray-500">
                          {dispatch.ShippingCarrier?.carrier_name || '-'}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <Link
                            to={`/dispatch/${dispatch.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
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
