"use client";

import { useToastStore } from "@/store/useToastStore";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export function ToastProvider() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => {
        
        // Define styles and icons based on the type
        const styles = {
          success: "bg-emerald-50 border-emerald-200 text-emerald-800",
          error: "bg-rose-50 border-rose-200 text-rose-800",
          warning: "bg-amber-50 border-amber-200 text-amber-800",
          info: "bg-blue-50 border-blue-200 text-blue-800",
        }[t.type];

        const Icon = {
          success: <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />,
          error: <AlertCircle className="text-rose-500 shrink-0" size={20} />,
          warning: <AlertTriangle className="text-amber-500 shrink-0" size={20} />,
          info: <Info className="text-blue-500 shrink-0" size={20} />,
        }[t.type];

        return (
          <div
            key={t.id}
            role="alert"
            className={`flex items-start gap-3 w-[350px] p-4 rounded-2xl border shadow-xl pointer-events-auto animate-in slide-in-from-bottom-5 fade-in duration-300 ${styles}`}
          >
            {Icon}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold tracking-tight leading-tight">{t.message}</h4>
              {t.description && (
                <p className="text-xs font-medium opacity-80 mt-1">{t.description}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="p-1 rounded-md hover:bg-black/5 transition-colors outline-none shrink-0"
            >
              <X size={16} className="opacity-50 hover:opacity-100" />
            </button>
          </div>
        );
      })}
    </div>
  );
}