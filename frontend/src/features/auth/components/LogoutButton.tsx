"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useState } from "react";

export function LogoutButton() {
  const logout = useAuthStore((state) => state.logout);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    setIsLoggingOut(true);
    
    // 1. Wipe the JWT and Active Lab ID from Zustand / localStorage
    logout();
    
    // 2. SECURITY CRITICAL: Hard redirect to wipe all React memory, 
    // Apollo/SWR/React Query caches, and DOM history.
    window.location.href = "/login";
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-slate-300 hover:bg-red-500/10 hover:text-red-500 transition-colors border border-transparent hover:border-red-500/20 disabled:opacity-50"
    >
      <svg 
        className="w-5 h-5" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      <span className="font-medium">{isLoggingOut ? "Ending Session..." : "Sign Out"}</span>
    </button>
  );
}