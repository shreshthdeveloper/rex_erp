import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Save, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { suppliersAPI, countriesAPI } from '../../services/api';
import { Card, CardHeader, CardTitle, CardBody, Button, SearchableSelect } from '../../components/ui';

export default function CreateSupplier() {
  const navigate = useNavigate();
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      company_name: '',
      contact_person: '',
      email: '',
      phone: '',
      tax_id: '',
      address_line1: '',
      city: '',
      state_id: '',
      postal_code: '',
      country_id: '',
      payment_terms: 'NET_30',
      is_active: true,
    },
  });
  
  const { data: countriesData } = useQuery({
    queryKey: ['countries'],
    queryFn: () => countriesAPI.getAll(),
  });
  
  const countries = countriesData?.data?.countries || [];
  
  const createMutation = useMutation({
    mutationFn: (data) => suppliersAPI.create(data),
    onSuccess: (response) => {
      toast.success('Supplier created successfully');
      navigate(`/suppliers/${response.data.id || response.data.supplier?.id}`);
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.errors?.[0]?.msg || error.response?.data?.message || 'Failed to create supplier';
      toast.error(errorMsg);
    },
  });
  
  const onSubmit = (data) => {
    // Validate required fields
    if (!data.company_name.trim()) {
      toast.error('Company name is required');
      return;
    }
    if (!data.email.trim()) {
      toast.error('Email is required');
      return;
    }
    if (!data.country_id) {
      toast.error('Country is required');
      return;
    }
    
    const submitData = {
      company_name: data.company_name,
      contact_person: data.contact_person || undefined,
      email: data.email,
      phone: data.phone || undefined,
      tax_id: data.tax_id || undefined,
      address_line1: data.address_line1 || undefined,
      city: data.city || undefined,
      state_id: data.state_id ? parseInt(data.state_id) : undefined,
      country_id: parseInt(data.country_id),
      postal_code: data.postal_code || undefined,
      payment_terms: data.payment_terms || 'NET_30',
      is_active: data.is_active,
    };
    createMutation.mutate(submitData);
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/suppliers')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Supplier</h1>
            <p className="text-gray-500 mt-1">Create a new supplier record</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => navigate('/suppliers')}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={createMutation.isLoading}>
            <Save className="w-4 h-4 mr-2" />
            Save Supplier
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
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('company_name', { required: 'Company name is required' })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter company name"
                    />
                    {errors.company_name && <p className="mt-1 text-sm text-red-500">{errors.company_name.message}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                    <input
                      type="text"
                      {...register('contact_person')}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Primary contact name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID</label>
                    <input
                      type="text"
                      {...register('tax_id')}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Tax identification number"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      {...register('email', {
                        required: 'Email is required',
                        pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
                      })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="supplier@example.com"
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="text"
                      {...register('phone')}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>
              </CardBody>
            </Card>
            
            {/* Address */}
            <Card>
              <CardHeader>
                <CardTitle>Address</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                    <input
                      type="text"
                      {...register('address_line1')}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter street address"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      {...register('city')}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter city"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State / Province ID</label>
                    <input
                      type="number"
                      {...register('state_id')}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter state ID"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                    <input
                      type="text"
                      {...register('postal_code')}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter postal code"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <SearchableSelect
                      options={countries.map(c => ({
                        value: c.id,
                        label: c.name,
                        description: c.code,
                      }))}
                      value={watch('country_id')}
                      onChange={(val) => setValue('country_id', val)}
                      placeholder="Select country..."
                    />
                  </div>
                </div>
              </CardBody>
            </Card>
            
            {/* Payment Terms */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Terms</CardTitle>
              </CardHeader>
              <CardBody>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Terms <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('payment_terms')}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="IMMEDIATE">Immediate</option>
                    <option value="NET_30">Net 30</option>
                    <option value="NET_60">Net 60</option>
                    <option value="NET_90">Net 90</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                </div>
              </CardBody>
            </Card>
            
            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Notes</CardTitle>
              </CardHeader>
              <CardBody>
                <textarea
                  {...register('notes')}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  placeholder="Any additional notes about this supplier..."
                />
              </CardBody>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Icon Preview */}
            <Card>
              <CardBody>
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                    <Building2 className="w-12 h-12 text-purple-600" />
                  </div>
                  <p className="text-sm text-gray-500">Supplier icon</p>
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
                    <p className="font-medium text-gray-900">Active Supplier</p>
                    <p className="text-sm text-gray-500">Available for purchase orders</p>
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
