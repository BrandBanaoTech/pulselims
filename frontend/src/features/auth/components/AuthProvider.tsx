"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { authService } from "@/features/auth/api/auth.service";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { token, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!_hasHydrated || !token) return;

    // 🛡️ ENTERPRISE TTL CACHE: Check sessionStorage
    const lastVerified = sessionStorage.getItem("lims_last_verified");
    const now = Date.now();
    const TEN_MINUTES = 10 * 60 * 1000;

    // If verified within the last 10 minutes, skip the network call entirely!
    if (lastVerified && now - Number(lastVerified) < TEN_MINUTES) {
      return;
    }

    const verifyDatabaseStatus = async () => {
      try {
        await authService.verifySession();
        // Stamp current time so we don't spam the backend
        sessionStorage.setItem("lims_last_verified", now.toString());
      } catch (error) {
        // If user/lab is deleted, our global Axios interceptor (axios.ts) 
        // will automatically catch the 401/403, clear Zustand, and redirect.
      }
    };

    verifyDatabaseStatus();
  }, [_hasHydrated, token]);

  return <>{children}</>;
}

// "use client";

// import { useEffect } from "react";
// import { useAuthStore } from "@/store/useAuthStore";
// import { api } from "@/lib/axios";

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const { token, activeLab, _hasHydrated, updateUser, setActiveLab } = useAuthStore();

//   useEffect(() => {
//     // Only run this check if Zustand has loaded from localStorage AND a token exists
//     if (!_hasHydrated || !token) return;

//     const verifySession = async () => {
//       try {
//         // Silently hit the backend to verify the user still exists in the DB
//         const res = await api.get("/users/me");
//         const freshUser = res.data;
//         // Success: Update Zustand with fresh DB data (e.g., if their name/role changed)
//         updateUser(freshUser);

//         // 2. Verify the Active Lab still exists in the DB for this user
//         if (activeLab) {
//           // Assuming your backend returns an array of lab names or IDs like: user.labs = [{ name: "Apex" }]
//           const userHasAccessToLab = freshUser.labs?.some((lab: any) => lab.name === activeLab);
          
//           if (!userHasAccessToLab) {
//             // console.warn("Active lab was deleted from DB. Revoking access.");
//             setActiveLab(''); // This instantly triggers AuthGuard to redirect to /onboarding
//           }
//         }
//       } catch (error: any) {
//         // If the backend returns 401 (User deleted/disabled), the Axios Interceptor 
//         // we built in Step 1 will automatically catch it, call logout(), and redirect!
//         // console.error("Session verification failed.");
//       }
//     };

//     verifySession();
//   }, [_hasHydrated, token, updateUser]);

//   return <>{children}</>;
// }