import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, FolderTree, Package, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { categoriesAPI } from '../../services/api';
import { Card, CardBody, Button, Badge, Modal, TableSkeleton } from '../../components/ui';

export default function Categories() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ category_name: '', description: '', parent_id: '' });
  const [deleteModal, setDeleteModal] = useState({ open: false, category: null });
  
  const { data, isLoading } = useQuery({
    queryKey: ['categories', { search }],
    queryFn: () => categoriesAPI.getAll({ search, limit: 100, flat: true }),
  });
  
  const categories = data?.data?.data?.categories || data?.data?.categories || [];
  
  const createMutation = useMutation({
    mutationFn: (data) => categoriesAPI.create(data),
    onSuccess: () => {
      toast.success('Category created successfully');
      queryClient.invalidateQueries(['categories']);
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create category');
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => categoriesAPI.update(id, data),
    onSuccess: () => {
      toast.success('Category updated successfully');
      queryClient.invalidateQueries(['categories']);
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update category');
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: (id) => categoriesAPI.delete(id),
    onSuccess: () => {
      toast.success('Category deleted successfully');
      queryClient.invalidateQueries(['categories']);
      setDeleteModal({ open: false, category: null });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete category');
    },
  });
  
  const openCreateModal = () => {
    setEditingCategory(null);
    setCategoryForm({ category_name: '', description: '', parent_id: '' });
    setModalOpen(true);
  };
  
  const openEditModal = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      category_name: category.category_name,
      description: category.description || '',
      parent_id: category.parent_id || '',
    });
    setModalOpen(true);
  };
  
  const closeModal = () => {
    setModalOpen(false);
    setEditingCategory(null);
    setCategoryForm({ category_name: '', description: '', parent_id: '' });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!categoryForm.category_name.trim()) {
      toast.error('Category name is required');
      return;
    }
    
    const submitData = {
      category_name: categoryForm.category_name,
      description: categoryForm.description || null,
      parent_id: categoryForm.parent_id || null,
    };
    
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };
  
  const parentCategories = categories.filter(c => !c.parent_id);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-500 mt-1">Manage product categories</p>
        </div>
        <Button variant="primary" onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FolderTree className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
                <p className="text-sm text-gray-500">Total Categories</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <FolderTree className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{parentCategories.length}</p>
                <p className="text-sm text-gray-500">Parent Categories</p>
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
                <p className="text-2xl font-bold text-gray-900">
                  {categories.reduce((sum, c) => sum + (c.product_count || 0), 0)}
                </p>
                <p className="text-sm text-gray-500">Total Products</p>
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
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </CardBody>
      </Card>
      
      {/* Categories Table */}
      <Card>
        <CardBody className="p-0">
          {isLoading ? (
            <TableSkeleton rows={8} columns={5} />
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <FolderTree className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first category</p>
              <Button variant="primary" onClick={openCreateModal}>
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Name</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Description</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Parent</th>
                  <th className="text-center py-4 px-6 text-sm font-medium text-gray-500">Products</th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => {
                  const parent = categories.find(c => c.id === category.parent_id);
                  return (
                    <tr key={category.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                            <FolderTree className="w-5 h-5 text-primary-600" />
                          </div>
                          <span className="font-medium text-gray-900">{category.category_name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-gray-500 truncate max-w-xs block">
                          {category.description || '-'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {parent ? (
                          <Badge variant="secondary">{parent.category_name}</Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <Badge variant="primary">{category.product_count || 0}</Badge>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(category)}
                            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteModal({ open: true, category })}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
      
      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title={editingCategory ? 'Edit Category' : 'Add Category'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={categoryForm.category_name}
              onChange={(e) => setCategoryForm(prev => ({ ...prev, category_name: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter category name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={categoryForm.description}
              onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              placeholder="Enter category description"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
            <select
              value={categoryForm.parent_id}
              onChange={(e) => setCategoryForm(prev => ({ ...prev, parent_id: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">None (Top Level)</option>
              {parentCategories.filter(c => c.id !== editingCategory?.id).map(category => (
                <option key={category.id} value={category.id}>{category.category_name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" variant="primary" loading={createMutation.isLoading || updateMutation.isLoading}>
              {editingCategory ? 'Update' : 'Create'} Category
            </Button>
          </div>
        </form>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, category: null })}
        title="Delete Category"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <span className="font-semibold">{deleteModal.category?.category_name}</span>?
            This action cannot be undone.
          </p>
          {deleteModal.category?.product_count > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                This category has {deleteModal.category.product_count} products. You may need to reassign them first.
              </p>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setDeleteModal({ open: false, category: null })}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteMutation.mutate(deleteModal.category?.id)}
              loading={deleteMutation.isLoading}
            >
              Delete Category
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
