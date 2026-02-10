import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '../../utils/helpers';
import { Checkbox } from './Input';
import { Button } from './Button';

export function Table({ 
  columns, 
  data = [], 
  loading,
  selectable,
  selectedRows = [],
  onSelectRow,
  onSelectAll,
  sortable = true,
  onSort,
  sortConfig,
  emptyMessage = 'No data found',
  className
}) {
  const [localSort, setLocalSort] = useState({ key: null, direction: 'asc' });
  
  const currentSort = sortConfig || localSort;
  
  const handleSort = (key) => {
    if (!sortable) return;
    
    const newDirection = currentSort.key === key && currentSort.direction === 'asc' ? 'desc' : 'asc';
    const newSort = { key, direction: newDirection };
    
    if (onSort) {
      onSort(newSort);
    } else {
      setLocalSort(newSort);
    }
  };

  const sortedData = useMemo(() => {
    if (!currentSort.key || onSort) return data;
    
    return [...data].sort((a, b) => {
      const aVal = a[currentSort.key];
      const bVal = b[currentSort.key];
      
      if (aVal === bVal) return 0;
      
      const comparison = aVal < bVal ? -1 : 1;
      return currentSort.direction === 'asc' ? comparison : -comparison;
    });
  }, [data, currentSort, onSort]);

  const allSelected = data.length > 0 && selectedRows.length === data.length;
  const someSelected = selectedRows.length > 0 && selectedRows.length < data.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={cn('overflow-x-auto rounded-lg border border-gray-200', className)}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {selectable && (
              <th className="w-12 px-6 py-3">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={(e) => onSelectAll?.(e.target.checked)}
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                  column.sortable !== false && sortable && 'cursor-pointer hover:bg-gray-100',
                  column.className
                )}
                style={{ width: column.width }}
                onClick={() => column.sortable !== false && handleSort(column.key)}
              >
                <div className="flex items-center gap-1">
                  {column.header}
                  {column.sortable !== false && sortable && currentSort.key === column.key && (
                    currentSort.direction === 'asc' 
                      ? <ChevronUp className="h-4 w-4" />
                      : <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedData.length === 0 ? (
            <tr>
              <td 
                colSpan={columns.length + (selectable ? 1 : 0)} 
                className="px-6 py-12 text-center text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedData.map((row, index) => {
              const rowId = row.id || index;
              const isSelected = selectedRows.includes(rowId);
              
              return (
                <tr 
                  key={rowId}
                  className={cn(
                    'hover:bg-gray-50 transition-colors',
                    isSelected && 'bg-blue-50'
                  )}
                >
                  {selectable && (
                    <td className="w-12 px-6 py-4">
                      <Checkbox
                        checked={isSelected}
                        onChange={(e) => onSelectRow?.(rowId, e.target.checked)}
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td 
                      key={column.key} 
                      className={cn('px-6 py-4 text-sm text-gray-900', column.cellClassName)}
                    >
                      {column.render 
                        ? column.render(row[column.key], row, index)
                        : row[column.key]}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({ 
  currentPage = 1, 
  totalPages = 1, 
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100]
}) {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-700">
          Showing {startItem} to {endItem} of {totalItems} results
        </span>
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="border border-gray-300 rounded-md text-sm px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size} per page
              </option>
            ))}
          </select>
        )}
      </div>
      
      <div className="flex items-center gap-1">
        <Button
          variant="secondary"
          size="icon"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        {getPageNumbers().map((page, index) => (
          page === '...' ? (
            <span key={`ellipsis-${index}`} className="px-2 text-gray-500">...</span>
          ) : (
            <Button
              key={page}
              variant={page === currentPage ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => onPageChange(page)}
            >
              {page}
            </Button>
          )
        ))}
        
        <Button
          variant="secondary"
          size="icon"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
