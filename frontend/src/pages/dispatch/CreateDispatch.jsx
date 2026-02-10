import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Save, Plus, Trash2, Package, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { dispatchesAPI, salesOrdersAPI } from '../../services/api';
import { Card, CardHeader, CardTitle, CardBody, Button, SearchableSelect, Modal } from '../../components/ui';

export default function CreateDispatch() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderIdFromUrl = searchParams.get('order_id');
  
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');
  
  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      sales_order_id: orderIdFromUrl || '',
      dispatch_date: new Date().toISOString().split('T')[0],
      expected_delivery_date: '',
      carrier: '',
      tracking_number: '',
      notes: '',
      items: [],
    },
  });
  
  const { fields, remove } = useFieldArray({
    control,
    name: 'items',
  });
  
  const salesOrderId = watch('sales_order_id');
  
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['salesOrders', 'pending-dispatch', orderSearch],
    queryFn: () => salesOrdersAPI.getAll({ status: 'CONFIRMED', search: orderSearch, limit: 50 }),
  });
  
  const { data: selectedOrderData } = useQuery({
    queryKey: ['salesOrder', salesOrderId],
    queryFn: () => salesOrdersAPI.getById(salesOrderId),
    enabled: !!salesOrderId,
  });
  
  const orders = ordersData?.data?.orders || [];
  const selectedOrder = selectedOrderData?.data;
  
  // Populate items when order is selected
  useEffect(() => {
    if (selectedOrder?.items) {
      const orderItems = selectedOrder.items.map(item => ({
        product_id: item.product_id,
        product: item.product,
        ordered_quantity: item.quantity,
        dispatched_quantity: item.quantity - (item.dispatched_quantity || 0),
      }));
      setValue('items', orderItems);
    }
  }, [selectedOrder, setValue]);
  
  const createMutation = useMutation({
    mutationFn: (data) => dispatchesAPI.create(data),
    onSuccess: (response) => {
      toast.success('Dispatch created successfully');
      navigate(`/dispatch/${response.data.id}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create dispatch');
    },
  });
  
  const onSubmit = (data) => {
    if (!data.sales_order_id) {
      toast.error('Please select a sales order');
      return;
    }
    
    if (data.items.length === 0) {
      toast.error('Please add items to dispatch');
      return;
    }
    
    const submitData = {
      salesOrderId: data.sales_order_id,
      expectedDeliveryDate: data.expected_delivery_date || null,
      carrierId: data.carrier ? Number(data.carrier) : undefined,
      notes: data.notes || null,
      items: data.items.map(item => ({
        productId: item.product_id,
        dispatchQuantity: parseInt(item.dispatched_quantity, 10),
      })),
    };
    
    createMutation.mutate(submitData);
  };
  
  const handleSelectOrder = (order) => {
    setValue('sales_order_id', order.id);
    setOrderModalOpen(false);
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dispatch')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Dispatch</h1>
            <p className="text-gray-500 mt-1">Create a new shipment for a sales order</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => navigate('/dispatch')}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={createMutation.isLoading}>
            <Save className="w-4 h-4 mr-2" />
            Create Dispatch
          </Button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Sales Order</CardTitle>
              </CardHeader>
              <CardBody>
                {selectedOrder ? (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{selectedOrder.order_number}</p>
                        <p className="text-sm text-gray-500">
                          {selectedOrder.customer?.name} • {selectedOrder.items?.length} items
                        </p>
                      </div>
                      <Button type="button" variant="secondary" size="sm" onClick={() => setValue('sales_order_id', '')}>
                        Change
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button type="button" variant="secondary" onClick={() => setOrderModalOpen(true)}>
                    <Search className="w-4 h-4 mr-2" />
                    Select Sales Order
                  </Button>
                )}
              </CardBody>
            </Card>
            
            {/* Items */}
            <Card>
              <CardHeader>
                <CardTitle>Items to Dispatch</CardTitle>
              </CardHeader>
              <CardBody className="p-0">
                {fields.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Select a sales order to load items</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Product</th>
                        <th className="text-center py-4 px-6 text-sm font-medium text-gray-500">Ordered</th>
                        <th className="text-center py-4 px-6 text-sm font-medium text-gray-500">Dispatch Qty</th>
                        <th className="text-right py-4 px-6 text-sm font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fields.map((field, index) => (
                        <tr key={field.id} className="border-b border-gray-50">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                <Package className="w-5 h-5 text-gray-400" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{field.product?.name}</p>
                                <p className="text-sm text-gray-500">{field.product?.sku}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center text-gray-500">{field.ordered_quantity}</td>
                          <td className="py-4 px-6">
                            <input
                              type="number"
                              min="0"
                              max={field.ordered_quantity}
                              {...register(`items.${index}.dispatched_quantity`, {
                                required: true,
                                min: 0,
                                max: field.ordered_quantity,
                                valueAsNumber: true,
                              })}
                              className="w-24 mx-auto block px-3 py-2 border border-gray-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardBody>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Shipment Details */}
            <Card>
              <CardHeader>
                <CardTitle>Shipment Details</CardTitle>
              </CardHeader>
              <CardBody className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dispatch Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('dispatch_date', { required: 'Dispatch date is required' })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  {errors.dispatch_date && (
                    <p className="mt-1 text-sm text-red-500">{errors.dispatch_date.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expected Delivery</label>
                  <input
                    type="date"
                    {...register('expected_delivery_date')}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Carrier</label>
                  <select
                    {...register('carrier')}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select carrier</option>
                    <option value="FedEx">FedEx</option>
                    <option value="UPS">UPS</option>
                    <option value="DHL">DHL</option>
                    <option value="USPS">USPS</option>
                    <option value="Self Delivery">Self Delivery</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number</label>
                  <input
                    type="text"
                    {...register('tracking_number')}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter tracking number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    {...register('notes')}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    placeholder="Any special instructions..."
                  />
                </div>
              </CardBody>
            </Card>
            
            {/* Customer Info */}
            {selectedOrder?.customer && (
              <Card>
                <CardHeader>
                  <CardTitle>Shipping To</CardTitle>
                </CardHeader>
                <CardBody>
                  <div className="space-y-2">
                    <p className="font-medium text-gray-900">{selectedOrder.customer.name}</p>
                    {selectedOrder.shipping_address && (
                      <p className="text-sm text-gray-500 whitespace-pre-line">
                        {selectedOrder.shipping_address}
                      </p>
                    )}
                    {selectedOrder.customer.phone && (
                      <p className="text-sm text-gray-500">{selectedOrder.customer.phone}</p>
                    )}
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      </form>
      
      {/* Order Selection Modal */}
      <Modal isOpen={orderModalOpen} onClose={() => setOrderModalOpen(false)} title="Select Sales Order" size="lg">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div className="max-h-96 overflow-y-auto space-y-2">
            {ordersLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
              </div>
            ) : orders.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No confirmed orders found</p>
            ) : (
              orders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => handleSelectOrder(order)}
                  className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-left"
                >
                  <div>
                    <p className="font-medium text-gray-900">{order.order_number}</p>
                    <p className="text-sm text-gray-500">
                      {order.customer?.name} • {order.items?.length || 0} items
                    </p>
                  </div>
                  <span className="text-sm text-gray-500">
                    ${parseFloat(order.total_amount || 0).toLocaleString()}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
