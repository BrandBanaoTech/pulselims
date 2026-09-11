"use client";

import { memo } from "react";
import { MoreHorizontal, FileText, RefreshCcw, CreditCard, Trash2 } from "lucide-react";
import type { IntakeRecord } from "../schemas/intake.schema";
import type { IntakeActions } from "./IntakeRow";

export const IntakeActionsMenu = memo(({ data, actions }: { data: IntakeRecord; actions: IntakeActions }) => {
  const isOpen = actions.isMenuOpen?.(data.id) ?? false;

  return (
    // 🚀 FIX 1: The wrapper itself becomes z-50 when open so it forces itself above the chevron button
    <div className={`relative ${isOpen ? 'z-50' : 'z-0'}`} onClick={(e) => e.stopPropagation()}>
      
      <button 
        onClick={() => actions.toggleMenu?.(data.id)}
        className={`p-1.5 rounded-lg transition-all outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 shadow-sm border ${
          isOpen 
            ? "bg-white text-indigo-600 border-slate-200" 
            : "text-slate-400 hover:text-indigo-600 hover:bg-white border-transparent hover:border-slate-200/60"
        }`}
        aria-label="Open Actions Menu"
        aria-expanded={isOpen}
      >
        <MoreHorizontal size={18} strokeWidth={2.5} />
      </button>

      {isOpen && (
        // 🚀 FIX 2: Added absolute right-0 so it anchors properly, and z-[100] to float over everything
        <div className="absolute right-0 top-full mt-2 w-48 bg-white/95 backdrop-blur-xl rounded-xl border border-slate-200/80 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] ring-1 ring-black/5 p-1 z-[100] animate-in fade-in zoom-in-95 duration-100 origin-top-right">
          
          <div className="flex flex-col">
            <button 
              onClick={() => { actions.toggleMenu?.(data.id); actions.view?.(data.id); }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-slate-600 hover:text-teal-700 hover:bg-teal-50/70 rounded-md transition-colors outline-none"
            >
              <FileText size={14} strokeWidth={2.5} />
              View Details
            </button>

            {/* <button 
              onClick={() => { actions.toggleMenu?.(data.id); actions.updateStatus?.(data.id, data.status); }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-slate-600 hover:text-teal-700 hover:bg-teal-50/70 rounded-md transition-colors outline-none"
            >
              <RefreshCcw size={14} strokeWidth={2.5} />
              Advance Workflow
            </button> */}

            {data.balance_due > 0 && (
              <button 
                onClick={() => { actions.toggleMenu?.(data.id); actions.collectBalance?.(data); }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-slate-600 hover:text-teal-700 hover:bg-teal-50/70 rounded-md transition-colors outline-none"
              >
                <CreditCard size={14} strokeWidth={2.5} />
                Collect Payment
              </button>
            )}

            <div className="h-px bg-slate-100 my-1 mx-1" />

            <button 
              onClick={() => { actions.toggleMenu?.(data.id); actions.delete?.(data.id, data.patient_name); }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors outline-none"
            >
              <Trash2 size={14} strokeWidth={2.5} />
              Cancel Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

IntakeActionsMenu.displayName = "IntakeActionsMenu";