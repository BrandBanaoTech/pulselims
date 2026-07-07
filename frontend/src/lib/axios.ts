// # Global Axios instance & interceptors

import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

// Initialize Axios
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Inject JWT and X-Lab-ID
api.interceptors.request.use(
  (config) => {
    // Access Zustand state outside of React components
    const { token, activeLabId } = useAuthStore.getState();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (activeLabId) {
      config.headers['X-Lab-ID'] = activeLabId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle global errors (e.g., 401 Unauthorized)
api.interceptors.response.use(
  (response) => {
    // Any status code that lies within the range of 2xx causes this function to trigger
    return response;
  },
  (error) => {
    const originalRequest = error.config;

    // ENTERPRISE UPGRADE: Prevent infinite reload loops if the 401 came from the login endpoint itself
    if (originalRequest?.url?.includes('/login') || originalRequest?.url?.includes('/auth')) {
      return Promise.reject(error);
    }
    // Any status codes that falls outside the range of 2xx causes this function to trigger
    if (error.response) {
      // Handle Token Expiry / Unauthorized Access
      if (error.response.status === 401) {
        console.warn('Unauthorized access - logging out.');
        useAuthStore.getState().logout();
        
        // Optional: You can trigger a hard redirect to the login page here
        if (typeof window !== 'undefined') {
           window.location.href = '/login';
        }
      }
      
      // Handle Missing Lab ID / Forbidden
      if (error.response.status === 403) {
         console.warn('Forbidden: Check RBAC permissions or X-Lab-ID header.');
      }
    }
    
    return Promise.reject(error);
  }
);