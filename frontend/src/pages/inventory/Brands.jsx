import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Tag, Search, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import { brandsAPI } from '../../services/api';
import { Card, CardBody, Button, Badge, Modal } from '../../components/ui';

export default function Brands() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, brand: null });
  const [brandForm, setBrandForm] = useState({
    brand_name: '',
    description: '',
    logo_url: '',
    website: '',
    is_active: true,
  });
  
  const { data, isLoading } = useQuery({
    queryKey: ['brands', { search }],
    queryFn: () => brandsAPI.getAll({ search, limit: 100 }),
  });
  
  const brands = data?.data?.brands || [];
  
  const createMutation = useMutation({
    mutationFn: (data) => brandsAPI.create(data),
    onSuccess: () => {
      toast.success('Brand created successfully');
      queryClient.invalidateQueries(['brands']);
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create brand');
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => brandsAPI.update(id, data),
    onSuccess: () => {
      toast.success('Brand updated successfully');
      queryClient.invalidateQueries(['brands']);
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update brand');
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: (id) => brandsAPI.delete(id),
    onSuccess: () => {
      toast.success('Brand deleted successfully');
      queryClient.invalidateQueries(['brands']);
      setDeleteModal({ open: false, brand: null });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete brand');
    },
  });
  
  const openCreateModal = () => {
    setEditingBrand(null);
    setBrandForm({
      brand_name: '',
      description: '',
      logo_url: '',
      website: '',
      is_active: true,
    });
    setModalOpen(true);
  };
  
  const openEditModal = (brand) => {
    setEditingBrand(brand);
    setBrandForm({
      brand_name: brand.name || '',
      description: brand.description || '',
      logo_url: brand.logo_url || '',
      website: brand.website || '',
      is_active: brand.is_active,
    });
    setModalOpen(true);
  };
  
  const closeModal = () => {
    setModalOpen(false);
    setEditingBrand(null);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!brandForm.brand_name.trim()) {
      toast.error('Brand name is required');
      return;
    }
    
    const submitData = {
      brand_name: brandForm.brand_name,
      description: brandForm.description || undefined,
      logo_url: brandForm.logo_url || undefined,
      website: brandForm.website || undefined,
      is_active: brandForm.is_active,
    };
    
    if (editingBrand) {
      updateMutation.mutate({ id: editingBrand.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };
  
  const activeBrands = brands.filter(b => b.is_active);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Brands</h1>
          <p className="text-gray-500 mt-1">Manage product brands</p>
        </div>
        <Button variant="primary" onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" />
          Add Brand
        </Button>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Tag className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{brands.length}</p>
                <p className="text-sm text-gray-500">Total Brands</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Tag className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{activeBrands.length}</p>
                <p className="text-sm text-gray-500">Active Brands</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
      
      {/* Search */}
      <Card>
        <CardBody>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search brands..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </CardBody>
      </Card>
      
      {/* Brands Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardBody>
                <div className="animate-pulse space-y-4">
                  <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : brands.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No brands found</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first brand</p>
              <Button variant="primary" onClick={openCreateModal}>
                <Plus className="w-4 h-4 mr-2" />
                Add Brand
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brands.map((brand) => (
            <Card key={brand.id} className="hover:shadow-lg transition-shadow">
              <CardBody>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                    {brand.logo_url ? (
                      <img src={brand.logo_url} alt={brand.name} className="w-8 h-8 object-contain" />
                    ) : (
                      <Tag className="w-6 h-6 text-primary-600" />
                    )}
                  </div>
                  <Badge variant={brand.is_active ? 'success' : 'secondary'}>
                    {brand.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{brand.name}</h3>
                {brand.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{brand.description}</p>
                )}
                
                {brand.website && (
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                    <Globe className="w-4 h-4 shrink-0" />
                    <a href={brand.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary-600 truncate">
                      {brand.website}
                    </a>
                  </div>
                )}
                
                <div className="flex items-center justify-end pt-4 border-t border-gray-100 gap-2">
                  <button
                    onClick={() => openEditModal(brand)}
                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteModal({ open: true, brand })}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
      
      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title={editingBrand ? 'Edit Brand' : 'Add Brand'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={brandForm.brand_name}
              onChange={(e) => setBrandForm(prev => ({ ...prev, brand_name: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter brand name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={brandForm.description}
              onChange={(e) => setBrandForm(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter brand description"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
            <input
              type="url"
              value={brandForm.logo_url}
              onChange={(e) => setBrandForm(prev => ({ ...prev, logo_url: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="https://example.com/logo.png"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
            <input
              type="url"
              value={brandForm.website}
              onChange={(e) => setBrandForm(prev => ({ ...prev, website: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="https://www.brand.com"
            />
          </div>
          
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={brandForm.is_active}
              onChange={(e) => setBrandForm(prev => ({ ...prev, is_active: e.target.checked }))}
              className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500"
            />
            <span className="text-gray-700">Active brand</span>
          </label>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" variant="primary" loading={createMutation.isLoading || updateMutation.isLoading}>
              {editingBrand ? 'Update' : 'Create'} Brand
            </Button>
          </div>
        </form>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, brand: null })}
        title="Delete Brand"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <span className="font-semibold">{deleteModal.brand?.name}</span>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setDeleteModal({ open: false, brand: null })}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteMutation.mutate(deleteModal.brand?.id)}
              loading={deleteMutation.isLoading}
            >
              Delete Brand
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
