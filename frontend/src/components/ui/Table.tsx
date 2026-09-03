import React from "react";
import { Search } from "lucide-react";
import { Button } from "./Button";

export function TableWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="hidden lg:block bg-white rounded-[2rem] border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] overflow-visible relative z-10 w-full mb-12">
      <table className="w-full text-left border-collapse">{children}</table>
    </div>
  );
}

export function TableHeader({ children }: { children: React.ReactNode }) {
  return <thead><tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{children}</tr></thead>;
}

export function TableHead({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`py-5 px-6 first:rounded-tl-[2rem] last:rounded-tr-[2rem] last:text-right ${className}`}>{children}</th>;
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-slate-100">{children}</tbody>;
}

export function TableRow({ children, onClick, className = "" }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return <tr onClick={onClick} className={`hover:bg-slate-50/80 transition-colors group relative ${onClick ? "cursor-pointer" : ""} ${className}`}>{children}</tr>;
}

export function TableCell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`py-4 px-6 last:text-right ${className}`}>{children}</td>;
}

export function TableEmpty({ title = "No records found", description = "Adjust your filters or clear the search query.", onClear }: { title?: string; description?: string; onClear?: () => void; }) {
  return (
    <div className="py-20 text-center bg-slate-50/50 rounded-b-[2rem]">
      <div className="w-16 h-16 bg-white text-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200 shadow-sm">
        <Search size={32} />
      </div>
      <p className="text-slate-900 font-bold">{title}</p>
      <p className="text-sm text-slate-500 mt-1">{description}</p>
      {onClear && <div className="mt-4 flex justify-center"><Button variant="secondary" size="sm" onClick={onClear}>Clear Filters</Button></div>}
    </div>
  );
}