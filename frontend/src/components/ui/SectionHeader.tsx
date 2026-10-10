import React from "react";
import { LucideIcon } from "lucide-react";

type HeaderVariant = "transparent" | "primary" | "secondary" | "dark" | "danger";

interface SectionHeaderProps {
  title: string;
  hint?: string;
  icon?: LucideIcon;
  badge?: string;
  badgeColor?: "teal" | "amber" | "slate" | "blue" | "rose" | "emerald";
  variant?: HeaderVariant;
  action?: React.ReactNode;
}

// Boosted contrast slightly for WCAG accessibility compliance
const badgeStyles = {
  teal: "bg-teal-100 text-teal-800 border-teal-200/60",
  amber: "bg-amber-100 text-amber-800 border-amber-200/60",
  slate: "bg-slate-100 text-slate-800 border-slate-200/60",
  blue: "bg-blue-100 text-blue-800 border-blue-200/60",
  rose: "bg-rose-100 text-rose-800 border-rose-200/60",
  emerald: "bg-emerald-100 text-emerald-800 border-emerald-200/60",
};

// Text colors are defined at the root so children inherit them perfectly via opacity
const variantStyles: Record<HeaderVariant, string> = {
  transparent: "bg-transparent text-slate-900",
  primary: "bg-teal-600 text-white shadow-md shadow-teal-600/20 p-4",
  secondary: "bg-slate-50 text-slate-900 border border-slate-200/80 p-4",
  dark: "bg-slate-900 text-white shadow-md shadow-slate-900/20 p-4",
  danger: "bg-rose-50 text-rose-800 border border-rose-200/80 p-4",
};

export function SectionHeader({
  title,
  hint,
  icon: Icon,
  badge,
  badgeColor = "slate",
  variant = "transparent",
  action,
}: SectionHeaderProps) {
  return (
    <div
      className={`flex flex-col md:flex-row md:items-center justify-between rounded-xl mb-4 min-w-0 transition-colors ${variantStyles[variant]}`}
    >
      <div className="flex items-center min-w-0 gap-2.5">
        {Icon && (
          <div className="shrink-0 flex items-center justify-center opacity-70">
            <Icon size={18} strokeWidth={2.5} />
          </div>
        )}

        <div className="flex flex-wrap md:flex-nowrap items-center gap-2 min-w-0">
          {/* Inherits text color from the variant wrapper */}
          <h1 className="text-base font-bold tracking-tight truncate">
            {title}
          </h1>

          {badge && (
            <span
              className={`px-2 py-0.5 rounded text-[10.5px] font-bold uppercase tracking-wider border leading-none ${badgeStyles[badgeColor]}`}
            >
              {badge}
            </span>
          )}

          {hint && (
            <div className="hidden md:flex items-center gap-2.5 min-w-0 opacity-70">
              <span className="text-[10.5px] font-black">•</span>
              <p className="text-sm font-medium truncate leading-none">
                {hint}
              </p>
            </div>
          )}
        </div>
      </div>

      {action && (
        <div className="shrink-0 mt-3 md:mt-0 flex items-center">
          {action}
        </div>
      )}
    </div>
  );
}
// import React from "react";
// import { LucideIcon } from "lucide-react";

// interface SectionHeaderProps {
//   title: string;
//   hint?: string;
//   icon?: LucideIcon;
//   badge?: string;
//   badgeColor?: "teal" | "amber" | "slate" | "blue" | "rose" | "emerald";
//   action?: React.ReactNode;
// }

// const badgeStyles = {
//   teal: "bg-teal-50 text-teal-700 border-teal-200/60",
//   amber: "bg-amber-50 text-amber-700 border-amber-200/60",
//   slate: "bg-slate-50 text-slate-700 border-slate-200/60",
//   blue: "bg-blue-50 text-blue-700 border-blue-200/60",
//   rose: "bg-rose-50 text-rose-700 border-rose-200/60",
//   emerald: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
// };

// export function SectionHeader({ title, hint, icon: Icon, badge, badgeColor = "slate", action }: SectionHeaderProps) {
//   return (
//     <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
//       <div className="flex items-center min-w-0">
//         {Icon && (
//           <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-slate-600">
//             <Icon size={16} strokeWidth={2.5}/>
//           </div>
//         )}
//         <div className="flex flex-wrap md:flex-nowrap items-center gap-1.5 min-w-0">
          
//           <h1 className="text-[16px] font-black text-slate-900 tracking-tight leading-none truncate">
//             {title}
//           </h1>
          
//           {badge && (
//             <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest border shadow-sm leading-none ${badgeStyles[badgeColor]}`}>
//               {badge}
//             </span>
//           )}

//           {hint && (
//             <>
//               <span className="hidden md:inline-block text-slate-300 font-black mb-0.5">•</span>
//               <p className="hidden md:block text-[13px] font-medium text-slate-500 truncate leading-none">
//                 {hint}
//               </p>
//             </>
//           )}

//         </div>
//       </div>
//       {action && (
//         <div className="shrink-0">
//           {action}
//         </div>
//       )}
      
//     </div>
//   );
// }
// import React from "react";
// import { LucideIcon } from "lucide-react";

// interface SectionHeaderProps {
//   title: string;
//   hint?: string;
//   icon?: LucideIcon;
//   badge?: string;
//   badgeColor?: "teal" | "amber" | "slate" | "blue" | "rose" | "emerald";
//   action?: React.ReactNode;
// }

// export function SectionHeader({ 
//   title, 
//   hint, 
//   icon: Icon, 
//   badge,
//   badgeColor = "slate",
//   action 
// }: SectionHeaderProps) {
  
//   // Enterprise status badge color mappings
//   const badgeStyles = {
//     teal: "bg-teal-50 text-teal-700 border-teal-200/60",
//     amber: "bg-amber-50 text-amber-700 border-amber-200/60",
//     slate: "bg-slate-50 text-slate-700 border-slate-200/60",
//     blue: "bg-blue-50 text-blue-700 border-blue-200/60",
//     rose: "bg-rose-50 text-rose-700 border-rose-200/60",
//     emerald: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
//   };

//   return (
//     <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
//       <div className="flex items-start gap-4">
        
//         {/* Visual Anchor (Icon Box) */}
//         {Icon && (
//           <div className="w-12 h-12 rounded-[1rem] bg-white shadow-sm border border-slate-200/80 flex items-center justify-center shrink-0 text-slate-700 relative overflow-hidden group">
//             {/* Subtle background glow effect */}
//             <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-transparent opacity-50"></div>
//             <Icon size={22} strokeWidth={2.5} className="relative z-10 group-hover:scale-110 transition-transform duration-300" />
//           </div>
//         )}

//         {/* Title & Hint Block */}
//         <div className="flex flex-col justify-center pt-0.5">
//           <div className="flex items-center gap-3 flex-wrap">
//             <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-none">
//               {title}
//             </h1>
            
//             {/* Context Badge */}
//             {badge && (
//               <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border shadow-sm ${badgeStyles[badgeColor]}`}>
//                 {badge}
//               </span>
//             )}
//           </div>
          
//           {/* Hint / Description */}
//           {hint && (
//             <p className="text-xs md:text-sm font-semibold text-slate-500 mt-1.5 leading-snug max-w-2xl">
//               {hint}
//             </p>
//           )}
//         </div>
//       </div>

//       {/* Top-Right Action Slot */}
//       {action && (
//         <div className="shrink-0 sm:mt-1">
//           {action}
//         </div>
//       )}
//     </div>
//   );
// }