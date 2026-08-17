import React from "react";
import { Search } from "lucide-react";

export interface FilterOption {
  label: string;
  value: string;
}

interface CommandBarProps {
  // Search
  searchQuery: string;
  onSearchChange: (val: string) => void;
  searchPlaceholder?: string;
  
  // Filters (Segmented Control)
  filters?: FilterOption[];
  activeFilter?: string;
  onFilterChange?: (val: string) => void;
  
  // Right-side Action (e.g. New Intake Button)
  action?: React.ReactNode;
}

export function CommandBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
  activeFilter,
  onFilterChange,
  action
}: CommandBarProps) {
  return (
    <div className="bg-white p-2.5 rounded-[1.25rem] border border-slate-200/80 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-3 mb-8 relative z-20">
      
      {/* Search Input */}
      <div className="relative w-full lg:flex-1 flex items-center bg-slate-50 rounded-xl border border-slate-200/80 focus-within:border-teal-500 focus-within:ring-4 focus-within:ring-teal-500/10 transition-all">
        <Search size={18} className="absolute left-4 text-slate-400" />
        <input
          type="text"
          className="w-full pl-11 pr-4 py-3 bg-transparent text-sm font-bold text-slate-900 placeholder:text-slate-400 outline-none"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Filters & Actions */}
      <div className="flex items-center gap-2 w-full lg:w-auto">
        
        {filters.length > 0 && onFilterChange && (
          <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200/80 flex-1 lg:flex-none overflow-x-auto no-scrollbar">
            {filters.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onFilterChange(opt.value)}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap outline-none ${
                  activeFilter === opt.value
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 border border-transparent"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {action && (
          <div className="shrink-0">
            {action}
          </div>
        )}
        
      </div>
    </div>
  );
}