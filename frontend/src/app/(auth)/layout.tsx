import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-white">
      {/* Left Panel: Branding & Marketing (Hidden on mobile) */}
      <div className="hidden lg:flex flex-col justify-between bg-slate-900 p-16 text-white overflow-hidden relative">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-400 via-slate-900 to-slate-900"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl">
              L
            </div>
            <h1 className="text-2xl font-bold tracking-tight">LIMS Pro</h1>
          </div>
          <p className="mt-6 text-slate-300 text-lg max-w-md leading-relaxed">
            The next-generation Laboratory Information Management System. Built for speed, accuracy, and uncompromising multi-tenant security.
          </p>
        </div>

        <div className="relative z-10 space-y-6">
          <blockquote className="text-2xl font-medium leading-snug">
            "Streamlining our pathology workflows with enterprise-grade RBAC and precision."
          </blockquote>
          <div className="flex items-center gap-4 text-slate-400">
            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center">
              {/* Placeholder for an avatar */}
              <span className="font-semibold text-slate-300">JD</span>
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Dr. Jane Doe</p>
              <p className="text-sm">Chief Pathologist, Apex Labs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: The Interactive Forms */}
      <div className="flex items-center justify-center p-6 sm:p-12 bg-slate-50 relative">
        {children}
      </div>
    </div>
  );
}