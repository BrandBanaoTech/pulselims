import React from "react";
import { LucideIcon } from "lucide-react";

interface RadioCardProps {
  selected: boolean;
  onClick: () => void;
  title: string;
  description?: string;
  icon?: LucideIcon;
}

export function RadioCard({ 
  selected, 
  onClick, 
  title, 
  description, 
  icon: Icon 
}: RadioCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all text-left outline-none w-full ${
        selected 
          ? "border-teal-500 bg-teal-50/50 shadow-sm ring-4 ring-teal-500/10 scale-[1.02]" 
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      {Icon && (
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
          selected ? "bg-teal-100 text-teal-600" : "bg-slate-100 text-slate-400"
        }`}>
          <Icon size={20} strokeWidth={selected ? 2.5 : 2} />
        </div>
      )}
      
      <div className="flex-1">
        <p className={`text-sm font-black ${selected ? "text-teal-900" : "text-slate-900"}`}>
          {title}
        </p>
        {description && (
          <p className={`text-[10px] font-bold mt-0.5 leading-snug ${selected ? "text-teal-700/70" : "text-slate-500"}`}>
            {description}
          </p>
        )}
      </div>

      {/* Optional Checkmark Indicator */}
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
        selected ? "border-teal-500 bg-teal-500" : "border-slate-300"
      }`}>
        {selected && <div className="w-2 h-2 bg-white rounded-full" />}
      </div>
    </button>
  );
}