import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, 
  Bell, 
  Search, 
  Settings, 
  LogOut, 
  User,
  ChevronDown,
  HelpCircle
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Avatar } from '../ui/Avatar';
import { Dropdown, DropdownItem, DropdownDivider } from '../ui/Dropdown';

export function Header({ onMenuClick }) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Search */}
        <form onSubmit={handleSearch} className="hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-64 lg:w-80 pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </form>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Dropdown
          align="right"
          trigger={
            <button className="relative p-2 hover:bg-gray-100 rounded-lg">
              <Bell className="h-5 w-5 text-gray-600" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>
          }
        >
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold">Notifications</h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer">
              <p className="text-sm text-gray-900">New order received</p>
              <p className="text-xs text-gray-500 mt-1">2 minutes ago</p>
            </div>
            <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer">
              <p className="text-sm text-gray-900">Low stock alert: Product XYZ</p>
              <p className="text-xs text-gray-500 mt-1">1 hour ago</p>
            </div>
            <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer">
              <p className="text-sm text-gray-900">Payment received from Customer ABC</p>
              <p className="text-xs text-gray-500 mt-1">3 hours ago</p>
            </div>
          </div>
          <div className="px-4 py-2 border-t border-gray-200">
            <button 
              onClick={() => navigate('/notifications')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all notifications
            </button>
          </div>
        </Dropdown>

        {/* Help */}
        <button className="p-2 hover:bg-gray-100 rounded-lg hidden sm:block">
          <HelpCircle className="h-5 w-5 text-gray-600" />
        </button>

        {/* User menu */}
        <Dropdown
          align="right"
          trigger={
            <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 hover:bg-gray-100 rounded-lg">
              <Avatar 
                name={`${user?.first_name || ''} ${user?.last_name || ''}`}
                size="sm"
              />
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.role?.name || 'User'}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400 hidden sm:block" />
            </button>
          }
        >
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-900">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          <DropdownItem 
            icon={<User className="h-4 w-4" />}
            onClick={() => navigate('/profile')}
          >
            My Profile
          </DropdownItem>
          <DropdownItem 
            icon={<Settings className="h-4 w-4" />}
            onClick={() => navigate('/settings')}
          >
            Settings
          </DropdownItem>
          <DropdownDivider />
          <DropdownItem 
            icon={<LogOut className="h-4 w-4" />}
            onClick={handleLogout}
            danger
          >
            Sign out
          </DropdownItem>
        </Dropdown>
      </div>
    </header>
  );
}
