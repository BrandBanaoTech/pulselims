import Link from "next/link";
import { Search, ArrowLeft, HeartPulse } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[500px] h-[500px] bg-teal-100/50 rounded-full blur-3xl"></div>
        <div className="absolute top-[20%] right-[5%] w-[300px] h-[300px] bg-blue-100/50 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-700">
        {/* Iconic Status */}
        <div className="w-24 h-24 bg-white rounded-3xl shadow-xl shadow-slate-200/50 flex items-center justify-center mb-8 border border-slate-100">
          <HeartPulse className="text-teal-600 animate-pulse" size={48} />
        </div>

        {/* Messaging */}
        <h1 className="text-8xl font-black text-slate-900 tracking-tighter mb-4">404</h1>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
          Page not found
        </h2>
        <p className="text-slate-500 font-medium max-w-sm mb-10 leading-relaxed">
          The clinical data or lab module you are looking for has been moved or does not exist in this workspace.
        </p>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 py-3 px-6 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-teal-500/30"
          >
            <ArrowLeft size={18} />
            Return to Dashboard
          </Link>
          <Link
            href="/dashboard/support"
            className="flex items-center gap-2 py-3 px-6 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 font-extrabold text-sm rounded-xl transition-all"
          >
            <Search size={18} />
            Contact Support
          </Link>
        </div>
      </div>
      
      {/* Footer Branding */}
      <p className="absolute bottom-8 text-xs font-bold text-slate-400 uppercase tracking-widest">
        PulseLIMS System
      </p>
    </div>
  );
}