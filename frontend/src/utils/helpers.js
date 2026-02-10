import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2
  }).format(amount || 0);
}

export function formatNumber(num) {
  return new Intl.NumberFormat('en-IN').format(num || 0);
}

export function formatDate(date, options = {}) {
  if (!date) return '-';
  const defaultOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  };
  return new Date(date).toLocaleDateString('en-IN', { ...defaultOptions, ...options });
}

export function formatDateTime(date) {
  if (!date) return '-';
  return new Date(date).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str, length = 50) {
  if (!str) return '';
  return str.length > length ? str.slice(0, length) + '...' : str;
}

export function getStatusColor(status) {
  const colors = {
    // General
    active: 'success',
    inactive: 'gray',
    pending: 'warning',
    completed: 'success',
    cancelled: 'danger',
    
    // Orders
    draft: 'gray',
    confirmed: 'info',
    processing: 'warning',
    shipped: 'info',
    delivered: 'success',
    
    // Invoices
    paid: 'success',
    partially_paid: 'warning',
    unpaid: 'danger',
    overdue: 'danger',
    sent: 'info',
    void: 'gray',
    
    // Purchase Orders
    pending_approval: 'warning',
    approved: 'success',
    rejected: 'danger',
    received: 'success',
    partially_received: 'warning',
    
    // Dispatch
    pending_picking: 'warning',
    picking: 'info',
    packing: 'info',
    ready_to_ship: 'success',
    in_transit: 'info',
    
    // Returns
    refunded: 'success',
    replaced: 'success'
  };
  
  return colors[status?.toLowerCase()] || 'gray';
}

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function generateQueryString(params) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value);
    }
  });
  return searchParams.toString();
}

export function downloadFile(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
