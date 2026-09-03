import React, { useEffect } from "react";
import { X } from "lucide-react";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Drawer({ isOpen, onClose, title, subtitle, icon, children, footer }: DrawerProps) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      
      {/* Sliding Panel */}
      <div className="relative w-full md:w-[580px] h-full bg-slate-50 shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-white shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center border border-teal-100 shadow-sm">
                {icon}
              </div>
            )}
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">{title}</h2>
              {subtitle && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors outline-none">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 no-scrollbar">
          {children}
        </div>

        {/* Sticky Footer */}
        {footer && (
          <div className="p-5 border-t border-slate-200/80 bg-white/95 backdrop-blur-md shrink-0 sticky bottom-0 z-20">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}