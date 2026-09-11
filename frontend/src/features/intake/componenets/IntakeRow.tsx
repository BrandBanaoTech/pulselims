"use client";

import { memo } from "react";
import { Clock, ShieldAlert, ChevronRight, Phone, SquarePen } from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import type { IntakeRecord } from "../schemas/intake.schema";
import { IntakeActionsMenu } from "./IntakeActionsMenu";

export interface IntakeActions {
  isMenuOpen?: (id: string) => boolean;
  toggleMenu?: (id: string) => void;
  view?: (id: string) => void;
  updateStatus?: (id: string, current: string) => void;
  collectBalance?: (data: IntakeRecord) => void;
  delete?: (id: string, name: string) => void;
}

const CHIP = "px-1.5 py-0.5 rounded-md border text-[9px] font-bold uppercase tracking-widest shadow-sm leading-none";
const CURRENCY = (num?: number) => (Number(num) || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export const IntakeRow = memo(({ 
  data = {}, 
  actions = {}
}: { 
  data?: Partial<IntakeRecord>; 
  actions?: IntakeActions;
}) => {
  const { id = "", patient_phone = "N/A", accession_number = "N/A", patient_name = "Unknown", patient_age = "-", patient_gender = "-", priority = "Routine", test_ids = [], net_amount = 0, balance_due = 0, status = "registered", intake_date } = data;

  const isOpen = actions.isMenuOpen?.(id);
  return (
    <div 
      role="row"
      onClick={() => actions.view?.(id)}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); actions.view?.(id); } }}
      className={`group relative flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:gap-4 lg:items-center p-4 lg:px-5 lg:py-2.5 cursor-pointer outline-none focus-visible:bg-slate-50 ${isOpen ? 'z-50' : 'z-10'}`}
    >
      
      {/* 1. Demographics */}
      <div role="cell" className="col-span-3 flex items-start lg:items-center gap-3 min-w-0">
        <span className="lg:hidden w-24 shrink-0 text-xs font-semibold text-slate-400 uppercase mt-2">Patient</span>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
            <h4 className="text-[13.5px] font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
              {patient_name}
            </h4>
            <span className="text-[10.5px] font-mono font-bold text-slate-900 bg-slate-100 border border-slate-200/80 px-0.5 rounded-md shadow-sm">
            {accession_number}</span>
            </div>
            <p className="text-[10.5px] font-medium text-slate-500 truncate mt-0.5">
              <span className="font-mono text-slate-400"></span>  {patient_age}y • {patient_gender} • {patient_phone}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Diagnostics */}
      <div role="cell" className="col-span-3 flex lg:block items-center min-w-0">
        <span className="lg:hidden w-24 shrink-0 text-xs font-semibold text-slate-400 uppercase">Diagnostics</span>
        <div className="flex flex-wrap gap-1.5 items-center min-w-0">
          {priority === "STAT" && (
            <span className={`${CHIP} bg-rose-50/80 text-rose-700 border-rose-200/60 flex items-center gap-1`}>
              <ShieldAlert size={10} strokeWidth={2.5} /> STAT
            </span>
          )}
          {test_ids.length === 0 && <span className="text-[10px] font-medium text-slate-400 italic">No tests</span>}
          {test_ids.slice(0, 2).map((tId, idx) => (
            <span key={idx} className={`${CHIP} bg-white/60 backdrop-blur-sm text-slate-600 border-slate-200/60`}>
              {tId}
            </span>
          ))}
          {test_ids.length > 2 && (
            <span className={`${CHIP} bg-white/40 text-slate-500 border-slate-200/40`}>
              +{test_ids.length - 2}
            </span>
          )}
        </div>
      </div>

      {/* 3. Billing */}
      <div role="cell" className="col-span-2 flex lg:block items-center min-w-0">
        <span className="lg:hidden w-24 shrink-0 text-xs font-semibold text-slate-400 uppercase">Billing</span>
        <div className="min-w-0">
          <p className="text-[13px] font-black font-mono text-slate-900 truncate">₹{CURRENCY(net_amount)}</p>
          {balance_due > 0 ? (
            <p className="text-[9.5px] text-amber-600 font-bold uppercase tracking-widest mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> DUE: ₹{CURRENCY(balance_due)}
            </p>
          ) : (
            <p className="text-[9.5px] text-emerald-600 font-bold uppercase tracking-widest mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> PAID
            </p>
          )}
        </div>
      </div>

      {/* 4. Status */}
      <div role="cell" className="col-span-3 flex lg:flex-col lg:items-start items-center">
        <span className="lg:hidden w-24 shrink-0 text-xs font-semibold text-slate-400 uppercase">Status</span>
        <div>
          {/* 🚀 Glassy Button */}
          <button onClick={(e) => { e.stopPropagation(); actions.updateStatus?.(id, status); }} className="outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md block transition-transform active:scale-95 bg-white/40 backdrop-blur-sm hover:bg-white/80">
            <StatusBadge status={status as any} label={status} isPulsing={status !== 'completed' && status !== 'cancelled'} />
          </button>
          {intake_date && (
            <div className="hidden lg:flex items-center gap-1 text-[9.5px] font-bold tracking-widest text-slate-400 mt-1.5 ml-0.5">
              <Clock size={10} strokeWidth={2.5} /> 
              {new Date(intake_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
      </div>

      {/* 5. Actions */}
      <div role="cell" className="col-span-1 flex items-center lg:justify-end gap-2 mt-3 lg:mt-0 pt-3 lg:pt-0 border-t border-slate-100/50 lg:border-none">
        
        <div className="flex items-center gap-1.5">
          <button onClick={(e) => { e.stopPropagation(); actions.view?.(id); }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white/80 rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 shadow-sm border border-transparent hover:border-slate-200/60 backdrop-blur-sm">
            <SquarePen size={18} strokeWidth={2.5} />
          </button>
          <div onClick={(e) => e.stopPropagation()}>
            <IntakeActionsMenu data={data as IntakeRecord} actions={actions} />
          </div>
        </div>

      </div>

    </div>
  );
});

IntakeRow.displayName = "IntakeRow";