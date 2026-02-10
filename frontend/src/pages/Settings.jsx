import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  Settings as SettingsIcon, Building2, Globe, Mail, Phone, MapPin,
  CreditCard, Save, FileText, Bell, Lock, Database, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { settingsAPI } from '../services/api';
import { Card, CardHeader, CardTitle, CardBody, Button, Badge } from '../components/ui';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('company');
  
  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsAPI.get(),
  });
  
  const settings = settingsData?.data || {};
  
  const tabs = [
    { id: 'company', label: 'Company', icon: Building2 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'system', label: 'System', icon: Database },
  ];
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your application settings</p>
      </div>
      
      <div className="flex gap-6">
        {/* Sidebar Tabs */}
        <div className="w-64 flex-shrink-0">
          <Card>
            <CardBody className="p-2">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </CardBody>
          </Card>
        </div>
        
        {/* Content */}
        <div className="flex-1">
          {activeTab === 'company' && <CompanySettings settings={settings} />}
          {activeTab === 'notifications' && <NotificationSettings settings={settings} />}
          {activeTab === 'security' && <SecuritySettings />}
          {activeTab === 'billing' && <BillingSettings />}
          {activeTab === 'system' && <SystemSettings />}
        </div>
      </div>
    </div>
  );
}

function CompanySettings({ settings }) {
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, formState: { isDirty } } = useForm({
    defaultValues: {
      company_name: settings.company_name || '',
      company_email: settings.company_email || '',
      company_phone: settings.company_phone || '',
      company_address: settings.company_address || '',
      company_city: settings.company_city || '',
      company_country: settings.company_country || '',
      tax_id: settings.tax_id || '',
      currency: settings.currency || 'USD',
      timezone: settings.timezone || 'UTC',
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: (data) => settingsAPI.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Company settings updated');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update settings');
    },
  });
  
  const onSubmit = (data) => {
    updateMutation.mutate(data);
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name *
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                {...register('company_name', { required: true })}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Acme Inc."
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  {...register('company_email')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="contact@company.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  {...register('company_phone')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <textarea
                {...register('company_address')}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
                placeholder="123 Main St, Suite 100"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                {...register('company_city')}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="New York"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country
              </label>
              <input
                {...register('company_country')}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="United States"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tax ID / VAT Number
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                {...register('tax_id')}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="XX-XXXXXXX"
              />
            </div>
          </div>
        </CardBody>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Regional Settings</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select
                {...register('currency')}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="INR">INR - Indian Rupee</option>
                <option value="CAD">CAD - Canadian Dollar</option>
                <option value="AUD">AUD - Australian Dollar</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timezone
              </label>
              <select
                {...register('timezone')}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Europe/Paris">Paris (CET)</option>
                <option value="Asia/Tokyo">Tokyo (JST)</option>
              </select>
            </div>
          </div>
        </CardBody>
      </Card>
      
      <div className="flex justify-end">
        <Button type="submit" loading={updateMutation.isPending} disabled={!isDirty}>
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </form>
  );
}

function NotificationSettings({ settings }) {
  const [notifications, setNotifications] = useState({
    email_orders: settings.email_orders ?? true,
    email_inventory: settings.email_inventory ?? true,
    email_payments: settings.email_payments ?? true,
    email_reports: settings.email_reports ?? false,
    push_orders: settings.push_orders ?? true,
    push_inventory: settings.push_inventory ?? false,
  });
  
  const toggleSetting = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          {[
            { key: 'email_orders', label: 'New Orders', desc: 'Get notified when new orders are placed' },
            { key: 'email_inventory', label: 'Low Inventory', desc: 'Alert when products are running low' },
            { key: 'email_payments', label: 'Payment Updates', desc: 'Receive payment confirmations and issues' },
            { key: 'email_reports', label: 'Weekly Reports', desc: 'Receive weekly business summary reports' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
              <div>
                <p className="font-medium text-gray-900">{item.label}</p>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications[item.key]}
                  onChange={() => toggleSetting(item.key)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          ))}
        </CardBody>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Push Notifications</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          {[
            { key: 'push_orders', label: 'Order Alerts', desc: 'Real-time notifications for orders' },
            { key: 'push_inventory', label: 'Stock Alerts', desc: 'Immediate alerts for stock issues' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
              <div>
                <p className="font-medium text-gray-900">{item.label}</p>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications[item.key]}
                  onChange={() => toggleSetting(item.key)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          ))}
        </CardBody>
      </Card>
      
      <div className="flex justify-end">
        <Button>
          <Save className="w-4 h-4 mr-2" />
          Save Preferences
        </Button>
      </div>
    </div>
  );
}

function SecuritySettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="flex items-center justify-between py-4 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Two-Factor Authentication</p>
              <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
            </div>
            <Button variant="secondary" size="sm">Enable</Button>
          </div>
          
          <div className="flex items-center justify-between py-4 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Session Timeout</p>
              <p className="text-sm text-gray-500">Automatically log out after inactivity</p>
            </div>
            <select className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="120">2 hours</option>
              <option value="480">8 hours</option>
              <option value="0">Never</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="font-medium text-gray-900">Password Requirements</p>
              <p className="text-sm text-gray-500">Minimum password strength for all users</p>
            </div>
            <select className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="low">Low (8+ characters)</option>
              <option value="medium">Medium (8+ with numbers)</option>
              <option value="high">High (8+ with special chars)</option>
            </select>
          </div>
        </CardBody>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Current Session</p>
                  <p className="text-sm text-gray-500">Chrome on macOS • IP: 192.168.1.1</p>
                </div>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Mobile App</p>
                  <p className="text-sm text-gray-500">iPhone • Last active 2 hours ago</p>
                </div>
              </div>
              <Button variant="secondary" size="sm">Revoke</Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function BillingSettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Professional Plan</h3>
              <p className="text-gray-500">$49/month • Renews on Jan 15, 2025</p>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">5</p>
              <p className="text-sm text-gray-500">Users</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">10GB</p>
              <p className="text-sm text-gray-500">Storage</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">Unlimited</p>
              <p className="text-sm text-gray-500">Orders</p>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <Button variant="secondary">Upgrade Plan</Button>
            <Button variant="secondary">View Invoices</Button>
          </div>
        </CardBody>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                VISA
              </div>
              <div>
                <p className="font-medium text-gray-900">•••• •••• •••• 4242</p>
                <p className="text-sm text-gray-500">Expires 12/2025</p>
              </div>
            </div>
            <Button variant="secondary" size="sm">Update</Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function SystemSettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="flex items-center justify-between py-4 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Export Data</p>
              <p className="text-sm text-gray-500">Download all your data in CSV format</p>
            </div>
            <Button variant="secondary" size="sm">Export</Button>
          </div>
          
          <div className="flex items-center justify-between py-4 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Import Data</p>
              <p className="text-sm text-gray-500">Import data from CSV files</p>
            </div>
            <Button variant="secondary" size="sm">Import</Button>
          </div>
          
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="font-medium text-gray-900">Database Backup</p>
              <p className="text-sm text-gray-500">Last backup: Today at 3:00 AM</p>
            </div>
            <Button variant="secondary" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Backup Now
            </Button>
          </div>
        </CardBody>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Version</p>
              <p className="font-medium text-gray-900">1.0.0</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Environment</p>
              <p className="font-medium text-gray-900">Production</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Database</p>
              <p className="font-medium text-gray-900">PostgreSQL 15</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Storage Used</p>
              <p className="font-medium text-gray-900">2.4 GB / 10 GB</p>
            </div>
          </div>
        </CardBody>
      </Card>
      
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="flex items-center justify-between py-4 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Clear All Data</p>
              <p className="text-sm text-gray-500">Remove all data except users</p>
            </div>
            <Button variant="danger" size="sm">Clear Data</Button>
          </div>
          
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="font-medium text-gray-900">Delete Account</p>
              <p className="text-sm text-gray-500">Permanently delete your account and all data</p>
            </div>
            <Button variant="danger" size="sm">Delete Account</Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
