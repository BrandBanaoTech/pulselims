import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ==========================================
// 1. TYPES & INTERFACES
// ==========================================

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  mobile?: string;
  default_lab?: string | null;
  role: string;
  permissions: string[]; // Standardized array for O(1) / O(N) access control
  theme_preference?: 'light' | 'dark' | 'system' | string;
  avatar_url?: string;
}

interface AuthState {
  // State Values
  token: string | null;
  activeLab: string | null;
  user: AuthUser | null;
  _hasHydrated: boolean;

  // Actions
  setAuth: (token: string, activeLab: string | null, user: AuthUser) => void;
  setActiveLab: (labId: string) => void;
  updateUser: (partialUser: Partial<AuthUser>) => void;
  setHasHydrated: (state: boolean) => void;
  logout: () => void;

  // Access Control & Auth Selectors
  isAuthenticated: () => boolean;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string | string[]) => boolean;
}

// ==========================================
// 2. AUTH ZUSTAND STORE
// ==========================================

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      activeLab: null,
      user: null,
      _hasHydrated: false,

      // Batch set session on successful Login / Token Refresh
      setAuth: (token, activeLab, user) =>
        set({
          token,
          activeLab: activeLab || user.default_lab || null,
          user,
        }),

      // Switch workspace / laboratory context
      setActiveLab: (activeLab) => set({ activeLab }),

      // Update user details (e.g., profile changes, theme)
      updateUser: (partialUser) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partialUser } : null,
        })),

      // Hydration state tracking for SSR safety
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      // Session Teardown
      logout: () => {
        set({ token: null, activeLab: null, user: null });
        if (typeof window !== 'undefined') {
          // Clear any non-Zustand residual session caches if applicable
          sessionStorage.clear();
        }
      },

      // Helpers
      isAuthenticated: () => {
        const { token, user } = get();
        return Boolean(token && user);
      },

      hasPermission: (permission: string) => {
        const { user } = get();
        if (!user || !Array.isArray(user.permissions)) return false;
        // Supports Wildcard admin access '*' or exact permission check
        return user.permissions.includes('*') || user.permissions.includes(permission);
      },

      hasRole: (roles: string | string[]) => {
        const { user } = get();
        if (!user) return false;
        const requiredRoles = Array.isArray(roles) ? roles : [roles];
        return requiredRoles.includes(user.role);
      },
    }),
    {
      name: 'lims-auth-storage',
      storage: createJSONStorage(() => localStorage),

      // 🛡️ SECURITY & CLEANLINESS:
      // Persists ONLY sensitive session keys. Excludes runtime flags like `_hasHydrated`.
      partialize: (state) => ({
        token: state.token,
        activeLab: state.activeLab,
        user: state.user,
      }),

      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
// import { create } from 'zustand';
// import { persist, createJSONStorage } from 'zustand/middleware';

// export interface AuthUser {
//   id: string;
//   email: string;
//   full_name: string;
//   mobile: string;
//   default_lab: string;
  
//   role: string;
//   permissions: string;
//   theme_preference: string;
// }

// interface AuthState {
//   token: string | null;
//   activeLab: string | null;
//   user: AuthUser | null;
//   _hasHydrated: boolean; // Tracks if localStorage has been read
  
//   setAuth: (token: string, activeLab: string | null, user: AuthUser) => void;
//   setActiveLab: (labId: string) => void;
//   setHasHydrated: (state: boolean) => void; 
//   logout: () => void;
// }

// export const useAuthStore = create<AuthState>()(
//   persist(
//     (set) => ({
//       token: null,
//       activeLab: null,
//       user: null,
//       _hasHydrated: false,
      
//       // NEW: Batch update for token and lab status
//       setAuth: (token, activeLab, user) => set({ token, activeLab, user }),
//       setActiveLab: (activeLab) => set({ activeLab }),
//       setHasHydrated: (state) => set({ _hasHydrated: state }),
      
//       logout: () => set({ token: null, activeLab: null, user: null }), 
//     }),
//     {
//       name: 'lims-auth-storage',
//       storage: createJSONStorage(() => localStorage), 
//       onRehydrateStorage: () => (state) => {
//         state?.setHasHydrated(true); 
//       },
//     }
//   )
// );

// import { create } from 'zustand';
// import { persist, createJSONStorage } from 'zustand/middleware';

// interface AuthState {
//   token: string | null;
//   activeLabId: string | null;
//   _hasHydrated: boolean; // NEW: Tracks if localStorage has been read
  
//   setToken: (token: string | null) => void;
//   setActiveLabId: (labId: string | null) => void;
//   setHasHydrated: (state: boolean) => void; // NEW
//   logout: () => void;
// }

// export const useAuthStore = create<AuthState>()(
//   persist(
//     (set) => ({
//       token: null,
//       activeLabId: null,
//       _hasHydrated: false,
      
//       setToken: (token) => set({ token }),
//       setActiveLabId: (activeLabId) => set({ activeLabId }),
//       setHasHydrated: (state) => set({ _hasHydrated: state }),
      
//       logout: () => set({ token: null, activeLabId: null }),
//     }),
//     {
//       name: 'lims-auth-storage',
//       storage: createJSONStorage(() => localStorage), 
//       // NEW: Automatically set _hasHydrated to true when localStorage is successfully read
//       onRehydrateStorage: () => (state) => {
//         state?.setHasHydrated(true);
//       },
//     }
//   )
// );