import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  Building2,
  Warehouse,
  FileText,
  Receipt,
  CreditCard,
  Truck,
  RotateCcw,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Boxes,
  Tags,
  ClipboardList,
  PackageCheck,
  X,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { cn } from '../../utils/helpers';
import { useAuthStore } from '../../store/authStore';

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    permission: null
  },
  {
    name: 'Sales',
    icon: ShoppingCart,
    permission: 'sales_view',
    children: [
      { name: 'Sales Orders', href: '/sales/orders', permission: 'sales_view' },
      { name: 'Invoices', href: '/sales/invoices', permission: 'invoice_view' },
      { name: 'Returns', href: '/sales/returns', permission: 'sales_view' }
    ]
  },
  {
    name: 'Purchases',
    icon: ClipboardList,
    permission: 'purchase_view',
    children: [
      { name: 'Purchase Orders', href: '/purchase/orders', permission: 'purchase_view' },
      { name: 'GRN', href: '/purchase/grn', permission: 'grn_view' }
    ]
  },
  {
    name: 'Inventory',
    icon: Package,
    permission: 'inventory_view',
    children: [
      { name: 'Products', href: '/inventory/products', permission: 'product_view' },
      { name: 'Categories', href: '/inventory/categories', permission: 'category_view' },
      { name: 'Brands', href: '/inventory/brands', permission: 'inventory_view' },
      { name: 'Units', href: '/inventory/units', permission: 'inventory_view' },
      { name: 'Stock Movements', href: '/inventory/stock', permission: 'inventory_view' },
      { name: 'Stock Adjustments', href: '/inventory/adjustments', permission: 'inventory_view' },
      { name: 'Warehouses', href: '/inventory/warehouses', permission: 'warehouse_view' }
    ]
  },
  {
    name: 'Dispatch',
    href: '/dispatch',
    icon: Truck,
    permission: 'dispatch_view'
  },
  {
    name: 'Payments',
    icon: CreditCard,
    permission: 'accounts_view',
    children: [
      { name: 'All Payments', href: '/payments', permission: 'accounts_view' }
    ]
  },
  {
    name: 'Customers',
    href: '/customers',
    icon: Users,
    permission: 'customer_view'
  },
  {
    name: 'Suppliers',
    href: '/suppliers',
    icon: Building2,
    permission: 'supplier_view'
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: BarChart3,
    permission: 'reports_view'
  },
  {
    name: 'Users',
    href: '/users',
    icon: Users,
    permission: 'user_view'
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    permission: 'admin'
  }
];

export function Sidebar({ isOpen, onClose, isCollapsed = false, onToggleCollapse }) {
  const location = useLocation();
  const { hasPermission } = useAuthStore();
  const [expandedItems, setExpandedItems] = useState([]);

  const toggleExpand = (name) => {
    setExpandedItems(prev =>
      prev.includes(name)
        ? prev.filter(item => item !== name)
        : [...prev, name]
    );
  };

  const isItemActive = (item) => {
    if (item.href) {
      return location.pathname === item.href || location.pathname.startsWith(item.href + '/');
    }
    if (item.children) {
      return item.children.some(child => 
        location.pathname === child.href || location.pathname.startsWith(child.href + '/')
      );
    }
    return false;
  };

  const canViewItem = (item) => {
    if (!item.permission) return true;
    if (item.permission === 'admin') return hasPermission('admin');
    if (item.children) {
      return item.children.some(child => !child.permission || hasPermission(child.permission));
    }
    return hasPermission(item.permission);
  };

  const filteredNavigation = navigation.filter(canViewItem);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen bg-white border-r border-gray-200 transition-all duration-300',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          isCollapsed ? 'w-20' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <Boxes className="h-5 w-5 text-white" />
            </div>
            {!isCollapsed && <span className="text-lg font-bold text-gray-900">REX ERP</span>}
          </div>
          <button 
            className="lg:hidden p-1 hover:bg-gray-100 rounded"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Collapse Toggle Button - Desktop only */}
        <div className="hidden lg:flex justify-end px-2 py-2 border-b border-gray-100">
          <button
            onClick={onToggleCollapse}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-5 w-5 text-gray-500" />
            ) : (
              <PanelLeftClose className="h-5 w-5 text-gray-500" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className={cn(
          'p-2 space-y-1 overflow-y-auto',
          isCollapsed ? 'h-[calc(100vh-8rem)]' : 'h-[calc(100vh-4rem)]'
        )}>
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item);
            const isExpanded = expandedItems.includes(item.name) || isActive;

            if (item.children) {
              return (
                <div key={item.name} className="relative group">
                  <button
                    onClick={() => !isCollapsed && toggleExpand(item.name)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                      isActive 
                        ? 'bg-primary-50 text-primary-700' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                      isCollapsed && 'justify-center px-2'
                    )}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 text-left text-sm font-medium">{item.name}</span>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </>
                    )}
                  </button>
                  
                  {/* Expanded children - when not collapsed */}
                  {!isCollapsed && isExpanded && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.children
                        .filter(child => !child.permission || hasPermission(child.permission))
                        .map((child) => (
                          <NavLink
                            key={child.href}
                            to={child.href}
                            onClick={onClose}
                            className={({ isActive }) => cn(
                              'flex items-center px-3 py-2 rounded-lg text-sm transition-colors',
                              isActive 
                                ? 'bg-primary-50 text-primary-700 font-medium' 
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            )}
                          >
                            {child.name}
                          </NavLink>
                        ))}
                    </div>
                  )}

                  {/* Tooltip children - when collapsed */}
                  {isCollapsed && (
                    <div className="absolute left-full top-0 ml-2 hidden group-hover:block z-50">
                      <div className="bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[160px]">
                        <div className="px-3 py-2 text-sm font-semibold text-gray-900 border-b border-gray-100">
                          {item.name}
                        </div>
                        {item.children
                          .filter(child => !child.permission || hasPermission(child.permission))
                          .map((child) => (
                            <NavLink
                              key={child.href}
                              to={child.href}
                              onClick={onClose}
                              className={({ isActive }) => cn(
                                'flex items-center px-3 py-2 text-sm transition-colors',
                                isActive 
                                  ? 'bg-primary-50 text-primary-700 font-medium' 
                                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                              )}
                            >
                              {child.name}
                            </NavLink>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={onClose}
                className={({ isActive }) => cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                  isActive 
                    ? 'bg-primary-50 text-primary-700' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                  isCollapsed && 'justify-center px-2'
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span className="text-sm font-medium">{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
