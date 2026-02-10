import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Ruler, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { unitsAPI } from '../../services/api';
import { Card, CardBody, Button, Badge, Modal } from '../../components/ui';

export default function Units() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, unit: null });
  const [unitForm, setUnitForm] = useState({
    unit_name: '',
    short_name: '',
    description: '',
    base_unit_id: '',
    conversion_factor: 1,
    is_active: true,
  });
  
  const { data, isLoading } = useQuery({
    queryKey: ['units', { search }],
    queryFn: () => unitsAPI.getAll({ search, limit: 100 }),
  });
  
  const units = data?.data?.units || [];
  
  const createMutation = useMutation({
    mutationFn: (data) => unitsAPI.create(data),
    onSuccess: () => {
      toast.success('Unit created successfully');
      queryClient.invalidateQueries(['units']);
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create unit');
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => unitsAPI.update(id, data),
    onSuccess: () => {
      toast.success('Unit updated successfully');
      queryClient.invalidateQueries(['units']);
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update unit');
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: (id) => unitsAPI.delete(id),
    onSuccess: () => {
      toast.success('Unit deleted successfully');
      queryClient.invalidateQueries(['units']);
      setDeleteModal({ open: false, unit: null });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete unit');
    },
  });
  
  const openCreateModal = () => {
    setEditingUnit(null);
    setUnitForm({
      unit_name: '',
      short_name: '',
      description: '',
      base_unit_id: '',
      conversion_factor: 1,
      is_active: true,
    });
    setModalOpen(true);
  };
  
  const openEditModal = (unit) => {
    setEditingUnit(unit);
    setUnitForm({
      unit_name: unit.name || '',
      short_name: unit.short_name || '',
      description: unit.description || '',
      base_unit_id: unit.base_unit_id || '',
      conversion_factor: unit.conversion_factor || 1,
      is_active: unit.is_active,
    });
    setModalOpen(true);
  };
  
  const closeModal = () => {
    setModalOpen(false);
    setEditingUnit(null);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!unitForm.unit_name.trim()) {
      toast.error('Unit name is required');
      return;
    }
    if (!unitForm.short_name.trim()) {
      toast.error('Short name is required');
      return;
    }
    
    const submitData = {
      unit_name: unitForm.unit_name,
      short_name: unitForm.short_name,
      description: unitForm.description || undefined,
      base_unit_id: unitForm.base_unit_id || undefined,
      conversion_factor: unitForm.conversion_factor || 1,
      is_active: unitForm.is_active,
    };
    
    if (editingUnit) {
      updateMutation.mutate({ id: editingUnit.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };
  
  const activeUnits = units.filter(u => u.is_active);
  // Filter out units that have a base_unit (these are derived units)
  const baseUnits = units.filter(u => !u.base_unit_id);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Units of Measurement</h1>
          <p className="text-gray-500 mt-1">Manage product units</p>
        </div>
        <Button variant="primary" onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" />
          Add Unit
        </Button>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Ruler className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{units.length}</p>
                <p className="text-sm text-gray-500">Total Units</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Ruler className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{activeUnits.length}</p>
                <p className="text-sm text-gray-500">Active Units</p>
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
              placeholder="Search units..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </CardBody>
      </Card>
      
      {/* Units Table */}
      <Card>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-4">
                  <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : units.length === 0 ? (
            <div className="text-center py-12">
              <Ruler className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No units found</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first unit</p>
              <Button variant="primary" onClick={openCreateModal}>
                <Plus className="w-4 h-4 mr-2" />
                Add Unit
              </Button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-6 font-medium text-gray-500">Unit Name</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-500">Short Name</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-500">Base Unit</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-500">Conversion</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-500">Status</th>
                  <th className="text-right py-4 px-6 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {units.map((unit) => (
                  <tr key={unit.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <Ruler className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{unit.name}</p>
                          {unit.description && (
                            <p className="text-sm text-gray-500 truncate max-w-xs">{unit.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant="secondary">{unit.short_name}</Badge>
                    </td>
                    <td className="py-4 px-6">
                      {unit.base_unit ? (
                        <span className="text-gray-900">{unit.base_unit.name} ({unit.base_unit.short_name})</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {unit.base_unit_id ? (
                        <span className="text-gray-900">1 {unit.short_name} = {unit.conversion_factor} {unit.base_unit?.short_name}</span>
                      ) : (
                        <span className="text-gray-400">Base unit</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant={unit.is_active ? 'success' : 'secondary'}>
                        {unit.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(unit)}
                          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteModal({ open: true, unit })}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
      
      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title={editingUnit ? 'Edit Unit' : 'Add Unit'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={unitForm.unit_name}
                onChange={(e) => setUnitForm(prev => ({ ...prev, unit_name: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., Kilogram"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Short Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={unitForm.short_name}
                onChange={(e) => setUnitForm(prev => ({ ...prev, short_name: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., kg"
                maxLength={10}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={unitForm.description}
              onChange={(e) => setUnitForm(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Optional description"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base Unit (for conversion)</label>
              <select
                value={unitForm.base_unit_id}
                onChange={(e) => setUnitForm(prev => ({ ...prev, base_unit_id: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">None (this is a base unit)</option>
                {baseUnits.filter(u => u.id !== editingUnit?.id).map(unit => (
                  <option key={unit.id} value={unit.id}>{unit.name} ({unit.short_name})</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Conversion Factor</label>
              <input
                type="number"
                step="0.000001"
                min="0"
                value={unitForm.conversion_factor}
                onChange={(e) => setUnitForm(prev => ({ ...prev, conversion_factor: parseFloat(e.target.value) || 1 }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="1"
                disabled={!unitForm.base_unit_id}
              />
              <p className="text-xs text-gray-500 mt-1">
                {unitForm.base_unit_id ? 'How many base units equal this unit' : 'Select a base unit first'}
              </p>
            </div>
          </div>
          
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={unitForm.is_active}
              onChange={(e) => setUnitForm(prev => ({ ...prev, is_active: e.target.checked }))}
              className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500"
            />
            <span className="text-gray-700">Active unit</span>
          </label>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" variant="primary" loading={createMutation.isLoading || updateMutation.isLoading}>
              {editingUnit ? 'Update' : 'Create'} Unit
            </Button>
          </div>
        </form>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, unit: null })}
        title="Delete Unit"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <span className="font-semibold">{deleteModal.unit?.name}</span>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setDeleteModal({ open: false, unit: null })}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteMutation.mutate(deleteModal.unit?.id)}
              loading={deleteMutation.isLoading}
            >
              Delete Unit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
