import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Save, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { customersAPI, countriesAPI } from '../../services/api';
import { Card, CardHeader, CardTitle, CardBody, Button, SearchableSelect } from '../../components/ui';

export default function CreateCustomer() {
  const navigate = useNavigate();
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      company_name: '',
      contact_person: '',
      email: '',
      phone: '',
      tax_id: '',
      billing_address_line1: '',
      billing_city: '',
      billing_state_id: '',
      billing_country_id: '',
      postal_code: '',
      notes: '',
      credit_limit: 0,
      is_active: true,
    },
  });
  
  const { data: countriesData } = useQuery({
    queryKey: ['countries'],
    queryFn: () => countriesAPI.getAll({ limit: 300 }),
  });
  
  const countries = countriesData?.data?.countries || countriesData?.data || [];
  
  const createMutation = useMutation({
    mutationFn: (data) => customersAPI.create(data),
    onSuccess: (response) => {
      toast.success('Customer created successfully');
      navigate(`/customers/${response.data.id}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create customer');
    },
  });
  
  const onSubmit = (data) => {
    if (!data.company_name?.trim()) {
      toast.error('Company name is required');
      return;
    }
    if (!data.email?.trim()) {
      toast.error('Email is required');
      return;
    }
    if (!data.billing_country_id) {
      toast.error('Billing country is required');
      return;
    }
    
    const submitData = {
      company_name: data.company_name,
      contact_person: data.contact_person || undefined,
      email: data.email,
      phone: data.phone || undefined,
      tax_id: data.tax_id || undefined,
      billing_address_line1: data.billing_address_line1 || undefined,
      billing_city: data.billing_city || undefined,
      billing_state_id: data.billing_state_id ? parseInt(data.billing_state_id, 10) : undefined,
      billing_country_id: parseInt(data.billing_country_id, 10),
      postal_code: data.postal_code || undefined,
      notes: data.notes || undefined,
      credit_limit: data.credit_limit || 0,
      is_active: data.is_active,
    };
    createMutation.mutate(submitData);
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/customers')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Customer</h1>
            <p className="text-gray-500 mt-1">Create a new customer record</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => navigate('/customers')}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={createMutation.isLoading}>
            <Save className="w-4 h-4 mr-2" />
            Save Customer
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
                      placeholder="customer@example.com"
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
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                    <input
                      type="text"
                      {...register('contact_person')}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Contact person name"
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
                </div>
              </CardBody>
            </Card>
            
            {/* Address */}
            <Card>
              <CardHeader>
                <CardTitle>Billing Address</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                    <input
                      type="text"
                      {...register('billing_address_line1')}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter street address"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      {...register('billing_city')}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter city"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State / Province</label>
                    <input
                      type="text"
                      {...register('billing_state_id')}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter state ID or leave blank"
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
                      value={watch('billing_country_id')}
                      onChange={(val) => setValue('billing_country_id', val)}
                      placeholder="Select billing country..."
                    />
                  </div>
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
                  placeholder="Any additional notes about this customer..."
                />
              </CardBody>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Avatar Preview */}
            <Card>
              <CardBody>
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                    <User className="w-12 h-12 text-primary-600" />
                  </div>
                  <p className="text-sm text-gray-500">Customer avatar will be generated from name</p>
                </div>
              </CardBody>
            </Card>
            
            {/* Credit Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Credit Settings</CardTitle>
              </CardHeader>
              <CardBody className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Credit Limit</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      {...register('credit_limit', { valueAsNumber: true })}
                      className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="0.00"
                    />
                  </div>
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
                    <p className="font-medium text-gray-900">Active Customer</p>
                    <p className="text-sm text-gray-500">Customer can place orders</p>
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
