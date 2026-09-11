import React from "react";
import { ChevronRight } from "lucide-react";

interface DataRowProps {
  layout: string;
  // 🚀 Added null/undefined support so users can do conditional columns: [name, isAdmin && <Badge/>]
  data: (React.ReactNode | string | number | null | undefined)[];
  mobileHeader?: React.ReactNode;
  action?: React.ReactNode;
  onClick?: () => void;
}

export function DataRow({ layout, data, mobileHeader, action, onClick }: DataRowProps) {
  const isInteractive = !!onClick;

  return (
    <article 
      role="row"
      onClick={onClick}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={(e) => {
        // 🚀 A11y: Allows keyboard power-users to trigger the row with Enter or Space
        if (isInteractive && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`group relative bg-white border border-slate-200/80 rounded-[1.25rem] p-4 lg:py-3.5 lg:px-5 shadow-sm transition-all duration-300 flex flex-col lg:grid ${layout} lg:items-center gap-3 lg:gap-5 ${
        isInteractive 
          // 🚀 Added active:scale-[0.995] for a native, tactile "button press" feel
          // 🚀 Added ring-offset-2 so the focus ring doesn't bleed into the border
          ? "cursor-pointer hover:shadow-md hover:border-teal-200/80 hover:-translate-y-[1px] active:scale-[0.995] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2" 
          : ""
      } ${
        // 🚀 Mobile Overlap Fix: If there is an absolute action menu, force right-padding on mobile
        action ? "pr-12 lg:pr-5" : ""
      }`}
    >
      
      {/* 📱 Mobile Top Bar */}
      {mobileHeader && (
        <div className="flex justify-between items-center lg:hidden border-b border-slate-100 pb-3 mb-1">
          {mobileHeader}
        </div>
      )}

      {/* 🖥️ The Smart Data Mapper */}
      {data.map((item, index) => (
        // min-w-0 guarantees text truncation works inside the CSS Grid
        <div key={index} role="cell" className="min-w-0">
          
          {typeof item === "string" || typeof item === "number" ? (
            <span className="text-[14px] font-semibold text-slate-900 truncate block">
              {item}
            </span>
          ) : (
            // 🚀 Grid Integrity: Render the item, or an empty span if null, to keep columns aligned
            item || <span className="sr-only">Empty</span>
          )}
          
        </div>
      ))}

      {/* ⚙️ Action Menu Slot (Far right) */}
      {action && (
        <div 
          role="cell" 
          className="absolute top-4 right-3 lg:relative lg:top-0 lg:right-0 flex justify-end shrink-0" 
          onClick={e => e.stopPropagation()}
        >
          {action}
        </div>
      )}

      {/* ➡️ Navigation Affordance */}
      {isInteractive && !action && (
        <div 
          role="cell" 
          className="absolute top-1/2 -translate-y-1/2 right-4 lg:relative lg:top-0 lg:translate-y-0 lg:right-0 flex justify-end shrink-0"
        >
          <ChevronRight 
            size={18} 
            strokeWidth={2.5} 
            className="text-slate-300 group-hover:text-teal-500 group-hover:translate-x-0.5 transition-all duration-200" 
          />
        </div>
      )}
      
    </article>
  );
}