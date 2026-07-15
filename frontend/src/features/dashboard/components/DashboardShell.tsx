"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  FlaskConical, 
  FileText, 
  Settings, 
  Menu, 
  X, 
  LogOut,
  Bell,
  HeartPulse
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

// ==========================================
// CLINICAL NAVIGATION SCHEMA
// ==========================================
const navigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Patient Intake", href: "/dashboard/patients", icon: Users },
  { name: "Test Catalog", href: "/dashboard/tests", icon: FlaskConical },
  { name: "Clinical Reports", href: "/dashboard/reports", icon: FileText },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuthStore();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu automatically when the route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout(); // Securely wipes Zustand memory & LocalStorage
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      
      {/* ========================================== */}
      {/* DESKTOP SIDEBAR */}
      {/* ========================================== */}
      <aside className="hidden lg:flex flex-col w-72 fixed inset-y-0 left-0 bg-slate-900 border-r border-slate-800 z-50">
        
        {/* Brand Header */}
        <div className="h-20 flex items-center px-8 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-teal-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
              <HeartPulse className="text-white" size={24} />
            </div>
            <span className="text-xl font-extrabold text-white tracking-tight">PulseLIMS</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
          <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Core Modules</p>
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
                  isActive 
                    ? "bg-teal-500/10 text-teal-400" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-800">
          <Link
            href="/dashboard/settings"
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all mb-2 ${
              pathname.includes("/settings") ? "bg-teal-500/10 text-teal-400" : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Settings size={20} />
            Workspace Settings
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all group"
          >
            <LogOut size={20} className="transition-transform group-hover:-translate-x-1" />
            Secure Logout
          </button>
        </div>
      </aside>

      {/* ========================================== */}
      {/* MOBILE DRAWER */}
      {/* ========================================== */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsMobileMenuOpen(false)} 
            aria-hidden="true"
          />
          
          {/* Drawer Menu */}
          <div className="relative flex flex-col w-72 max-w-[80%] bg-slate-900 h-full shadow-2xl animate-in slide-in-from-left-full duration-300">
            <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-tr from-teal-500 to-cyan-400 rounded-lg flex items-center justify-center">
                  <HeartPulse className="text-white" size={18} />
                </div>
                <span className="text-lg font-extrabold text-white">PulseLIMS</span>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)} 
                className="text-slate-400 hover:text-white transition-colors"
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
            </div>
            
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
                      isActive ? "bg-teal-500/10 text-teal-400" : "text-slate-400 hover:bg-slate-800"
                    }`}
                  >
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            
            <div className="p-4 border-t border-slate-800">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={20} />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MAIN CONTENT AREA */}
      {/* ========================================== */}
      <main className="flex-1 flex flex-col min-w-0 lg:pl-72">
        
        {/* TOP HEADER */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 z-40 sticky top-0 shadow-sm shadow-slate-100/50">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-extrabold text-slate-900 hidden sm:block">
              {navigation.find(n => pathname === n.href || pathname.startsWith(`${n.href}/`))?.name || "Workspace"}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="flex-1 p-4 sm:p-8 relative">
          <div className="max-w-7xl mx-auto w-full relative z-10">
            {children}
          </div>
        </div>
        
      </main>
    </div>
  );
}