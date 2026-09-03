import React from "react";
import { LucideIcon } from "lucide-react";

export interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  icon?: LucideIcon;
  children?: React.ReactNode; 
}

export function PageHeader({ title, description, eyebrow, icon: Icon, children }: PageHeaderProps) {
  return (
    <header className="mb-6 lg:mb-8">
      {(eyebrow || Icon) && (
        <div className="flex items-center gap-2.5 text-teal-600 mb-2">
          {Icon && <Icon size={18} strokeWidth={2.5} />}
          {eyebrow && <span className="text-[10px] font-black uppercase tracking-widest">{eyebrow}</span>}
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">{title}</h1>
          {description && <p className="text-sm font-medium text-slate-500 mt-2 max-w-xl leading-relaxed">{description}</p>}
        </div>
        {children && <div className="flex items-center gap-3 shrink-0">{children}</div>}
      </div>
    </header>
  );
}