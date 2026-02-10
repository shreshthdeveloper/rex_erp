import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, Building2, Mail, Phone, MapPin, Globe, User, Edit2, ShoppingCart, Package, DollarSign, FileText } from 'lucide-react';
import { suppliersAPI } from '../../services/api';
import { Card, CardHeader, CardTitle, CardBody, Button, Badge, LoadingScreen, TableSkeleton } from '../../components/ui';

export default function SupplierDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['supplier', id],
    queryFn: () => suppliersAPI.getById(id),
  });
  
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['supplierOrders', id],
    queryFn: () => suppliersAPI.getPurchaseOrders(id),
  });
  
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['supplierProducts', id],
    queryFn: () => suppliersAPI.getProducts(id),
  });
  
  const supplier = data?.data;
  const orders = ordersData?.data?.purchaseOrders || [];
  const products = productsData?.data?.products || [];
  
  if (isLoading) return <LoadingScreen />;
  
  if (error || !supplier) {
    return (
      <div className="text-center py-12">
        <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Supplier not found</h3>
        <Button variant="primary" onClick={() => navigate('/suppliers')}>
          Back to Suppliers
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/suppliers')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{supplier.name}</h1>
              {supplier.contact_person && <p className="text-gray-500">Contact: {supplier.contact_person}</p>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={supplier.is_active ? 'success' : 'secondary'} size="lg">
            {supplier.is_active ? 'Active' : 'Inactive'}
          </Badge>
          <Link to={`/suppliers/${id}/edit`}>
            <Button variant="secondary">
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{supplier.order_count || 0}</p>
                <p className="text-sm text-gray-500">Purchase Orders</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">${parseFloat(supplier.total_purchases || 0).toLocaleString()}</p>
                <p className="text-sm text-gray-500">Total Purchases</p>
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
                <p className="text-2xl font-bold text-gray-900">{supplier.product_count || 0}</p>
                <p className="text-sm text-gray-500">Products Supplied</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">${parseFloat(supplier.outstanding_balance || 0).toLocaleString()}</p>
                <p className="text-sm text-gray-500">Outstanding</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Supplier Info */}
        <Card>
          <CardHeader>
            <CardTitle>Supplier Information</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            {supplier.contact_person && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Contact Person</p>
                  <p className="text-gray-900">{supplier.contact_person}</p>
                </div>
              </div>
            )}
            
            {supplier.email && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <a href={`mailto:${supplier.email}`} className="text-gray-900 hover:text-primary-600">
                    {supplier.email}
                  </a>
                </div>
              </div>
            )}
            
            {supplier.phone && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <a href={`tel:${supplier.phone}`} className="text-gray-900 hover:text-primary-600">
                    {supplier.phone}
                  </a>
                </div>
              </div>
            )}
            
            {supplier.website && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Website</p>
                  <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700">
                    {supplier.website}
                  </a>
                </div>
              </div>
            )}
            
            {(supplier.address || supplier.city) && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="text-gray-900">
                    {supplier.address && <span className="block">{supplier.address}</span>}
                    {supplier.city && (
                      <span className="block">
                        {[supplier.city, supplier.state, supplier.postal_code].filter(Boolean).join(', ')}
                      </span>
                    )}
                    {supplier.country && <span className="block">{supplier.country}</span>}
                  </p>
                </div>
              </div>
            )}
            
            <div className="pt-4 border-t border-gray-100 text-sm text-gray-500">
              <p>Supplier since: {format(new Date(supplier.created_at), 'MMMM dd, yyyy')}</p>
            </div>
          </CardBody>
        </Card>
        
        {/* Purchase Orders */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Purchase Orders</CardTitle>
                <Link to={`/purchase/orders?supplier_id=${supplier.id}`}>
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {ordersLoading ? (
                <TableSkeleton rows={5} columns={4} />
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No purchase orders yet</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">PO Number</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Date</th>
                      <th className="text-center py-4 px-6 text-sm font-medium text-gray-500">Status</th>
                      <th className="text-right py-4 px-6 text-sm font-medium text-gray-500">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map((order) => (
                      <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <Link to={`/purchase/orders/${order.id}`} className="font-medium text-primary-600 hover:text-primary-700">
                            {order.po_number}
                          </Link>
                        </td>
                        <td className="py-4 px-6 text-gray-500">
                          {format(new Date(order.order_date), 'MMM dd, yyyy')}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <Badge variant={
                            order.status === 'RECEIVED' ? 'success' :
                            order.status === 'PENDING' ? 'warning' :
                            order.status === 'CANCELLED' ? 'danger' : 'secondary'
                          }>
                            {order.status}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-right font-semibold text-gray-900">
                          ${parseFloat(order.total_amount || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardBody>
          </Card>
          
          {/* Products */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Products from this Supplier</CardTitle>
                <Link to={`/inventory/products?supplier_id=${supplier.id}`}>
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {productsLoading ? (
                <TableSkeleton rows={5} columns={3} />
              ) : products.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No products linked to this supplier</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Product</th>
                      <th className="text-right py-4 px-6 text-sm font-medium text-gray-500">Cost Price</th>
                      <th className="text-center py-4 px-6 text-sm font-medium text-gray-500">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.slice(0, 5).map((product) => (
                      <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Package className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                              <Link to={`/inventory/products/${product.id}`} className="font-medium text-gray-900 hover:text-primary-600">
                                {product.name}
                              </Link>
                              <p className="text-sm text-gray-500">{product.sku}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right text-gray-900">
                          ${parseFloat(product.cost_price || 0).toFixed(2)}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <Badge variant={product.stock_quantity > product.reorder_level ? 'success' : product.stock_quantity > 0 ? 'warning' : 'danger'}>
                            {product.stock_quantity}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
      
      {/* Notes */}
      {supplier.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-gray-600 whitespace-pre-line">{supplier.notes}</p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
