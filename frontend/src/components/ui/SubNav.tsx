import React from "react";
import { LucideIcon } from "lucide-react";

export interface TabItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  badge?: number | string; // E.g., "5" or "New"
  badgeColor?: "teal" | "rose" | "amber" | "slate";
}

interface SubNavProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function SubNav({ tabs, activeTab, onChange, className = "" }: SubNavProps) {
  
  const getBadgeColors = (color?: string) => {
    switch (color) {
      case "rose": return "bg-rose-100 text-rose-700";
      case "amber": return "bg-amber-100 text-amber-700";
      case "teal": return "bg-teal-100 text-teal-700";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <div className={`w-full border-b border-slate-200/80 mb-6 lg:mb-8 ${className}`}>
      {/* Scrollable container for mobile */}
      <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`group relative py-4 text-sm font-bold transition-all outline-none flex items-center gap-2.5 whitespace-nowrap ${
                isActive 
                  ? "text-teal-700" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {/* Icon */}
              {Icon && (
                <Icon 
                  size={16} 
                  strokeWidth={isActive ? 2.5 : 2} 
                  className={`transition-colors ${isActive ? "text-teal-600" : "text-slate-400 group-hover:text-slate-600"}`} 
                />
              )}
              
              {/* Label */}
              <span>{tab.label}</span>

              {/* Optional Data Badge (e.g., "3" unpaid bills) */}
              {tab.badge !== undefined && (
                <span className={`px-2 py-0.5 text-[10px] font-black rounded-md transition-colors ${
                  isActive ? getBadgeColors(tab.badgeColor || "teal") : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                }`}>
                  {tab.badge}
                </span>
              )}

              {/* 🚀 The Animated Bottom Indicator */}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-teal-600 rounded-t-md animate-in zoom-in-95 duration-200" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}