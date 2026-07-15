"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { HeartPulse } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { authService } from "@/features/auth/api/auth.service";

interface AuthGuardProps {
  children: React.ReactNode;
  requireActiveLab?: boolean;
}

export function AuthGuard({ children, requireActiveLab = true }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  const { token, activeLabId, _hasHydrated, logout } = useAuthStore();
  const [isAuthorized, setIsAuthorized] = useState(false);
  console.log( 'lab -> ' + activeLabId)
  const isCheckingRef = useRef(false);

  useEffect(() => {
    // 1. Wait for Store Hydration
    if (!_hasHydrated) return;
    if (isCheckingRef.current) return;

    const executeSecurityCheck = async () => {
      isCheckingRef.current = true;

      try {
        // A. If no token, bounce to login
        if (!token) {
          throw new Error("No token");
        }

        // B. Verify Session/Refresh Token
        // This validates that the token is alive and session is active
        await authService.verifySession();

        // C. Multi-Tenant Routing Engine
        // IF activeLabId IS NULL (New user or user without access)
        if (!activeLabId) {
          if (requireActiveLab) {
            router.replace("/onboarding");
            return;
          }
        } 
        // IF activeLabId EXISTS (Standard user)
        else {
          // If they try to hit /onboarding but already have a lab, kick them to dashboard
          if (pathname === "/onboarding") {
            router.replace("/dashboard");
            return;
          }
        }

        setIsAuthorized(true);
      } catch (error) {
        logout();
        router.replace("/login");
      } finally {
        isCheckingRef.current = false;
      }
    };

    executeSecurityCheck();
  }, [token, activeLabId, _hasHydrated, router, pathname, logout, requireActiveLab]);

  if (!isAuthorized || !_hasHydrated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <HeartPulse className="text-teal-600 animate-pulse" size={40} />
      </div>
    );
  }

  return <>{children}</>;
}

// // "use client";

// // import { useEffect, useState } from "react";
// // import { useRouter, usePathname } from "next/navigation";
// // import { useAuthStore } from "@/store/useAuthStore";
// // import { jwtDecode } from "jwt-decode";
// // import { JwtPayload } from "@/types/auth";

// // interface AuthGuardProps {
// //   children: React.ReactNode;
// //   requireActiveLab?: boolean; // NEW: Allows us to bypass lab checks for onboarding
// // }

// // export function AuthGuard({ children, requireActiveLab = true }: AuthGuardProps) {
// //   const router = useRouter();
// //   const pathname = usePathname();
// //   const { token, activeLabId, _hasHydrated, setActiveLabId, logout } = useAuthStore();
// //   const [isAuthorized, setIsAuthorized] = useState(false);

// //   useEffect(() => {
// //     // 1. DO NOTHING UNTIL ZUSTAND HAS FINISHED READING LOCALSTORAGE
// //     if (!_hasHydrated) return;

// //     // 1. If there is no token at all, boot them to login
// //     if (!token) {
// //       router.replace("/login");
// //       return;
// //     }

// //     try {
// //       // 2. Decode the JWT to check expiration and tenant permissions
// //       const decoded = jwtDecode<JwtPayload>(token);
// //       const currentTime = Date.now() / 1000;

// //       if (decoded.exp < currentTime) {
// //         // Token is expired
// //         logout();
// //         router.replace("/login");
// //         return;
// //       }

// //       // Check Tenant Permissions
// //       // const availableLabs = Object.keys(decoded.lab_permissions || {});

// //       // if (availableLabs.length === 0) {
// //       //   if (requireActiveLab) {
// //       //     console.warn("User has no workspaces. Redirecting to onboarding...");
// //       //     router.replace("/onboarding");
// //       //     return;
// //       //   }
// //       // }
// //       // // User HAS labs, but hasn't selected one in this session yet
// //       // else if (!activeLabId) {
// //       //   setActiveLabId(availableLabs[0]); // Auto-select the first available lab
// //       // }

// //       // If they are on the onboarding page but already have a lab, 
// //       // you might want to redirect them to the dashboard (optional, but good UX)
// //       // if (pathname === "/onboarding" && availableLabs.length > 0 && !requireActiveLab) {
// //       //    router.replace("/dashboard");
// //       //    return;
// //       // }


// //       // 3. Multi-Tenant Initialization
// //       // If the user doesn't have an active lab selected yet, auto-select the first one available
// //       // if (!activeLabId) {
// //       //   const availableLabs = Object.keys(decoded.lab_permissions || {});
        
// //       //   if (availableLabs.length > 0) {
// //       //     setActiveLabId(availableLabs[0]); // Sets the X-Lab-ID for Axios
// //       //   } else {
// //       //     console.warn("User has no lab permissions.");
// //       //     // Optional: redirect to a "Create your first lab" onboarding screen here
// //       //   }
// //       // }

// //       // User is verified and workspace is initialized
// //       setIsAuthorized(true);

// //     } catch (error) {
// //       // Token is malformed
// //       logout();
// //       router.replace("/login");
// //     }
// //   }, [token, activeLabId, _hasHydrated, router, pathname, logout, setActiveLabId, requireActiveLab]);

// //   // Show a blank screen or a sleek loading spinner while validating
// //   // If not authorized OR hasn't finished hydrating, show the loading spinner
// //   if (!isAuthorized || !_hasHydrated) {
// //     return (
// //       <div className="min-h-screen flex items-center justify-center bg-slate-50">
// //         <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
// //       </div>
// //     );
// //   }

// //   return <>{children}</>;
// // }

// "use client";

// import { useEffect, useState, useRef } from "react";
// import { useRouter, usePathname } from "next/navigation";
// import { jwtDecode } from "jwt-decode";
// import { HeartPulse } from "lucide-react";

// import { useAuthStore } from "@/store/useAuthStore";
// import { authService } from "@/features/auth/api/auth.service";
// import { JwtPayload } from "@/types/auth"; // Ensure this matches your JWT structure

// interface AuthGuardProps {
//   children: React.ReactNode;
//   requireActiveLab?: boolean;
// }

// export function AuthGuard({ children, requireActiveLab = true }: AuthGuardProps) {
//   const router = useRouter();
//   const pathname = usePathname();
  
//   const { token, setToken, activeLabId, _hasHydrated, setActiveLabId, logout } = useAuthStore();
  
//   const [isAuthorized, setIsAuthorized] = useState(false);
  
//   // 🛡️ SECURITY LOCK: Prevents React StrictMode from blasting the API twice
//   // and prevents infinite loops when setting the activeLabId.
//   const isCheckingRef = useRef(false);

//   useEffect(() => {
//     // 1. Wait for Zustand to read from LocalStorage
//     if (!_hasHydrated) return;
    
//     // Halt if a security check is already actively running
//     if (isCheckingRef.current) return;

//     const executeSecurityCheck = async () => {
//       isCheckingRef.current = true;

//       try {
//         let currentToken = token;
//         let needsRefresh = false;

//         // 2. Token Validation Logic
//         if (!currentToken) {
//           needsRefresh = true;
//         } else {
//           try {
//             const decoded = jwtDecode<JwtPayload>(currentToken);
//             const currentTime = Date.now() / 1000;
            
//             // If token expires in the next 30 seconds, refresh it now
//             if (decoded.exp < currentTime + 30) {
//               needsRefresh = true;
//             }
//           } catch {
//             needsRefresh = true; // Malformed token
//           }
//         }

//         // 3. Silent Background Refresh
//         if (needsRefresh) {
//           try {
//             const response = await authService.refreshToken();
//             if (response?.access_token) {
//               setToken(response.access_token);
//               currentToken = response.access_token;
//             } else {
//               throw new Error("Missing access token in refresh payload.");
//             }
//           } catch (error) {
//             // Refresh failed (user is truly logged out or token is dead)
//             logout();
//             router.replace("/login");
//             return;
//           }
//         }

//         // 4. Multi-Tenant Routing Engine
//         if (!currentToken) throw new Error("No token available after refresh");
        
//         const decoded = jwtDecode<JwtPayload>(currentToken);
//         // Safely extract labs (fallback to empty object if undefined)
//         const availableLabIds = Object.keys(decoded.lab_permissions || {});

//         // RULE A: ZERO LABS
//         if (availableLabIds.length === 0) {
//           if (requireActiveLab) {
//             router.replace("/onboarding");
//             return;
//           }
//         } 
//         // RULE B: HAS LABS
//         else {
//           // If trying to view onboarding but already has a lab, boot to dashboard
//           if (pathname === "/onboarding" && !requireActiveLab) {
//              router.replace("/dashboard");
//              return;
//           }

//           // If store is out of sync with the JWT, auto-select their first available lab
//           if (!activeLabId || !availableLabIds.includes(activeLabId)) {
//             setActiveLabId(availableLabIds[0]); 
//           }
//         }

//         // Passed all DB checks and Tenant checks! Unveil the UI.
//         setIsAuthorized(true);

//       } catch (error) {
//         logout();
//         router.replace("/login");
//       } finally {
//         // Release the lock so route changes can re-trigger checks if needed
//         isCheckingRef.current = false;
//       }
//     };

//     executeSecurityCheck();

//   // Notice we removed `activeLabId` and `setToken` from dependencies 
//   // to prevent infinite re-rendering loops!
//   }, [token, _hasHydrated, router, pathname, logout, requireActiveLab]);

//   // ==========================================
//   // SECURE LOADING STATE
//   // ==========================================
//   if (!isAuthorized || !_hasHydrated) {
//     return (
//       <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
//         <HeartPulse className="text-teal-600 animate-pulse" size={40} />
//       </div>
//     );
//   }

//   return <>{children}</>;
// }