import React, { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { Label } from "./Label";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { label: string; value: string | number }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, className = "", required, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <Label required={required}>{label}</Label>}
        <div className="relative">
          <select
            ref={ref}
            className={`w-full py-3 pl-4 pr-10 bg-slate-50 border rounded-xl text-sm font-bold text-slate-900 outline-none appearance-none cursor-pointer transition-all shadow-sm focus:bg-white focus:ring-4 ${
              error 
                ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/10" 
                : "border-slate-200 focus:border-teal-500 focus:ring-teal-500/10"
            } ${className}`}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        {error && <p className="text-rose-500 text-[10px] font-bold mt-1.5">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";