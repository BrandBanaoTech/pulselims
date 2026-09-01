"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Users, FlaskConical, Settings, X, LogOut, LayoutDashboard, 
  HeartPulse, Plus, ShieldCheck, History, Menu, FileText, 
  ListPlus, ChevronDown, PanelLeftClose, ChevronRight,
  Building2,
  ShieldAlert
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

// ==========================================
// CLINICAL NAVIGATION SCHEMA
// ==========================================
const MAIN_NAV = [
  { name: "Clinical Overview", href: "/dashboard", icon: LayoutDashboard, exact: true },
  { 
    name: "Patient Intakes", 
    href: "/dashboard/intakes", 
    icon: ListPlus, 
    exact: false,
    // subOptions: [
    //   { name: "New Registration", href: "/dashboard/intake", icon: Plus },
    //   { name: "Patient Directory", href: "/dashboard/patients", icon: FileText },
    //   { name: "Clinical History", href: "/dashboard/history", icon: History },
    // ]
  },
  // { name: "Test Dictionary", href: "/dashboard/tests", icon: FlaskConical, exact: false },
];

const BOTTOM_NAV = [
  { 
    name: "Labspace Settings", 
    href: "/dashboard/settings", 
    icon: Settings, 
    // exact: false,
    // Adding subOptions automatically makes it a hover-flyout when collapsed!
    // subOptions: [
    //   { name: "Lab Profile", href: "/dashboard/settings", icon: Building2 },
    //   { name: "Test Dictionary", href: "/dashboard/settings", icon: FlaskConical },
    // ]
  },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  // Initialize UI State
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("lims_sidebar_collapsed");
    if (stored === "true") setIsCollapsed(true);
  }, []);

  // Auto-close mobile drawer on route change
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);

  // Prevent background scroll on mobile drawer open
  useEffect(() => {
    if (isMobileSidebarOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileSidebarOpen]);

  // Sidebar Controls
  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("lims_sidebar_collapsed", String(newState));
    if (newState) setExpandedMenus([]); // Auto-close accordions when collapsing
  };

  const toggleSubMenu = (name: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (isCollapsed) return;
    setExpandedMenus(prev => 
      prev.includes(name) ? prev.filter(m => m !== name) : [...prev, name]
    );
  };

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const currentWorkspaceName = user?.default_lab || "Diagnostic Hub";

  // =========================================================
  // REUSABLE NAVIGATION ITEM RENDERER (PREMIUM UX)
  // =========================================================
  const renderNavItem = (item: any) => {
    const hasSub = !!item.subOptions;
    const isSubExpanded = expandedMenus.includes(item.name);
    const isActive = item.exact 
      ? pathname === item.href 
      : pathname.startsWith(item.href) || (hasSub && item.subOptions?.some((s: any) => pathname.startsWith(s.href)));
    const Icon = item.icon;

    return (
      <div key={item.name} className="relative group">
        <Link
          href={hasSub && !isCollapsed ? "#" : item.href}
          onClick={(e) => hasSub && !isCollapsed && toggleSubMenu(item.name, e)}
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-3 rounded-xl transition-all duration-200 outline-none ${
            isActive 
              ? 'bg-slate-900 shadow-md shadow-slate-900/10' 
              : 'hover:bg-slate-100/80 active:bg-slate-200/60'
          }`}
        >
          <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'gap-3'}`}>
            <Icon 
              size={18} 
              strokeWidth={isActive ? 2.5 : 2} 
              className={`shrink-0 transition-colors duration-200 ${
                isActive ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-800'
              }`} 
            />
            {!isCollapsed && (
              <span className={`text-sm font-semibold truncate ${isActive ? 'text-white' : 'text-slate-700 group-hover:text-slate-900'}`}>
                {item.name}
              </span>
            )}
          </div>
          {hasSub && !isCollapsed && (
            <ChevronDown size={14} strokeWidth={2.5} className={`transition-transform duration-200 ${
              isActive ? 'text-slate-400' : 'text-slate-400'
            } ${isSubExpanded ? 'rotate-180' : ''}`} />
          )}
        </Link>

        {/* EXPANDED ACCORDION (Desktop Open) */}
        {hasSub && !isCollapsed && isSubExpanded && (
          <div className="mt-1 ml-4 pl-4 border-l-2 border-slate-100 space-y-0.5 animate-in slide-in-from-top-2 duration-300">
            {item.subOptions.map((sub: any) => {
              const isSubActive = pathname === sub.href;
              return (
                <Link
                  key={sub.name}
                  href={sub.href}
                  className={`flex items-center gap-2.5 py-2 px-3 text-xs font-semibold rounded-lg transition-all duration-200 ${
                    isSubActive 
                      ? 'text-teal-700 bg-teal-50/80 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <sub.icon size={14} className={isSubActive ? "text-teal-600" : "text-slate-400"} />
                  {sub.name}
                </Link>
              );
            })}
          </div>
        )}

        {/* COLLAPSED FLYOUT / TOOLTIP (SaaS Style Hover) */}
        {isCollapsed && (
          <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 hidden group-hover:flex items-start z-[100] pointer-events-none group-hover:pointer-events-auto">
            {/* Invisible hover bridge */}
            <div className="absolute -left-4 top-0 w-4 h-full bg-transparent"></div>
            
            <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-xl shadow-xl py-2 min-w-[200px] border border-slate-800 animate-in fade-in zoom-in-95 duration-200 relative">
              {/* Flyout Arrow/Caret */}
              <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-slate-900/95 border-l border-b border-slate-800 rotate-45"></div>
              
              <div className="px-3 pb-1 border-b border-slate-800/50 mb-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{item.name}</p>
              </div>
              
              {hasSub ? (
                <div className="space-y-0.5 px-1.5 relative z-10">
                  {item.subOptions.map((sub: any) => (
                    <Link
                      key={sub.name}
                      href={sub.href}
                      className="flex items-center gap-2.5 py-2 px-2.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors"
                    >
                      <sub.icon size={14} className="text-slate-400" /> {sub.name}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="px-3 py-1 text-xs font-medium text-slate-300 relative z-10">Click to view {item.name.toLowerCase()}</div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 font-sans">
      
      {/* ========================================================= */}
      {/* 1. MOBILE DRAWER OVERLAY (Hidden on md+)                  */}
      {/* ========================================================= */}
      <div className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ${isMobileSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div 
          className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${isMobileSidebarOpen ? 'opacity-100' : 'opacity-0'}`} 
          onClick={() => setIsMobileSidebarOpen(false)}
        />
        
        <aside className={`fixed inset-y-0 left-0 w-[280px] bg-white flex flex-col p-6 justify-between transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] shadow-2xl ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="space-y-8 overflow-y-auto no-scrollbar">
            
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-slate-900 text-teal-400 rounded-xl shadow-lg shrink-0">
                  <HeartPulse className="animate-pulse" size={20} />
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm font-extrabold tracking-tight text-slate-900 truncate">{currentWorkspaceName}</h1>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-bold tracking-wider">PulseLIMS</p>
                </div>
              </div>
              <button onClick={() => setIsMobileSidebarOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors outline-none">
                <X size={20} />
              </button>
            </div>

            <nav className="space-y-1">
              {MAIN_NAV.map(renderNavItem)}
              <div className="h-px bg-slate-200/60 my-4 mx-2" />
              {BOTTOM_NAV.map(renderNavItem)}
            </nav>
          </div>

          <div className="pt-6 border-t border-slate-100 mt-6 space-y-4">
            <button onClick={handleLogout} className="w-full px-4 py-3 text-xs rounded-xl text-slate-700 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 transition-all flex items-center justify-center gap-2 font-bold outline-none">
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </aside>
      </div>

      {/* ========================================================= */}
      {/* 2. DESKTOP SIDEBAR (Scalable, Resizable, Top-Right Icon)  */}
      {/* ========================================================= */}
      <aside 
        className={`hidden md:flex flex-col bg-white border-r border-slate-200/80 h-screen sticky top-0 z-30 transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] shrink-0 shadow-[2px_0_12px_rgba(0,0,0,0.02)] relative
          ${isCollapsed ? 'w-20' : 'w-[280px]'}
        `}
      >
        {/* PREMIUM FLOATING BORDER TOGGLE (TOP RIGHT) */}
        <button 
          onClick={toggleSidebar}
          className="absolute -right-3.5 top-7 w-7 h-7 bg-white border border-slate-200 rounded-full shadow-md text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all duration-200 z-[60] flex items-center justify-center outline-none"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight size={14} strokeWidth={2.5} /> : <PanelLeftClose size={14} strokeWidth={2.5} />}
        </button>

        {/* Brand Header */}
        <div className={`h-20 flex items-center border-b border-slate-100 shrink-0 transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'px-5'}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2.5 bg-slate-900 text-teal-400 rounded-xl shadow-lg shrink-0">
              <HeartPulse className="animate-pulse" size={20} />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 pr-2">
                <h1 className="text-sm font-extrabold tracking-tight text-slate-900 truncate" title={currentWorkspaceName}>
                  {currentWorkspaceName}
                </h1>
                <p className="text-[10px] text-slate-400 mt-0.5 font-bold tracking-widest uppercase">PulseLIMS</p>
              </div>
            )}
          </div>
        </div>

        {/* 
          🚀 KEY FIX: Dynamic Overflow! 
          If collapsed, allow overflow so tooltips break out perfectly. 
          If expanded, allow scrolling for large menus and accordions. 
        */}
        <div className={`flex-1 py-6 space-y-1 ${isCollapsed ? 'px-2 overflow-visible' : 'px-3 overflow-y-auto no-scrollbar'}`}>
          {MAIN_NAV.map(renderNavItem)}
        </div>

        {/* Workspace Settings (Bottom Pinned) */}
        <div className={`pb-5 shrink-0 ${isCollapsed ? 'px-2' : 'px-4'}`}>
          <div className="mb-4">
            {BOTTOM_NAV.map(renderNavItem)}
          </div>

          {/* Premium User Profile Card */}
          <div className={`bg-slate-50 border border-slate-200/80 flex items-center transition-all duration-300 relative group/profile
            ${isCollapsed ? 'flex-col p-2 rounded-2xl gap-2 bg-transparent border-transparent shadow-none overflow-visible' : 'flex-row justify-between p-2.5 rounded-2xl shadow-xs gap-2 overflow-hidden'}
          `}>
            <div className={`flex items-center gap-3 min-w-0 ${isCollapsed ? 'justify-center w-full' : ''}`}>
              <div className="w-9 h-9 rounded-xl bg-teal-100/80 border border-teal-200 text-teal-700 font-extrabold flex items-center justify-center shrink-0 shadow-sm">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              {!isCollapsed && (
                <div className="min-w-0 pr-1">
                  <p className="text-xs font-bold text-slate-900 truncate">{user?.full_name || 'Staff User'}</p>
                  <p className="text-[10px] font-semibold text-slate-500 truncate">{user?.email || 'Verified Operator'}</p>
                </div>
              )}
            </div>
            
            <button 
              onClick={handleLogout}
              className={`text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all shrink-0 flex items-center justify-center outline-none
                ${isCollapsed ? 'w-10 h-10 rounded-xl bg-slate-100 shadow-sm border border-slate-200/60' : 'p-2 rounded-xl'}
              `}
              title="Secure Sign Out"
            >
              <LogOut size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 3. MAIN CONTENT AREA                                      */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-300 relative bg-[#F8FAFC]">
        
        {/* Mobile Top Header (Sticky) */}
        <header className="md:hidden bg-white/80 backdrop-blur-xl border-b border-slate-200 px-5 py-4 sticky top-0 z-40 shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors outline-none"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2.5 min-w-0">
              <HeartPulse className="text-teal-600 shrink-0" size={20} />
              <div className="min-w-0">
                <span className="text-sm font-extrabold text-slate-900 truncate block">{currentWorkspaceName}</span>
              </div>
            </div>
          </div>

          <Link
            href="/dashboard/intake"
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-md transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Plus size={14} strokeWidth={3} />
            <span>Intake</span>
          </Link>
        </header>

        {/* Page Content Injection */}
        <main className="flex-1 w-full p-4 sm:p-6 lg:p-10 relative z-0">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}

// "use client";

// import { useState, useEffect } from "react";
// import Link from "next/link";
// import { usePathname, useRouter } from "next/navigation";
// import { 
//   LayoutDashboard, 
//   Users, 
//   FlaskConical, 
//   FileText, 
//   Settings, 
//   Menu, 
//   X, 
//   LogOut,
//   Bell,
//   HeartPulse,
//   Plus,
//   ShieldCheck,
//   ChevronDown, Layers,
//   History,
//   type LucideIcon
// } from "lucide-react";
// import { useAuthStore } from "@/store/useAuthStore";
// import { LabConfig } from "@/types/lab";


// // ==========================================
// // CLINICAL NAVIGATION SCHEMA
// // ==========================================
// const navigation = [
//   { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
//   { name: "Patient Intake", href: "/dashboard/patients", icon: Users },
//   { name: "Test Catalog", href: "/dashboard/tests", icon: FlaskConical },
//   { name: "Clinical Reports", href: "/dashboard/reports", icon: FileText },
// ];


// export const DEFAULT_LAB_CONFIG: LabConfig = {
//   name: 'Metro Diagnostics & Research Centre',
//   address: '104, Medical Enclave, Near Civil Hospital, New Delhi, Delhi 110001',
//   email: 'info@metrodiagnostics.co.in',
//   phone: '+91 98765 43210',
//   regNo: 'DEL/LIMS/2026/8892',
//   doctorName: 'Dr. Sameer Sharma, MD',
//   doctorDegree: 'Consultant Pathologist (Reg No: MCI-84920)',
//   primaryColor: '#0d9488',
//   fontStyle: 'sans',
//   tagline: 'Accredited Premium Diagnostic & Research Centre',
//   nablNumber: 'NABL-MC-9921 / ULR-889226',
//   reportTemplate: 'modern',
//   notifyEnabled: true,
//   notifyChannel: 'whatsapp',
//   twilioSid: 'AC_MOCK_TWILIO_6a3bb7489fe20d8819030',
//   twilioToken: 'SK_MOCK_TOKEN_efba583bb34612e52c80',
//   twilioFrom: '+14158882026',
//   emailjsSrcId: 'service_metro_lims',
//   emailjsTempId: 'template_report_ready',
//   emailjsKey: 'user_mock_public_key_312'
// };


// export function DashboardShell({ children }: { children: React.ReactNode }) {
//   const pathname = usePathname();
//   const router = useRouter();
//   const { logout } = useAuthStore();
  
//   const [labConfig, setLabConfig] = useState<LabConfig>(DEFAULT_LAB_CONFIG);
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
//   const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
//   const [showSwitchDropdown, setShowSwitchDropdown] = useState<boolean>(false);

//     // Navigation & focus states
//   const [activeTab, setActiveTab] = useState<'dashboard' | 'register' | 'settings' | 'history' | 'tests'>('dashboard');
//   const [focusedPatientId, setFocusedPatientId] = useState<string | null>(null);

//   // 1. Extract the specific state variables you need
//   const currentUser = useAuthStore((state) => state.user);

//   // Close mobile menu automatically when the route changes
//   useEffect(() => {
//     setIsMobileMenuOpen(false);
//   }, [pathname]);

//   const handleLogout = () => {
//     logout(); // Securely wipes Zustand memory & LocalStorage
//     router.replace("/login");
//   };

//   return (
//     <div id="main-app-root" className="min-h-screen bg-slate-50/50 flex flex-col md:flex-row text-slate-900 selection:bg-teal-100 selection:text-teal-850">
//       {/* 1. RESPONSIVE SIDEBAR */}
//       {/* Mobile Sliding Hamburger Menu Drawer */}
//       <div id="mobile-sidebar-drawer" className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ${isMobileSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
//         {/* Backdrop overlay */}
//         <div className={`fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300 ${isMobileSidebarOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsMobileSidebarOpen(false)}></div>

//         {/* Drawer panel */}
//         <aside className={`fixed inset-y-0 left-0 w-72 bg-white flex flex-col p-6 justify-between transition-transform duration-300 ease-out transform ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
//           <div className="space-y-8">
//             {/* Header / Brand with close x */}
//             <div className="flex items-center justify-between gap-3 font-sans">
//               <div className="flex items-center gap-2.5">
//                 <div className="p-2.5 bg-gradient-to-tr from-teal-600 to-cyan-500 text-white rounded-xl shadow-lg shadow-teal-500/20 shrink-0">
//                   <HeartPulse className="animate-pulse" size={20} />
//                 </div>
//                 <div className="min-w-0">
//                   <h1 className="text-sm font-extrabold tracking-tight text-slate-850 truncate" title={currentUser?.default_lab}>
//                     {currentUser?.default_lab}
//                   </h1>
//                   <p className="text-[10px] text-slate-405 mt-0.5">Powered by <span className="font-extrabold text-teal-600">PulseLIMS</span></p>
//                 </div>
//               </div>
//               <button 
//                 onClick={() => setIsMobileSidebarOpen(false)} 
//                 className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
//                 aria-label="Close menu"
//               >
//                 <Plus className="rotate-45" size={20} />
//               </button>
//             </div>

//             {/* Diagnostic Center Badge */}
//             <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150">
//               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Diagnostic Hub</p>
//               <p className="text-xs font-semibold text-slate-700 mt-1.5 truncate">📍 {labConfig.name}</p>
//             </div>

//             {/* Navigation links for mobile drawer */}
//             <nav className="space-y-1.5">
//               {[
//                 { tab: 'dashboard', label: 'Patient Directory', icon: Users },
//                 { tab: 'register', label: 'New Patient Intake', icon: Plus },
//                 { tab: 'history', label: 'Clinical History', icon: History },
//                 // { tab: 'tests', label: 'Tests Library', icon: Layers },
//                 { tab: 'settings', label: 'Office Settings', icon: Settings },
//               ].map(({ tab, label, icon: Icon }) => {
//                 // const isActive = activeTab === tab && !focusedPatientId;
//                 return (
//                   <></>
//                   // <button
//                     // key={tab}
//                     // onClick={() => {
//                       // setActiveTab(tab as any);
//                       // setFocusedPatientId(null);
//                       // setIsMobileSidebarOpen(false);
//                     // }}
//                     // className={`w-full px-4 py-3.5 text-xs rounded-xl transition-all flex items-center gap-3 cursor-pointer text-left font-semibold ${
//                       // isActive
//                         // ? 'bg-teal-50/70 text-teal-800 border-l-4 border-teal-600 font-bold shadow-3xs'
//                         // : 'text-slate-500 hover:text-slate-850 hover:bg-slate-50 border-l-4 border-transparent'
//                     // }`}
//                   // >
//                     // <Icon size={16} className={isActive ? 'text-teal-600' : 'text-slate-400'} />
//                     // <span>{label}</span>
//                   // </button>
//                 );
//               })}
//             </nav>
//           </div>

//           {/* Pathologist badge */}
//           <div className="p-4 bg-emerald-50/35 border border-emerald-100 rounded-2xl flex items-start gap-2.5">
//             <ShieldCheck className="text-emerald-600 mt-0.5 shrink-0" size={16} />
//             <div>
//               <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">Secured Access</p>
//               <p className="text-[11px] text-slate-500 mt-0.5">Pathologist verified reports compliant with MCI guidelines</p>
//             </div>
//           </div>

//           {/* Mobile Log Out action */}
//           <div className="pt-4 border-t border-slate-100">
//             <button
//               onClick={() => {
//                 // api.logout();
//                 // setCurrentUser(null);
//                 setIsMobileSidebarOpen(false);
//               }}
//               className="w-full px-4 py-3.5 text-xs rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all flex items-center gap-3 cursor-pointer text-left font-bold"
//             >
//               <LogOut size={16} className="text-rose-500" />
//               <span>Secure Sign Out</span>
//             </button>
//           </div>
//         </aside>
//       </div>

//       {/* Responsive Desktop & Tablet Sidebar */}
//       <aside className="hidden md:flex md:w-20 lg:w-68 md:flex-col md:bg-white md:border-r md:border-slate-200 md:h-screen md:sticky md:top-0 md:z-30 p-4 lg:p-6 justify-between shrink-0 font-sans transition-all duration-300">
//         <div className="space-y-8">
//           {/* Brand header */}
//           <div className="flex items-center gap-2.5 justify-center lg:justify-start">
//             <div className="p-2.5 bg-gradient-to-tr from-teal-600 to-cyan-500 text-white rounded-xl shadow-lg shadow-teal-500/20 shrink-0">
//               <HeartPulse className="animate-pulse" size={20} />
//             </div>
//             <div className="min-w-0 flex-1 hidden lg:block">
//               <h1 className="text-sm font-extrabold tracking-tight text-slate-850 truncate" title={labConfig.name}>
//                 {currentUser?.default_lab || 'Lab Space'}
//               </h1>
//               <p className="text-[10px] text-slate-400 mt-0.5">Powered by <span className="font-extrabold text-teal-600">PulseLIMS</span></p>
//             </div>
//           </div>

//           {/* Diagnostic Hub Badge / Workspace Switcher - hidden on tablets */}
//           <div className="relative hidden lg:block">
//             {/* <button 
//               onClick={() => setShowSwitchDropdown(!showSwitchDropdown)}
//               className="w-full text-left p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-150 transition-all cursor-pointer flex items-center justify-between gap-2 group"
//             >
//               <div className="min-w-0 flex-1">
//                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Diagnostic Hub</p>
//                 <p className="text-xs font-semibold text-slate-700 mt-1.5 truncate flex items-center gap-1.5">
//                   <span>📍 {labConfig.name}</span>
//                 </p>
//               </div>
//               <ChevronDown size={14} className={`text-slate-400 group-hover:text-slate-600 transition-transform ${showSwitchDropdown ? 'rotate-180' : ''}`} />
//             </button> */}

//             {/* {showSwitchDropdown && (
//               <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 animate-fade-in">
//                 <div className="p-2.5 bg-slate-50/50">
//                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">Switch Workspace</p>
//                 </div>
//                 <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
//                   {labs.map((lab) => (
//                     <button
//                       key={lab.id}
//                       onClick={() => {
//                         localStorage.setItem('lims_active_lab_id', lab.id);
//                         setActiveLabId(lab.id);
//                         setShowSwitchDropdown(false);
//                       }}
//                       className={`w-full text-left px-4 py-3 text-xs transition-all flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
//                         lab.id === activeLabId ? 'font-bold text-teal-700 bg-teal-50/20' : 'text-slate-650'
//                       }`}
//                     >
//                       <span className="truncate">{lab.name}</span>
//                       {lab.id === activeLabId && <CheckCircle2 size={12} className="text-teal-650 shrink-0" />}
//                     </button>
//                   ))}
//                 </div>
//                 <div className="p-2 bg-slate-50/50 text-center">
//                   <button
//                     onClick={() => {
//                       localStorage.removeItem('lims_active_lab_id');
//                       setActiveLabId(null);
//                       setShowSwitchDropdown(false);
//                     }}
//                     className="text-[10px] font-bold text-teal-600 hover:text-teal-700 hover:underline cursor-pointer"
//                   >
//                     + Manage Workspaces
//                   </button>
//                 </div>
//               </div>
//             )} */}
//           </div>

//           {/* Navigation Links */}
//           <nav className="space-y-1.5">
//             {[
//               { tab: 'dashboard', label: 'Patient Directory', icon: Users },
//               { tab: 'register', label: 'New Patient Intake', icon: Plus },
//               { tab: 'history', label: 'Clinical History', icon: History },
//               { tab: 'tests', label: 'Tests Library', icon: Layers },
//               { tab: 'settings', label: 'Office Settings', icon: Settings },
//             ].map(({ tab, label, icon: Icon }) => {
//               const isActive = activeTab === tab && !focusedPatientId;
//               return (
//                 <button
//                   key={tab}
//                   onClick={() => {
//                     setActiveTab(tab as any);
//                     setFocusedPatientId(null);
//                   }}
//                   className={`w-full p-3 lg:px-4 lg:py-3.5 text-xs rounded-xl transition-all flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-1 lg:gap-3 cursor-pointer text-center lg:text-left ${
//                     isActive
//                       ? 'bg-teal-50/70 text-teal-800 lg:border-l-4 lg:border-teal-600 font-bold shadow-3xs'
//                       : 'text-slate-500 hover:text-slate-850 hover:bg-slate-50 lg:border-l-4 lg:border-transparent'
//                   }`}
//                   title={label}
//                 >
//                   <Icon size={16} className={isActive ? 'text-teal-600 font-bold' : 'text-slate-300 group-hover:text-slate-600'} />
//                   {/* Text labels hide on tablet md breakpoint but expand on desktop lg */}
//                   <span className="hidden lg:inline">{label}</span>
//                   <span className="lg:hidden text-[9px] font-bold tracking-tight mt-1">{label.split(' ').pop()}</span>
//                 </button>
//               );
//             })}
//           </nav>
//         </div>

//         {/* Pathologist access badge - compact icon of shield check on tablet, full info on desktop */}
//         <div className="flex flex-col gap-3">
//           <div className="p-2 lg:p-4 bg-emerald-50/30 border border-emerald-100 rounded-2xl flex flex-col lg:flex-row items-center lg:items-start gap-1 lg:gap-2.5">
//             <ShieldCheck className="text-emerald-600 shrink-0" size={16} />
//             <div className="hidden lg:block text-left">
//               <p className="text-[10px] text-emerald-850 font-bold uppercase tracking-wider">Secured Access</p>
//               <p className="text-[11px] text-slate-500 mt-0.5">Pathologist verified reports compliant with MCI guidelines</p>
//             </div>
//             <p className="lg:hidden text-[9px] font-semibold text-emerald-800 text-center uppercase tracking-tighter mt-0.5">MCI</p>
//           </div>

//           {/* Desktop/Tablet session status and Log Out button */}
//           <div className="p-2 lg:p-3 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between gap-2">
//             <div className="min-w-0 hidden lg:block text-left">
//               <p className="text-xs font-bold text-slate-800 truncate" title={currentUser?.full_name || currentUser?.email}>
//                 {currentUser?.full_name || 'Staff User'}
//               </p>
//               <p className="text-[10px] text-slate-400">{ currentUser?.email || 'Verified Operator'}</p>
//             </div>
//             <button 
//               onClick={() => {
//                 // api.logout();
//                 // setCurrentUser(null);
//               }}
//               className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all cursor-pointer mx-auto lg:mx-0 shrink-0"
//               title="Secure Sign Out"
//             >
//               <LogOut size={16} />
//             </button>
//           </div>
//         </div>
//       </aside>

//       {/* 2. RESPONSIVE MOBILE TOP BAR HEADER */}
//       <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-40 shadow-xs font-sans">
//         <div className="flex items-center justify-between gap-3 font-sans">
//           <div className="flex items-center gap-1.5 min-w-0">
//             {/* Hamburger button */}
//             <button
//               onClick={() => setIsMobileSidebarOpen(true)}
//               className="p-2 -ml-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
//               aria-label="Open navigation menu"
//             >
//               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"></line><line x1="4" x2="20" y1="6" y2="6"></line><line x1="4" x2="20" y1="18" y2="18"></line></svg>
//             </button>
//             <div className="flex items-center gap-2 min-w-0">
//               <HeartPulse className="text-teal-600 shrink-0 animate-pulse" size={18} />
//               <div className="min-w-0 font-sans">
//                 <span className="text-xs font-extrabold text-slate-850 truncate block" title={labConfig.name}>
//                   {labConfig.name}
//                 </span>
//                 {/* <span className="text-[9px] text-[#0d9488] font-bold uppercase tracking-wider block">
//                   {focusedPatientId ? 'Review Screen' : activeTab === 'dashboard' ? 'Directory' : activeTab === 'register' ? 'New Intake' : activeTab === 'history' ? 'Clinical' : activeTab === 'tests' ? 'Tests Dictionary' : 'Settings'}
//                 </span> */}
//               </div>
//             </div>
//           </div>

//           <button
//             onClick={() => {
//               // setActiveTab('register');
//               // setFocusedPatientId(null);
//             }}
//             className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1 shrink-0"
//           >
//             <Plus size={13} strokeWidth={3} />
//             <span>New Intake</span>
//           </button>
//         </div>
//       </header>
      
//       {/* 3. HUMBLE UTILITY FOOTER */}
//       <footer className="bg-white border-t border-slate-100 py-6 px-6 mt-12">
//         <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-medium">
//           <div>
//             <span>© 2026 PulseLIMS Engine. Designed for Standalone Diagnostic Centers.</span>
//           </div>
//           <div className="flex items-center gap-4">
//             <span>HIPAA Certifiable</span>
//             <span>MCI Pathologist Sign-off Ready</span>
//             <span>Offline Local Storage active</span>
//           </div>
//         </div>
//       </footer>
//     </div>
    
    
    // <div className="min-h-screen bg-slate-50 flex">
      
    //   {/* ========================================== */}
    //   {/* DESKTOP SIDEBAR */}
    //   {/* ========================================== */}
    //   <aside className="hidden lg:flex flex-col w-72 fixed inset-y-0 left-0 bg-slate-900 border-r border-slate-800 z-50">
        
    //     {/* Brand Header */}
    //     <div className="h-20 flex items-center px-8 border-b border-slate-800">
    //       <div className="flex items-center gap-3">
    //         <div className="w-10 h-10 bg-gradient-to-tr from-teal-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
    //           <HeartPulse className="text-white" size={24} />
    //         </div>
    //         <span className="text-xl font-extrabold text-white tracking-tight">PulseLIMS</span>
    //       </div>
    //     </div>

    //     {/* Navigation Links */}
    //     <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
    //       <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Core Modules</p>
    //       {navigation.map((item) => {
    //         const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
    //         const Icon = item.icon;
            
    //         return (
    //           <Link
    //             key={item.name}
    //             href={item.href}
    //             className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
    //               isActive 
    //                 ? "bg-teal-500/10 text-teal-400" 
    //                 : "text-slate-400 hover:bg-slate-800 hover:text-white"
    //             }`}
    //           >
    //             <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
    //             {item.name}
    //           </Link>
    //         );
    //       })}
    //     </nav>

    //     {/* Bottom Actions */}
    //     <div className="p-4 border-t border-slate-800">
    //       <Link
    //         href="/dashboard/settings"
    //         className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all mb-2 ${
    //           pathname.includes("/settings") ? "bg-teal-500/10 text-teal-400" : "text-slate-400 hover:bg-slate-800 hover:text-white"
    //         }`}
    //       >
    //         <Settings size={20} />
    //         Workspace Settings
    //       </Link>
    //       <button
    //         onClick={handleLogout}
    //         className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all group"
    //       >
    //         <LogOut size={20} className="transition-transform group-hover:-translate-x-1" />
    //         Secure Logout
    //       </button>
    //     </div>
    //   </aside>

    //   {/* ========================================== */}
    //   {/* MOBILE DRAWER */}
    //   {/* ========================================== */}
    //   {isMobileMenuOpen && (
    //     <div className="fixed inset-0 z-50 lg:hidden flex">
    //       {/* Backdrop */}
    //       <div 
    //         className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" 
    //         onClick={() => setIsMobileMenuOpen(false)} 
    //         aria-hidden="true"
    //       />
          
    //       {/* Drawer Menu */}
    //       <div className="relative flex flex-col w-72 max-w-[80%] bg-slate-900 h-full shadow-2xl animate-in slide-in-from-left-full duration-300">
    //         <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800">
    //           <div className="flex items-center gap-3">
    //             <div className="w-8 h-8 bg-gradient-to-tr from-teal-500 to-cyan-400 rounded-lg flex items-center justify-center">
    //               <HeartPulse className="text-white" size={18} />
    //             </div>
    //             <span className="text-lg font-extrabold text-white">PulseLIMS</span>
    //           </div>
    //           <button 
    //             onClick={() => setIsMobileMenuOpen(false)} 
    //             className="text-slate-400 hover:text-white transition-colors"
    //             aria-label="Close menu"
    //           >
    //             <X size={24} />
    //           </button>
    //         </div>
            
    //         <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
    //           {navigation.map((item) => {
    //             const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
    //             const Icon = item.icon;
    //             return (
    //               <Link
    //                 key={item.name}
    //                 href={item.href}
    //                 className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
    //                   isActive ? "bg-teal-500/10 text-teal-400" : "text-slate-400 hover:bg-slate-800"
    //                 }`}
    //               >
    //                 <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
    //                 {item.name}
    //               </Link>
    //             );
    //           })}
    //         </nav>
            
    //         <div className="p-4 border-t border-slate-800">
    //           <button
    //             onClick={handleLogout}
    //             className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/10 transition-colors"
    //           >
    //             <LogOut size={20} />
    //             Logout
    //           </button>
    //         </div>
    //       </div>
    //     </div>
    //   )}

    //   {/* ========================================== */}
    //   {/* MAIN CONTENT AREA */}
    //   {/* ========================================== */}
    //   <main className="flex-1 flex flex-col min-w-0 lg:pl-72">
        
    //     {/* TOP HEADER */}
    //     <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 z-40 sticky top-0 shadow-sm shadow-slate-100/50">
    //       <div className="flex items-center gap-4">
    //         <button 
    //           onClick={() => setIsMobileMenuOpen(true)}
    //           className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
    //           aria-label="Open menu"
    //         >
    //           <Menu size={24} />
    //         </button>
    //         <h1 className="text-xl font-extrabold text-slate-900 hidden sm:block">
    //           {navigation.find(n => pathname === n.href || pathname.startsWith(`${n.href}/`))?.name || "Workspace"}
    //         </h1>
    //       </div>

    //       <div className="flex items-center gap-4">
    //         <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all">
    //           <Bell size={20} />
    //           <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
    //         </button>
    //       </div>
    //     </header>

    //     {/* PAGE CONTENT */}
    //     <div className="flex-1 p-4 sm:p-8 relative">
    //       <div className="max-w-7xl mx-auto w-full relative z-10">
    //         {children}
    //       </div>
    //     </div>
        
    //   </main>
    // </div>
  // );
// }