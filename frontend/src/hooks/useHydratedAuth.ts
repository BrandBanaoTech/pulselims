import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

export function useHydratedAuth() {
  const store = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(store._hasHydrated);
  }, [store._hasHydrated]);

  return {
    ...store,
    isReady: isHydrated,
  };
}

// // How to use RBAC in your components / routes:
// import { useAuthStore } from '@/store/useAuthStore';

// export function CreateTestButton() {
//   const hasPermission = useAuthStore((state) => state.hasPermission);
//   const isAuthenticated = useAuthStore((state) => state.isAuthenticated());

//   if (!isAuthenticated || !hasPermission('manage_tests')) {
//     return null; // Hide button if unauthorized
//   }

//   return <button>Add Parameter</button>;
// }