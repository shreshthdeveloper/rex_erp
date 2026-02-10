import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus, Eye, Search, DollarSign, TrendingUp, Clock, CheckCircle, CreditCard } from 'lucide-react';
import { paymentsAPI } from '../../services/api';
import { Card, CardHeader, CardTitle, CardBody, Button, Badge, TableSkeleton } from '../../components/ui';

export default function Payments() {
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: '',
  });
  const [page, setPage] = useState(1);
  
  const { data, isLoading } = useQuery({
    queryKey: ['payments', filters, page],
    queryFn: () => paymentsAPI.getAll({ ...filters, page, limit: 20 }),
  });
  
  const payments = data?.data?.payments || [];
  const totalPages = data?.data?.totalPages || 1;
  
  const getStatusConfig = (status) => {
    const statuses = {
      PENDING: { label: 'Pending', color: 'warning' },
      COMPLETED: { label: 'Completed', color: 'success' },
      FAILED: { label: 'Failed', color: 'danger' },
      REFUNDED: { label: 'Refunded', color: 'info' },
    };
    return statuses[status] || { label: status, color: 'secondary' };
  };
  
  const getTypeLabel = (type) => {
    const types = {
      RECEIVED: 'Received',
      MADE: 'Made',
      REFUND: 'Refund',
    };
    return types[type] || type;
  };
  
  const stats = {
    total: payments.length,
    received: payments.filter(p => p.type === 'RECEIVED').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0),
    made: payments.filter(p => p.type === 'MADE').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0),
    pending: payments.filter(p => p.status === 'PENDING').length,
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-500 mt-1">Manage all transactions</p>
        </div>
        <Link to="/payments/new">
          <Button variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            Record Payment
          </Button>
        </Link>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-500">Total Payments</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">${stats.received.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Received</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">${stats.made.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Made</p>
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
      </div>
      
      {/* Filters */}
      <Card>
        <CardBody>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search payments..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Types</option>
              <option value="RECEIVED">Received</option>
              <option value="MADE">Made</option>
              <option value="REFUND">Refund</option>
            </select>
            
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
        </CardBody>
      </Card>
      
      {/* Payments Table */}
      <Card>
        <CardBody className="p-0">
          {isLoading ? (
            <TableSkeleton rows={10} columns={7} />
          ) : payments.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
              <p className="text-gray-500 mb-4">Get started by recording a payment</p>
              <Link to="/payments/new">
                <Button variant="primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Record Payment
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Payment #</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Date</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Type</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Reference</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Method</th>
                    <th className="text-right py-4 px-6 text-sm font-medium text-gray-500">Amount</th>
                    <th className="text-right py-4 px-6 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => {
                    const statusConfig = getStatusConfig(payment.status);
                    return (
                      <tr key={payment.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <Link to={`/payments/${payment.id}`} className="font-medium text-primary-600 hover:text-primary-700">
                            {payment.payment_number}
                          </Link>
                        </td>
                        <td className="py-4 px-6 text-gray-500">
                          {format(new Date(payment.payment_date), 'MMM dd, yyyy')}
                        </td>
                        <td className="py-4 px-6">
                          <Badge variant={payment.type === 'RECEIVED' ? 'success' : payment.type === 'MADE' ? 'warning' : 'info'}>
                            {getTypeLabel(payment.type)}
                          </Badge>
                        </td>
                        <td className="py-4 px-6">
                          {payment.invoice ? (
                            <Link to={`/sales/invoices/${payment.invoice_id}`} className="text-gray-900 hover:text-primary-600">
                              {payment.invoice.invoice_number}
                            </Link>
                          ) : payment.purchase_order ? (
                            <Link to={`/purchase/orders/${payment.purchase_order_id}`} className="text-gray-900 hover:text-primary-600">
                              {payment.purchase_order.po_number}
                            </Link>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <Badge variant={statusConfig.color}>
                            {statusConfig.label}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-gray-500">
                          {payment.payment_method || '-'}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className={`font-semibold ${payment.type === 'RECEIVED' ? 'text-green-600' : 'text-red-600'}`}>
                            {payment.type === 'RECEIVED' ? '+' : '-'}${parseFloat(payment.amount || 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <Link
                            to={`/payments/${payment.id}`}
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
