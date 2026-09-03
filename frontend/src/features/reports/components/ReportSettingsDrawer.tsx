"use client";

import React, { useEffect } from "react";
import { X, Palette, LayoutTemplate, FileCheck2, Image as ImageIcon } from "lucide-react";
import { useReportStore, TemplateStyle } from "@/store/useReportStore";

export function ReportSettingsDrawer({ onClose }: { onClose: () => void }) {
  const { config, updateConfig } = useReportStore();

  // Prevent background scrolling when drawer is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const THEME_COLORS = [
    "#0d9488", // Teal (Default)
    "#2563eb", // Royal Blue
    "#4f46e5", // Indigo
    "#e11d48", // Rose/Crimson
    "#ea580c", // Orange
    "#475569", // Slate/Corporate
  ];

  return (
    <div className="fixed inset-0 z-[100] flex justify-end no-print">
      {/* 1. Backdrop Blur Overlay */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      
      {/* 2. Sliding Drawer Panel */}
      <div className="relative w-full md:w-[420px] h-full bg-slate-50 shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-500 z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-white shrink-0 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center border border-slate-200 shadow-sm">
              <Palette size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Report Settings</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Customize Template</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors outline-none"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Scrollable Configuration Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-8 custom-scrollbar">
          
          {/* A. Template Selection (Radio Cards) */}
          <div className="space-y-3">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
              Template Architecture
            </label>
            <div className="grid gap-3">
              {(["classic", "modern", "minimal"] as TemplateStyle[]).map((tmpl) => {
                const isActive = config.template === tmpl;
                return (
                  <button
                    key={tmpl} 
                    onClick={() => updateConfig({ template: tmpl })}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left outline-none ${
                      isActive 
                        ? "border-teal-500 bg-teal-50/50 shadow-sm ring-4 ring-teal-500/10" 
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      isActive ? "bg-teal-100 text-teal-600" : "bg-slate-100 text-slate-400"
                    }`}>
                      <LayoutTemplate size={20} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    <div>
                      <p className={`text-sm font-black capitalize ${isActive ? "text-teal-900" : "text-slate-900"}`}>
                        {tmpl} Design
                      </p>
                      <p className="text-[10px] font-bold text-slate-500 mt-0.5 leading-snug">
                        {tmpl === "classic" && "Traditional medical borders & grids"}
                        {tmpl === "modern" && "Sleek SaaS aesthetic with soft backgrounds"}
                        {tmpl === "minimal" && "High whitespace, borderless elegance"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* B. Brand Color Selection */}
          <div className="space-y-3">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
              Brand Accent Color
            </label>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap gap-4 justify-center shadow-sm">
              {THEME_COLORS.map((color) => {
                const isActive = config.themeColor === color;
                return (
                  <button
                    key={color} 
                    onClick={() => updateConfig({ themeColor: color })}
                    className={`w-10 h-10 rounded-full transition-all outline-none ${
                      isActive 
                        ? "scale-110 ring-4 ring-offset-2 ring-slate-100 shadow-md" 
                        : "hover:scale-105 hover:shadow-sm ring-1 ring-slate-200"
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                );
              })}
            </div>
          </div>

          {/* C. Document Elements Toggle List */}
          <div className="space-y-3 pt-4 border-t border-slate-200/80">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
              Document Elements
            </label>
            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-sm overflow-hidden">
              
              {/* Header Toggle */}
              <label className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <ImageIcon size={16} className="text-slate-400" />
                  <span className="text-sm font-bold text-slate-700">Show Header (Letterhead)</span>
                </div>
                <div className={`w-10 h-6 rounded-full p-1 transition-colors ${config.showHeader ? "bg-teal-500" : "bg-slate-200"}`}>
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${config.showHeader ? "translate-x-4" : "translate-x-0"}`} />
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={config.showHeader} 
                  onChange={(e) => updateConfig({ showHeader: e.target.checked })} 
                />
              </label>

              {/* Footer Toggle */}
              <label className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <FileCheck2 size={16} className="text-slate-400" />
                  <span className="text-sm font-bold text-slate-700">Show Footer (Signatures)</span>
                </div>
                <div className={`w-10 h-6 rounded-full p-1 transition-colors ${config.showFooter ? "bg-teal-500" : "bg-slate-200"}`}>
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${config.showFooter ? "translate-x-4" : "translate-x-0"}`} />
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={config.showFooter} 
                  onChange={(e) => updateConfig({ showFooter: e.target.checked })} 
                />
              </label>

              {/* QR Code Toggle */}
              <label className={`flex items-center justify-between p-4 transition-colors ${!config.showFooter ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-slate-50"}`}>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-700">Show Verification QR Code</span>
                  <span className="text-[10px] font-semibold text-slate-400 mt-0.5">Requires Footer to be active</span>
                </div>
                <div className={`w-10 h-6 rounded-full p-1 transition-colors ${config.showQR && config.showFooter ? "bg-teal-500" : "bg-slate-200"}`}>
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${config.showQR && config.showFooter ? "translate-x-4" : "translate-x-0"}`} />
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={config.showQR} 
                  disabled={!config.showFooter}
                  onChange={(e) => updateConfig({ showQR: e.target.checked })} 
                />
              </label>

            </div>
          </div>

        </div>

        {/* Sticky Footer */}
        <div className="p-5 border-t border-slate-200/80 bg-white shrink-0 sticky bottom-0 z-20">
          <button 
            onClick={onClose}
            className="w-full px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-black rounded-xl shadow-lg shadow-slate-900/20 transition-all active:scale-95 outline-none"
          >
            Apply Settings
          </button>
        </div>

      </div>
    </div>
  );
}