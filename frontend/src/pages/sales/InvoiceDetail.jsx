import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Printer,
  Download,
  Mail,
  Package,
  User,
  MapPin,
  Phone,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { invoicesAPI } from '../../services/api';
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
    case 'paid':
      return 'success';
    case 'pending':
      return 'warning';
    case 'overdue':
      return 'danger';
    default:
      return 'secondary';
  }
}

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoicesAPI.getById(id),
  });
  
  if (isLoading) return <LoadingScreen />;
  if (error) return <div className="text-center py-12 text-red-600">Failed to load invoice</div>;
  
  const invoice = data?.data;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/sales/invoices')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{invoice?.invoice_number}</h1>
              <Badge color={getStatusColor(invoice?.status)}>
                {invoice?.status}
              </Badge>
            </div>
            <p className="text-gray-500 mt-1">
              Created on {formatDate(invoice?.created_at)}
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
          <Button variant="primary">
            <Mail className="w-4 h-4 mr-2" />
            Send to Customer
          </Button>
        </div>
      </div>
      
      {/* Invoice Content */}
      <Card>
        <CardBody>
          {/* Header Info */}
          <div className="flex flex-col md:flex-row md:justify-between gap-6 pb-6 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-gray-900">INVOICE</h2>
              <p className="text-gray-500 mt-1">{invoice?.invoice_number}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary-600 mb-2">REX ERP</div>
              <p className="text-gray-500">123 Business Street</p>
              <p className="text-gray-500">City, State 12345</p>
            </div>
          </div>
          
          {/* Billing & Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Bill To</h3>
              <p className="font-medium text-gray-900">{invoice?.customer_name}</p>
              <p className="text-gray-500">{invoice?.customer_email}</p>
              <p className="text-gray-500">{invoice?.billing_address?.street}</p>
              <p className="text-gray-500">
                {invoice?.billing_address?.city}, {invoice?.billing_address?.state} {invoice?.billing_address?.zip_code}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Invoice Date</h3>
              <p className="text-gray-900">{formatDate(invoice?.invoice_date)}</p>
              
              <h3 className="text-sm font-medium text-gray-500 uppercase mt-4 mb-2">Due Date</h3>
              <p className="text-gray-900">{formatDate(invoice?.due_date)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Amount Due</h3>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(invoice?.total_amount)}</p>
            </div>
          </div>
          
          {/* Items Table */}
          <div className="py-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Description</th>
                  <th className="text-center text-xs font-medium text-gray-500 uppercase py-3">Qty</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase py-3">Rate</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase py-3">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoice?.items?.map((item, index) => (
                  <tr key={index}>
                    <td className="py-4">
                      <p className="font-medium text-gray-900">{item.product_name}</p>
                      {item.description && (
                        <p className="text-sm text-gray-500">{item.description}</p>
                      )}
                    </td>
                    <td className="py-4 text-center text-gray-900">{item.quantity}</td>
                    <td className="py-4 text-right text-gray-900">{formatCurrency(item.unit_price)}</td>
                    <td className="py-4 text-right font-medium text-gray-900">
                      {formatCurrency(item.quantity * item.unit_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Totals */}
          <div className="flex justify-end border-t border-gray-100 pt-6">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900">{formatCurrency(invoice?.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax ({invoice?.tax_rate || 0}%)</span>
                <span className="text-gray-900">{formatCurrency(invoice?.tax_amount)}</span>
              </div>
              {invoice?.discount_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Discount</span>
                  <span className="text-green-600">-{formatCurrency(invoice?.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-100">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">{formatCurrency(invoice?.total_amount)}</span>
              </div>
            </div>
          </div>
          
          {/* Notes */}
          {invoice?.notes && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Notes</h3>
              <p className="text-gray-600">{invoice?.notes}</p>
            </div>
          )}
          
          {/* Payment Info */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Payment Information</h3>
            <p className="text-sm text-gray-500">
              Please make payment by the due date. Contact us if you have any questions.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
