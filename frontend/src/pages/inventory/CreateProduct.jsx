import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Save, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { productsAPI, categoriesAPI, suppliersAPI } from '../../services/api';
import { Card, CardHeader, CardTitle, CardBody, Button } from '../../components/ui';

export default function CreateProduct() {
  const navigate = useNavigate();
  const [imagePreview, setImagePreview] = useState(null);
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      sku: '',
      description: '',
      category_id: '',
      supplier_id: '',
      product_type: 'SINGLE',
      cost_price: 0,
      selling_price: 0,
      stock_quantity: 0,
      reorder_level: 10,
      reorder_quantity: 20,
      unit: 'Each',
      brand: '',
      barcode: '',
      hsn_code: '',
      is_active: true,
    },
  });
  
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.getAll({ limit: 100, flat: true }),
  });
  
  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => suppliersAPI.getAll({ limit: 100 }),
  });
  
  const categories = categoriesData?.data?.data?.categories || categoriesData?.data?.categories || [];
  const suppliers = suppliersData?.data?.data?.suppliers || suppliersData?.data?.suppliers || [];
  
  const createMutation = useMutation({
    mutationFn: (data) => productsAPI.create(data),
    onSuccess: (response) => {
      toast.success('Product created successfully');
      navigate(`/inventory/products/${response.data.id}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create product');
    },
  });
  
  const onSubmit = (data) => {
    const submitData = {
      product_name: data.name,
      sku: data.sku,
      description: data.description,
      category_id: data.category_id || null,
      product_type: data.product_type,
      cost_price: parseFloat(data.cost_price) || 0,
      selling_price: parseFloat(data.selling_price) || 0,
      reorder_level: parseInt(data.reorder_level) || 10,
      hsn_code: data.hsn_code || null,
      is_active: data.is_active,
    };
    createMutation.mutate(submitData);
  };
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setValue('image_url', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/inventory/products')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
            <p className="text-gray-500 mt-1">Create a new product in your inventory</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => navigate('/inventory/products')}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={createMutation.isLoading}>
            <Save className="w-4 h-4 mr-2" />
            Save Product
          </Button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Type <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          {...register('product_type')}
                          value="SINGLE"
                          className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-gray-700">Single Product</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          {...register('product_type')}
                          value="VARIANT"
                          className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-gray-700">Product with Variants</span>
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Choose "Product with Variants" if this product has multiple options (e.g., size, color)
                    </p>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('name', { required: 'Product name is required' })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter product name"
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SKU <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('sku', { required: 'SKU is required' })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., PROD-001"
                    />
                    {errors.sku && <p className="mt-1 text-sm text-red-500">{errors.sku.message}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                    <input
                      type="text"
                      {...register('barcode')}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter barcode"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      {...register('description')}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                      placeholder="Enter product description"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      {...register('category_id')}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select category</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.category_name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">HSN Code</label>
                    <input
                      type="text"
                      {...register('hsn_code')}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter HSN code"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                    <input
                      type="text"
                      {...register('brand')}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter brand name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <select
                      {...register('unit')}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="Each">Each</option>
                      <option value="Box">Box</option>
                      <option value="Pack">Pack</option>
                      <option value="Kg">Kilogram (Kg)</option>
                      <option value="Liter">Liter</option>
                      <option value="Meter">Meter</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                    <select
                      {...register('supplier_id')}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select supplier</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.company_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardBody>
            </Card>
            
            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cost Price <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        step="0.01"
                        {...register('cost_price', { required: 'Cost price is required', valueAsNumber: true })}
                        className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Selling Price <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        step="0.01"
                        {...register('selling_price', { required: 'Selling price is required', valueAsNumber: true })}
                        className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
            
            {/* Stock Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Stock Settings</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock</label>
                    <input
                      type="number"
                      {...register('stock_quantity', { valueAsNumber: true })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                    <input
                      type="number"
                      {...register('reorder_level', { valueAsNumber: true })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="10"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Quantity</label>
                    <input
                      type="number"
                      {...register('reorder_quantity', { valueAsNumber: true })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="20"
                    />
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Product Image */}
            <Card>
              <CardHeader>
                <CardTitle>Product Image</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={() => { setImagePreview(null); setValue('image_url', ''); }}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-primary-300 hover:bg-primary-50 transition-colors">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">Click to upload image</span>
                      <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </CardBody>
            </Card>
            
            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardBody>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('is_active')}
                    className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Active Product</p>
                    <p className="text-sm text-gray-500">Product will be visible in catalog</p>
                  </div>
                </label>
              </CardBody>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
