import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, Truck, Package, MapPin, User, Phone, Clock, CheckCircle, XCircle, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { dispatchesAPI } from '../../services/api';
import { Card, CardHeader, CardTitle, CardBody, Button, Badge, LoadingScreen } from '../../components/ui';

export default function DispatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['dispatch', id],
    queryFn: () => dispatchesAPI.getById(id),
  });
  
  const dispatch = data?.data;
  
  const updateStatusMutation = useMutation({
    mutationFn: (status) => dispatchesAPI.updateStatus(id, status),
    onSuccess: () => {
      toast.success('Dispatch status updated');
      queryClient.invalidateQueries(['dispatch', id]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });
  
  const getStatusConfig = (status) => {
    const statuses = {
      PENDING: { label: 'Pending', color: 'warning', icon: Clock },
      IN_TRANSIT: { label: 'In Transit', color: 'info', icon: Truck },
      DELIVERED: { label: 'Delivered', color: 'success', icon: CheckCircle },
      CANCELLED: { label: 'Cancelled', color: 'danger', icon: XCircle },
    };
    return statuses[status] || { label: status, color: 'secondary', icon: Package };
  };
  
  const statusTransitions = {
    PENDING: ['IN_TRANSIT', 'CANCELLED'],
    IN_TRANSIT: ['DELIVERED', 'CANCELLED'],
    DELIVERED: [],
    CANCELLED: [],
  };
  
  if (isLoading) return <LoadingScreen />;
  
  if (error || !dispatch) {
    return (
      <div className="text-center py-12">
        <Truck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Dispatch not found</h3>
        <Button variant="primary" onClick={() => navigate('/dispatch')}>
          Back to Dispatches
        </Button>
      </div>
    );
  }
  
  const statusConfig = getStatusConfig(dispatch.status);
  const StatusIcon = statusConfig.icon;
  const availableTransitions = statusTransitions[dispatch.status] || [];
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dispatch')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{dispatch.dispatch_number}</h1>
              <Badge variant={statusConfig.color} size="lg">
                <StatusIcon className="w-4 h-4 mr-1" />
                {statusConfig.label}
              </Badge>
            </div>
            <p className="text-gray-500 mt-1">
              Created {format(new Date(dispatch.created_at), 'MMM dd, yyyy')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {availableTransitions.map((status) => {
            return (
              <Button
                key={status}
                variant={status === 'CANCELLED' ? 'danger' : 'primary'}
                onClick={() => updateStatusMutation.mutate(status)}
                loading={updateStatusMutation.isLoading}
              >
                {status === 'IN_TRANSIT' && 'Mark In Transit'}
                {status === 'DELIVERED' && 'Mark Delivered'}
                {status === 'CANCELLED' && 'Cancel'}
              </Button>
            );
          })}
          <Button variant="secondary">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipment Details */}
          <Card>
            <CardHeader>
              <CardTitle>Shipment Details</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Dispatch Date</p>
                  <p className="font-medium text-gray-900">
                    {dispatch.dispatch_date
                      ? format(new Date(dispatch.dispatch_date), 'MMMM dd, yyyy')
                      : 'Not set'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Expected Delivery</p>
                  <p className="font-medium text-gray-900">
                    {dispatch.expected_delivery_date
                      ? format(new Date(dispatch.expected_delivery_date), 'MMMM dd, yyyy')
                      : 'Not set'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Carrier</p>
                  <p className="font-medium text-gray-900">{dispatch.carrier || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Tracking Number</p>
                  <p className="font-medium text-gray-900">{dispatch.tracking_number || 'Not available'}</p>
                </div>
              </div>
              
              {dispatch.notes && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Notes</p>
                  <p className="text-gray-900">{dispatch.notes}</p>
                </div>
              )}
            </CardBody>
          </Card>
          
          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Dispatched Items</CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Product</th>
                    <th className="text-center py-4 px-6 text-sm font-medium text-gray-500">Ordered</th>
                    <th className="text-center py-4 px-6 text-sm font-medium text-gray-500">Dispatched</th>
                  </tr>
                </thead>
                <tbody>
                  {dispatch.items?.map((item, index) => (
                    <tr key={index} className="border-b border-gray-50">
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
                      <td className="py-4 px-6 text-center text-gray-900">{item.ordered_quantity || 0}</td>
                      <td className="py-4 px-6 text-center font-semibold text-gray-900">{item.dispatched_quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
          
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Timeline</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Dispatch Created</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(dispatch.created_at), 'MMMM dd, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
                
                {dispatch.dispatch_date && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                      <Truck className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Dispatched</p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(dispatch.dispatch_date), 'MMMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                )}
                
                {dispatch.status === 'DELIVERED' && dispatch.delivered_at && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Delivered</p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(dispatch.delivered_at), 'MMMM dd, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Related Order */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Order</CardTitle>
            </CardHeader>
            <CardBody>
              {dispatch.sales_order ? (
                <div className="space-y-3">
                  <Link
                    to={`/sales/orders/${dispatch.sales_order_id}`}
                    className="font-medium text-primary-600 hover:text-primary-700"
                  >
                    {dispatch.sales_order.order_number}
                  </Link>
                  <div>
                    <p className="text-sm text-gray-500">Order Date</p>
                    <p className="text-gray-900">
                      {format(new Date(dispatch.sales_order.order_date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="text-lg font-semibold text-gray-900">
                      ${parseFloat(dispatch.sales_order.total_amount || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No linked order</p>
              )}
            </CardBody>
          </Card>
          
          {/* Customer */}
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardBody>
              {dispatch.sales_order?.customer ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{dispatch.sales_order.customer.name}</p>
                      <p className="text-sm text-gray-500">{dispatch.sales_order.customer.email}</p>
                    </div>
                  </div>
                  
                  {dispatch.sales_order.customer.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{dispatch.sales_order.customer.phone}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No customer information</p>
              )}
            </CardBody>
          </Card>
          
          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardBody>
              {dispatch.shipping_address ? (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                  <div className="text-gray-600">
                    <p>{dispatch.shipping_address.address_line1}</p>
                    {dispatch.shipping_address.address_line2 && (
                      <p>{dispatch.shipping_address.address_line2}</p>
                    )}
                    <p>
                      {dispatch.shipping_address.city}, {dispatch.shipping_address.state} {dispatch.shipping_address.postal_code}
                    </p>
                    <p>{dispatch.shipping_address.country}</p>
                  </div>
                </div>
              ) : dispatch.sales_order?.shipping_address ? (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                  <div className="text-gray-600 whitespace-pre-line">
                    {dispatch.sales_order.shipping_address}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No shipping address</p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
