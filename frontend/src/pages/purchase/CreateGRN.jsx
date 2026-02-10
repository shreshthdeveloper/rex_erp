import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Save, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { grnAPI, purchaseAPI } from '../../services/api';
import { formatDate } from '../../utils/helpers';
import { Card, CardHeader, CardTitle, CardBody, Button, SearchableSelect } from '../../components/ui';

export default function CreateGRN() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPO = searchParams.get('po');
  
  const { register, handleSubmit, control, watch, setValue } = useForm({
    defaultValues: {
      purchase_order_id: preselectedPO || '',
      received_date: new Date().toISOString().split('T')[0],
      items: [],
      notes: '',
    },
  });
  
  const { fields, replace } = useFieldArray({ control, name: 'items' });
  const selectedPOId = watch('purchase_order_id');
  
  const { data: poListData } = useQuery({
    queryKey: ['purchase-orders-for-grn'],
    queryFn: () => purchaseAPI.getAll({ status: 'ordered', limit: 100 }),
  });
  
  const { data: poDetailData } = useQuery({
    queryKey: ['purchase-order-detail', selectedPOId],
    queryFn: () => purchaseAPI.getById(selectedPOId),
    enabled: !!selectedPOId,
  });
  
  const purchaseOrders = poListData?.data?.orders || [];
  const selectedPO = poDetailData?.data;
  
  useEffect(() => {
    if (selectedPO?.items) {
      replace(selectedPO.items.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        sku: item.sku,
        ordered_quantity: item.quantity,
        received_quantity: item.quantity - (item.received_quantity || 0),
      })));
    }
  }, [selectedPO, replace]);
  
  const createMutation = useMutation({
    mutationFn: (data) => grnAPI.create(data),
    onSuccess: (response) => {
      toast.success('GRN created successfully');
      navigate(`/purchase/grn/${response.data.id}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create GRN');
    },
  });
  
  const onSubmit = (data) => {
    if (data.items.length === 0) {
      toast.error('No items to receive');
      return;
    }
    
    // Transform to backend expected format
    const submitData = {
      purchaseOrderId: parseInt(data.purchase_order_id, 10),
      receivedDate: data.received_date,
      notes: data.notes,
      items: data.items.map(item => ({
        productId: parseInt(item.product_id, 10),
        acceptedQuantity: parseInt(item.received_quantity || 0, 10),
        rejectedQuantity: 0,
      })),
    };
    
    createMutation.mutate(submitData);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/purchase/grn')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create GRN</h1>
            <p className="text-gray-500 mt-1">Record received goods from suppliers</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => navigate('/purchase/grn')}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={createMutation.isLoading}>
            <Save className="w-4 h-4 mr-2" />
            Create GRN
          </Button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Purchase Order</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Purchase Order</label>
                    <SearchableSelect
                      options={purchaseOrders.map(po => ({
                        value: po.id,
                        label: po.po_number,
                        description: `${po.supplier_name} - ${formatDate(po.order_date)}`,
                      }))}
                      value={selectedPOId}
                      onChange={(val) => setValue('purchase_order_id', val)}
                      placeholder="Search purchase orders..."
                    />
                  </div>
                  {selectedPO && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-900">{selectedPO.po_number}</p>
                      <p className="text-sm text-gray-500">{selectedPO.supplier_name}</p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Items to Receive</CardTitle>
              </CardHeader>
              <CardBody className="p-0">
                {fields.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Select a purchase order to see items</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Product</th>
                        <th className="text-center text-xs font-medium text-gray-500 uppercase px-6 py-3">Ordered</th>
                        <th className="text-center text-xs font-medium text-gray-500 uppercase px-6 py-3">Receiving</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {fields.map((field, index) => (
                        <tr key={field.id}>
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-900">{field.product_name}</p>
                            <p className="text-sm text-gray-500">SKU: {field.sku}</p>
                          </td>
                          <td className="px-6 py-4 text-center text-gray-900">{field.ordered_quantity}</td>
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              min="0"
                              max={field.ordered_quantity}
                              {...register(`items.${index}.received_quantity`, { valueAsNumber: true })}
                              className="w-20 mx-auto px-3 py-2 text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardBody>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardBody>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Received Date</label>
                  <input
                    type="date"
                    {...register('received_date')}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </CardBody>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardBody>
                <textarea
                  {...register('notes')}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  placeholder="Any notes about the delivery..."
                />
              </CardBody>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
