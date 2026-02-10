import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, User, Mail, Phone, MapPin, Building2, Edit2, ShoppingCart, DollarSign, FileText } from 'lucide-react';
import { customersAPI } from '../../services/api';
import { Card, CardHeader, CardTitle, CardBody, Button, Badge, LoadingScreen, TableSkeleton } from '../../components/ui';

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customersAPI.getById(id),
  });
  
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['customerOrders', id],
    queryFn: () => customersAPI.getOrders(id),
  });
  
  const customer = data?.data;
  const orders = ordersData?.data?.orders || [];
  
  if (isLoading) return <LoadingScreen />;
  
  if (error || !customer) {
    return (
      <div className="text-center py-12">
        <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Customer not found</h3>
        <Button variant="primary" onClick={() => navigate('/customers')}>
          Back to Customers
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/customers')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-600">
                {customer.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
              {customer.company && <p className="text-gray-500">{customer.company}</p>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={customer.is_active ? 'success' : 'secondary'} size="lg">
            {customer.is_active ? 'Active' : 'Inactive'}
          </Badge>
          <Link to={`/customers/${id}/edit`}>
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
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{customer.order_count || 0}</p>
                <p className="text-sm text-gray-500">Total Orders</p>
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
                <p className="text-2xl font-bold text-gray-900">${parseFloat(customer.total_spent || 0).toLocaleString()}</p>
                <p className="text-sm text-gray-500">Total Spent</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">${parseFloat(customer.average_order_value || 0).toLocaleString()}</p>
                <p className="text-sm text-gray-500">Avg Order Value</p>
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
                <p className="text-2xl font-bold text-gray-900">${parseFloat(customer.outstanding_balance || 0).toLocaleString()}</p>
                <p className="text-sm text-gray-500">Outstanding</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            {customer.email && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <a href={`mailto:${customer.email}`} className="text-gray-900 hover:text-primary-600">
                    {customer.email}
                  </a>
                </div>
              </div>
            )}
            
            {customer.phone && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <a href={`tel:${customer.phone}`} className="text-gray-900 hover:text-primary-600">
                    {customer.phone}
                  </a>
                </div>
              </div>
            )}
            
            {customer.company && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Company</p>
                  <p className="text-gray-900">{customer.company}</p>
                </div>
              </div>
            )}
            
            {(customer.address || customer.city) && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="text-gray-900">
                    {customer.address && <span className="block">{customer.address}</span>}
                    {customer.city && (
                      <span className="block">
                        {[customer.city, customer.state, customer.postal_code].filter(Boolean).join(', ')}
                      </span>
                    )}
                    {customer.country && <span className="block">{customer.country}</span>}
                  </p>
                </div>
              </div>
            )}
            
            <div className="pt-4 border-t border-gray-100 text-sm text-gray-500">
              <p>Customer since: {format(new Date(customer.created_at), 'MMMM dd, yyyy')}</p>
            </div>
          </CardBody>
        </Card>
        
        {/* Orders */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Orders</CardTitle>
                <Link to={`/sales/orders?customer_id=${customer.id}`}>
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
                  <p className="text-gray-500">No orders yet</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Order</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Date</th>
                      <th className="text-center py-4 px-6 text-sm font-medium text-gray-500">Status</th>
                      <th className="text-right py-4 px-6 text-sm font-medium text-gray-500">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map((order) => (
                      <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <Link to={`/sales/orders/${order.id}`} className="font-medium text-primary-600 hover:text-primary-700">
                            {order.order_number}
                          </Link>
                        </td>
                        <td className="py-4 px-6 text-gray-500">
                          {format(new Date(order.order_date), 'MMM dd, yyyy')}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <Badge variant={
                            order.status === 'COMPLETED' ? 'success' :
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
        </div>
      </div>
      
      {/* Notes */}
      {customer.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-gray-600 whitespace-pre-line">{customer.notes}</p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
