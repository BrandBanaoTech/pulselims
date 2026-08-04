import { ShieldCheck } from "lucide-react";

export function SystemIntegrityCard() {
  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl p-6 lg:p-8 flex flex-col justify-between relative overflow-hidden group h-full">
      
      {/* Decorative background pulse & Grid pattern */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none transition-transform duration-1000 group-hover:scale-110"></div>
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none"></div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-1.5">
          <ShieldCheck className="text-teal-500" size={22} strokeWidth={2.5} />
          <h3 className="text-xl font-black text-white tracking-tight">System Integrity</h3>
        </div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-8">Hardware & API Sync Monitor</p>
        
        <div className="space-y-4">
          {/* Status Item: Main Server */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-md">
            <div className="flex items-center gap-3 text-slate-200">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
              </div>
              <span className="text-sm font-extrabold tracking-wide">Cloud Core</span>
            </div>
            <span className="text-[11px] font-black text-emerald-400 tracking-widest uppercase bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Online</span>
          </div>
          
          {/* Status Item: Database */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-md">
            <div className="flex items-center gap-3 text-slate-200">
              <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <span className="text-sm font-extrabold tracking-wide">Database Auth</span>
            </div>
            <span className="text-xs font-bold text-slate-400">12ms Ping</span>
          </div>

          {/* Status Item: Analyzers */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-md">
            <div className="flex items-center gap-3 text-slate-200">
              <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
              <span className="text-sm font-extrabold tracking-wide">Lab Analyzers</span>
            </div>
            <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">Synced</span>
          </div>
        </div>
      </div>

      {/* Compliance Footer */}
      <div className="mt-10 pt-6 border-t border-slate-700/50 relative z-10">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-teal-500" />
            <p className="text-xs font-black text-slate-200 uppercase tracking-widest">
              HIPAA Compliant
            </p>
          </div>
          <p className="text-[11px] font-semibold text-slate-500 leading-relaxed">
            AES-256 End-to-End Encryption active on all patient data streams.<br/>
            <span className="inline-block mt-1">Last system audit: <span className="text-slate-300 font-bold">Just now</span></span>
          </p>
        </div>
      </div>
    </div>
  );
}