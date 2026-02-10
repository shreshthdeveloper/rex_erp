import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  Package,
  User,
  MapPin,
  Save,
  Warehouse,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { salesAPI, customersAPI, productsAPI, warehousesAPI } from '../../services/api';
import { formatCurrency } from '../../utils/helpers';
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Button,
  SearchableSelect,
  Modal,
} from '../../components/ui';

export default function CreateSalesOrder() {
  const navigate = useNavigate();
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [productSearch, setProductSearch] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      customer_id: '',
      warehouse_id: '',
      order_date: new Date().toISOString().split('T')[0],
      items: [],
      shipping_address: {
        street: '',
        city: '',
        state: '',
        zip_code: '',
        country: '',
      },
      notes: '',
      discount_amount: 0,
      shipping_amount: 0,
      tax_rate: 10,
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });
  
  const items = watch('items');
  const discountAmount = watch('discount_amount') || 0;
  const shippingAmount = watch('shipping_amount') || 0;
  const taxRate = watch('tax_rate') || 0;
  
  // Fetch customers for dropdown
  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersAPI.getAll({ limit: 100 }),
  });

  // Fetch warehouses for dropdown
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => warehousesAPI.getAll({ limit: 100 }),
  });
  
  // Fetch products for search
  const { data: productsData } = useQuery({
    queryKey: ['products', productSearch],
    queryFn: () => productsAPI.getAll({ search: productSearch, limit: 20 }),
    enabled: showProductModal,
  });
  
  const customers = customersData?.data?.customers || [];
  const warehouses = warehousesData?.data?.warehouses || [];
  const products = productsData?.data?.products || [];
  
  const createMutation = useMutation({
    mutationFn: (data) => salesAPI.create(data),
    onSuccess: (response) => {
      toast.success('Order created successfully');
      navigate(`/sales/orders/${response.data.id}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create order');
    },
  });
  
  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const taxAmount = (subtotal - discountAmount) * (taxRate / 100);
  const total = subtotal - discountAmount + taxAmount + Number(shippingAmount);
  
  const handleCustomerSelect = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    setSelectedCustomer(customer);
    setValue('customer_id', customerId);
    
    // Auto-fill shipping address if available
    if (customer?.address) {
      setValue('shipping_address', {
        street: customer.address.street || '',
        city: customer.address.city || '',
        state: customer.address.state || '',
        zip_code: customer.address.zip_code || '',
        country: customer.address.country || '',
      });
    }
  };

  const handleWarehouseSelect = (warehouseId) => {
    const warehouse = warehouses.find(w => w.id === warehouseId);
    setSelectedWarehouse(warehouse);
    setValue('warehouse_id', warehouseId);
  };
  
  const handleAddProduct = (product) => {
    const existingIndex = items.findIndex(item => item.product_id === product.id);
    
    if (existingIndex >= 0) {
      const newQuantity = items[existingIndex].quantity + 1;
      setValue(`items.${existingIndex}.quantity`, newQuantity);
    } else {
      append({
        product_id: product.id,
        product_name: product.name,
        sku: product.sku,
        quantity: 1,
        unit_price: product.selling_price || product.price,
      });
    }
    
    setShowProductModal(false);
    setProductSearch('');
  };
  
  const onSubmit = (data) => {
    if (data.items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }
    
    createMutation.mutate({
      ...data,
      subtotal,
      tax_amount: taxAmount,
      total_amount: total,
    });
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/sales/orders')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Sales Order</h1>
            <p className="text-gray-500 mt-1">Add a new sales order</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => navigate('/sales/orders')}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            loading={createMutation.isLoading}
          >
            <Save className="w-4 h-4 mr-2" />
            Create Order
          </Button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Customer <span className="text-red-500">*</span>
                    </label>
                    <SearchableSelect
                      options={customers.map(c => ({
                        value: c.id,
                        label: c.name,
                        description: c.email,
                      }))}
                      value={watch('customer_id')}
                      onChange={handleCustomerSelect}
                      placeholder="Search customers..."
                    />
                    {errors.customer_id && (
                      <p className="mt-1 text-sm text-red-500">{errors.customer_id.message}</p>
                    )}
                  </div>
                  
                  {selectedCustomer && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{selectedCustomer.name}</p>
                          <p className="text-sm text-gray-500">{selectedCustomer.email}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Warehouse Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Source Warehouse</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Warehouse <span className="text-red-500">*</span>
                    </label>
                    <SearchableSelect
                      options={warehouses.map(w => ({
                        value: w.id,
                        label: w.warehouse_name || w.name,
                        description: w.city || w.address_line1,
                      }))}
                      value={watch('warehouse_id')}
                      onChange={handleWarehouseSelect}
                      placeholder="Search warehouses..."
                    />
                  </div>
                  
                  {selectedWarehouse && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <Warehouse className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{selectedWarehouse.warehouse_name || selectedWarehouse.name}</p>
                          <p className="text-sm text-gray-500">{selectedWarehouse.city}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
            
            {/* Order Items */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Order Items</CardTitle>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowProductModal(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </div>
              </CardHeader>
              <CardBody className="p-0">
                {fields.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No items added</h3>
                    <p className="text-gray-500 mt-1">Add products to this order</p>
                    <Button
                      type="button"
                      variant="primary"
                      className="mt-4"
                      onClick={() => setShowProductModal(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Product
                    </Button>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Product</th>
                        <th className="text-center text-xs font-medium text-gray-500 uppercase px-6 py-3">Qty</th>
                        <th className="text-right text-xs font-medium text-gray-500 uppercase px-6 py-3">Price</th>
                        <th className="text-right text-xs font-medium text-gray-500 uppercase px-6 py-3">Total</th>
                        <th className="px-6 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {fields.map((field, index) => (
                        <tr key={field.id}>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-gray-900">{field.product_name}</p>
                              <p className="text-sm text-gray-500">SKU: {field.sku}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              min="1"
                              {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                              className="w-20 px-3 py-2 text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              {...register(`items.${index}.unit_price`, { valueAsNumber: true })}
                              className="w-28 px-3 py-2 text-right border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-gray-900">
                            {formatCurrency(items[index]?.quantity * items[index]?.unit_price || 0)}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
            
            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                    <input
                      type="text"
                      {...register('shipping_address.street')}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      {...register('shipping_address.city')}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
                    <input
                      type="text"
                      {...register('shipping_address.state')}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="State"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIP/Postal Code</label>
                    <input
                      type="text"
                      {...register('shipping_address.zip_code')}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="12345"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <input
                      type="text"
                      {...register('shipping_address.country')}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Country"
                    />
                  </div>
                </div>
              </CardBody>
            </Card>
            
            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Order Notes</CardTitle>
              </CardHeader>
              <CardBody>
                <textarea
                  {...register('notes')}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  placeholder="Add any notes or special instructions..."
                />
              </CardBody>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Date */}
            <Card>
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
              </CardHeader>
              <CardBody>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order Date</label>
                  <input
                    type="date"
                    {...register('order_date')}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </CardBody>
            </Card>
            
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="text-gray-900">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-gray-500">Discount</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        {...register('discount_amount', { valueAsNumber: true })}
                        className="w-20 px-2 py-1 text-right border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-gray-500">Tax</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        {...register('tax_rate', { valueAsNumber: true })}
                        className="w-16 px-2 py-1 text-right border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <span className="text-gray-500">%</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tax Amount</span>
                    <span className="text-gray-900">{formatCurrency(taxAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-gray-500">Shipping</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        {...register('shipping_amount', { valueAsNumber: true })}
                        className="w-20 px-2 py-1 text-right border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                  <div className="border-t border-gray-100 pt-3">
                    <div className="flex justify-between text-lg font-semibold">
                      <span className="text-gray-900">Total</span>
                      <span className="text-gray-900">{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </form>
      
      {/* Product Search Modal */}
      <Modal
        isOpen={showProductModal}
        onClose={() => {
          setShowProductModal(false);
          setProductSearch('');
        }}
        title="Add Product"
        size="lg"
      >
        <div className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Search products..."
              autoFocus
            />
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {products.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No products found
              </div>
            ) : (
              <div className="space-y-2">
                {products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleAddProduct(product)}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Package className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatCurrency(product.selling_price || product.price)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Stock: {product.stock_quantity || 0}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
