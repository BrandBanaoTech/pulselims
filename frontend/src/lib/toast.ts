import { useToastStore } from '@/store/useToastStore';

export const toast = {
  success: (message: string, description?: string) => 
    useToastStore.getState().addToast({ type: 'success', message, description }),
    
  error: (message: string, description?: string) => 
    useToastStore.getState().addToast({ type: 'error', message, description }),
    
  info: (message: string, description?: string) => 
    useToastStore.getState().addToast({ type: 'info', message, description }),
    
  warning: (message: string, description?: string) => 
    useToastStore.getState().addToast({ type: 'warning', message, description }),
};