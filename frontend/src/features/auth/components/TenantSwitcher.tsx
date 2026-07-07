// "use client";

// import { useState, useRef, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { useAuthStore } from "@/store/useAuthStore";
// import { labService, LabResponse } from "@/features/labs/api/lab.service";
// import { ChevronDown, CheckCircle2, Plus } from "lucide-react";
// // import { useModalStore } from "@/store/useModalStore";

// export function TenantSwitcher() {
//   const router = useRouter();
//   const { activeLabId, setActiveLabId } = useAuthStore();
//   // const { openCreateLab } = useModalStore();
  
//   const [isOpen, setIsOpen] = useState(false);
//   const [workspaces, setWorkspaces] = useState<LabResponse[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const dropdownRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     let isMounted = true;
//     const fetchLabs = async () => {
//       try {
//         const data = await labService.getMyWorkspaces();
//         if (isMounted) setWorkspaces(data);
//       } catch (error) {
//         console.error("Failed to fetch workspaces", error);
//       } finally {
//         if (isMounted) setIsLoading(false);
//       }
//     };
//     fetchLabs();
//     return () => { isMounted = false; };
//   }, []);

//   useEffect(() => {
//     function handleClickOutside(event: MouseEvent) {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
//         setIsOpen(false);
//       }
//     }
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const handleSwitchTenant = (newLabId: string) => {
//     if (newLabId === activeLabId) {
//       setIsOpen(false);
//       return;
//     }
//     setActiveLabId(newLabId);
//     setIsOpen(false);
//     window.location.href = "/dashboard"; 
//   };

//   if (isLoading) {
//     return (
//       <div className="relative hidden lg:block animate-pulse w-full">
//         <div className="w-full text-left p-4 bg-slate-50 rounded-2xl border border-slate-100 h-[72px]"></div>
//       </div>
//     );
//   }

//   const activeLab = workspaces.find((lab) => lab.id === activeLabId);
//   const activeLabName = activeLab ? activeLab.name : "Select Workspace";

//   return (
//     <div className="relative hidden lg:block" ref={dropdownRef}>
//       <button 
//         onClick={() => setIsOpen(!isOpen)}
//         className="w-full text-left p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-150 transition-all cursor-pointer flex items-center justify-between gap-2 group focus:outline-none focus:ring-2 focus:ring-teal-500/30"
//       >
//         <div className="min-w-0 flex-1">
//           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Diagnostic Hub</p>
//           <p className="text-xs font-semibold text-slate-700 mt-1.5 truncate flex items-center gap-1.5">
//             <span>📍 {activeLabName}</span>
//           </p>
//         </div>
//         <ChevronDown size={14} className={`text-slate-400 group-hover:text-slate-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
//       </button>

//       {isOpen && (
//         <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
//           <div className="p-2.5 bg-slate-50/50">
//             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">Switch Workspace</p>
//           </div>
//           <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
//             {workspaces.map((lab) => {
//               const isActive = lab.id === activeLabId;
//               return (
//                 <button
//                   key={lab.id}
//                   onClick={() => handleSwitchTenant(lab.id)}
//                   disabled={isActive}
//                   className={`w-full text-left px-4 py-3 text-xs transition-all flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
//                     isActive ? 'font-bold text-teal-700 bg-teal-50/20 cursor-default' : 'text-slate-600'
//                   }`}
//                 >
//                   <span className="truncate">{lab.name}</span>
//                   {isActive && <CheckCircle2 size={14} className="text-teal-600 shrink-0" strokeWidth={2.5} />}
//                 </button>
//               );
//             })}
//           </div>
//           <div className="p-2 bg-slate-50/50 text-center">
//             {/* <button
//               onClick={() => {
//                 setIsOpen(false);
//                 router.push("/onboarding");
//               }}
//               className="text-[10px] font-bold text-teal-600 hover:text-teal-700 hover:underline cursor-pointer py-1"
//             >
//               + Manage Lab
//             </button> */}
//             {/* <button
//             onClick={() => {
//               setIsOpen(false);
//               openCreateLab(); // <--- Trigger the modal!
//             }}
//             className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
//           >
//             <Plus size={14} strokeWidth={2.5} />
//             <span>Create New Workspace</span>
//           </button> */}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { labService, LabResponse } from "@/features/labs/api/lab.service";
import { Building2, MapPin, Settings } from "lucide-react";

export function TenantSwitcher() {
  const router = useRouter();
  const { activeLabId, setActiveLabId } = useAuthStore();
  
  const [workspace, setWorkspace] = useState<LabResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchLabs = async () => {
      try {
        const data = await labService.getMyWorkspaces();
        
        if (isMounted && data.length > 0) {
          // 1. AUTO-SELECT LOGIC: Pick the user's lab automatically
          const targetLab = activeLabId ? data.find(l => l.id === activeLabId) || data[0] : data[0];
          
          // 2. Hydrate global state if it's missing
          if (!activeLabId || activeLabId !== targetLab.id) {
            setActiveLabId(targetLab.id);
          }
          
          setWorkspace(targetLab);
        }
      } catch (error) {
        console.error("Failed to fetch workspaces", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    
    fetchLabs();
    
    return () => { isMounted = false; };
  }, [activeLabId, setActiveLabId]);

  if (isLoading) {
    return (
      <div className="relative hidden lg:block animate-pulse w-full">
        <div className="w-full bg-slate-50/80 rounded-2xl border border-slate-100 h-[76px]"></div>
      </div>
    );
  }

  // If user has zero labs, render nothing (or you could redirect to onboarding here)
  if (!workspace) return null;

  // Format the address for the sleek micro-label
  const location = `${workspace.address.city}, ${workspace.address.country}`;

  return (
    <div className="relative hidden lg:block animate-in fade-in zoom-in-95 duration-300">
      <div className="w-full text-left p-3 bg-slate-50 rounded-2xl border border-slate-200/60 flex items-center justify-between gap-3 group">
        
        {/* Lab Branding & Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-slate-200/60 text-teal-600 shadow-sm shrink-0">
            <Building2 size={18} strokeWidth={2.5} />
          </div>
          
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-slate-800 truncate leading-tight" title={workspace.name}>
              {workspace.name}
            </p>
            <div className="flex items-center gap-1 mt-1 text-slate-500">
              <MapPin size={10} strokeWidth={2.5} className="shrink-0" />
              <p className="text-[10px] font-bold uppercase tracking-wider truncate" title={location}>
                {location}
              </p>
            </div>
          </div>
        </div>

        {/* Quick-Access Settings Button */}
        <button 
          onClick={() => router.push('/dashboard/settings')}
          className="p-2 text-slate-400 hover:text-teal-600 hover:bg-white rounded-lg transition-all duration-200 border border-transparent hover:border-slate-200 hover:shadow-sm shrink-0"
          title="Workspace Settings"
          aria-label="Settings"
        >
          <Settings size={18} strokeWidth={2.5} />
        </button>
        
      </div>
    </div>
  );
}