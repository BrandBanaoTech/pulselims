// "use client";

// import { useEffect, useState } from "react";
// import { useRouter, usePathname } from "next/navigation";
// import { useAuthStore } from "@/store/useAuthStore";
// import { jwtDecode } from "jwt-decode";
// import { JwtPayload } from "@/types/auth";

// interface AuthGuardProps {
//   children: React.ReactNode;
//   requireActiveLab?: boolean; // NEW: Allows us to bypass lab checks for onboarding
// }

// export function AuthGuard({ children, requireActiveLab = true }: AuthGuardProps) {
//   const router = useRouter();
//   const pathname = usePathname();
//   const { token, activeLabId, _hasHydrated, setActiveLabId, logout } = useAuthStore();
//   const [isAuthorized, setIsAuthorized] = useState(false);

//   useEffect(() => {
//     // 1. DO NOTHING UNTIL ZUSTAND HAS FINISHED READING LOCALSTORAGE
//     if (!_hasHydrated) return;

//     // 1. If there is no token at all, boot them to login
//     if (!token) {
//       router.replace("/login");
//       return;
//     }

//     try {
//       // 2. Decode the JWT to check expiration and tenant permissions
//       const decoded = jwtDecode<JwtPayload>(token);
//       const currentTime = Date.now() / 1000;

//       if (decoded.exp < currentTime) {
//         // Token is expired
//         logout();
//         router.replace("/login");
//         return;
//       }

//       // Check Tenant Permissions
//       // const availableLabs = Object.keys(decoded.lab_permissions || {});

//       // if (availableLabs.length === 0) {
//       //   if (requireActiveLab) {
//       //     console.warn("User has no workspaces. Redirecting to onboarding...");
//       //     router.replace("/onboarding");
//       //     return;
//       //   }
//       // }
//       // // User HAS labs, but hasn't selected one in this session yet
//       // else if (!activeLabId) {
//       //   setActiveLabId(availableLabs[0]); // Auto-select the first available lab
//       // }

//       // If they are on the onboarding page but already have a lab, 
//       // you might want to redirect them to the dashboard (optional, but good UX)
//       // if (pathname === "/onboarding" && availableLabs.length > 0 && !requireActiveLab) {
//       //    router.replace("/dashboard");
//       //    return;
//       // }


//       // 3. Multi-Tenant Initialization
//       // If the user doesn't have an active lab selected yet, auto-select the first one available
//       // if (!activeLabId) {
//       //   const availableLabs = Object.keys(decoded.lab_permissions || {});
        
//       //   if (availableLabs.length > 0) {
//       //     setActiveLabId(availableLabs[0]); // Sets the X-Lab-ID for Axios
//       //   } else {
//       //     console.warn("User has no lab permissions.");
//       //     // Optional: redirect to a "Create your first lab" onboarding screen here
//       //   }
//       // }

//       // User is verified and workspace is initialized
//       setIsAuthorized(true);

//     } catch (error) {
//       // Token is malformed
//       logout();
//       router.replace("/login");
//     }
//   }, [token, activeLabId, _hasHydrated, router, pathname, logout, setActiveLabId, requireActiveLab]);

//   // Show a blank screen or a sleek loading spinner while validating
//   // If not authorized OR hasn't finished hydrating, show the loading spinner
//   if (!isAuthorized || !_hasHydrated) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-slate-50">
//         <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
//       </div>
//     );
//   }

//   return <>{children}</>;
// }

"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { authService } from "@/features/auth/api/auth.service";
import { jwtDecode } from "jwt-decode";
import { JwtPayload } from "@/types/auth";
import { HeartPulse } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  requireActiveLab?: boolean;
}

export function AuthGuard({ children, requireActiveLab = true }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, setToken, activeLabId, _hasHydrated, setActiveLabId, logout } = useAuthStore();
  
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // 1. Wait for Zustand to read from LocalStorage
    if (!_hasHydrated) return;

    const executeSecurityCheck = async () => {
      let currentToken = token;
      let needsRefresh = false;

      // 2. Token Validation Logic
      if (!currentToken) {
        needsRefresh = true;
      } else {
        try {
          const decoded = jwtDecode<JwtPayload>(currentToken);
          const currentTime = Date.now() / 1000;
          // If token expires in the next 30 seconds, refresh it now
          if (decoded.exp < currentTime + 30) {
            needsRefresh = true;
          }
        } catch {
          needsRefresh = true; // Malformed token
        }
      }

      // 3. Silent Background Refresh
      if (needsRefresh) {
        try {
          const response = await authService.refreshToken();
          if (response?.access_token) {
            setToken(response.access_token);
            currentToken = response.access_token;
          } else {
            throw new Error("Missing access token in refresh payload.");
          }
        } catch (error) {
          // Refresh failed (user is truly logged out or token is dead)
          logout();
          router.replace("/login");
          return;
        }
      }

      // 4. Multi-Tenant Routing Engine
      try {
        const decoded = jwtDecode<JwtPayload>(currentToken!);
        const availableLabIds = Object.keys(decoded.lab_permissions || {});

        // A. ZERO LABS: Force Onboarding
        if (availableLabIds.length === 0) {
          if (requireActiveLab) {
            router.replace("/onboarding");
            return;
          }
        } 
        // B. HAS LABS: Route to Dashboard & Sync State
        else {
          // If they are trying to view onboarding but already have a lab, boot them to dashboard
          if (pathname === "/onboarding" && !requireActiveLab) {
             router.replace("/dashboard");
             return;
          }

          // If store is out of sync with the JWT, auto-select their first available lab
          if (!activeLabId || !availableLabIds.includes(activeLabId)) {
            setActiveLabId(availableLabIds[0]); 
          }
        }

        // Passed all checks!
        setIsAuthorized(true);
      } catch (error) {
        logout();
        router.replace("/login");
      }
    };

    executeSecurityCheck();

  }, [token, activeLabId, _hasHydrated, router, pathname, logout, setActiveLabId, setToken, requireActiveLab]);

  // 5. Secure Loading State (Prevents UI flashing)
  if (!isAuthorized || !_hasHydrated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <HeartPulse className="text-teal-600 animate-pulse" size={40} />
      </div>
    );
  }

  return <>{children}</>;
}