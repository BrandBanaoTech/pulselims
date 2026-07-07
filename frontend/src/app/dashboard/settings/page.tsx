"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, Users, ShieldAlert, Loader2, ChevronLeft} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { labService, LabResponse } from "@/features/labs/api/lab.service";
import { LabProfileTab } from "@/features/labs/components/LabProfileTab";
// We will build these next:
// import { StaffManagementTab } from "@/features/labs/components/StaffManagementTab";
// import { DangerZoneTab } from "@/features/labs/components/DangerZoneTab";

type SettingsTab = "profile" | "team" | "danger";

export default function SettingsPage() {
  const router = useRouter();
  const { activeLabId } = useAuthStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  
  const [labData, setLabData] = useState<LabResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch the lab context securely
  useEffect(() => {
    if (!activeLabId) return;
    
    let isMounted = true;
    setIsLoading(true);
    
    labService.getLabDetails(activeLabId)
      .then((data) => {
        if (isMounted) setLabData(data);
      })
      .catch((err) => console.error("Failed to fetch lab details", err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [activeLabId]);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-slate-400">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  if (!labData) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
        Workspace data unavailable. Please refresh or select a valid workspace.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        {/* Back Button */}
        <button 
          onClick={() => router.back()}
          className="p-2 -ml-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
          aria-label="Go back"
        >
          <ChevronLeft size={24} strokeWidth={2.5} />
        </button>

        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Workspace Settings</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage compliance, team access, and physical details for {labData?.name || "this lab"}.</p>
        </div>
      </div>

      {/* Settings Shell Grid */}
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Left Sidebar Navigation */}
        <aside className="w-full md:w-64 shrink-0">
          <nav className="flex md:flex-col gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === "profile" 
                  ? "bg-blue-50 text-blue-700 shadow-sm" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Building2 size={18} className={activeTab === "profile" ? "text-blue-600" : "text-slate-400"} />
              Lab Profile & Details
            </button>

            <button
              onClick={() => setActiveTab("team")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === "team" 
                  ? "bg-blue-50 text-blue-700 shadow-sm" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Users size={18} className={activeTab === "team" ? "text-blue-600" : "text-slate-400"} />
              Team & Access Control
            </button>

            <div className="hidden md:block h-px bg-slate-200 my-2"></div>

            <button
              onClick={() => setActiveTab("danger")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === "danger" 
                  ? "bg-red-50 text-red-700 shadow-sm" 
                  : "text-slate-600 hover:bg-red-50 hover:text-red-600"
              }`}
            >
              <ShieldAlert size={18} className={activeTab === "danger" ? "text-red-600" : "text-slate-400"} />
              Danger Zone
            </button>
          </nav>
        </aside>

        {/* Right Content Area */}
        <main className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
            {activeTab === "profile" && <LabProfileTab labData={labData} />}
            {activeTab === "team" && <div className="animate-pulse">Building Team Tab...</div>}
            {activeTab === "danger" && <div className="animate-pulse">Building Danger Zone...</div>}
          </div>
        </main>

      </div>
    </div>
  );
}