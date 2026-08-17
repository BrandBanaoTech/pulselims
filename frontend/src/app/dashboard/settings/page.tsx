"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Building2, Users, ShieldAlert, ChevronLeft, 
  Settings2, AlertCircle, Plus, Trash2, Mail, Lock,
  MapPin, Palette, FileSignature,
  FlaskConical
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { labService, LabResponse } from "@/features/labs/api/lab.service";
import { LabProfileTab } from "@/features/labs/components/LabProfileTab";
import { TestDictionaryTab } from "@/features/labs/components/TestDictionaryTab";

type SettingsTab = "profile" | "team" | "tests" | "danger";

const NAVIGATION_TABS = [
  { id: "profile", label: "Workspace Profile", icon: Building2, isDanger: false },
  { id: "team", label: "Team & Access", icon: Users, isDanger: false },
  { id: "tests", label: "Test Dictionary", icon: FlaskConical, isDanger: false },
  { id: "danger", label: "Danger Zone", icon: ShieldAlert, isDanger: true },
];

const PROFILE_SECTIONS = [
  { id: "section-core", label: "Core Details", icon: Building2 },
  { id: "section-location", label: "Location", icon: MapPin },
  { id: "section-branding", label: "Branding", icon: Palette },
  { id: "section-compliance", label: "Compliance", icon: FileSignature },
];

export default function SettingsPage() {
  const router = useRouter();
  const { activeLab } = useAuthStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  
  const [labData, setLabData] = useState<LabResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Securely fetch lab context
  useEffect(() => {
    if (!activeLab) return;
    
    let isMounted = true;
    setIsLoading(true);
    
    labService.getLabDetails(activeLab)
      .then((data) => {
        if (isMounted) setLabData(data);
      })
      .catch((err) => console.error("Failed to fetch lab details", err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [activeLab]);

  // Smooth scroll jump helper
  const scrollToSection = (sectionId: string) => {
    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // ==========================================
  // SKELETON LOADING UI (Zero Layout Shift)
  // ==========================================
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 animate-pulse pb-12">
        <div className="flex items-center gap-5 mb-10">
          <div className="w-12 h-12 bg-slate-200 rounded-2xl"></div>
          <div className="space-y-3">
            <div className="w-64 h-8 bg-slate-200 rounded-lg"></div>
            <div className="w-96 h-4 bg-slate-100 rounded-md"></div>
          </div>
        </div>
        <div className="flex gap-6 border-b border-slate-200 pb-2">
          <div className="w-32 h-6 bg-slate-200 rounded-md"></div>
          <div className="w-32 h-6 bg-slate-100 rounded-md"></div>
        </div>
        <div className="space-y-6">
          <div className="w-full h-[500px] bg-white border border-slate-100 rounded-3xl shadow-sm"></div>
        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR / MISSING STATE
  // ==========================================
  if (!labData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in zoom-in-95">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse"></div>
          <div className="w-20 h-20 bg-white border border-slate-200 shadow-xl rounded-3xl flex items-center justify-center relative z-10">
            <AlertCircle className="text-slate-400" size={36} strokeWidth={2} />
          </div>
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Workspace Unavailable</h2>
        <p className="text-slate-500 text-sm max-w-md mb-8 font-medium leading-relaxed">
          We could not load the configuration for this workspace. It may have been permanently deleted or your administrative access was revoked.
        </p>
        <button 
          onClick={() => router.push('/dashboard')} 
          className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl shadow-lg shadow-slate-900/20 transition-all focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 outline-none"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // ==========================================
  // MAIN UI
  // ==========================================
  return (
    // <div className="max-w-5xl mx-auto flex flex-col min-h-screen animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans">
    <div className="flex-1 flex flex-col min-h-screen animate-in fade-in duration-500 font-sans pb-24 relative">
      
      {/* 1. EDITORIAL HEADER */}
        {/* <button 
          onClick={() => router.back()}
          className="mt-1.5 p-2.5 text-slate-400 hover:text-slate-900 hover:bg-white bg-transparent hover:shadow-sm border border-transparent hover:border-slate-200 rounded-2xl transition-all focus:outline-none focus:ring-2 focus:ring-slate-200 shrink-0 group"
          aria-label="Go back"
          >
          <ChevronLeft size={24} strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform" />
          </button> */}
      {/* <div className="flex items-start gap-5 mb-8">
        <div className="pt-1">
          <div className="flex items-center gap-2.5 text-teal-600 mb-2">
            <Settings2 size={16} strokeWidth={2.5} />
            <span className="text-[10px] font-black uppercase tracking-widest">Configuration Console</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Workspace Settings</h1>
          <p className="text-sm font-medium text-slate-500 mt-2.5 leading-relaxed max-w-2xl">
            Manage compliance metadata, configure team access protocols, and control deep system integrations for <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200/60">{labData.name}</span>.
          </p>
        </div>
      </div> */}

      

      {/* 2. MINIMALIST TAB NAVIGATION (Vercel Style) */}
      <div className="sticky top-0 z-30 pt-2 pb-4 bg-[#F8FAFC]/90 backdrop-blur-xl border-b border-slate-200/80 mb-6">
        <nav className="flex items-center gap-6 overflow-x-auto no-scrollbar">
          {NAVIGATION_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SettingsTab)}
                className={`flex items-center gap-2 pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-all duration-300 outline-none ${
                  isActive 
                    ? tab.isDanger 
                        ? 'border-red-500 text-red-600' 
                        : 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* 3. JUMP-TO PILL SHORTCUTS (Only when Profile is active) */}
        {/* {activeTab === "profile" && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-4 animate-in fade-in slide-in-from-top-2">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mr-2 shrink-0">Jump To:</span>
            {PROFILE_SECTIONS.map((sec) => (
              <button
                key={sec.id}
                onClick={(e) => { e.preventDefault(); scrollToSection(sec.id); }}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg shadow-sm transition-all whitespace-nowrap flex items-center gap-1.5 outline-none shrink-0"
              >
                <sec.icon size={12} className="text-slate-400" />
                {sec.label}
              </button>
            ))}
          </div>
        )} */}
      </div>

      {/* 4. TAB CONTENT AREA */}
      <main className="flex-1 min-w-0 pb-32">
        
        {/* PROFILE TAB */}
        {activeTab === "profile" && <LabProfileTab labData={labData} />}
        
        {/* TEAM & ACCESS TAB (Premium Empty State) */}
        {activeTab === "team" && (
          <div className="animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden relative min-h-[500px] flex flex-col items-center justify-center">
              
              {/* Fake UI Background (Blurred Data Grid) */}
              <div className="absolute inset-0 opacity-[0.15] pointer-events-none select-none overflow-hidden flex flex-col">
                <div className="h-16 border-b border-slate-200 w-full flex items-center px-8 gap-4">
                  <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
                  <div className="w-32 h-4 bg-slate-200 rounded-md"></div>
                  <div className="w-16 h-4 bg-slate-200 rounded-md ml-auto"></div>
                </div>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center px-8 py-5 border-b border-slate-100 gap-8">
                    <div className="w-48 h-4 bg-slate-200 rounded-md"></div>
                    <div className="w-32 h-4 bg-slate-200 rounded-md"></div>
                    <div className="w-24 h-4 bg-slate-200 rounded-md ml-auto"></div>
                  </div>
                ))}
              </div>

              {/* Glassmorphism Foreground */}
              <div className="relative z-10 flex flex-col items-center text-center p-8 max-w-lg bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-tr from-slate-800 to-slate-900 text-white rounded-3xl flex items-center justify-center shadow-inner relative z-10">
                    <Users size={32} strokeWidth={2} />
                  </div>
                  <div className="absolute -top-3 -right-3 w-10 h-10 bg-white border border-slate-100 rounded-full flex items-center justify-center shadow-md z-20">
                    <Mail size={16} className="text-blue-500" />
                  </div>
                </div>

                <span className="px-3.5 py-1.5 bg-teal-50 text-teal-700 border border-teal-100 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm mb-5">
                  Coming Soon
                </span>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Collaborate with your staff</h3>
                <p className="text-slate-500 text-sm mt-3 font-medium leading-relaxed mb-8">
                  Invite pathologists, phlebotomists, and front-desk operators to this workspace. Manage role-based permissions, access controls, and audit logs.
                </p>

                <button disabled className="px-8 py-3.5 bg-slate-100 text-slate-400 text-sm font-bold rounded-xl flex items-center gap-2 cursor-not-allowed border border-slate-200 transition-all">
                  <Plus size={18} strokeWidth={3} /> Invite Team Member
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TEST DICTIONARY TAB */}
        {activeTab === "tests" && <TestDictionaryTab />}

        {/* DANGER ZONE TAB (Premium Locked State) */}
        {activeTab === "danger" && (
          <div className="animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-white rounded-3xl border border-red-200 overflow-hidden shadow-sm relative">
              {/* Danger Pattern Strip */}
              <div className="absolute top-0 left-0 bottom-0 w-2 bg-[repeating-linear-gradient(45deg,#fecaca,#fecaca_10px,#fee2e2_10px,#fee2e2_20px)]"></div>
              
              <div className="p-8 md:p-12 flex flex-col md:flex-row items-start gap-8 pl-10">
                <div className="p-5 bg-red-50 border border-red-100 shadow-inner rounded-3xl shrink-0 text-red-600 relative">
                  <AlertCircle size={36} strokeWidth={2} />
                  <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-sm border border-slate-100">
                    <Lock size={14} className="text-slate-400" />
                  </div>
                </div>

                <div className="flex-1 w-full">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Delete Workspace</h3>
                  <p className="text-slate-500 text-sm mt-2 font-medium leading-relaxed max-w-2xl">
                    Permanently remove your workspace and all of its contents from the PulseLIMS platform. This action is <span className="font-bold text-red-600">not reversible</span> and will destroy all patient records, diagnostic history, and staff associations.
                  </p>
                  
                  <div className="mt-8 p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Target Workspace</p>
                      <span className="text-sm font-bold text-slate-900 font-mono tracking-tight bg-white px-2 py-1 rounded border border-slate-200 shadow-sm truncate block">{labData.name}</span>
                    </div>
                    <button disabled className="w-full sm:w-auto px-6 py-3 bg-red-50 text-red-400 hover:text-red-500 text-sm font-bold rounded-xl flex items-center justify-center gap-2 cursor-not-allowed border border-red-100 transition-colors shrink-0">
                      <Trash2 size={18} strokeWidth={2.5} /> Terminate Workspace
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 font-semibold mt-4 flex items-center gap-1.5">
                    <Lock size={12} /> Requires platform administrator override to unlock destructive actions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

    </div>
  );
}