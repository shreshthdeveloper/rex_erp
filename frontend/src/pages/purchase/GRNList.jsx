import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  MoreHorizontal,
  ClipboardCheck,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { grnAPI } from '../../services/api';
import { formatDate } from '../../utils/helpers';
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

export default function GRNList() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  
  const { data, isLoading } = useQuery({
    queryKey: ['grn-list', page, search],
    queryFn: () => grnAPI.getAll({ page, search }),
  });
  
  const grnList = data?.data?.grns || [];
  const pagination = data?.data?.pagination || { total: 0, pages: 1 };
  
  const columns = [
    {
      key: 'grn_number',
      header: 'GRN #',
      render: (row) => (
        <Link
          to={`/purchase/grn/${row.id}`}
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          {row.grn_number}
        </Link>
      ),
    },
    {
      key: 'po_number',
      header: 'PO #',
      render: (row) => (
        <Link
          to={`/purchase/orders/${row.purchase_order_id}`}
          className="text-gray-600 hover:text-gray-900"
        >
          {row.po_number}
        </Link>
      ),
    },
    {
      key: 'supplier',
      header: 'Supplier',
      render: (row) => (
        <p className="font-medium text-gray-900">{row.supplier_name}</p>
      ),
    },
    {
      key: 'received_date',
      header: 'Received Date',
      render: (row) => formatDate(row.received_date),
    },
    {
      key: 'items_count',
      header: 'Items',
      render: (row) => (
        <span className="text-gray-900">{row.items_count || row.items?.length || 0}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge color={row.status === 'verified' ? 'success' : 'warning'}>
          {row.status || 'Pending'}
        </Badge>
      ),
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
          <DropdownItem onClick={() => navigate(`/purchase/grn/${row.id}`)}>
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
          <h1 className="text-2xl font-bold text-gray-900">Goods Received Notes</h1>
          <p className="text-gray-500 mt-1">Track received inventory from suppliers</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="primary" onClick={() => navigate('/purchase/grn/new')}>
            <Plus className="w-4 h-4 mr-2" />
            New GRN
          </Button>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total GRNs</p>
                <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
              </div>
              <div className="p-3 rounded-lg bg-primary-100">
                <ClipboardCheck className="w-5 h-5 text-primary-600" />
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Verification</p>
                <p className="text-2xl font-bold text-yellow-600">3</p>
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
                <p className="text-sm text-gray-500">Verified</p>
                <p className="text-2xl font-bold text-green-600">28</p>
              </div>
              <div className="p-3 rounded-lg bg-green-100">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
      
      {/* Table */}
      <Card>
        <CardHeader>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search GRN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {isLoading ? (
            <TableSkeleton rows={5} columns={7} />
          ) : (
            <>
              <Table columns={columns} data={grnList} />
              {grnList.length === 0 && (
                <div className="text-center py-12">
                  <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No GRNs found</h3>
                  <p className="text-gray-500 mt-1">Create a GRN when you receive goods</p>
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
