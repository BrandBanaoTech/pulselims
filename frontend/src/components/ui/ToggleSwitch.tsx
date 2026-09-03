import React from "react";
import { LucideIcon } from "lucide-react";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  description?: string;
  icon?: LucideIcon;
  disabled?: boolean;
}

export function ToggleSwitch({ 
  checked, 
  onChange, 
  title, 
  description, 
  icon: Icon, 
  disabled = false 
}: ToggleSwitchProps) {
  return (
    <label 
      className={`flex items-center justify-between p-4 transition-colors ${
        disabled 
          ? "opacity-50 cursor-not-allowed" 
          : "cursor-pointer hover:bg-slate-50"
      }`}
    >
      <div className="flex items-center gap-3 pr-4">
        {Icon && <Icon size={18} className="text-slate-400 shrink-0" strokeWidth={2.5} />}
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-700">{title}</span>
          {description && (
            <span className="text-[10px] font-semibold text-slate-400 mt-0.5 leading-snug">
              {description}
            </span>
          )}
        </div>
      </div>

      {/* The Animated Switch Track */}
      <div 
        className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out shrink-0 shadow-inner ${
          checked ? "bg-teal-500" : "bg-slate-200"
        }`}
      >
        {/* The Switch Thumb */}
        <div 
          className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-sm ${
            checked ? "translate-x-5" : "translate-x-0"
          }`} 
        />
      </div>

      <input 
        type="checkbox" 
        className="hidden" 
        checked={checked} 
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)} 
      />
    </label>
  );
}