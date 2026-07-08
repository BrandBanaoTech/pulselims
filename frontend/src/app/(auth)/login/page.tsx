import { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/LoginForm";
import Link from "next/link";
import { HeartPulse, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Sign In | PulseLIMS",
  description: "Securely sign in to your Laboratory Information Management System.",
};

export default function LoginPage() {
  return (
    <div className="relative min-h-screen w-full flex flex-col justify-center items-center bg-slate-50 p-4 sm:p-6 lg:p-8 overflow-hidden">
      
      {/* 1. Ambient Background Glow (Premium SaaS Feel) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-teal-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-md flex flex-col items-center z-10 animate-in fade-in zoom-in-95 duration-700 ease-out">
        
        {/* Brand Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="relative mb-5">
            {/* 2. Decorative Outer Glow Behind the Logo */}
            <div className="absolute inset-0 bg-teal-400 blur-xl opacity-30 rounded-2xl"></div>
            
            <div className="relative w-16 h-16 bg-gradient-to-tr from-teal-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-xl shadow-teal-500/30 border border-teal-400/50">
              <HeartPulse className="text-white" size={32} strokeWidth={2.5} />
            </div>
          </div>
          
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">PulseLIMS</h1>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1.5">Diagnostic Command Center</p>
        </div>

        {/* The Form Card */}
        <div className="w-full">
          <LoginForm />
        </div>

        {/* Footer Links with Micro-interaction */}
        <div className="mt-8 text-sm text-slate-500 font-medium text-center flex items-center justify-center gap-1.5">
          <span>Don't have a workspace yet?</span>
          <Link 
            href="/register" 
            className="group font-bold text-teal-600 hover:text-teal-700 transition-colors flex items-center gap-1"
          >
            Create one now
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

      </div>
    </div>
  );
}