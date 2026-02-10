import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Filter,
  Download,
  Eye,
  MoreHorizontal,
  RotateCcw,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { returnsAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Badge,
  Table,
  Pagination,
  Dropdown,
  DropdownItem,
  TableSkeleton,
} from '../../components/ui';

function getStatusConfig(status) {
  switch (status) {
    case 'approved':
      return { color: 'success', label: 'Approved' };
    case 'pending':
      return { color: 'warning', label: 'Pending' };
    case 'rejected':
      return { color: 'danger', label: 'Rejected' };
    case 'refunded':
      return { color: 'primary', label: 'Refunded' };
    default:
      return { color: 'secondary', label: status };
  }
}

export default function SalesReturns() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const { data, isLoading } = useQuery({
    queryKey: ['sales-returns', page, search, statusFilter],
    queryFn: () => returnsAPI.getSalesReturns({ page, search, status: statusFilter !== 'all' ? statusFilter : undefined }),
  });
  
  const returns = data?.data?.returns || [];
  const pagination = data?.data?.pagination || { total: 0, pages: 1 };
  
  const columns = [
    {
      key: 'return_number',
      header: 'Return #',
      render: (row) => (
        <Link
          to={`/sales/returns/${row.id}`}
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          {row.return_number}
        </Link>
      ),
    },
    {
      key: 'order_number',
      header: 'Order #',
      render: (row) => (
        <Link
          to={`/sales/orders/${row.order_id}`}
          className="text-gray-600 hover:text-gray-900"
        >
          {row.order_number}
        </Link>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row.customer_name}</p>
        </div>
      ),
    },
    {
      key: 'return_date',
      header: 'Date',
      render: (row) => formatDate(row.return_date),
    },
    {
      key: 'refund_amount',
      header: 'Refund Amount',
      render: (row) => (
        <span className="font-medium text-gray-900">
          {formatCurrency(row.refund_amount)}
        </span>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (row) => (
        <span className="text-sm text-gray-600 truncate max-w-[200px] block">
          {row.reason}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const config = getStatusConfig(row.status);
        return <Badge color={config.color}>{config.label}</Badge>;
      },
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <Dropdown
          trigger={
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreHorizontal className="w-5 h-5 text-gray-500" />
            </button>
          }
          align="right"
        >
          <DropdownItem onClick={() => navigate(`/sales/returns/${row.id}`)}>
            <Eye className="w-4 h-4" />
            View Details
          </DropdownItem>
        </Dropdown>
      ),
    },
  ];
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Returns</h1>
          <p className="text-gray-500 mt-1">Manage customer returns and refunds</p>
        </div>
        <Button variant="secondary">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Returns</p>
                <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
              </div>
              <div className="p-3 rounded-lg bg-primary-100">
                <RotateCcw className="w-5 h-5 text-primary-600" />
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">5</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-100">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Approved</p>
                <p className="text-2xl font-bold text-green-600">12</p>
              </div>
              <div className="p-3 rounded-lg bg-green-100">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Refunded</p>
                <p className="text-2xl font-bold text-gray-900">$4,250</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-100">
                <RotateCcw className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
      
      {/* Filters & Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search returns..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <Dropdown
              trigger={
                <Button variant="secondary" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Status: {statusFilter === 'all' ? 'All' : statusFilter}
                </Button>
              }
            >
              <DropdownItem onClick={() => setStatusFilter('all')}>All</DropdownItem>
              <DropdownItem onClick={() => setStatusFilter('pending')}>Pending</DropdownItem>
              <DropdownItem onClick={() => setStatusFilter('approved')}>Approved</DropdownItem>
              <DropdownItem onClick={() => setStatusFilter('rejected')}>Rejected</DropdownItem>
              <DropdownItem onClick={() => setStatusFilter('refunded')}>Refunded</DropdownItem>
            </Dropdown>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {isLoading ? (
            <TableSkeleton rows={5} columns={8} />
          ) : (
            <>
              <Table columns={columns} data={returns} />
              {returns.length === 0 && (
                <div className="text-center py-12">
                  <RotateCcw className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No returns found</h3>
                  <p className="text-gray-500 mt-1">Returns will appear here when customers request them</p>
                </div>
              )}
            </>
          )}
        </CardBody>
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100">
            <Pagination
              currentPage={page}
              totalPages={pagination.pages}
              onPageChange={setPage}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
