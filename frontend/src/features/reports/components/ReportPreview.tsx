import React from "react";
import { useReportStore } from "@/store/useReportStore";
import { ClassicTemplate } from "../templates/ClassicTemplate";
import { ModernTemplate } from "../templates/ModernTemplate";
import { MinimalTemplate } from "../templates/MinimalTemplate";

export function ReportPreview() {
  const { status, config } = useReportStore();

  // Dynamic template router
  const renderTemplate = () => {
    switch (config.template) {
      case "classic": return <ClassicTemplate />;
      case "modern": return <ModernTemplate />;
      case "minimal": return <MinimalTemplate />;
      default: return <ModernTemplate />;
    }
  };

  return (
    <div className="print-paper-document bg-white shadow-2xl ring-1 ring-slate-200/50 w-[794px] min-h-[1123px] flex flex-col relative overflow-hidden">
      
      {/* 🛡️ Universal Draft Watermark */}
      {status === "Draft" && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0 opacity-[0.03] no-print-bg">
          <span className="text-[150px] font-black text-slate-900 tracking-widest -rotate-45 select-none">DRAFT</span>
        </div>
      )}

      {/* 🚀 Render the Selected Design */}
      <div className="flex-1 flex flex-col relative z-10">
        {renderTemplate()}
      </div>

    </div>
  );
}