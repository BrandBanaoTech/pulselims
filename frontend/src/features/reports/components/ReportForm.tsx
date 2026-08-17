"use client";

import React, { useMemo } from "react";
import { Activity } from "lucide-react";
import { useReportStore } from "@/store/useReportStore";

// In a real app, this comes from an API based on the patient's selected tests.
const cbcParameters = [
  { id: "p1", name: "Hemoglobin (Hb)", unit: "g/dL", minRange: 13.0, maxRange: 17.0, referenceText: "13.0 - 17.0" },
  { id: "p2", name: "Total RBC Count", unit: "mill/cumm", minRange: 4.5, maxRange: 5.5, referenceText: "4.5 - 5.5" },
  { id: "p3", name: "Total WBC Count (TLC)", unit: "cells/cumm", minRange: 4000, maxRange: 11000, referenceText: "4000 - 11000" },
  { id: "p4", name: "Platelet Count", unit: "lakhs/cumm", minRange: 1.5, maxRange: 4.5, referenceText: "1.5 - 4.5" },
  { id: "p5", name: "Packed Cell Volume (PCV)", unit: "%", minRange: 40.0, maxRange: 50.0, referenceText: "40.0 - 50.0" },
  { id: "p6", name: "Mean Corpuscular Vol (MCV)", unit: "fL", minRange: 83.0, maxRange: 101.0, referenceText: "83.0 - 101.0" },
];

export function ReportForm() {
  const { metrics, setMetric, pathologistNote, setPathologistNote } = useReportStore();

  // NABL Auto-Flagging Logic
  const evaluateFlag = (paramId: string, value: string) => {
    if (!value) return null;
    const num = parseFloat(value);
    if (isNaN(num)) return null;

    const param = cbcParameters.find((p) => p.id === paramId);
    if (!param) return null;

    if (num < param.minRange) return "Low";
    if (num > param.maxRange) return "High";
    return "Normal";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Form Header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
          <Activity size={16} strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="text-sm font-black text-slate-900 tracking-tight">Complete Blood Count (CBC)</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Enter Results</p>
        </div>
      </div>

      {/* Form Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        <div className="space-y-4">
          {cbcParameters.map((param) => {
            const val = metrics[param.id] || "";
            const flag = evaluateFlag(param.id, val);

            return (
              <div key={param.id} className="group flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200/80 transition-colors">
                
                {/* Parameter Label */}
                <div className="w-full sm:w-[45%] flex flex-col shrink-0">
                  <label className="text-sm font-bold text-slate-800 leading-tight">{param.name}</label>
                  <span className="text-[10px] font-bold text-slate-400 mt-1 tracking-wide">Ref: {param.referenceText} {param.unit}</span>
                </div>

                {/* Input Field */}
                <div className="w-full sm:w-[55%] flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="0.01"
                      value={val}
                      onChange={(e) => setMetric(param.id, e.target.value)}
                      className={`w-full py-2.5 px-3 rounded-xl border text-sm font-black font-mono transition-all outline-none focus:ring-4 shadow-sm ${
                        flag === "High" ? "bg-rose-50/50 border-rose-300 text-rose-700 focus:ring-rose-500/20" :
                        flag === "Low" ? "bg-blue-50/50 border-blue-300 text-blue-700 focus:ring-blue-500/20" :
                        "bg-white border-slate-200 text-slate-900 focus:ring-teal-500/10 focus:border-teal-500"
                      }`}
                      placeholder="---"
                    />
                    {flag && flag !== "Normal" && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <span className={`flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-black shadow-sm ${flag === "High" ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"}`}>
                          {flag === "High" ? "H" : "L"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="w-16 shrink-0 text-xs font-semibold text-slate-400">{param.unit}</div>
                </div>
                
              </div>
            );
          })}
        </div>

        {/* Pathologist Notes */}
        <div className="pt-6 border-t border-slate-100">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Clinical Comments / Notes</label>
          <textarea
            value={pathologistNote}
            onChange={(e) => setPathologistNote(e.target.value)}
            className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all outline-none text-sm font-semibold text-slate-800 resize-none min-h-[120px] shadow-sm"
            placeholder="E.g., Mild anisocytosis observed. Advise clinical correlation."
          />
        </div>
      </div>
    </div>
  );
}