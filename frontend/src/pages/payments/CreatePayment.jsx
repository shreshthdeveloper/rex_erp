import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Save, Search, FileText, User, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { paymentsAPI, invoicesAPI, purchaseOrdersAPI, customersAPI, suppliersAPI } from '../../services/api';
import { Card, CardHeader, CardTitle, CardBody, Button, SearchableSelect, Modal } from '../../components/ui';

export default function CreatePayment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invoiceIdFromUrl = searchParams.get('invoice_id');
  
  const [paymentType, setPaymentType] = useState('customer');
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [poModalOpen, setPoModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      payment_date: new Date().toISOString().split('T')[0],
      amount: '',
      payment_method: '',
      reference_number: '',
      invoice_id: invoiceIdFromUrl || '',
      purchase_order_id: '',
      customer_id: '',
      supplier_id: '',
      notes: '',
    },
  });
  
  const invoiceId = watch('invoice_id');
  const purchaseOrderId = watch('purchase_order_id');
  
  const { data: customersData } = useQuery({
    queryKey: ['customers-list'],
    queryFn: () => customersAPI.getAll({ limit: 100 }),
    enabled: paymentType === 'customer',
  });
  
  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers-list'],
    queryFn: () => suppliersAPI.getAll({ limit: 100 }),
    enabled: paymentType === 'supplier',
  });
  
  const { data: invoicesData } = useQuery({
    queryKey: ['invoices-unpaid', searchQuery],
    queryFn: () => invoicesAPI.getAll({ status: 'UNPAID', search: searchQuery, limit: 50 }),
    enabled: paymentType === 'customer',
  });
  
  const { data: posData } = useQuery({
    queryKey: ['pos-pending', searchQuery],
    queryFn: () => purchaseOrdersAPI.getAll({ status: 'CONFIRMED', search: searchQuery, limit: 50 }),
    enabled: paymentType === 'supplier',
  });
  
  const { data: selectedInvoice } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => invoicesAPI.getById(invoiceId),
    enabled: !!invoiceId,
  });
  
  const { data: selectedPO } = useQuery({
    queryKey: ['purchaseOrder', purchaseOrderId],
    queryFn: () => purchaseOrdersAPI.getById(purchaseOrderId),
    enabled: !!purchaseOrderId,
  });
  
  const customers = customersData?.data?.customers || [];
  const suppliers = suppliersData?.data?.suppliers || [];
  const invoices = invoicesData?.data?.invoices || [];
  const purchaseOrders = posData?.data?.purchaseOrders || [];
  
  const createMutation = useMutation({
    mutationFn: (data) => (
      paymentType === 'customer'
        ? paymentsAPI.createCustomerPayment(data)
        : paymentsAPI.createSupplierPayment(data)
    ),
    onSuccess: (response) => {
      toast.success('Payment recorded successfully');
      navigate(`/payments/${response.data.id}?scope=${paymentType}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to record payment');
    },
  });
  
  const handleTypeChange = (type) => {
    setPaymentType(type);
    setValue('invoice_id', '');
    setValue('purchase_order_id', '');
    setValue('customer_id', '');
    setValue('supplier_id', '');
  };
  
  const onSubmit = (data) => {
    if (!data.amount) {
      toast.error('Please enter amount');
      return;
    }

    const payload = {
      amount: parseFloat(data.amount),
      paymentMethod: data.payment_method,
      paymentDate: data.payment_date,
      referenceNumber: data.reference_number,
      notes: data.notes,
    };

    if (paymentType === 'customer') {
      payload.customerId = Number(data.customer_id);
      payload.invoiceId = Number(data.invoice_id);
    } else {
      payload.supplierId = Number(data.supplier_id);
      payload.purchaseOrderId = data.purchase_order_id ? Number(data.purchase_order_id) : null;
    }

    createMutation.mutate(payload);
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/payments')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Record Payment</h1>
            <p className="text-gray-500 mt-1">Record a new payment transaction</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => navigate('/payments')}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={createMutation.isLoading}>
            <Save className="w-4 h-4 mr-2" />
            Save Payment
          </Button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Type */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Type</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => handleTypeChange('customer')}
                    className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                      paymentType === 'customer'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        paymentType === 'customer' ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <User className={`w-6 h-6 ${paymentType === 'customer' ? 'text-green-600' : 'text-gray-400'}`} />
                      </div>
                      <p className="font-medium text-gray-900">Payment Received</p>
                      <p className="text-sm text-gray-500">From customers</p>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleTypeChange('supplier')}
                    className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                      paymentType === 'supplier'
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        paymentType === 'supplier' ? 'bg-red-100' : 'bg-gray-100'
                      }`}>
                        <Building2 className={`w-6 h-6 ${paymentType === 'supplier' ? 'text-red-600' : 'text-gray-400'}`} />
                      </div>
                      <p className="font-medium text-gray-900">Payment Made</p>
                      <p className="text-sm text-gray-500">To suppliers</p>
                    </div>
                  </button>
                </div>
              </CardBody>
            </Card>
            
            {/* Reference Document */}
            <Card>
              <CardHeader>
                <CardTitle>Reference Document</CardTitle>
              </CardHeader>
              <CardBody>
                {paymentType === 'customer' ? (
                  selectedInvoice?.data ? (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{selectedInvoice.data.invoice_number}</p>
                            <p className="text-sm text-gray-500">
                              {selectedInvoice.data.Customer?.company_name || selectedInvoice.data.customer?.company_name} • ${parseFloat(selectedInvoice.data.total_amount || 0).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Button type="button" variant="secondary" size="sm" onClick={() => setValue('invoice_id', '')}>
                          Change
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button type="button" variant="secondary" onClick={() => setInvoiceModalOpen(true)}>
                      <Search className="w-4 h-4 mr-2" />
                      Select Invoice (Optional)
                    </Button>
                  )
                ) : (
                  selectedPO?.data ? (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{selectedPO.data.po_number}</p>
                            <p className="text-sm text-gray-500">
                              {selectedPO.data.Supplier?.company_name || selectedPO.data.supplier?.company_name} • ${parseFloat(selectedPO.data.total_amount || 0).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Button type="button" variant="secondary" size="sm" onClick={() => setValue('purchase_order_id', '')}>
                          Change
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button type="button" variant="secondary" onClick={() => setPoModalOpen(true)}>
                      <Search className="w-4 h-4 mr-2" />
                      Select Purchase Order (Optional)
                    </Button>
                  )
                )}
              </CardBody>
            </Card>
            
            {/* Payment Details */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        step="0.01"
                        {...register('amount', { required: 'Amount is required' })}
                        className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="0.00"
                      />
                    </div>
                    {errors.amount && <p className="mt-1 text-sm text-red-500">{errors.amount.message}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      {...register('payment_date', { required: 'Date is required' })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <select
                      {...register('payment_method')}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select method</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Check">Check</option>
                      <option value="PayPal">PayPal</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
                    <input
                      type="text"
                      {...register('reference_number')}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Transaction ref / Check no."
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      {...register('notes')}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                      placeholder="Additional notes..."
                    />
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Party Selection */}
            <Card>
              <CardHeader>
                <CardTitle>{paymentType === 'customer' ? 'Customer' : 'Supplier'}</CardTitle>
              </CardHeader>
              <CardBody>
                {paymentType === 'customer' ? (
                  <SearchableSelect
                    options={customers.map(c => ({ value: c.id, label: c.name }))}
                    value={watch('customer_id')}
                    onChange={(val) => setValue('customer_id', val)}
                    placeholder="Select customer"
                  />
                ) : (
                  <SearchableSelect
                    options={suppliers.map(s => ({ value: s.id, label: s.name }))}
                    value={watch('supplier_id')}
                    onChange={(val) => setValue('supplier_id', val)}
                    placeholder="Select supplier"
                  />
                )}
              </CardBody>
            </Card>
            
            {/* Quick Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Type</span>
                    <span className="font-medium text-gray-900">
                      {paymentType === 'customer' ? 'Received' : 'Made'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount</span>
                    <span className={`font-semibold ${paymentType === 'customer' ? 'text-green-600' : 'text-red-600'}`}>
                      ${parseFloat(watch('amount') || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Method</span>
                    <span className="text-gray-900">{watch('payment_method') || '-'}</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </form>
      
      {/* Invoice Selection Modal */}
      <Modal isOpen={invoiceModalOpen} onClose={() => setInvoiceModalOpen(false)} title="Select Invoice" size="lg">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div className="max-h-96 overflow-y-auto space-y-2">
            {invoices.map((invoice) => (
              <button
                key={invoice.id}
                type="button"
                onClick={() => { setValue('invoice_id', invoice.id); setInvoiceModalOpen(false); }}
                className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-left"
              >
                <div>
                  <p className="font-medium text-gray-900">{invoice.invoice_number}</p>
                  <p className="text-sm text-gray-500">{invoice.customer?.name}</p>
                </div>
                <span className="font-semibold text-gray-900">
                  ${parseFloat(invoice.total_amount || 0).toLocaleString()}
                </span>
              </button>
            ))}
          </div>
        </div>
      </Modal>
      
      {/* PO Selection Modal */}
      <Modal isOpen={poModalOpen} onClose={() => setPoModalOpen(false)} title="Select Purchase Order" size="lg">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search purchase orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div className="max-h-96 overflow-y-auto space-y-2">
            {purchaseOrders.map((po) => (
              <button
                key={po.id}
                type="button"
                onClick={() => { setValue('purchase_order_id', po.id); setPoModalOpen(false); }}
                className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-left"
              >
                <div>
                  <p className="font-medium text-gray-900">{po.po_number}</p>
                  <p className="text-sm text-gray-500">{po.supplier?.name}</p>
                </div>
                <span className="font-semibold text-gray-900">
                  ${parseFloat(po.total_amount || 0).toLocaleString()}
                </span>
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
