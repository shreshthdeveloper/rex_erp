import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, Warehouse, MapPin, Phone, Package, Edit2, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { warehousesAPI } from '../../services/api';
import { Card, CardHeader, CardTitle, CardBody, Button, Badge, LoadingScreen, TableSkeleton } from '../../components/ui';

export default function WarehouseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['warehouse', id],
    queryFn: () => warehousesAPI.getById(id),
  });
  
  const { data: stockData, isLoading: stockLoading } = useQuery({
    queryKey: ['warehouseStock', id],
    queryFn: () => warehousesAPI.getStock(id),
  });
  
  const warehouse = data?.data;
  const stock = stockData?.data?.stock || [];
  
  if (isLoading) return <LoadingScreen />;
  
  if (error || !warehouse) {
    return (
      <div className="text-center py-12">
        <Warehouse className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Warehouse not found</h3>
        <Button variant="primary" onClick={() => navigate('/inventory/warehouses')}>
          Back to Warehouses
        </Button>
      </div>
    );
  }
  
  const lowStockItems = stock.filter(s => s.quantity <= s.product?.reorder_level);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/inventory/warehouses')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{warehouse.name}</h1>
            {warehouse.code && <p className="text-gray-500">Code: {warehouse.code}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={warehouse.is_active ? 'success' : 'secondary'} size="lg">
            {warehouse.is_active ? 'Active' : 'Inactive'}
          </Badge>
          <Button variant="secondary">
            <Edit2 className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stock.length}</p>
                <p className="text-sm text-gray-500">Product Types</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <ArrowDownRight className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stock.reduce((sum, s) => sum + s.quantity, 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">Total Units</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <ArrowUpRight className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{lowStockItems.length}</p>
                <p className="text-sm text-gray-500">Low Stock Items</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  ${stock.reduce((sum, s) => sum + (s.quantity * (s.product?.cost_price || 0)), 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">Stock Value</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Warehouse Info */}
        <Card>
          <CardHeader>
            <CardTitle>Warehouse Information</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                <Warehouse className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Warehouse</p>
                <p className="font-medium text-gray-900">{warehouse.name}</p>
              </div>
            </div>
            
            {(warehouse.address || warehouse.city) && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium text-gray-900">
                    {warehouse.address && <span className="block">{warehouse.address}</span>}
                    {warehouse.city && (
                      <span className="block">
                        {[warehouse.city, warehouse.state, warehouse.postal_code].filter(Boolean).join(', ')}
                      </span>
                    )}
                    {warehouse.country && <span className="block">{warehouse.country}</span>}
                  </p>
                </div>
              </div>
            )}
            
            {warehouse.phone && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium text-gray-900">{warehouse.phone}</p>
                </div>
              </div>
            )}
            
            <div className="pt-4 border-t border-gray-100 text-sm text-gray-500">
              <p>Created: {format(new Date(warehouse.created_at), 'MMM dd, yyyy')}</p>
              <p>Updated: {format(new Date(warehouse.updated_at), 'MMM dd, yyyy')}</p>
            </div>
          </CardBody>
        </Card>
        
        {/* Stock Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Stock Inventory</CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              {stockLoading ? (
                <TableSkeleton rows={8} columns={5} />
              ) : stock.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No stock in this warehouse</h3>
                  <p className="text-gray-500">Products will appear here when stock is added</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Product</th>
                        <th className="text-center py-4 px-6 text-sm font-medium text-gray-500">Quantity</th>
                        <th className="text-center py-4 px-6 text-sm font-medium text-gray-500">Reorder Level</th>
                        <th className="text-center py-4 px-6 text-sm font-medium text-gray-500">Status</th>
                        <th className="text-right py-4 px-6 text-sm font-medium text-gray-500">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stock.map((item) => {
                        const reorderLevel = item.product?.reorder_level || 10;
                        const isLowStock = item.quantity <= reorderLevel;
                        const isOutOfStock = item.quantity === 0;
                        
                        return (
                          <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <Package className="w-5 h-5 text-gray-400" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{item.product?.name}</p>
                                  <p className="text-sm text-gray-500">{item.product?.sku}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span className="font-semibold text-gray-900">{item.quantity}</span>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span className="text-gray-500">{reorderLevel}</span>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <Badge variant={isOutOfStock ? 'danger' : isLowStock ? 'warning' : 'success'}>
                                {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                              </Badge>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <span className="font-medium text-gray-900">
                                ${(item.quantity * (item.product?.cost_price || 0)).toLocaleString()}
                              </span>
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
        </div>
      </div>
    </div>
  );
}
