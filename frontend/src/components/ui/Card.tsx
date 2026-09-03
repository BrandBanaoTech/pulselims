import React from "react";

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white p-5 md:p-6 rounded-[2rem] border border-slate-200/80 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function SectionHeader({ title, icon: Icon, badge }: { title: string; icon?: any; badge?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
      <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
        {Icon && <Icon size={14} className="text-teal-600" />} {title}
      </h3>
      {badge && <div>{badge}</div>}
    </div>
  );
}