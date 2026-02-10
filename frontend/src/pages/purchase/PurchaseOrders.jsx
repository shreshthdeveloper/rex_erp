import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  ShoppingBag,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { purchaseAPI } from '../../services/api';
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
  DropdownDivider,
  TableSkeleton,
} from '../../components/ui';

function getStatusConfig(status) {
  switch (status) {
    case 'received':
      return { color: 'success', label: 'Received' };
    case 'partial':
      return { color: 'warning', label: 'Partial' };
    case 'pending':
      return { color: 'secondary', label: 'Pending' };
    case 'ordered':
      return { color: 'primary', label: 'Ordered' };
    case 'cancelled':
      return { color: 'danger', label: 'Cancelled' };
    default:
      return { color: 'secondary', label: status };
  }
}

export default function PurchaseOrders() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const { data, isLoading } = useQuery({
    queryKey: ['purchase-orders', page, search, statusFilter],
    queryFn: () => purchaseAPI.getAll({ page, search, status: statusFilter !== 'all' ? statusFilter : undefined }),
  });
  
  const orders = data?.data?.orders || [];
  const pagination = data?.data?.pagination || { total: 0, pages: 1 };
  
  const columns = [
    {
      key: 'po_number',
      header: 'PO #',
      sortable: true,
      render: (row) => (
        <Link
          to={`/purchase/orders/${row.id}`}
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          {row.po_number}
        </Link>
      ),
    },
    {
      key: 'supplier',
      header: 'Supplier',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row.supplier_name}</p>
          <p className="text-sm text-gray-500">{row.supplier_email}</p>
        </div>
      ),
    },
    {
      key: 'order_date',
      header: 'Order Date',
      sortable: true,
      render: (row) => formatDate(row.order_date),
    },
    {
      key: 'expected_date',
      header: 'Expected',
      render: (row) => formatDate(row.expected_date),
    },
    {
      key: 'total_amount',
      header: 'Total',
      sortable: true,
      render: (row) => (
        <span className="font-medium text-gray-900">
          {formatCurrency(row.total_amount)}
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
          <DropdownItem onClick={() => navigate(`/purchase/orders/${row.id}`)}>
            <Eye className="w-4 h-4" />
            View Details
          </DropdownItem>
          <DropdownItem onClick={() => navigate(`/purchase/orders/${row.id}/edit`)}>
            <Edit className="w-4 h-4" />
            Edit Order
          </DropdownItem>
          {row.status === 'ordered' && (
            <DropdownItem onClick={() => navigate(`/purchase/grn/new?po=${row.id}`)}>
              <CheckCircle className="w-4 h-4" />
              Create GRN
            </DropdownItem>
          )}
          <DropdownDivider />
          <DropdownItem className="text-red-600 hover:bg-red-50">
            <Trash2 className="w-4 h-4" />
            Delete
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
          <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-gray-500 mt-1">Manage orders from your suppliers</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="primary" onClick={() => navigate('/purchase/orders/new')}>
            <Plus className="w-4 h-4 mr-2" />
            New PO
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
              </div>
              <div className="p-3 rounded-lg bg-primary-100">
                <ShoppingBag className="w-5 h-5 text-primary-600" />
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">8</p>
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
                <p className="text-sm text-gray-500">In Transit</p>
                <p className="text-2xl font-bold text-blue-600">5</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-100">
                <ShoppingBag className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Received</p>
                <p className="text-2xl font-bold text-green-600">45</p>
              </div>
              <div className="p-3 rounded-lg bg-green-100">
                <CheckCircle className="w-5 h-5 text-green-600" />
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
                placeholder="Search purchase orders..."
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
              <DropdownItem onClick={() => setStatusFilter('ordered')}>Ordered</DropdownItem>
              <DropdownItem onClick={() => setStatusFilter('partial')}>Partial</DropdownItem>
              <DropdownItem onClick={() => setStatusFilter('received')}>Received</DropdownItem>
              <DropdownItem onClick={() => setStatusFilter('cancelled')}>Cancelled</DropdownItem>
            </Dropdown>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {isLoading ? (
            <TableSkeleton rows={5} columns={7} />
          ) : (
            <>
              <Table columns={columns} data={orders} />
              {orders.length === 0 && (
                <div className="text-center py-12">
                  <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No purchase orders found</h3>
                  <p className="text-gray-500 mt-1">Create your first purchase order</p>
                  <Button
                    variant="primary"
                    className="mt-4"
                    onClick={() => navigate('/purchase/orders/new')}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create PO
                  </Button>
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
