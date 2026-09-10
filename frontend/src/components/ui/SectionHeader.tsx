import React from "react";
import { LucideIcon } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  hint?: string;
  icon?: LucideIcon;
  badge?: string;
  badgeColor?: "teal" | "amber" | "slate" | "blue" | "rose" | "emerald";
  action?: React.ReactNode;
}

export function SectionHeader({ 
  title, 
  hint, 
  icon: Icon, 
  badge,
  badgeColor = "slate",
  action 
}: SectionHeaderProps) {
  
  // Enterprise status badge color mappings
  const badgeStyles = {
    teal: "bg-teal-50 text-teal-700 border-teal-200/60",
    amber: "bg-amber-50 text-amber-700 border-amber-200/60",
    slate: "bg-slate-50 text-slate-700 border-slate-200/60",
    blue: "bg-blue-50 text-blue-700 border-blue-200/60",
    rose: "bg-rose-50 text-rose-700 border-rose-200/60",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
      <div className="flex items-start gap-4">
        
        {/* Visual Anchor (Icon Box) */}
        {Icon && (
          <div className="w-12 h-12 rounded-[1rem] bg-white shadow-sm border border-slate-200/80 flex items-center justify-center shrink-0 text-slate-700 relative overflow-hidden group">
            {/* Subtle background glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-transparent opacity-50"></div>
            <Icon size={22} strokeWidth={2.5} className="relative z-10 group-hover:scale-110 transition-transform duration-300" />
          </div>
        )}

        {/* Title & Hint Block */}
        <div className="flex flex-col justify-center pt-0.5">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-none">
              {title}
            </h1>
            
            {/* Context Badge */}
            {badge && (
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border shadow-sm ${badgeStyles[badgeColor]}`}>
                {badge}
              </span>
            )}
          </div>
          
          {/* Hint / Description */}
          {hint && (
            <p className="text-xs md:text-sm font-semibold text-slate-500 mt-1.5 leading-snug max-w-2xl">
              {hint}
            </p>
          )}
        </div>
      </div>

      {/* Top-Right Action Slot */}
      {action && (
        <div className="shrink-0 sm:mt-1">
          {action}
        </div>
      )}
    </div>
  );
}