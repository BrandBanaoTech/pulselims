import React, { forwardRef } from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "dark";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = "primary", size = "md", isLoading, icon, className = "", ...props }, ref) => {
    
    const baseStyle = "inline-flex items-center justify-center gap-2 rounded-xl transition-all active:scale-95 outline-none disabled:opacity-50 disabled:pointer-events-none shrink-0";
    
    const variants = {
      primary: "bg-teal-600 hover:bg-teal-700 text-white font-black shadow-lg shadow-teal-500/20",
      secondary: "bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold shadow-sm",
      dark: "bg-slate-900 hover:bg-slate-800 text-white font-black shadow-lg shadow-slate-900/20",
      danger: "bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold border border-rose-200/80",
    };

    const sizes = {
      sm: "px-4 py-2 text-xs",
      md: "px-6 py-3 text-sm",
      lg: "px-8 py-4 text-base"
    };

    return (
      <button ref={ref} className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`} disabled={isLoading || props.disabled} {...props}>
        {isLoading ? <Loader2 size={16} className="animate-spin" /> : icon}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";