import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Package,
  BarChart3,
  Tag,
  Boxes,
  DollarSign,
  Calendar,
  Building,
} from 'lucide-react';
import { productsAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { Card, CardHeader, CardTitle, CardBody, Button, Badge, LoadingScreen } from '../../components/ui';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsAPI.getById(id),
  });
  
  if (isLoading) return <LoadingScreen />;
  if (error) return <div className="text-center py-12 text-red-600">Failed to load product</div>;
  
  const product = data?.data;
  
  const getStockStatus = (quantity, reorderLevel) => {
    if (quantity <= 0) return { color: 'danger', label: 'Out of Stock' };
    if (quantity <= reorderLevel) return { color: 'warning', label: 'Low Stock' };
    return { color: 'success', label: 'In Stock' };
  };
  
  const stockStatus = getStockStatus(product?.stock_quantity, product?.reorder_level);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/inventory/products')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{product?.name}</h1>
              <Badge color={product?.is_active ? 'success' : 'secondary'}>
                {product?.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-gray-500 mt-1">SKU: {product?.sku}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => navigate(`/inventory/products/${product?.id}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="danger">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Image & Basic Info */}
          <Card>
            <CardBody>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-48 h-48 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                  {product?.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-16 h-16 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900">{product?.name}</h2>
                  <p className="text-gray-500 mt-2">{product?.description || 'No description available'}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-sm text-gray-500">Category</p>
                      <p className="font-medium text-gray-900">{product?.category_name || 'Uncategorized'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Brand</p>
                      <p className="font-medium text-gray-900">{product?.brand || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Unit</p>
                      <p className="font-medium text-gray-900">{product?.unit || 'Each'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Barcode</p>
                      <p className="font-medium text-gray-900">{product?.barcode || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
          
          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-500 mb-2">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm">Cost Price</span>
                  </div>
                  <p className="text-xl font-semibold text-gray-900">{formatCurrency(product?.cost_price)}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 text-green-600 mb-2">
                    <Tag className="w-4 h-4" />
                    <span className="text-sm">Selling Price</span>
                  </div>
                  <p className="text-xl font-semibold text-green-600">{formatCurrency(product?.selling_price)}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <BarChart3 className="w-4 h-4" />
                    <span className="text-sm">Margin</span>
                  </div>
                  <p className="text-xl font-semibold text-blue-600">
                    {product?.cost_price ? (((product?.selling_price - product?.cost_price) / product?.cost_price) * 100).toFixed(1) : 0}%
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 text-purple-600 mb-2">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm">Profit/Unit</span>
                  </div>
                  <p className="text-xl font-semibold text-purple-600">
                    {formatCurrency((product?.selling_price || 0) - (product?.cost_price || 0))}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
          
          {/* Stock Movement History */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Stock Movements</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Stock movement history will appear here</p>
              </div>
            </CardBody>
          </Card>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stock Status */}
          <Card>
            <CardHeader>
              <CardTitle>Stock Status</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="text-center mb-4">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${
                  stockStatus.color === 'success' ? 'bg-green-100' :
                  stockStatus.color === 'warning' ? 'bg-yellow-100' : 'bg-red-100'
                }`}>
                  <Boxes className={`w-8 h-8 ${
                    stockStatus.color === 'success' ? 'text-green-600' :
                    stockStatus.color === 'warning' ? 'text-yellow-600' : 'text-red-600'
                  }`} />
                </div>
                <p className="text-3xl font-bold text-gray-900">{product?.stock_quantity || 0}</p>
                <p className="text-gray-500">units in stock</p>
                <Badge color={stockStatus.color} className="mt-2">
                  {stockStatus.label}
                </Badge>
              </div>
              
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Reorder Level</span>
                  <span className="text-gray-900">{product?.reorder_level || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Reorder Qty</span>
                  <span className="text-gray-900">{product?.reorder_quantity || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Stock Value</span>
                  <span className="text-gray-900">{formatCurrency((product?.stock_quantity || 0) * (product?.cost_price || 0))}</span>
                </div>
              </div>
            </CardBody>
          </Card>
          
          {/* Supplier Info */}
          <Card>
            <CardHeader>
              <CardTitle>Supplier</CardTitle>
            </CardHeader>
            <CardBody>
              {product?.supplier_id ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <Building className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{product?.supplier_name}</p>
                    <a href={`/suppliers/${product?.supplier_id}`} className="text-sm text-primary-600 hover:underline">
                      View Supplier
                    </a>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No supplier assigned</p>
              )}
            </CardBody>
          </Card>
          
          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Created</span>
                  <span className="text-gray-900">{formatDate(product?.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Updated</span>
                  <span className="text-gray-900">{formatDate(product?.updated_at)}</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
