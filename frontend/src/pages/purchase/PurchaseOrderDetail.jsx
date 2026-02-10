import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Edit,
  Printer,
  Download,
  Package,
  Building,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import { purchaseAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Button,
  Badge,
  LoadingScreen,
} from '../../components/ui';

function getStatusColor(status) {
  switch (status) {
    case 'received':
      return 'success';
    case 'partial':
      return 'warning';
    case 'ordered':
      return 'primary';
    case 'pending':
      return 'secondary';
    case 'cancelled':
      return 'danger';
    default:
      return 'secondary';
  }
}

export default function PurchaseOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['purchase-order', id],
    queryFn: () => purchaseAPI.getById(id),
  });
  
  if (isLoading) return <LoadingScreen />;
  if (error) return <div className="text-center py-12 text-red-600">Failed to load purchase order</div>;
  
  const order = data?.data;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/purchase/orders')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{order?.po_number}</h1>
              <Badge color={getStatusColor(order?.status)}>
                {order?.status}
              </Badge>
            </div>
            <p className="text-gray-500 mt-1">
              Created on {formatDate(order?.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="secondary">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          {order?.status !== 'received' && order?.status !== 'cancelled' && (
            <Button variant="primary" onClick={() => navigate(`/purchase/grn/new?po=${order?.id}`)}>
              Create GRN
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Product</th>
                    <th className="text-center text-xs font-medium text-gray-500 uppercase px-6 py-3">Ordered</th>
                    <th className="text-center text-xs font-medium text-gray-500 uppercase px-6 py-3">Received</th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase px-6 py-3">Unit Cost</th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase px-6 py-3">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {order?.items?.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Package className="w-5 h-5 text-gray-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{item.product_name}</p>
                            <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-900">{item.quantity}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={item.received_quantity === item.quantity ? 'text-green-600' : 'text-yellow-600'}>
                          {item.received_quantity || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-900">{formatCurrency(item.unit_cost)}</td>
                      <td className="px-6 py-4 text-right font-medium text-gray-900">
                        {formatCurrency(item.quantity * item.unit_cost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Totals */}
              <div className="border-t border-gray-100 px-6 py-4">
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="text-gray-900">{formatCurrency(order?.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Tax</span>
                      <span className="text-gray-900">{formatCurrency(order?.tax_amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Shipping</span>
                      <span className="text-gray-900">{formatCurrency(order?.shipping_amount)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold pt-2 border-t border-gray-100">
                      <span className="text-gray-900">Total</span>
                      <span className="text-gray-900">{formatCurrency(order?.total_amount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
          
          {/* Notes */}
          {order?.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardBody>
                <p className="text-gray-600 whitespace-pre-wrap">{order?.notes}</p>
              </CardBody>
            </Card>
          )}
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Supplier Info */}
          <Card>
            <CardHeader>
              <CardTitle>Supplier</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                  <Building className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{order?.supplier_name}</p>
                  <a
                    href={`/suppliers/${order?.supplier_id}`}
                    className="text-sm text-primary-600 hover:underline"
                  >
                    View Profile
                  </a>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{order?.supplier_email || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{order?.supplier_phone || 'N/A'}</span>
                </div>
              </div>
            </CardBody>
          </Card>
          
          {/* Order Info */}
          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Order Date</span>
                  <span className="text-gray-900">{formatDate(order?.order_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Expected Delivery</span>
                  <span className="text-gray-900">{formatDate(order?.expected_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Terms</span>
                  <span className="text-gray-900">{order?.payment_terms || 'Net 30'}</span>
                </div>
              </div>
            </CardBody>
          </Card>
          
          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Address</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="text-sm text-gray-600">
                  <p>{order?.shipping_address?.street || 'Main Warehouse'}</p>
                  <p>{order?.shipping_address?.city}, {order?.shipping_address?.state}</p>
                  <p>{order?.shipping_address?.zip_code}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
