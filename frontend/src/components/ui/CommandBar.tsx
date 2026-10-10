import React from "react";
import { Search } from "lucide-react";

export type FilterColor = 'slate' | 'teal' | 'blue' | 'amber' | 'emerald' | 'rose';

export interface FilterOption { 
  label: string; 
  value: string; 
  count?: number; 
  color?: FilterColor; // 🚀 Added color mapping
}

interface CommandBarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  searchPlaceholder?: string;
  filters?: FilterOption[];
  activeFilter?: string;
  onFilterChange?: (val: string) => void;
  action?: React.ReactNode;
}

// 🚀 Helper to get the Active Pill styling
const getActivePillStyle = (color: FilterColor = 'slate') => {
  const styles = {
    slate: "bg-white text-slate-900 shadow-sm border border-slate-200/80",
    blue: "bg-blue-50 text-blue-700 shadow-sm border border-blue-200/80",
    teal: "bg-teal-50 text-teal-700 shadow-sm border border-teal-200/80",
    amber: "bg-amber-50 text-amber-700 shadow-sm border border-amber-200/80",
    emerald: "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-200/80",
    rose: "bg-rose-50 text-rose-700 shadow-sm border border-rose-200/80",
  };
  return styles[color];
};

// 🚀 Helper to get the Count Badge styling
const getBadgeStyle = (color: FilterColor = 'slate', isActive: boolean) => {
  if (!isActive) return "bg-slate-200/70 text-slate-500 font-bold border border-transparent";
  
  const styles = {
    slate: "bg-slate-100 text-slate-700 font-black border border-slate-200",
    blue: "bg-blue-200/50 text-blue-800 font-black border border-blue-200",
    teal: "bg-teal-200/50 text-teal-800 font-black border border-teal-200",
    amber: "bg-amber-200/50 text-amber-800 font-black border border-amber-200",
    emerald: "bg-emerald-200/50 text-emerald-800 font-black border border-emerald-200",
    rose: "bg-rose-200/50 text-rose-800 font-black border border-rose-200",
  };
  return styles[color];
};

export function CommandBar({ searchQuery, onSearchChange, searchPlaceholder = "Search...", filters = [], activeFilter, onFilterChange, action }: CommandBarProps) {
  return (
    <div className="bg-white p-2.5 rounded-[1.25rem] border border-slate-200/80 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-3 mb-4 relative z-20">
      
      <div className="relative w-full lg:flex-1 flex items-center bg-slate-50 rounded-xl border border-slate-200/80 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
        <Search size={18} className="absolute left-4 text-slate-400" />
        <input
          type="text"
          className="w-full pl-11 pr-4 py-3 bg-transparent text-sm font-bold text-slate-900 placeholder:text-slate-400 outline-none"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2 w-full lg:w-auto">
        {filters.length > 0 && onFilterChange && (
          <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200/80 flex-1 lg:flex-none overflow-x-auto no-scrollbar">
            {filters.map((opt) => {
              const isActive = activeFilter === opt.value;
              return (
                <button
                  key={opt.value} 
                  onClick={() => onFilterChange(opt.value)}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap outline-none ${
                    isActive 
                      ? getActivePillStyle(opt.color) 
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 border border-transparent"
                  }`}
                >
                  {opt.label}
                  {opt.count !== undefined && (
                    <span className={`px-1.5 py-0.5 ml-1.5 rounded-md text-[10px] font-mono leading-none transition-colors ${getBadgeStyle(opt.color, isActive)}`}>
                      {opt.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}

// import React from "react";
// import { Search } from "lucide-react";

// interface FilterOption { label: string; value: string; count?: number; }

// interface CommandBarProps {
//   searchQuery: string;
//   onSearchChange: (val: string) => void;
//   searchPlaceholder?: string;
//   filters?: FilterOption[];
//   activeFilter?: string;
//   onFilterChange?: (val: string) => void;
//   action?: React.ReactNode;
// }

// export function CommandBar({ searchQuery, onSearchChange, searchPlaceholder = "Search...", filters = [], activeFilter, onFilterChange, action }: CommandBarProps) {
//   return (
//     <div className="bg-white p-2.5 rounded-[1.25rem] border border-slate-200/80 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-3 mb-8 relative z-20">
//       <div className="relative w-full lg:flex-1 flex items-center bg-slate-50 rounded-xl border border-slate-200/80 focus-within:border-teal-500 focus-within:ring-4 focus-within:ring-teal-500/10 transition-all">
//         <Search size={18} className="absolute left-4 text-slate-400" />
//         <input
//           type="text"
//           className="w-full pl-11 pr-4 py-3 bg-transparent text-sm font-bold text-slate-900 placeholder:text-slate-400 outline-none"
//           placeholder={searchPlaceholder}
//           value={searchQuery}
//           onChange={(e) => onSearchChange(e.target.value)}
//         />
//       </div>
//       <div className="flex items-center gap-2 w-full lg:w-auto">
//         {filters.length > 0 && onFilterChange && (
//           <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200/80 flex-1 lg:flex-none overflow-x-auto no-scrollbar">
//             {filters.map((opt) => (
//               <button
//                 key={opt.value} onClick={() => onFilterChange(opt.value)}
//                 className={`px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap outline-none ${
//                   activeFilter === opt.value ? "bg-white text-slate-900 shadow-sm border border-slate-200/80" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 border border-transparent"
//                 }`}
//               >
//                 {opt.label}
//                 {opt.count !== undefined && (
//                     <span className={`px-1.5 py-0.5 ml-1 rounded-md text-[10px] font-mono leading-none transition-colors ${
//                       activeFilter === opt.value 
//                         ? "bg-teal-50 text-teal-700 font-black" 
//                         : "bg-slate-200/70 text-slate-500 font-bold"
//                     }`}>
//                       {opt.count}
//                     </span>
//                   )}
//               </button>
//             ))}
//           </div>
//         )}
//         {action && <div className="shrink-0">{action}</div>}
//       </div>
//     </div>
//   );
// }