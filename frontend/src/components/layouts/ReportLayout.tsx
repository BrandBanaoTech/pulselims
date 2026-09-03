"use client";

import React, { useState, useCallback } from "react";
import { 
  PanelLeftClose, PanelRightClose, Columns, 
  Printer, Download, Send 
} from "lucide-react";
import { Button } from "@/components/ui/Button";

type LayoutMode = "split" | "form-only" | "preview-only";

interface ReportLayoutProps {
  header: React.ReactNode;
  formPane: React.ReactNode;
  previewPane: React.ReactNode;
  onPrint?: () => void;
  onWhatsApp?: () => void;
}

export function ReportLayout({ 
  header, 
  formPane, 
  previewPane, 
  onPrint,
  onWhatsApp 
}: ReportLayoutProps) {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("split");

  // Handles smooth transition to split mode before printing to ensure DOM is ready
  const handleSmartPrint = useCallback(() => {
    if (layoutMode === "form-only") {
      setLayoutMode("split");
      setTimeout(() => {
        if (onPrint) onPrint();
        else window.print();
      }, 300);
    } else {
      if (onPrint) onPrint();
      else window.print();
    }
  }, [layoutMode, onPrint]);

  return (
    <div className="flex flex-col h-screen w-full bg-slate-100 overflow-hidden font-sans relative">
      
      {/* 🚀 ENTERPRISE PRINT ENGINE */}
      <style jsx global>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body, html { background: #ffffff !important; margin: 0 !important; padding: 0 !important; }
          
          /* Hide EVERYTHING except the actual A4 paper container */
          header, .no-print, .left-pane-form, .layout-toggles { display: none !important; }
          
          /* Force browsers to print exact brand colors (Teal/Slate backgrounds) */
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

          /* Reset layout to allow the paper to fill the page */
          .print-paper-container { padding: 0 !important; margin: 0 !important; background: transparent !important; overflow: visible !important; }
          .print-paper-document {
            box-shadow: none !important; border: none !important; width: 210mm !important; min-height: 297mm !important;
            margin: 0 auto !important; padding: 0 !important; page-break-after: avoid;
          }
        }
      `}</style>

      {/* ================= HEADER AREA ================= */}
      <div className="shrink-0 z-20 no-print">
        {header}
        
        {/* Absolute positioned layout toggles (sits inside the header visually) */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 hidden lg:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 shadow-inner layout-toggles z-30">
          <button onClick={() => setLayoutMode("form-only")} className={`p-1.5 rounded-lg transition-all ${layoutMode === "form-only" ? "bg-white text-teal-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`} title="Form Focus">
            <PanelRightClose size={16} strokeWidth={2.5} />
          </button>
          <button onClick={() => setLayoutMode("split")} className={`p-1.5 rounded-lg transition-all ${layoutMode === "split" ? "bg-white text-teal-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`} title="Split View">
            <Columns size={16} strokeWidth={2.5} />
          </button>
          <button onClick={() => setLayoutMode("preview-only")} className={`p-1.5 rounded-lg transition-all ${layoutMode === "preview-only" ? "bg-white text-teal-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`} title="Full Preview">
            <PanelLeftClose size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* ================= WORKSPACE AREA ================= */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* LEFT PANE: Form */}
        {(layoutMode === "split" || layoutMode === "form-only") && (
          <div className={`left-pane-form flex-1 flex flex-col h-full bg-white border-r border-slate-200 z-10 transition-all duration-300 ${layoutMode === "form-only" ? "max-w-4xl mx-auto border-x shadow-2xl" : ""}`}>
            {formPane}
          </div>
        )}

        {/* RIGHT PANE: Live A4 PDF Preview */}
        {(layoutMode === "split" || layoutMode === "preview-only") && (
          <div className="flex-1 hidden md:flex flex-col bg-slate-200/50 relative overflow-hidden h-full">
            
            {/* Floating Action Bar (PDF Controls) */}
            <div className="absolute top-6 right-8 flex items-center gap-2 z-20 no-print animate-in fade-in slide-in-from-top-4">
              <button onClick={handleSmartPrint} className="p-3 bg-white text-slate-700 rounded-2xl shadow-lg border border-slate-200 hover:text-teal-600 hover:scale-105 active:scale-95 transition-all outline-none" title="Download / Print PDF">
                <Download size={18} strokeWidth={2.5} />
              </button>
              {onWhatsApp && (
                <button onClick={onWhatsApp} className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 hover:scale-105 active:scale-95 transition-all outline-none" title="Send WhatsApp">
                  <Send size={18} strokeWidth={2.5} />
                </button>
              )}
            </div>

            {/* The A4 Canvas Wrapper */}
            <div className="print-paper-container flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center items-start custom-scrollbar">
              {previewPane}
            </div>

          </div>
        )}
      </div>

    </div>
  );
}