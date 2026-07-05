import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  activeLabId: string | null;
  _hasHydrated: boolean; // NEW: Tracks if localStorage has been read
  
  setToken: (token: string | null) => void;
  setActiveLabId: (labId: string | null) => void;
  setHasHydrated: (state: boolean) => void; // NEW
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      activeLabId: null,
      _hasHydrated: false,
      
      setToken: (token) => set({ token }),
      setActiveLabId: (activeLabId) => set({ activeLabId }),
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      
      logout: () => set({ token: null, activeLabId: null }),
    }),
    {
      name: 'lims-auth-storage',
      storage: createJSONStorage(() => localStorage), 
      // NEW: Automatically set _hasHydrated to true when localStorage is successfully read
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);