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
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Truck,
} from 'lucide-react';
import { salesAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Button,
  Badge,
  Table,
  Pagination,
  Dropdown,
  DropdownItem,
  DropdownDivider,
  Modal,
  TableSkeleton,
} from '../../components/ui';

function getStatusConfig(status) {
  switch (status) {
    case 'DELIVERED':
      return { color: 'success', icon: CheckCircle, label: 'Delivered' };
    case 'PROCESSING':
      return { color: 'warning', icon: Clock, label: 'Processing' };
    case 'PENDING':
      return { color: 'secondary', icon: Clock, label: 'Pending' };
    case 'SHIPPED':
      return { color: 'primary', icon: Truck, label: 'Shipped' };
    case 'CANCELLED':
      return { color: 'danger', icon: XCircle, label: 'Cancelled' };
    case 'CONFIRMED':
      return { color: 'primary', icon: CheckCircle, label: 'Confirmed' };
    case 'ON_HOLD':
      return { color: 'warning', icon: Clock, label: 'On Hold' };
    default:
      return { color: 'secondary', icon: Clock, label: status };
  }
}

export default function SalesOrders() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ open: false, order: null });
  
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['sales-orders', page, search, statusFilter],
    queryFn: () => salesAPI.getAll({ page, search, status: statusFilter !== 'all' ? statusFilter.toUpperCase() : undefined }),
  });
  
  const orders = data?.data?.orders || [];
  const pagination = data?.data?.pagination || { total: 0, pages: 1 };
  
  const handleDelete = async () => {
    try {
      await salesAPI.delete(deleteModal.order.id);
      setDeleteModal({ open: false, order: null });
      refetch();
    } catch (error) {
      console.error('Failed to delete order:', error);
    }
  };
  
  const handleExport = () => {
    // Export functionality
    console.log('Exporting orders...');
  };
  
  const columns = [
    {
      key: 'order_number',
      header: 'Order #',
      sortable: true,
      render: (row) => (
        <Link
          to={`/sales/orders/${row.id}`}
          className="text-primary-600 hover:text-primary-700 font-medium"
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
          <p className="font-medium text-gray-900">{row.Customer?.company_name || '—'}</p>
          <p className="text-sm text-gray-500">{row.Customer?.email || ''}</p>
        </div>
      ),
    },
    {
      key: 'order_date',
      header: 'Date',
      sortable: true,
      render: (row) => (
        <div className="text-sm">
          <p className="text-gray-900">{formatDate(row.order_date)}</p>
        </div>
      ),
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
          <DropdownItem onClick={() => navigate(`/sales/orders/${row.id}`)}>
            <Eye className="w-4 h-4" />
            View Details
          </DropdownItem>
          <DropdownItem onClick={() => navigate(`/sales/orders/${row.id}/edit`)}>
            <Edit className="w-4 h-4" />
            Edit Order
          </DropdownItem>
          <DropdownDivider />
          <DropdownItem
            onClick={() => setDeleteModal({ open: true, order: row })}
            className="text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
            Delete Order
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
          <h1 className="text-2xl font-bold text-gray-900">Sales Orders</h1>
          <p className="text-gray-500 mt-1">Manage and track all your sales orders</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="primary" onClick={() => navigate('/sales/orders/new')}>
            <Plus className="w-4 h-4 mr-2" />
            New Order
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
                <Calendar className="w-5 h-5 text-primary-600" />
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">12</p>
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
                <p className="text-sm text-gray-500">Shipped</p>
                <p className="text-2xl font-bold text-blue-600">28</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-100">
                <Truck className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-green-600">156</p>
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
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            {/* Status Filter */}
            <div className="flex items-center gap-2">
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
                <DropdownItem onClick={() => setStatusFilter('processing')}>Processing</DropdownItem>
                <DropdownItem onClick={() => setStatusFilter('shipped')}>Shipped</DropdownItem>
                <DropdownItem onClick={() => setStatusFilter('completed')}>Completed</DropdownItem>
                <DropdownItem onClick={() => setStatusFilter('cancelled')}>Cancelled</DropdownItem>
              </Dropdown>
            </div>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {isLoading ? (
            <TableSkeleton rows={5} columns={6} />
          ) : (
            <>
              <Table
                columns={columns}
                data={orders}
                selectable
                selectedRows={selectedOrders}
                onSelectionChange={setSelectedOrders}
              />
              {orders.length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No orders found</h3>
                  <p className="text-gray-500 mt-1">Get started by creating your first order</p>
                  <Button
                    variant="primary"
                    className="mt-4"
                    onClick={() => navigate('/sales/orders/new')}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Order
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
              totalItems={pagination.total}
              itemsPerPage={10}
            />
          </div>
        )}
      </Card>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, order: null })}
        title="Delete Order"
      >
        <div className="p-6">
          <p className="text-gray-600">
            Are you sure you want to delete order{' '}
            <span className="font-medium text-gray-900">{deleteModal.order?.order_number}</span>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setDeleteModal({ open: false, order: null })}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete Order
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
