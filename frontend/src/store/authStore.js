import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      permissions: [],
      roles: [],

      setAuth: (user, token, refreshToken = null) => {
        // Extract permissions from user roles (backend returns Roles array)
        const userRoles = user?.Roles || [];
        const permissions = [];
        userRoles.forEach(role => {
          if (role.Permissions) {
            role.Permissions.forEach(perm => {
              permissions.push(perm.permission_name);
            });
          }
        });
        set({ 
          user, 
          token, 
          refreshToken,
          isAuthenticated: true,
          permissions,
          roles: userRoles.map(r => r.role_name)
        });
      },

      updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } });
      },

      logout: () => {
        set({ 
          user: null, 
          token: null, 
          refreshToken: null,
          isAuthenticated: false,
          permissions: [],
          roles: []
        });
        localStorage.removeItem('auth-storage');
      },

      hasPermission: (permission) => {
        const { permissions, roles } = get();
        // SUPER_ADMIN has all permissions
        if (roles?.includes('SUPER_ADMIN')) return true;
        // Check if user has the specific permission (case-insensitive)
        return permissions.some(p => p.toLowerCase() === permission.toLowerCase());
      },

      hasAnyPermission: (permissionList) => {
        const { permissions, roles } = get();
        // SUPER_ADMIN has all permissions
        if (roles?.includes('SUPER_ADMIN')) return true;
        return permissionList.some(p => 
          permissions.some(userPerm => userPerm.toLowerCase() === p.toLowerCase())
        );
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        permissions: state.permissions,
        roles: state.roles
      })
    }
  )
);
