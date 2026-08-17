import React from "react";

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label({ children, required, className = "", ...props }: LabelProps) {
  return (
    <label 
      className={`block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ${className}`} 
      {...props}
    >
      {children} {required && <span className="text-rose-500">*</span>}
    </label>
  );
}