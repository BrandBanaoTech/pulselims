import React, { forwardRef } from "react";
import { LucideIcon } from "lucide-react";
import { Label } from "./Label";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: LucideIcon;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon: Icon, error, className = "", required, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <Label required={required}>{label}</Label>}
        <div className="relative flex items-center">
          {Icon && <Icon size={16} className="absolute left-4 text-slate-400 pointer-events-none" />}
          
          <input
            ref={ref}
            className={`w-full py-3 ${Icon ? "pl-11" : "pl-4"} pr-4 bg-slate-50 border rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-sm focus:bg-white focus:ring-4 ${
              error 
                ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/10" 
                : "border-slate-200 focus:border-teal-500 focus:ring-teal-500/10"
            } ${className}`}
            {...props}
          />
        </div>
        {error && <p className="text-rose-500 text-[10px] font-bold mt-1.5">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";