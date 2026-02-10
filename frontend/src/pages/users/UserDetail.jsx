import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import {
  ArrowLeft, Edit, Trash2, Mail, Phone, Shield, Calendar, Clock,
  User, UserCheck, Save, X, Lock, Key
} from 'lucide-react';
import toast from 'react-hot-toast';
import { usersAPI } from '../../services/api';
import { Card, CardHeader, CardTitle, CardBody, Button, Badge, Modal, LoadingScreen } from '../../components/ui';

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['users', id],
    queryFn: () => usersAPI.getById(id),
  });
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  
  const { register: registerPassword, handleSubmit: handlePasswordSubmit, reset: resetPassword, watch } = useForm();
  const newPassword = watch('new_password');
  
  const updateMutation = useMutation({
    mutationFn: (data) => usersAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', id] });
      toast.success('User updated successfully');
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update user');
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: () => usersAPI.delete(id),
    onSuccess: () => {
      toast.success('User deleted successfully');
      navigate('/users');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete user');
    },
  });
  
  const passwordMutation = useMutation({
    mutationFn: (data) => usersAPI.changePassword(id, data),
    onSuccess: () => {
      toast.success('Password changed successfully');
      setShowPasswordModal(false);
      resetPassword();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to change password');
    },
  });
  
  if (isLoading) return <LoadingScreen />;
  if (error) return <div className="p-8 text-center text-red-500">Error loading user</div>;
  
  const user = data?.data;
  
  const startEditing = () => {
    reset({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'staff',
      is_active: user.is_active,
    });
    setIsEditing(true);
  };
  
  const onSubmit = (formData) => {
    updateMutation.mutate(formData);
  };
  
  const onPasswordSubmit = (formData) => {
    passwordMutation.mutate({
      new_password: formData.new_password,
    });
  };
  
  const getRoleBadge = (role) => {
    const config = {
      admin: { variant: 'error', icon: Shield },
      manager: { variant: 'primary', icon: UserCheck },
      staff: { variant: 'secondary', icon: User },
    };
    const { variant, icon: Icon } = config[role] || config.staff;
    return (
      <Badge variant={variant}>
        <Icon className="w-3 h-3 mr-1" />
        {role?.charAt(0).toUpperCase() + role?.slice(1)}
      </Badge>
    );
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/users"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {user.first_name && user.last_name 
                ? `${user.first_name} ${user.last_name}` 
                : user.email}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              {getRoleBadge(user.role)}
              <Badge variant={user.is_active ? 'success' : 'secondary'}>
                {user.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isEditing && (
            <>
              <Button variant="secondary" onClick={() => setShowPasswordModal(true)}>
                <Key className="w-4 h-4 mr-2" />
                Change Password
              </Button>
              <Button variant="secondary" onClick={startEditing}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardBody>
              {isEditing ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        {...register('first_name')}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        {...register('last_name')}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      {...register('email', { required: 'Email is required' })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      {...register('phone')}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role *
                    </label>
                    <select
                      {...register('role', { required: true })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="staff">Staff</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      {...register('is_active')}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <label htmlFor="is_active" className="text-sm text-gray-700">
                      Active account
                    </label>
                  </div>
                  
                  <div className="flex items-center gap-3 pt-4">
                    <Button type="submit" loading={updateMutation.isPending}>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button 
                      type="button" 
                      variant="secondary" 
                      onClick={() => setIsEditing(false)}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500">First Name</p>
                    <p className="font-medium text-gray-900">{user.first_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Last Name</p>
                    <p className="font-medium text-gray-900">{user.last_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <p className="font-medium text-gray-900">{user.email}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <p className="font-medium text-gray-900">{user.phone || '-'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Role</p>
                    {getRoleBadge(user.role)}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <Badge variant={user.is_active ? 'success' : 'secondary'}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-medium text-gray-900">
                    {user.created_at ? format(new Date(user.created_at), 'MMM d, yyyy') : '-'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Login</p>
                  <p className="font-medium text-gray-900">
                    {user.last_login 
                      ? format(new Date(user.last_login), 'MMM d, yyyy h:mm a') 
                      : 'Never'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Lock className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Password</p>
                  <button 
                    onClick={() => setShowPasswordModal(true)}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Change Password
                  </button>
                </div>
              </div>
            </CardBody>
          </Card>
          
          {/* Avatar */}
          <Card>
            <CardBody className="text-center py-8">
              <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-primary-600">
                  {user.first_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                  {user.last_name?.charAt(0) || ''}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {user.first_name && user.last_name 
                  ? `${user.first_name} ${user.last_name}` 
                  : 'No Name Set'}
              </h3>
              <p className="text-gray-500">{user.email}</p>
            </CardBody>
          </Card>
        </div>
      </div>
      
      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete User"
      >
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete this user? This action cannot be undone.
        </p>
        <div className="flex items-center gap-3 justify-end">
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={() => deleteMutation.mutate()}
            loading={deleteMutation.isPending}
          >
            Delete User
          </Button>
        </div>
      </Modal>
      
      {/* Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          resetPassword();
        }}
        title="Change Password"
      >
        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password *
            </label>
            <input
              type="password"
              {...registerPassword('new_password', { 
                required: 'Password is required',
                minLength: { value: 8, message: 'Password must be at least 8 characters' }
              })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter new password"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password *
            </label>
            <input
              type="password"
              {...registerPassword('confirm_password', { 
                required: 'Please confirm password',
                validate: value => value === newPassword || 'Passwords do not match'
              })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Confirm new password"
            />
          </div>
          
          <div className="flex items-center gap-3 justify-end pt-4">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => {
                setShowPasswordModal(false);
                resetPassword();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={passwordMutation.isPending}>
              <Key className="w-4 h-4 mr-2" />
              Change Password
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
