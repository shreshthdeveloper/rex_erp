import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Printer,
  MoreHorizontal,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
} from 'lucide-react';
import { invoicesAPI } from '../../services/api';
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
  TableSkeleton,
} from '../../components/ui';

function getStatusConfig(status) {
  switch (status) {
    case 'paid':
      return { color: 'success', icon: CheckCircle, label: 'Paid' };
    case 'pending':
      return { color: 'warning', icon: Clock, label: 'Pending' };
    case 'overdue':
      return { color: 'danger', icon: XCircle, label: 'Overdue' };
    case 'cancelled':
      return { color: 'secondary', icon: XCircle, label: 'Cancelled' };
    default:
      return { color: 'secondary', icon: Clock, label: status };
  }
}

export default function Invoices() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const { data, isLoading } = useQuery({
    queryKey: ['invoices', page, search, statusFilter],
    queryFn: () => invoicesAPI.getAll({ page, search, status: statusFilter !== 'all' ? statusFilter : undefined }),
  });
  
  const invoices = data?.data?.invoices || [];
  const pagination = data?.data?.pagination || { total: 0, pages: 1 };
  
  const columns = [
    {
      key: 'invoice_number',
      header: 'Invoice #',
      sortable: true,
      render: (row) => (
        <Link
          to={`/sales/invoices/${row.id}`}
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          {row.invoice_number}
        </Link>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row.customer_name}</p>
          <p className="text-sm text-gray-500">{row.customer_email}</p>
        </div>
      ),
    },
    {
      key: 'invoice_date',
      header: 'Date',
      sortable: true,
      render: (row) => formatDate(row.invoice_date),
    },
    {
      key: 'due_date',
      header: 'Due Date',
      sortable: true,
      render: (row) => formatDate(row.due_date),
    },
    {
      key: 'total_amount',
      header: 'Amount',
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
          <DropdownItem onClick={() => navigate(`/sales/invoices/${row.id}`)}>
            <Eye className="w-4 h-4" />
            View Invoice
          </DropdownItem>
          <DropdownItem>
            <Printer className="w-4 h-4" />
            Print
          </DropdownItem>
          <DropdownItem>
            <Download className="w-4 h-4" />
            Download PDF
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
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-500 mt-1">Manage all your invoices</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Invoices</p>
                <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
              </div>
              <div className="p-3 rounded-lg bg-primary-100">
                <FileText className="w-5 h-5 text-primary-600" />
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
                <p className="text-sm text-gray-500">Overdue</p>
                <p className="text-2xl font-bold text-red-600">3</p>
              </div>
              <div className="p-3 rounded-lg bg-red-100">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Outstanding</p>
                <p className="text-2xl font-bold text-green-600">$12,450</p>
              </div>
              <div className="p-3 rounded-lg bg-green-100">
                <DollarSign className="w-5 h-5 text-green-600" />
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
                placeholder="Search invoices..."
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
              <DropdownItem onClick={() => setStatusFilter('paid')}>Paid</DropdownItem>
              <DropdownItem onClick={() => setStatusFilter('overdue')}>Overdue</DropdownItem>
              <DropdownItem onClick={() => setStatusFilter('cancelled')}>Cancelled</DropdownItem>
            </Dropdown>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {isLoading ? (
            <TableSkeleton rows={5} columns={7} />
          ) : (
            <>
              <Table columns={columns} data={invoices} />
              {invoices.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No invoices found</h3>
                  <p className="text-gray-500 mt-1">Invoices will appear here when orders are completed</p>
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
