import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, CreditCard, FileText, User, Building2, Printer, DollarSign } from 'lucide-react';
import { paymentsAPI } from '../../services/api';
import { Card, CardHeader, CardTitle, CardBody, Button, Badge, LoadingScreen } from '../../components/ui';

export default function PaymentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const scope = new URLSearchParams(location.search).get('scope') || 'customer';
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['payment', scope, id],
    queryFn: () => (scope === 'supplier'
      ? paymentsAPI.getSupplierPaymentById(id)
      : paymentsAPI.getCustomerPaymentById(id)
    ),
  });
  
  const payment = data?.data;
  
  const getStatusConfig = (status) => {
    const statuses = {
      PENDING: { label: 'Pending', color: 'warning' },
      COMPLETED: { label: 'Completed', color: 'success' },
      FAILED: { label: 'Failed', color: 'danger' },
      REFUNDED: { label: 'Refunded', color: 'info' },
    };
    return statuses[status] || { label: status, color: 'secondary' };
  };
  
  const getTypeLabel = () => (scope === 'customer' ? 'Payment Received' : 'Payment Made');
  
  if (isLoading) return <LoadingScreen />;
  
  if (error || !payment) {
    return (
      <div className="text-center py-12">
        <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Payment not found</h3>
        <Button variant="primary" onClick={() => navigate('/payments')}>
          Back to Payments
        </Button>
      </div>
    );
  }
  
  const statusConfig = getStatusConfig(payment.status);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/payments')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{payment.payment_number}</h1>
              <Badge variant={statusConfig.color} size="lg">
                {statusConfig.label}
              </Badge>
            </div>
            <p className="text-gray-500 mt-1">
              {getTypeLabel()} • {format(new Date(payment.payment_date), 'MMMM dd, yyyy')}
            </p>
          </div>
        </div>
        <Button variant="secondary">
          <Printer className="w-4 h-4 mr-2" />
          Print Receipt
        </Button>
      </div>
      
      {/* Amount Card */}
      <Card className={`${scope === 'customer' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
        <CardBody>
          <div className="text-center py-4">
            <p className="text-sm font-medium text-gray-600 mb-2">{getTypeLabel()}</p>
            <p className={`text-4xl font-bold ${scope === 'customer' ? 'text-green-600' : 'text-red-600'}`}>
              ${parseFloat(payment.amount || 0).toLocaleString()}
            </p>
          </div>
        </CardBody>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Payment Number</p>
                  <p className="font-medium text-gray-900">{payment.payment_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Payment Date</p>
                  <p className="font-medium text-gray-900">
                    {format(new Date(payment.payment_date), 'MMMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Payment Method</p>
                  <p className="font-medium text-gray-900">{payment.PaymentMethod?.method_name || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Reference</p>
                  <p className="font-medium text-gray-900">{payment.reference_number || '-'}</p>
                </div>
              </div>
              
              {payment.notes && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Notes</p>
                  <p className="text-gray-900">{payment.notes}</p>
                </div>
              )}
            </CardBody>
          </Card>
          
          {/* Related Document */}
          {(payment.Invoice || payment.PurchaseOrder) && (
            <Card>
              <CardHeader>
                <CardTitle>Related Document</CardTitle>
              </CardHeader>
              <CardBody>
                {payment.Invoice && (
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Invoice</p>
                        <Link 
                          to={`/sales/invoices/${payment.invoice_id}`}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          {payment.Invoice.invoice_number}
                        </Link>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Invoice Amount</p>
                      <p className="font-semibold text-gray-900">
                        ${parseFloat(payment.Invoice.total_amount || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                
                {payment.PurchaseOrder && (
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <FileText className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Purchase Order</p>
                        <Link 
                          to={`/purchase/orders/${payment.purchase_order_id}`}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          {payment.PurchaseOrder.po_number}
                        </Link>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">PO Amount</p>
                      <p className="font-semibold text-gray-900">
                        ${parseFloat(payment.PurchaseOrder.total_amount || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Party Info */}
          <Card>
            <CardHeader>
              <CardTitle>{scope === 'customer' ? 'From' : 'To'}</CardTitle>
            </CardHeader>
            <CardBody>
              {payment.Customer ? (
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{payment.Customer.company_name}</p>
                    {payment.Customer.email && (
                      <p className="text-sm text-gray-500">{payment.Customer.email}</p>
                    )}
                    {payment.Customer.phone && (
                      <p className="text-sm text-gray-500">{payment.Customer.phone}</p>
                    )}
                    <Link 
                      to={`/customers/${payment.Customer.id}`}
                      className="text-sm text-primary-600 hover:text-primary-700 mt-2 inline-block"
                    >
                      View Customer
                    </Link>
                  </div>
                </div>
              ) : payment.Supplier ? (
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{payment.Supplier.company_name}</p>
                    {payment.Supplier.email && (
                      <p className="text-sm text-gray-500">{payment.Supplier.email}</p>
                    )}
                    {payment.Supplier.phone && (
                      <p className="text-sm text-gray-500">{payment.Supplier.phone}</p>
                    )}
                    <Link 
                      to={`/suppliers/${payment.Supplier.id}`}
                      className="text-sm text-primary-600 hover:text-primary-700 mt-2 inline-block"
                    >
                      View Supplier
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No party information</p>
              )}
            </CardBody>
          </Card>
          
          {/* Transaction Info */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction Info</CardTitle>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Transaction ID</p>
                <p className="font-medium text-gray-900">{payment.transaction_id || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Bank Reference</p>
                <p className="font-medium text-gray-900">{payment.bank_reference || '-'}</p>
              </div>
              <div className="pt-4 border-t border-gray-100 text-sm text-gray-500">
                <p>Created: {format(new Date(payment.created_at), 'MMM dd, yyyy h:mm a')}</p>
                <p>Updated: {format(new Date(payment.updated_at), 'MMM dd, yyyy h:mm a')}</p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
