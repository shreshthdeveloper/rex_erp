import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { 
  Plus, Package, Warehouse, Search, Filter, 
  Check, X, Eye, Trash2, AlertCircle, Clock
} from 'lucide-react';
import { inventoryAPI, productsAPI, warehousesAPI } from '../../services/api';
import { 
  Card, CardHeader, CardTitle, CardBody, Badge, Button, Input, 
  Modal, ModalHeader, ModalBody, ModalFooter, TableSkeleton, SearchableSelect 
} from '../../components/ui';
import toast from 'react-hot-toast';

export default function StockAdjustments() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAdjustment, setSelectedAdjustment] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    warehouseId: '',
  });
  const [page, setPage] = useState(1);
  
  const queryClient = useQueryClient();
  
  // Queries
  const { data, isLoading } = useQuery({
    queryKey: ['stockAdjustments', filters, page],
    queryFn: () => inventoryAPI.getAdjustments({ ...filters, page, limit: 20 }),
  });
  
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses-list'],
    queryFn: () => warehousesAPI.getAll({ limit: 100 }),
  });
  
  const { data: productsData } = useQuery({
    queryKey: ['products-list'],
    queryFn: () => productsAPI.getAll({ limit: 500 }),
  });
  
  const adjustments = data?.data?.adjustments || [];
  const totalPages = data?.data?.pagination?.totalPages || 1;
  const warehouses = warehousesData?.data?.warehouses || [];
  const products = productsData?.data?.products || [];
  
  // Mutations
  const createMutation = useMutation({
    mutationFn: inventoryAPI.createAdjustment,
    onSuccess: () => {
      queryClient.invalidateQueries(['stockAdjustments']);
      queryClient.invalidateQueries(['stockMovements']);
      setShowCreateModal(false);
      toast.success('Stock adjustment created');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create adjustment'),
  });
  
  const approveMutation = useMutation({
    mutationFn: (id) => inventoryAPI.approveAdjustment(id, {}),
    onSuccess: () => {
      queryClient.invalidateQueries(['stockAdjustments']);
      queryClient.invalidateQueries(['stockMovements']);
      toast.success('Adjustment approved');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to approve'),
  });
  
  const rejectMutation = useMutation({
    mutationFn: (id) => inventoryAPI.rejectAdjustment(id, {}),
    onSuccess: () => {
      queryClient.invalidateQueries(['stockAdjustments']);
      toast.success('Adjustment rejected');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to reject'),
  });
  
  const getStatusBadge = (status) => {
    const statuses = {
      pending: { color: 'warning', label: 'Pending' },
      approved: { color: 'success', label: 'Approved' },
      rejected: { color: 'danger', label: 'Rejected' },
    };
    return statuses[status] || { color: 'secondary', label: status };
  };
  
  const handleViewDetail = (adjustment) => {
    setSelectedAdjustment(adjustment);
    setShowDetailModal(true);
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Adjustments</h1>
          <p className="text-gray-500 mt-1">Adjust stock levels for products</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Adjustment
        </Button>
      </div>
      
      {/* Filters */}
      <Card>
        <CardBody>
          <div className="flex flex-wrap gap-4">
            <select
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            
            <select
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={filters.warehouseId}
              onChange={(e) => setFilters({ ...filters, warehouseId: e.target.value })}
            >
              <option value="">All Warehouses</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.warehouse_name || w.name}</option>
              ))}
            </select>
          </div>
        </CardBody>
      </Card>
      
      {/* Adjustments Table */}
      <Card>
        <CardBody className="p-0">
          {isLoading ? (
            <TableSkeleton rows={5} columns={6} />
          ) : adjustments.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No stock adjustments found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warehouse</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {adjustments.map((adj) => {
                    const status = getStatusBadge(adj.status);
                    return (
                      <tr key={adj.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">#{adj.id}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {adj.Warehouse?.warehouse_name || adj.warehouse?.name || `Warehouse #${adj.warehouse_id}`}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{adj.reason}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {adj.StockAdjustmentItems?.length || adj.items?.length || 0} items
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={status.color}>{status.label}</Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {adj.created_at ? format(new Date(adj.created_at), 'MMM d, yyyy') : '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleViewDetail(adj)}
                              className="p-1 hover:bg-gray-100 rounded"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4 text-gray-500" />
                            </button>
                            {adj.status === 'pending' && (
                              <>
                                <button 
                                  onClick={() => approveMutation.mutate(adj.id)}
                                  className="p-1 hover:bg-green-100 rounded"
                                  title="Approve"
                                  disabled={approveMutation.isPending}
                                >
                                  <Check className="w-4 h-4 text-green-600" />
                                </button>
                                <button 
                                  onClick={() => rejectMutation.mutate(adj.id)}
                                  className="p-1 hover:bg-red-100 rounded"
                                  title="Reject"
                                  disabled={rejectMutation.isPending}
                                >
                                  <X className="w-4 h-4 text-red-600" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="px-4 py-2 text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <Button 
            variant="outline" 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
      
      {/* Create Modal */}
      <CreateAdjustmentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
        warehouses={warehouses}
        products={products}
      />
      
      {/* Detail Modal */}
      {selectedAdjustment && (
        <AdjustmentDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          adjustment={selectedAdjustment}
          onApprove={() => approveMutation.mutate(selectedAdjustment.id)}
          onReject={() => rejectMutation.mutate(selectedAdjustment.id)}
          isApproving={approveMutation.isPending}
          isRejecting={rejectMutation.isPending}
        />
      )}
    </div>
  );
}

function CreateAdjustmentModal({ isOpen, onClose, onSubmit, isLoading, warehouses, products }) {
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    defaultValues: {
      warehouseId: '',
      reason: '',
      notes: '',
      items: [{ productId: '', adjustedQuantity: '', reason: '' }],
    }
  });
  
  const [items, setItems] = useState([{ productId: '', adjustedQuantity: '', reason: '' }]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  
  const handleWarehouseSelect = (warehouseId) => {
    setValue('warehouseId', warehouseId);
    setSelectedWarehouse(warehouses.find(w => w.id === warehouseId));
  };
  
  const addItem = () => {
    setItems([...items, { productId: '', adjustedQuantity: '', reason: '' }]);
  };
  
  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };
  
  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = field === 'productId' || field === 'adjustedQuantity' 
      ? (value === '' ? '' : parseInt(value, 10)) 
      : value;
    setItems(updated);
  };
  
  const onFormSubmit = (data) => {
    const validItems = items.filter(item => item.productId && item.adjustedQuantity !== '');
    if (validItems.length === 0) {
      toast.error('Please add at least one item');
      return;
    }
    onSubmit({
      warehouseId: parseInt(data.warehouseId, 10),
      reason: data.reason,
      notes: data.notes,
      items: validItems.map(item => ({
        productId: parseInt(item.productId, 10),
        adjustedQuantity: parseInt(item.adjustedQuantity, 10),
        reason: item.reason || '',
      })),
    });
  };
  
  const handleClose = () => {
    reset();
    setItems([{ productId: '', adjustedQuantity: '', reason: '' }]);
    setSelectedWarehouse(null);
    onClose();
  };
  
  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalHeader>
        <h3 className="text-lg font-semibold">Create Stock Adjustment</h3>
      </ModalHeader>
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <ModalBody>
          <div className="space-y-6">
            {/* Warehouse Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Warehouse <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                options={warehouses.map(w => ({
                  value: w.id,
                  label: w.warehouse_name || w.name,
                  description: w.city || w.address_line1,
                }))}
                value={watch('warehouseId')}
                onChange={handleWarehouseSelect}
                placeholder="Select warehouse..."
              />
            </div>
            
            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason <span className="text-red-500">*</span>
              </label>
              <select
                {...register('reason', { required: 'Reason is required' })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select a reason</option>
                <option value="Physical count correction">Physical count correction</option>
                <option value="Damaged goods">Damaged goods</option>
                <option value="Expired items">Expired items</option>
                <option value="Lost/Theft">Lost/Theft</option>
                <option value="Found items">Found items</option>
                <option value="System error correction">System error correction</option>
                <option value="Other">Other</option>
              </select>
              {errors.reason && <p className="text-red-500 text-sm mt-1">{errors.reason.message}</p>}
            </div>
            
            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                {...register('notes')}
                rows={2}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Additional notes..."
              />
            </div>
            
            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Items <span className="text-red-500">*</span>
                </label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </Button>
              </div>
              
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="flex gap-3 items-start p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">Product</label>
                      <select
                        value={item.productId}
                        onChange={(e) => updateItem(index, 'productId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      >
                        <option value="">Select product</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.sku} - {p.product_name || p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-32">
                      <label className="text-xs text-gray-500 mb-1 block">New Qty</label>
                      <input
                        type="number"
                        min="0"
                        value={item.adjustedQuantity}
                        onChange={(e) => updateItem(index, 'adjustedQuantity', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        placeholder="0"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">Item Note</label>
                      <input
                        type="text"
                        value={item.reason}
                        onChange={(e) => updateItem(index, 'reason', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        placeholder="Optional"
                      />
                    </div>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="mt-5 p-2 hover:bg-red-100 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Adjustment'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

function AdjustmentDetailModal({ isOpen, onClose, adjustment, onApprove, onReject, isApproving, isRejecting }) {
  const items = adjustment.StockAdjustmentItems || adjustment.items || [];
  const status = {
    pending: { color: 'warning', label: 'Pending', icon: Clock },
    approved: { color: 'success', label: 'Approved', icon: Check },
    rejected: { color: 'danger', label: 'Rejected', icon: X },
  }[adjustment.status] || { color: 'secondary', label: adjustment.status, icon: AlertCircle };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Adjustment #{adjustment.id}</h3>
          <Badge variant={status.color} className="flex items-center gap-1">
            <status.icon className="w-3 h-3" />
            {status.label}
          </Badge>
        </div>
      </ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          {/* Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-xs text-gray-500">Warehouse</p>
              <p className="font-medium">{adjustment.Warehouse?.warehouse_name || adjustment.warehouse?.name || `#${adjustment.warehouse_id}`}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Date</p>
              <p className="font-medium">{adjustment.created_at ? format(new Date(adjustment.created_at), 'MMM d, yyyy h:mm a') : '-'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-500">Reason</p>
              <p className="font-medium">{adjustment.reason}</p>
            </div>
            {adjustment.notes && (
              <div className="col-span-2">
                <p className="text-xs text-gray-500">Notes</p>
                <p className="text-sm">{adjustment.notes}</p>
              </div>
            )}
          </div>
          
          {/* Items */}
          <div>
            <h4 className="font-medium mb-2">Items ({items.length})</h4>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Old Qty</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">New Qty</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Difference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item, idx) => {
                    const diff = (item.adjusted_quantity || item.adjustedQuantity) - (item.current_quantity || item.currentQuantity || 0);
                    return (
                      <tr key={idx}>
                        <td className="px-4 py-2 text-sm">
                          {item.Product?.product_name || item.product?.name || `Product #${item.product_id || item.productId}`}
                        </td>
                        <td className="px-4 py-2 text-sm text-right text-gray-500">
                          {item.current_quantity || item.currentQuantity || 0}
                        </td>
                        <td className="px-4 py-2 text-sm text-right font-medium">
                          {item.adjusted_quantity || item.adjustedQuantity}
                        </td>
                        <td className={`px-4 py-2 text-sm text-right font-medium ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {diff >= 0 ? '+' : ''}{diff}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        {adjustment.status === 'pending' && (
          <>
            <Button 
              variant="outline" 
              onClick={onReject}
              disabled={isRejecting}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <X className="w-4 h-4 mr-1" />
              {isRejecting ? 'Rejecting...' : 'Reject'}
            </Button>
            <Button onClick={onApprove} disabled={isApproving}>
              <Check className="w-4 h-4 mr-1" />
              {isApproving ? 'Approving...' : 'Approve'}
            </Button>
          </>
        )}
      </ModalFooter>
    </Modal>
  );
}
