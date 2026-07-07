// "use client";

// import { useState } from "react";
// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import { Activity, Users, Plus, History, Layers, Settings, Menu, X } from "lucide-react";
// import { TenantSwitcher } from "@/features/auth/components/TenantSwitcher";
// import { LogoutButton } from "@/features/auth/components/LogoutButton";
// import { useAuthStore } from "@/store/useAuthStore";
// import { jwtDecode } from "jwt-decode";
// import { JwtPayload } from "@/types/auth";

// interface DashboardShellProps {
//   children: React.ReactNode;
// }

// export function DashboardShell({ children }: DashboardShellProps) {
//   const pathname = usePathname();
//   const { token } = useAuthStore();
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

//   // Safely extract user email from the stateless JWT
//   const decoded = token ? jwtDecode<JwtPayload>(token) : null;
//   const userEmail = decoded?.email || "Staff User";

//   const navItems = [
//     { href: "/dashboard", label: "Directory", icon: Users },
//     { href: "/dashboard/intake", label: "New Intake", icon: Plus },
//     { href: "/dashboard/history", label: "History", icon: History },
//     { href: "/dashboard/tests", label: "Tests Library", icon: Layers },
//     { href: "/dashboard/settings", label: "Settings", icon: Settings },
//   ];

//   return (
//     <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      
//       {/* --- MOBILE DRAWER OVERLAY --- */}
//       {isMobileMenuOpen && (
//         <div className="md:hidden fixed inset-0 z-50 flex">
//           <div 
//             className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" 
//             onClick={() => setIsMobileMenuOpen(false)}
//           />
//           <aside className="relative w-72 bg-white flex flex-col shadow-2xl animate-in slide-in-from-left duration-300">
//             <div className="p-4 flex items-center justify-between border-b border-slate-100">
//               <div className="flex items-center gap-2">
//                 <div className="p-2 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/20">
//                   <Activity size={20} strokeWidth={2.5} />
//                 </div>
//                 <span className="font-bold text-lg tracking-tight">PulseLIMS</span>
//               </div>
//               <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
//                 <X size={20} />
//               </button>
//             </div>
            
//             <div className="p-4 border-b border-slate-100">
//               <TenantSwitcher />
//             </div>

//             <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
//               {navItems.map((item) => {
//                 const isActive = pathname === item.href;
//                 return (
//                   <Link
//                     key={item.href}
//                     href={item.href}
//                     onClick={() => setIsMobileMenuOpen(false)}
//                     className={`flex items-center gap-3 p-3 rounded-xl transition-all font-semibold ${
//                       isActive 
//                         ? 'bg-blue-50 text-blue-700 border border-blue-100' 
//                         : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
//                     }`}
//                   >
//                     <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
//                     <span>{item.label}</span>
//                   </Link>
//                 );
//               })}
//             </nav>
//             <div className="p-4 border-t border-slate-100">
//                <LogoutButton />
//             </div>
//           </aside>
//         </div>
//       )}

//       {/* --- DESKTOP SIDEBAR --- */}
//       <aside className="hidden md:flex flex-col w-20 lg:w-72 bg-white border-r border-slate-200 z-30 transition-all duration-300 shadow-sm">
//         <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-100 shrink-0">
//           <div className="flex items-center gap-3">
//             <div className="p-2 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/20">
//               <Activity size={24} strokeWidth={2.5} />
//             </div>
//             <div className="hidden lg:block">
//               <h1 className="text-lg font-bold tracking-tight leading-none">Pulse<span className="text-blue-600">LIMS</span></h1>
//               <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Diagnostic Hub</p>
//             </div>
//           </div>
//         </div>

//         <div className="hidden lg:block p-4 border-b border-slate-100">
//           <TenantSwitcher />
//         </div>

//         <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
//           {navItems.map((item) => {
//             const isActive = pathname === item.href;
//             return (
//               <Link
//                 key={item.href}
//                 href={item.href}
//                 className={`flex items-center justify-center lg:justify-start gap-3 p-3 rounded-xl transition-all font-semibold ${
//                   isActive 
//                     ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
//                     : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
//                 }`}
//                 title={item.label}
//               >
//                 <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
//                 <span className="hidden lg:block text-sm">{item.label}</span>
//               </Link>
//             )
//           })}
//         </nav>

//         <div className="p-4 border-t border-slate-100">
//           <div className="hidden lg:block mb-3 px-2">
//             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Session Active</p>
//             <p className="text-xs font-semibold text-slate-700 truncate">{userEmail}</p>
//           </div>
//           <LogoutButton />
//         </div>
//       </aside>

//       {/* --- MAIN CONTENT AREA --- */}
//       <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
//         {/* MOBILE TOPBAR */}
//         <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 z-20 shadow-sm">
//           <div className="flex items-center gap-3">
//             <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
//               <Menu size={24} />
//             </button>
//             <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-sm">
//                <Activity size={16} strokeWidth={2.5} />
//             </div>
//           </div>
//           <Link 
//             href="/dashboard/intake" 
//             className="flex items-center justify-center w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md shadow-blue-500/20 transition-colors"
//           >
//             <Plus size={20} strokeWidth={2.5} />
//           </Link>
//         </header>

//         {/* PAGE CONTENT */}
//         <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 w-full relative">
//           {children}
//         </main>
//       </div>
//     </div>
//   );
// }

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Plus, History, Layers, Settings, HeartPulse, ShieldCheck, LogOut } from "lucide-react";
import { TenantSwitcher } from "@/features/auth/components/TenantSwitcher";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/axios"; // Adjust path to your auth logout function
import { jwtDecode } from "jwt-decode";
import { JwtPayload } from "@/types/auth";
import { decode } from "punycode";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const { token, logout } = useAuthStore();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const decoded = token ? jwtDecode<JwtPayload>(token) : null;
  const allPermissions = Object.values(decoded?.lab_permissions || {});
  const userName = allPermissions[0]?.[0] || "User";

  const navItems = [
    { href: "/dashboard", label: "Intakes", icon: Users },
    // { href: "/dashboard/intake", label: "New Patient Intake", icon: Plus },
    // { href: "/dashboard/history", label: "Clinical History", icon: History },
    // { href: "/dashboard/tests", label: "Tests Library", icon: Layers },
    // { href: "/dashboard/settings", label: "Office Settings", icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col md:flex-row text-slate-900 selection:bg-teal-100 selection:text-teal-900 font-sans">
      
      {/* 1. MOBILE DRAWER */}
      <div className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ${isMobileSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div 
          className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 ${isMobileSidebarOpen ? 'opacity-100' : 'opacity-0'}`} 
          onClick={() => setIsMobileSidebarOpen(false)}
        />
        
        <aside className={`fixed inset-y-0 left-0 w-72 bg-white flex flex-col p-6 justify-between transition-transform duration-300 ease-out transform ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="space-y-8">
            {/* Header / Brand with close x */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-gradient-to-tr from-teal-600 to-cyan-500 text-white rounded-xl shadow-lg shadow-teal-500/20 shrink-0">
                  <HeartPulse className="animate-pulse" size={20} />
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm font-extrabold tracking-tight text-slate-900 truncate">PulseLIMS</h1>
                  <p className="text-[10px] text-slate-500 mt-0.5">Powered by <span className="font-extrabold text-teal-600">LIMS Engine</span></p>
                </div>
              </div>
              <button 
                onClick={() => setIsMobileSidebarOpen(false)} 
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                <Plus className="rotate-45" size={24} />
              </button>
            </div>

            <div className="border-t border-b border-transparent">
               <TenantSwitcher />
            </div>

            {/* Navigation links for mobile drawer */}
            <nav className="space-y-1.5">
              {navItems.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className={`w-full px-4 py-3.5 text-xs rounded-xl transition-all flex items-center gap-3 cursor-pointer font-semibold ${
                      isActive
                        ? 'bg-teal-50/70 text-teal-800 border-l-4 border-teal-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border-l-4 border-transparent'
                    }`}
                  >
                    <Icon size={18} className={isActive ? 'text-teal-600' : 'text-slate-400'} />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="space-y-4 pt-6">
            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex items-start gap-2.5">
              <ShieldCheck className="text-emerald-600 mt-0.5 shrink-0" size={16} />
              <div>
                <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">Secured Access</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Verified reports compliant with guidelines</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 text-xs rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all flex items-center gap-3 font-bold"
              >
                <LogOut size={16} />
                <span>Secure Sign Out</span>
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* 2. DESKTOP SIDEBAR */}
      <aside className="hidden md:flex md:w-24 lg:w-72 md:flex-col md:bg-white md:border-r md:border-slate-200 md:h-screen md:sticky md:top-0 md:z-30 p-4 lg:p-6 justify-between shrink-0 transition-all duration-300">
        <div className="space-y-8">
          {/* Brand header */}
          <div className="flex items-center gap-2.5 justify-center lg:justify-start">
            <div className="p-2.5 bg-gradient-to-tr from-teal-600 to-cyan-500 text-white rounded-xl shadow-lg shadow-teal-500/20 shrink-0">
              <HeartPulse className="animate-pulse" size={24} />
            </div>
            <div className="min-w-0 flex-1 hidden lg:block">
              <h1 className="text-base font-extrabold tracking-tight text-slate-900 truncate">PulseLIMS</h1>
              <p className="text-[10px] text-slate-400 mt-0.5">Powered by <span className="font-extrabold text-teal-600">LIMS Engine</span></p>
            </div>
          </div>

          <TenantSwitcher />

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`w-full p-3 lg:px-4 lg:py-3.5 text-xs rounded-xl transition-all flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-1 lg:gap-3 font-medium ${
                    isActive
                      ? 'bg-teal-50/70 text-teal-800 lg:border-l-4 lg:border-teal-600 font-bold shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 lg:border-l-4 lg:border-transparent'
                  }`}
                  title={label}
                >
                  <Icon size={18} className={isActive ? 'text-teal-600 font-bold' : 'text-slate-400'} />
                  <span className="hidden lg:inline">{label}</span>
                  <span className="lg:hidden text-[9px] font-bold tracking-tight mt-1">{label.split(' ').pop()}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-4">
          <div className="p-2 lg:p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex flex-col lg:flex-row items-center lg:items-start gap-1 lg:gap-2.5">
            <ShieldCheck className="text-emerald-600 shrink-0" size={18} />
            <div className="hidden lg:block text-left">
              <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">Secured Access</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Pathologist verified reports compliant with guidelines</p>
            </div>
            <p className="lg:hidden text-[9px] font-semibold text-emerald-800 text-center uppercase mt-0.5">SAFE</p>
          </div>

          <div className="p-2 lg:p-3 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between gap-2">
            <div className="min-w-0 hidden lg:block text-left">
              <p className="text-xs font-bold text-slate-800 truncate">{userName}</p>
              <p className="text-[10px] text-slate-400">Verified Operator</p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all cursor-pointer mx-auto lg:mx-0 shrink-0"
              title="Secure Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* 3. MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        
        {/* MOBILE TOP BAR HEADER */}
        <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-40 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 min-w-0">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="p-2 -ml-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"></line><line x1="4" x2="20" y1="6" y2="6"></line><line x1="4" x2="20" y1="18" y2="18"></line></svg>
              </button>
              <div className="flex items-center gap-2 min-w-0">
                <HeartPulse className="text-teal-600 shrink-0 animate-pulse" size={20} />
                <div className="min-w-0">
                  <span className="text-xs font-extrabold text-slate-900 truncate block">PulseLIMS</span>
                  <span className="text-[9px] text-[#0d9488] font-bold uppercase tracking-wider block">Dashboard</span>
                </div>
              </div>
            </div>

            <Link
              href="/dashboard/intake"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Plus size={16} strokeWidth={3} />
              <span>New Intake</span>
            </Link>
          </div>
        </header>

        {/* SCROLLABLE VIEW CONTAINER */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8 w-full max-w-7xl mx-auto relative overflow-y-auto">
          {children}
        </main>
        
      </div>
    </div>
  );
}