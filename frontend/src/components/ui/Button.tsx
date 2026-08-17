import React from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export function Button({ 
  children, variant = "primary", size = "md", isLoading, icon, className = "", ...props 
}: ButtonProps) {
  
  const baseStyle = "inline-flex items-center justify-center gap-2 rounded-xl transition-all active:scale-95 outline-none disabled:opacity-50 disabled:pointer-events-none shrink-0";
  
  const variants = {
    primary: "bg-teal-600 hover:bg-teal-700 text-white font-black shadow-lg shadow-teal-500/20",
    secondary: "bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-200/80 shadow-sm",
    danger: "bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold border border-rose-200/80",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-600 font-bold"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base"
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`} disabled={isLoading || props.disabled} {...props}>
      {isLoading ? <Loader2 size={16} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}