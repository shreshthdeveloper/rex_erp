import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Printer,
  Download,
  Mail,
  CheckCircle,
  Clock,
  XCircle,
  Truck,
  Package,
  MapPin,
  Phone,
  User,
  Calendar,
  DollarSign,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { salesAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Button,
  Badge,
  Modal,
  LoadingScreen,
  Dropdown,
  DropdownItem,
  DropdownDivider,
} from '../../components/ui';

function getStatusConfig(status) {
  switch (status) {
    case 'completed':
      return { color: 'success', icon: CheckCircle, label: 'Completed', bg: 'bg-green-50' };
    case 'processing':
      return { color: 'warning', icon: Clock, label: 'Processing', bg: 'bg-yellow-50' };
    case 'pending':
      return { color: 'secondary', icon: Clock, label: 'Pending', bg: 'bg-gray-50' };
    case 'shipped':
      return { color: 'primary', icon: Truck, label: 'Shipped', bg: 'bg-blue-50' };
    case 'cancelled':
      return { color: 'danger', icon: XCircle, label: 'Cancelled', bg: 'bg-red-50' };
    default:
      return { color: 'secondary', icon: Clock, label: status, bg: 'bg-gray-50' };
  }
}

const statusTransitions = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['completed'],
  completed: [],
  cancelled: [],
};

export default function SalesOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteModal, setDeleteModal] = useState(false);
  const [statusModal, setStatusModal] = useState({ open: false, newStatus: null });
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['sales-order', id],
    queryFn: () => salesAPI.getById(id),
  });
  
  const updateStatusMutation = useMutation({
    mutationFn: (newStatus) => salesAPI.updateStatus(id, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries(['sales-order', id]);
      toast.success('Order status updated');
      setStatusModal({ open: false, newStatus: null });
    },
    onError: () => {
      toast.error('Failed to update status');
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: () => salesAPI.delete(id),
    onSuccess: () => {
      toast.success('Order deleted');
      navigate('/sales/orders');
    },
    onError: () => {
      toast.error('Failed to delete order');
    },
  });
  
  if (isLoading) return <LoadingScreen />;
  if (error) return <div className="text-center py-12 text-red-600">Failed to load order</div>;
  
  const order = data?.data;
  const statusConfig = getStatusConfig(order?.status);
  const StatusIcon = statusConfig.icon;
  const availableTransitions = statusTransitions[order?.status] || [];
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/sales/orders')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{order?.order_number}</h1>
              <Badge color={statusConfig.color} className="text-sm">
                {statusConfig.label}
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
          <Dropdown
            trigger={
              <Button variant="secondary">
                Actions
              </Button>
            }
            align="right"
          >
            <DropdownItem onClick={() => navigate(`/sales/orders/${id}/edit`)}>
              <Edit className="w-4 h-4" />
              Edit Order
            </DropdownItem>
            <DropdownItem>
              <Mail className="w-4 h-4" />
              Send to Customer
            </DropdownItem>
            <DropdownItem>
              <Download className="w-4 h-4" />
              Download PDF
            </DropdownItem>
            <DropdownDivider />
            <DropdownItem
              onClick={() => setDeleteModal(true)}
              className="text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              Delete Order
            </DropdownItem>
          </Dropdown>
          {availableTransitions.length > 0 && (
            <Dropdown
              trigger={
                <Button variant="primary">
                  Update Status
                </Button>
              }
              align="right"
            >
              {availableTransitions.map((status) => {
                const config = getStatusConfig(status);
                return (
                  <DropdownItem
                    key={status}
                    onClick={() => setStatusModal({ open: true, newStatus: status })}
                  >
                    <config.icon className="w-4 h-4" />
                    Mark as {config.label}
                  </DropdownItem>
                );
              })}
            </Dropdown>
          )}
        </div>
      </div>
      
      {/* Status Timeline */}
      <Card className={statusConfig.bg}>
        <CardBody>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${statusConfig.color === 'success' ? 'bg-green-100' : statusConfig.color === 'warning' ? 'bg-yellow-100' : statusConfig.color === 'danger' ? 'bg-red-100' : 'bg-blue-100'}`}>
              <StatusIcon className={`w-6 h-6 ${statusConfig.color === 'success' ? 'text-green-600' : statusConfig.color === 'warning' ? 'text-yellow-600' : statusConfig.color === 'danger' ? 'text-red-600' : 'text-blue-600'}`} />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Order {statusConfig.label}</h3>
              <p className="text-sm text-gray-500">
                {order?.status === 'completed' && 'This order has been completed and delivered'}
                {order?.status === 'shipped' && 'This order is on its way to the customer'}
                {order?.status === 'processing' && 'This order is being prepared for shipment'}
                {order?.status === 'pending' && 'This order is waiting to be processed'}
                {order?.status === 'cancelled' && 'This order has been cancelled'}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
      
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
                    <th className="text-center text-xs font-medium text-gray-500 uppercase px-6 py-3">Qty</th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase px-6 py-3">Price</th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase px-6 py-3">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {order?.items?.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{item.product_name}</p>
                            <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-900">{item.quantity}</td>
                      <td className="px-6 py-4 text-right text-gray-900">{formatCurrency(item.unit_price)}</td>
                      <td className="px-6 py-4 text-right font-medium text-gray-900">
                        {formatCurrency(item.quantity * item.unit_price)}
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
                      <span className="text-gray-500">Tax ({order?.tax_rate || 0}%)</span>
                      <span className="text-gray-900">{formatCurrency(order?.tax_amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Shipping</span>
                      <span className="text-gray-900">{formatCurrency(order?.shipping_amount)}</span>
                    </div>
                    {order?.discount_amount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Discount</span>
                        <span className="text-green-600">-{formatCurrency(order?.discount_amount)}</span>
                      </div>
                    )}
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
                <CardTitle>Order Notes</CardTitle>
              </CardHeader>
              <CardBody>
                <p className="text-gray-600 whitespace-pre-wrap">{order?.notes}</p>
              </CardBody>
            </Card>
          )}
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{order?.customer_name}</p>
                  <Link
                    to={`/customers/${order?.customer_id}`}
                    className="text-sm text-primary-600 hover:underline"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{order?.customer_email}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{order?.customer_phone || 'N/A'}</span>
                </div>
              </div>
            </CardBody>
          </Card>
          
          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="text-sm text-gray-600">
                  <p>{order?.shipping_address?.street || 'N/A'}</p>
                  <p>{order?.shipping_address?.city}, {order?.shipping_address?.state}</p>
                  <p>{order?.shipping_address?.zip_code}</p>
                  <p>{order?.shipping_address?.country}</p>
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
                  <span className="text-gray-500">Payment Method</span>
                  <span className="text-gray-900">{order?.payment_method || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Status</span>
                  <Badge color={order?.payment_status === 'paid' ? 'success' : 'warning'}>
                    {order?.payment_status || 'Pending'}
                  </Badge>
                </div>
                {order?.invoice_id && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Invoice</span>
                    <Link
                      to={`/sales/invoices/${order?.invoice_id}`}
                      className="text-primary-600 hover:underline"
                    >
                      View Invoice
                    </Link>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
      
      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        title="Delete Order"
      >
        <div className="p-6">
          <p className="text-gray-600">
            Are you sure you want to delete this order? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setDeleteModal(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteMutation.mutate()}
              loading={deleteMutation.isLoading}
            >
              Delete Order
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Status Update Modal */}
      <Modal
        isOpen={statusModal.open}
        onClose={() => setStatusModal({ open: false, newStatus: null })}
        title="Update Order Status"
      >
        <div className="p-6">
          <p className="text-gray-600">
            Are you sure you want to change the order status to{' '}
            <span className="font-medium">{getStatusConfig(statusModal.newStatus).label}</span>?
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setStatusModal({ open: false, newStatus: null })}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => updateStatusMutation.mutate(statusModal.newStatus)}
              loading={updateStatusMutation.isLoading}
            >
              Update Status
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
