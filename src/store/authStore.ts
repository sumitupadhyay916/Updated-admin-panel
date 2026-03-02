import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
// UserRole is probably missing 'staff', but this is just an example of modifying imports if needed.
import type { User, UserRole as BaseUserRole, LoginCredentials, SuperAdmin, Admin } from '@/types';
type UserRole = BaseUserRole | 'staff';
import { authApi } from '@/services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  canAccessRoute: (route: string) => boolean;
}

// Route access rules by role
const routeAccessRules: Record<UserRole, string[]> = {
  super_admin: [
    '/super-admin',
    '/admin',
    '/seller',
  ],
  admin: [
    '/admin',
    '/seller',
  ],
  seller: [
    '/seller',
  ],
  staff: [
    '/seller',
  ],
  consumer: [
    '/consumer',
  ],
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      token: null,

      login: async (credentials: LoginCredentials): Promise<boolean> => {
        set({ isLoading: true });

        try {
          const response = await authApi.login({
            email: credentials.email,
            password: credentials.password,
            role: credentials.role,
          });

          if (response.success && response.data) {
            const { user, token } = response.data as { user: User; token: string };

            // Check if role matches (if specified)
            if (credentials.role) {
              if (credentials.role === 'staff' && user.role === 'staff') {
                // Allow staff directly 
              } else if (credentials.role === 'seller' && user.role === 'staff') {
                // Allow staff to login via the seller portal
              } else if (user.role !== credentials.role) {
                set({ isLoading: false });
                return false;
              }
            }

            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
            });
            return true;
          }

          set({ isLoading: false });
          return false;
        } catch (error) {
          console.error('Login error:', error);
          set({ isLoading: false });
          return false;
        }
      },

      logout: () => {
        authApi.logout();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      fetchProfile: async (): Promise<void> => {
        try {
          const response = await authApi.getProfile();
          if (response.success && response.data) {
            set({ user: response.data as User });
          }
        } catch (error) {
          console.error('Fetch profile error:', error);
        }
      },

      hasPermission: (permission: string): boolean => {
        const { user } = get();
        if (!user) return false;

        if (user.role === 'super_admin') return true;
        
        // Both admins and staff can have permissions arrays
        if (['admin', 'staff'].includes(user.role)) {
          const userWithPerms = user as any;
          if (Array.isArray(userWithPerms.permissions)) {
            return userWithPerms.permissions.includes(permission) ||
                   userWithPerms.permissions.includes('all');
          }
        }
        return false;
      },

      canAccessRoute: (route: string): boolean => {
        const { user } = get();
        if (!user) return false;

        const allowedRoutes = routeAccessRules[user.role] || [];
        return allowedRoutes.some(allowedRoute => route.startsWith(allowedRoute));
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        token: state.token,
      }),
    }
  )
);

// Hook for role-based access
export const useRole = () => {
  const user = useAuthStore(state => state.user);
  return {
    role: user?.role || null,
    isSuperAdmin: user?.role === 'super_admin',
    isAdmin: user?.role === 'admin',
    isSeller: user?.role === 'seller',
    isStaff: user?.role === 'staff',
    isConsumer: user?.role === 'consumer',
  };
};

// Hook for permissions
export const usePermission = (permission: string) => {
  const hasPermission = useAuthStore(state => state.hasPermission);
  return hasPermission(permission);
};
