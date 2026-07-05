
"use client";
import { useAuthStore } from "@/store/useAuthStore";
import { LogOut, ShieldCheck } from "lucide-react";
export default function Dashboad(){
    const { token, logout } = useAuthStore();
    const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };
    return(
        <div>
            <h1>Dashboard</h1>

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
            
        </div>
    );
}