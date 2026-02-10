import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Warehouse, MapPin, Package, Eye, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { warehousesAPI } from '../../services/api';
import { Card, CardBody, Button, Badge, Modal, TableSkeleton } from '../../components/ui';

export default function Warehouses() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, warehouse: null });
  const [warehouseForm, setWarehouseForm] = useState({
    warehouse_name: '',
    warehouse_code: '',
    address_line1: '',
    city: '',
    state: '',
    country_id: '',
    postal_code: '',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    is_active: true,
  });
  
  const { data, isLoading } = useQuery({
    queryKey: ['warehouses', { search }],
    queryFn: () => warehousesAPI.getAll({ search, limit: 100 }),
  });
  
  const warehouses = data?.data?.warehouses || [];
  
  const createMutation = useMutation({
    mutationFn: (data) => warehousesAPI.create(data),
    onSuccess: () => {
      toast.success('Warehouse created successfully');
      queryClient.invalidateQueries(['warehouses']);
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create warehouse');
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => warehousesAPI.update(id, data),
    onSuccess: () => {
      toast.success('Warehouse updated successfully');
      queryClient.invalidateQueries(['warehouses']);
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update warehouse');
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: (id) => warehousesAPI.delete(id),
    onSuccess: () => {
      toast.success('Warehouse deleted successfully');
      queryClient.invalidateQueries(['warehouses']);
      setDeleteModal({ open: false, warehouse: null });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete warehouse');
    },
  });
  
  const openCreateModal = () => {
    setEditingWarehouse(null);
    setWarehouseForm({
      warehouse_name: '',
      warehouse_code: '',
      address_line1: '',
      city: '',
      state: '',
      country_id: '',
      postal_code: '',
      contact_person: '',
      contact_phone: '',
      contact_email: '',
      is_active: true,
    });
    setModalOpen(true);
  };
  
  const openEditModal = (warehouse) => {
    setEditingWarehouse(warehouse);
    setWarehouseForm({
      warehouse_name: warehouse.warehouse_name || warehouse.name || '',
      warehouse_code: warehouse.warehouse_code || warehouse.code || '',
      address_line1: warehouse.address_line1 || warehouse.address || '',
      city: warehouse.city || '',
      state: warehouse.state_id || warehouse.stateId || '',
      country_id: warehouse.country_id || warehouse.countryId || '',
      postal_code: warehouse.postal_code || warehouse.pincode || '',
      contact_person: warehouse.contact_person || warehouse.contactPerson || '',
      contact_phone: warehouse.phone || warehouse.contactPhone || '',
      contact_email: warehouse.email || warehouse.contactEmail || '',
      is_active: warehouse.is_active !== undefined ? warehouse.is_active : warehouse.isActive !== undefined ? warehouse.isActive : true,
    });
    setModalOpen(true);
  };
  
  const closeModal = () => {
    setModalOpen(false);
    setEditingWarehouse(null);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!warehouseForm.warehouse_name.trim()) {
      toast.error('Warehouse name is required');
      return;
    }
    if (!warehouseForm.address_line1.trim()) {
      toast.error('Address is required');
      return;
    }
    if (!warehouseForm.city.trim()) {
      toast.error('City is required');
      return;
    }
    
    // Map frontend fields to backend expected fields
    const submitData = {
      name: warehouseForm.warehouse_name,
      address: warehouseForm.address_line1,
      city: warehouseForm.city,
      stateId: warehouseForm.state ? parseInt(warehouseForm.state, 10) : undefined,
      countryId: warehouseForm.country_id ? parseInt(warehouseForm.country_id, 10) : 1,
      pincode: warehouseForm.postal_code || undefined,
      contactPerson: warehouseForm.contact_person || undefined,
      contactPhone: warehouseForm.contact_phone || undefined,
      contactEmail: warehouseForm.contact_email || undefined,
      isActive: warehouseForm.is_active,
    };
    
    if (editingWarehouse) {
      updateMutation.mutate({ id: editingWarehouse.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };
  
  const activeWarehouses = warehouses.filter(w => w.is_active);
  const totalStock = warehouses.reduce((sum, w) => sum + (w.total_stock || 0), 0);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Warehouses</h1>
          <p className="text-gray-500 mt-1">Manage warehouse locations</p>
        </div>
        <Button variant="primary" onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" />
          Add Warehouse
        </Button>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Warehouse className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{warehouses.length}</p>
                <p className="text-sm text-gray-500">Total Warehouses</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Warehouse className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{activeWarehouses.length}</p>
                <p className="text-sm text-gray-500">Active Warehouses</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalStock.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Total Stock Units</p>
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
              placeholder="Search warehouses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </CardBody>
      </Card>
      
      {/* Warehouses Grid */}
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
      ) : warehouses.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <Warehouse className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No warehouses found</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first warehouse</p>
              <Button variant="primary" onClick={openCreateModal}>
                <Plus className="w-4 h-4 mr-2" />
                Add Warehouse
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {warehouses.map((warehouse) => (
            <Card key={warehouse.id} className="hover:shadow-lg transition-shadow">
              <CardBody>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                    <Warehouse className="w-6 h-6 text-primary-600" />
                  </div>
                  <Badge variant={warehouse.is_active ? 'success' : 'secondary'}>
                    {warehouse.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{warehouse.warehouse_name}</h3>
                {warehouse.warehouse_code && (
                  <p className="text-sm text-gray-500 mb-3">Code: {warehouse.warehouse_code}</p>
                )}
                
                {(warehouse.address_line1 || warehouse.city) && (
                  <div className="flex items-start gap-2 text-gray-500 text-sm mb-4">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>
                      {[warehouse.address_line1, warehouse.city, warehouse.State?.name].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-sm text-gray-500">Stock Units</p>
                    <p className="text-lg font-semibold text-gray-900">{(warehouse.total_stock || 0).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/inventory/warehouses/${warehouse.id}`}
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => openEditModal(warehouse)}
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteModal({ open: true, warehouse })}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
      
      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title={editingWarehouse ? 'Edit Warehouse' : 'Add Warehouse'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Warehouse Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={warehouseForm.warehouse_name}
                onChange={(e) => setWarehouseForm(prev => ({ ...prev, warehouse_name: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter warehouse name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
              <input
                type="text"
                value={warehouseForm.warehouse_code}
                onChange={(e) => setWarehouseForm(prev => ({ ...prev, warehouse_code: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., WH-001"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={warehouseForm.address_line1}
              onChange={(e) => setWarehouseForm(prev => ({ ...prev, address_line1: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter street address"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={warehouseForm.city}
                onChange={(e) => setWarehouseForm(prev => ({ ...prev, city: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter city"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                value={warehouseForm.state}
                onChange={(e) => setWarehouseForm(prev => ({ ...prev, state: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter state"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input
                type="text"
                value={warehouseForm.country_id}
                onChange={(e) => setWarehouseForm(prev => ({ ...prev, country_id: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter country"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
              <input
                type="text"
                value={warehouseForm.postal_code}
                onChange={(e) => setWarehouseForm(prev => ({ ...prev, postal_code: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter postal code"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="text"
              value={warehouseForm.phone}
              onChange={(e) => setWarehouseForm(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter phone number"
            />
          </div>
          
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={warehouseForm.is_active}
              onChange={(e) => setWarehouseForm(prev => ({ ...prev, is_active: e.target.checked }))}
              className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500"
            />
            <span className="text-gray-700">Active warehouse</span>
          </label>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" variant="primary" loading={createMutation.isLoading || updateMutation.isLoading}>
              {editingWarehouse ? 'Update' : 'Create'} Warehouse
            </Button>
          </div>
        </form>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, warehouse: null })}
        title="Delete Warehouse"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <span className="font-semibold">{deleteModal.warehouse?.warehouse_name}</span>?
            This action cannot be undone.
          </p>
          {deleteModal.warehouse?.total_stock > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                This warehouse has {deleteModal.warehouse.total_stock} stock units. You may need to transfer them first.
              </p>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setDeleteModal({ open: false, warehouse: null })}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteMutation.mutate(deleteModal.warehouse?.id)}
              loading={deleteMutation.isLoading}
            >
              Delete Warehouse
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
