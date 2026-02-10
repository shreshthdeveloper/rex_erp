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
  Package,
  AlertTriangle,
  TrendingUp,
  Archive,
} from 'lucide-react';
import { productsAPI } from '../../services/api';
import { formatCurrency } from '../../utils/helpers';
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

export default function Products() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search, categoryFilter],
    queryFn: () => productsAPI.getAll({ page, search, category_id: categoryFilter !== 'all' ? categoryFilter : undefined }),
  });
  
  const products = data?.data?.products || [];
  const pagination = data?.data?.pagination || { total: 0, pages: 1 };
  
  const getStockStatus = (quantity, reorderLevel) => {
    if (quantity <= 0) return { color: 'danger', label: 'Out of Stock' };
    if (quantity <= reorderLevel) return { color: 'warning', label: 'Low Stock' };
    return { color: 'success', label: 'In Stock' };
  };
  
  const columns = [
    {
      key: 'product',
      header: 'Product',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
            {row.image_url ? (
              <img src={row.image_url} alt={row.product_name || row.name} className="w-full h-full object-cover" />
            ) : (
              <Package className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <div>
            <Link
              to={`/inventory/products/${row.id}`}
              className="font-medium text-gray-900 hover:text-primary-600"
            >
              {row.product_name || row.name}
            </Link>
            <p className="text-sm text-gray-500">{row.sku}</p>
            {row.product_type === 'VARIANT' && (
              <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">{row.variants_count || 0} variants</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (row) => (
        <span className="text-gray-600">{row.category_name || 'Uncategorized'}</span>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{formatCurrency(row.selling_price)}</p>
          <p className="text-sm text-gray-500">Cost: {formatCurrency(row.cost_price)}</p>
        </div>
      ),
    },
    {
      key: 'stock',
      header: 'Stock',
      sortable: true,
      render: (row) => {
        const status = getStockStatus(row.stock_quantity, row.reorder_level);
        return (
          <div>
            <p className="font-medium text-gray-900">{row.stock_quantity} units</p>
            <Badge color={status.color} className="text-xs mt-1">
              {status.label}
            </Badge>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge color={row.is_active ? 'success' : 'secondary'}>
          {row.is_active ? 'Active' : 'Inactive'}
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
          <DropdownItem onClick={() => navigate(`/inventory/products/${row.id}`)}>
            <Eye className="w-4 h-4" />
            View Details
          </DropdownItem>
          <DropdownItem onClick={() => navigate(`/inventory/products/${row.id}/edit`)}>
            <Edit className="w-4 h-4" />
            Edit Product
          </DropdownItem>
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
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 mt-1">Manage your product catalog</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="primary" onClick={() => navigate('/inventory/products/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
              </div>
              <div className="p-3 rounded-lg bg-primary-100">
                <Package className="w-5 h-5 text-primary-600" />
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">12</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-100">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">5</p>
              </div>
              <div className="p-3 rounded-lg bg-red-100">
                <Archive className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Value</p>
                <p className="text-2xl font-bold text-green-600">$156K</p>
              </div>
              <div className="p-3 rounded-lg bg-green-100">
                <TrendingUp className="w-5 h-5 text-green-600" />
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
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <Dropdown
              trigger={
                <Button variant="secondary" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
              }
            >
              <DropdownItem onClick={() => setCategoryFilter('all')}>All Categories</DropdownItem>
              <DropdownItem onClick={() => setCategoryFilter('electronics')}>Electronics</DropdownItem>
              <DropdownItem onClick={() => setCategoryFilter('clothing')}>Clothing</DropdownItem>
              <DropdownItem onClick={() => setCategoryFilter('food')}>Food</DropdownItem>
            </Dropdown>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {isLoading ? (
            <TableSkeleton rows={5} columns={6} />
          ) : (
            <>
              <Table columns={columns} data={products} />
              {products.length === 0 && (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No products found</h3>
                  <p className="text-gray-500 mt-1">Get started by adding your first product</p>
                  <Button
                    variant="primary"
                    className="mt-4"
                    onClick={() => navigate('/inventory/products/new')}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
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
