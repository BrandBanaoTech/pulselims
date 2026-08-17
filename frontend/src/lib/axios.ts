import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/lib/toast';

// ==========================================
// ENTERPRISE STATE LOCKS
// ==========================================
// Prevents rapid-fire toasts and infinite redirect loops if multiple 
// widgets fail simultaneously (e.g., 5 dashboard graphs hit a 401 at once)
let isRedirecting = false;

// ==========================================
// INSTANCE CONFIGURATION
// ==========================================
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Fail-fast timeout (15s) to prevent infinite loading states if the backend dies
  timeout: 15000, 
});

// ==========================================
// 1. REQUEST INTERCEPTOR (The Injector)
// ==========================================
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Dynamically pull the latest state right before the request fires
    const { token, activeLab } = useAuthStore.getState();

    // Safely inject Auth Token using Axios config setter
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }

    // Inject Multi-Tenant Lab Context (Tenant Isolation)
    if (activeLab) {
      config.headers.set('X-Lab-ID', activeLab);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ==========================================
// 2. RESPONSE INTERCEPTOR (The Shield)
// ==========================================
api.interceptors.response.use(
  (response) => {
    // 2xx status codes pass through successfully
    return response;
  },
  (error: AxiosError) => {
    // Gracefully handle cancelled requests (e.g., component unmounts during fetch)
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    const originalRequest = error.config;

    // ---------------------------------------------------------
    // SCENARIO 1: BYPASS AUTH ROUTES
    // Never intercept failed logins/registrations to prevent infinite loops
    // ---------------------------------------------------------
    if (originalRequest?.url?.includes('/login') || originalRequest?.url?.includes('/auth')) {
      return Promise.reject(error);
    }

    // ---------------------------------------------------------
    // SCENARIO 2: PURE NETWORK DROPS & TIMEOUTS
    // ---------------------------------------------------------
    if (!error.response) {
      if (!isRedirecting && typeof window !== 'undefined') {
        if (error.code === 'ECONNABORTED') {
          toast.error("Request Timed Out", "The server is taking too long to respond.");
        } else {
          toast.error("Network Error", "Cannot connect to the server. Please check your internet connection.");
        }
      }
      return Promise.reject(error);
    }

    const status = error.response.status;
    const responseData = error.response.data as any;

    // ---------------------------------------------------------
    // FASTAPI ERROR NORMALIZATION
    // Safely extract the error detail (handles both strings and Pydantic arrays)
    // ---------------------------------------------------------
    const errorDetail = typeof responseData?.detail === 'string' 
      ? responseData.detail.toLowerCase() 
      : JSON.stringify(responseData?.detail || '').toLowerCase();
      
    // ---------------------------------------------------------
    // SCENARIO 3: LAB DELETED (404 or 403)
    // ---------------------------------------------------------
    // Check if the 404 or 403 specifically mentions the lab/workspace being missing.
    const isLabMissingError = 
      (status === 403 || status === 404) && 
      (errorDetail.includes('lab') || errorDetail.includes('workspace') || errorDetail.includes('tenant'));

    // Safely check Axios 1.x header normalization (case-insensitive)
    const hasLabIdHeader = originalRequest?.headers && (
      originalRequest.headers.has?.('X-Lab-ID') || 
      originalRequest.headers['x-lab-id'] || 
      originalRequest.headers['X-Lab-ID']
    );

    if (isLabMissingError) {
      if (hasLabIdHeader && !isRedirecting) {
         // Instantly wipe the active lab from Zustand
         useAuthStore.getState().setActiveLab(''); 
         
         if (typeof window !== 'undefined' && !window.location.pathname.includes('/onboarding')) {
           toast.warning("Workspace Unavailable", "This Labspace was deleted or no longer exists.");
           window.location.href = '/onboarding';
         }
      }
      return Promise.reject(error);
    }

    // ---------------------------------------------------------
    // SCENARIO 4: UNAUTHORIZED (401)
    // User was deleted, disabled, or session expired globally.
    // ---------------------------------------------------------
    if (status === 401 && !isRedirecting) {
      isRedirecting = true;
      
      // Instantly wipe frontend memory (tokens, user, lab)
      useAuthStore.getState().logout();
      
      // Ensure we aren't already on the login page
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        toast.error("Session Expired", "Your session has expired. Please log in again.");
        
        // Brief 500ms delay so the user can read the toast before the screen goes blank
        setTimeout(() => { 
          window.location.href = '/login'; 
        }, 500);
      } else {
        isRedirecting = false; // Release lock if already on login
      }
      
      return Promise.reject(error);
    } 

    // ---------------------------------------------------------
    // SCENARIO 5: STANDARD FORBIDDEN / ACCESS REVOKED (403)
    // ---------------------------------------------------------
    if (status === 403) {
      // Normal RBAC violation (e.g., trying to view billing without Admin role)
      toast.error("Access Denied", "You do not have the required permissions for this action.");
      return Promise.reject(error);
    }

    // ---------------------------------------------------------
    // SCENARIO 6: RATE LIMITING (429)
    // ---------------------------------------------------------
    if (status === 429) {
      toast.warning("Too Many Requests", "You are performing actions too quickly. Please slow down.");
      return Promise.reject(error);
    }

    // ---------------------------------------------------------
    // SCENARIO 7: INTERNAL SERVER ERRORS (500+)
    // ---------------------------------------------------------
    if (status >= 500) {
      toast.error("System Error", "The server encountered an unexpected error. Our team has been notified.");
      return Promise.reject(error);
    }

    // Return all other standard errors (400, 422, 404) back to the component to handle (e.g. form validation errors)
    return Promise.reject(error);
  }
);

// // # Global Axios instance & interceptors

// import axios from 'axios';
// import { useAuthStore } from '@/store/useAuthStore';
// import { toast } from '@/lib/toast'; // Import your global toast helper

// // Enterprise Lock: Prevents rapid-fire redirects if multiple parallel API calls fail at once
// let isRedirecting = false;

// // Initialize Axios
// export const api = axios.create({
//   baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
//   headers: {
//     'Content-Type': 'application/json',
//     'Accept': 'application/json',
//   },
//   // Enterprise Standard: Fail fast if the backend hangs, preventing infinite UI loading states
//   timeout: 15000, 
// });

// // ==========================================
// // 1. REQUEST INTERCEPTOR
// // ==========================================
// api.interceptors.request.use(
//   (config) => {
//     // Access Zustand state outside of React components
//     const { token, activeLab } = useAuthStore.getState();

//     // Inject Bearer Token
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }

//     // Inject Multi-Tenant Lab Context
//     if (activeLab) {
//       config.headers['X-Lab-ID'] = activeLab;
//     }

//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// // ==========================================
// // 2. RESPONSE INTERCEPTOR
// // ==========================================
// api.interceptors.response.use(
//   (response) => {
//     // Any status code within 2xx triggers this function
//     return response;
//   },
//   (error) => {
//     const originalRequest = error.config;

//     // SCENARIO 1: Bypass for Auth Routes (Prevents infinite loops if /login fails)
//     if (originalRequest?.url?.includes('/login') || originalRequest?.url?.includes('/auth')) {
//       return Promise.reject(error);
//     }

//     // SCENARIO 2: Pure Network Error / CORS / Server Offline
//     if (!error.response) {
//       if (!isRedirecting && typeof window !== 'undefined') {
//         toast.error("Network Error", "Cannot connect to the server. Please check your internet connection.");
//       }
//       return Promise.reject(error);
//     }

//     const status = error.response.status;

//     // SCENARIO 3: Unauthorized (Token expired, user deleted, or logged out from another device)
//     if (status === 401 && !isRedirecting) {
//       isRedirecting = true;
//       console.warn('Unauthorized access - wiping session and redirecting.');
      
//       // Wipe Zustand Store completely
//       useAuthStore.getState().logout();
      
//       // Check to ensure we aren't already on the login page to avoid flicker
//       if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
//         toast.error("Session Expired", "Your session has expired or your access was modified. Please log in again.");
        
//         // 500ms delay allows the user to actually see the Toast before the hard redirect
//         setTimeout(() => {
//           window.location.href = '/login';
//         }, 500);
//       } else {
//         // Unlock if already on login
//         isRedirecting = false; 
//       }
//     } 
    
//     // SCENARIO 4: Forbidden (Valid token, but lacks specific RBAC/Lab privileges)
//     else if (status === 403) {
//       // console.warn('Forbidden: Check RBAC permissions or X-Lab-ID header.');
      
//       // Sub-Scenario 4A: The backend rejected their active Lab ID (Lab deleted or user removed from lab)
//       if (originalRequest.headers['X-Lab-ID'] && !isRedirecting) {
//          // Wipe the active lab from Zustand, but keep them logged in
//          useAuthStore.getState().setActiveLab(''); 
         
//          if (typeof window !== 'undefined' && !window.location.pathname.includes('/onboarding')) {
//            toast.warning("Workspace Access Revoked", "You no longer have access to this Labspace.");
//            window.location.href = '/onboarding';
//          }
//       } 
//       // Sub-Scenario 4B: General RBAC violation (e.g., Technician trying to access Admin Billing)
//       else {
//         toast.error("Access Denied", "You do not have the required permissions for this action.");
//       }
//     }

//     // Return the error so the individual component's try/catch block can handle UI specific loading states
//     return Promise.reject(error);
//   }
// );

// // import axios from 'axios';
// // import { useAuthStore } from '@/store/useAuthStore';
// // import { toast } from '@/lib/toast'; // Your toast helper

// // const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// // export const api = axios.create({
// //   baseURL: API_BASE_URL,
// //   headers: { 'Content-Type': 'application/json' },
// // });

// // // 1. Inject Token into every request
// // api.interceptors.request.use((config) => {
// //   const token = useAuthStore.getState().token;
// //   const activeLab = useAuthStore.getState().activeLab;

// //   if (token) config.headers.Authorization = `Bearer ${token}`;
  
// //   // Pass active lab context to backend if needed
// //   if (activeLab) config.headers['X-Lab-Context'] = activeLab; 

// //   return config;
// // });

// // // 2. Globally Catch DB Deletions / Revoked Access
// // api.interceptors.response.use(
// //   (response) => response,
// //   (error) => {
// //     const status = error.response?.status;

// //     if (status === 401) {
// //       // SCENARIO 1: User deleted in DB, Disabled, or Token Expired
// //       useAuthStore.getState().logout();
      
// //       // Prevent redirect loop if they are already on login
// //       if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
// //         toast.error("Session Expired", "Your account access was revoked or expired.");
// //         window.location.href = '/login';
// //       }
// //     } 
// //     else if (status === 403) {
// //       // SCENARIO 2: Lab deleted, or User removed from this specific lab
// //       // Don't log them out entirely, just clear the lab context and force onboarding
// //       useAuthStore.getState().setActiveLab('');
      
// //       if (typeof window !== 'undefined' && !window.location.pathname.includes('/onboarding')) {
// //         toast.warning("Access Revoked", "You no longer have access to this Labspace.");
// //         window.location.href = '/onboarding';
// //       }
// //     }

// //     return Promise.reject(error);
// //   }
// // );

// // // # Global Axios instance & interceptors

// // import axios from 'axios';
// // import { useAuthStore } from '@/store/useAuthStore';

// // // Initialize Axios
// // export const api = axios.create({
// //   baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
// //   headers: {
// //     'Content-Type': 'application/json',
// //   },
// // });

// // // Request Interceptor: Inject JWT and X-Lab-ID
// // api.interceptors.request.use(
// //   (config) => {
// //     // Access Zustand state outside of React components
// //     const { token, activeLab } = useAuthStore.getState();

// //     if (token) {
// //       config.headers.Authorization = `Bearer ${token}`;
// //     }

// //     if (activeLab) {
// //       config.headers['X-Lab-ID'] = activeLab;
// //     }

// //     return config;
// //   },
// //   (error) => {
// //     return Promise.reject(error);
// //   }
// // );

// // // Response Interceptor: Handle global errors (e.g., 401 Unauthorized)
// // api.interceptors.response.use(
// //   (response) => {
// //     // Any status code that lies within the range of 2xx causes this function to trigger
// //     return response;
// //   },
// //   (error) => {
// //     const originalRequest = error.config;

// //     // ENTERPRISE UPGRADE: Prevent infinite reload loops if the 401 came from the login endpoint itself
// //     if (originalRequest?.url?.includes('/login') || originalRequest?.url?.includes('/auth')) {
// //       return Promise.reject(error);
// //     }
// //     // Any status codes that falls outside the range of 2xx causes this function to trigger
// //     if (error.response) {
// //       // Handle Token Expiry / Unauthorized Access
// //       if (error.response.status === 401) {
// //         console.warn('Unauthorized access - logging out.');
// //         useAuthStore.getState().logout();
        
// //         // Optional: You can trigger a hard redirect to the login page here
// //         if (typeof window !== 'undefined') {
// //            window.location.href = '/login';
// //         }
// //       }
      
// //       // Handle Missing Lab ID / Forbidden
// //       if (error.response.status === 403) {
// //          console.warn('Forbidden: Check RBAC permissions or X-Lab-ID header.');
// //       }
// //     }
    
// //     return Promise.reject(error);
// //   }
// // );