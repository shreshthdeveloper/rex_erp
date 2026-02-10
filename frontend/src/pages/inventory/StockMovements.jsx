import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowUpRight, ArrowDownRight, Package, Filter, Search, Download, ArrowRightLeft } from 'lucide-react';
import { inventoryAPI, productsAPI, warehousesAPI } from '../../services/api';
import { Card, CardHeader, CardTitle, CardBody, Badge, TableSkeleton } from '../../components/ui';

export default function StockMovements() {
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    productId: '',
    warehouseId: '',
  });
  const [page, setPage] = useState(1);
  
  const { data, isLoading } = useQuery({
    queryKey: ['stockMovements', filters, page],
    queryFn: () => inventoryAPI.getTransactions({ ...filters, page, limit: 20 }),
  });
  
  const { data: productsData } = useQuery({
    queryKey: ['products-list'],
    queryFn: () => productsAPI.getAll({ limit: 100 }),
  });
  
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses-list'],
    queryFn: () => warehousesAPI.getAll({ limit: 100 }),
  });
  
  const movements = data?.data?.transactions || [];
  const totalPages = data?.data?.pagination?.totalPages || 1;
  const products = productsData?.data?.products || [];
  const warehouses = warehousesData?.data?.warehouses || [];
  
  const getTypeConfig = (type) => {
    const types = {
      INWARD: { label: 'Stock In', color: 'success', icon: ArrowDownRight },
      OUTWARD: { label: 'Stock Out', color: 'danger', icon: ArrowUpRight },
      TRANSFER_IN: { label: 'Transfer In', color: 'info', icon: ArrowRightLeft },
      TRANSFER_OUT: { label: 'Transfer Out', color: 'info', icon: ArrowRightLeft },
      ADJUSTMENT: { label: 'Adjustment', color: 'warning', icon: Package },
    };
    return types[type] || { label: type, color: 'secondary', icon: Package };
  };
  
  const stats = {
    totalIn: movements.filter(m => m.transaction_type === 'INWARD' || m.transaction_type === 'TRANSFER_IN').reduce((sum, m) => sum + m.quantity, 0),
    totalOut: movements.filter(m => m.transaction_type === 'OUTWARD' || m.transaction_type === 'TRANSFER_OUT').reduce((sum, m) => sum + m.quantity, 0),
    transfers: movements.filter(m => m.transaction_type === 'TRANSFER_IN' || m.transaction_type === 'TRANSFER_OUT').length,
    adjustments: movements.filter(m => m.transaction_type === 'ADJUSTMENT').length,
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Movements</h1>
          <p className="text-gray-500 mt-1">Track all inventory movements</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <ArrowDownRight className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalIn}</p>
                <p className="text-sm text-gray-500">Total Stock In</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <ArrowUpRight className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOut}</p>
                <p className="text-sm text-gray-500">Total Stock Out</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <ArrowRightLeft className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.transfers}</p>
                <p className="text-sm text-gray-500">Transfers</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.adjustments}</p>
                <p className="text-sm text-gray-500">Adjustments</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
      
      {/* Filters */}
      <Card>
        <CardBody>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by reference..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Types</option>
              <option value="INWARD">Stock In</option>
              <option value="OUTWARD">Stock Out</option>
              <option value="TRANSFER_IN">Transfer In</option>
              <option value="TRANSFER_OUT">Transfer Out</option>
              <option value="ADJUSTMENT">Adjustment</option>
            </select>
            
            <select
              value={filters.productId}
              onChange={(e) => setFilters(prev => ({ ...prev, productId: e.target.value }))}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Products</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>{product.product_name || product.name}</option>
              ))}
            </select>
            
            <select
              value={filters.warehouseId}
              onChange={(e) => setFilters(prev => ({ ...prev, warehouseId: e.target.value }))}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Warehouses</option>
              {warehouses.map(warehouse => (
                <option key={warehouse.id} value={warehouse.id}>{warehouse.warehouse_name || warehouse.name}</option>
              ))}
            </select>
          </div>
        </CardBody>
      </Card>
      
      {/* Movements Table */}
      <Card>
        <CardBody className="p-0">
          {isLoading ? (
            <TableSkeleton rows={10} columns={7} />
          ) : movements.length === 0 ? (
            <div className="text-center py-12">
              <ArrowRightLeft className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No movements found</h3>
              <p className="text-gray-500">Stock movements will appear here as inventory changes</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Date</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Reference</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Type</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Product</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Warehouse</th>
                    <th className="text-right py-4 px-6 text-sm font-medium text-gray-500">Quantity</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((movement) => {
                    const typeConfig = getTypeConfig(movement.transaction_type);
                    const TypeIcon = typeConfig.icon;
                    const isInward = movement.transaction_type === 'INWARD' || movement.transaction_type === 'TRANSFER_IN';
                    const isOutward = movement.transaction_type === 'OUTWARD' || movement.transaction_type === 'TRANSFER_OUT';
                    return (
                      <tr key={movement.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <span className="text-gray-900">
                            {format(new Date(movement.created_at), 'MMM dd, yyyy')}
                          </span>
                          <span className="text-gray-500 text-sm block">
                            {format(new Date(movement.created_at), 'HH:mm')}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-medium text-gray-900">{movement.reference_type || '-'}</span>
                        </td>
                        <td className="py-4 px-6">
                          <Badge variant={typeConfig.color}>
                            <TypeIcon className="w-3 h-3 mr-1" />
                            {typeConfig.label}
                          </Badge>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Package className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{movement.product_name || movement.Product?.product_name || 'Unknown'}</p>
                              <p className="text-sm text-gray-500">{movement.Product?.sku}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-gray-900">{movement.warehouse_name || movement.Warehouse?.warehouse_name || '-'}</span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className={`font-semibold ${isInward ? 'text-green-600' : isOutward ? 'text-red-600' : 'text-gray-900'}`}>
                            {isInward ? '+' : isOutward ? '-' : ''}{movement.quantity}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-gray-500 truncate max-w-xs block">{movement.notes || '-'}</span>
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
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
