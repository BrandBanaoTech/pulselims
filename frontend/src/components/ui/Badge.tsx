import React from "react";

interface BadgeProps {
  status: "completed" | "processing" | "sample_collected" | "cancelled" | "registered" | string;
  label: string;
  isPulsing?: boolean;
}

export function StatusBadge({ status, label, isPulsing = false }: BadgeProps) {
  const getColors = () => {
    if (status === 'completed') return 'bg-emerald-50 text-emerald-800 border-emerald-200/80 ring-emerald-500';
    if (status === 'processing') return 'bg-blue-50 text-blue-800 border-blue-200/80 ring-blue-500';
    if (status === 'sample_collected') return 'bg-indigo-50 text-indigo-800 border-indigo-200/80 ring-indigo-500';
    if (status === 'cancelled') return 'bg-rose-50 text-rose-800 border-rose-200/80 ring-rose-500';
    return 'bg-amber-50 text-amber-800 border-amber-200/80 ring-amber-500'; // Default/Registered
  };

  const colors = getColors();

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border shadow-sm ${colors}`}>
      {isPulsing && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ring-current ring-inset bg-current" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 ring-2 ring-current ring-inset bg-current" />
        </span>
      )}
      <span>{label}</span>
    </div>
  );
}