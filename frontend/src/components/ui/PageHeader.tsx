import React from "react";
import { LucideIcon } from "lucide-react";

export interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  icon?: LucideIcon;
  children?: React.ReactNode; // Used for action buttons on the right
  className?: string;
}

export function PageHeader({ 
  title, 
  description, 
  eyebrow, 
  icon: Icon, 
  children, 
  className = "" 
}: PageHeaderProps) {
  return (
    <header className={`mb-6 lg:mb-8 ${className}`}>
      
      {/* 1. The Eyebrow & Icon */}
      {(eyebrow || Icon) && (
        <div className="flex items-center gap-2.5 text-teal-600 mb-2 animate-in fade-in slide-in-from-left-2 duration-500">
          {Icon && <Icon size={18} strokeWidth={2.5} />}
          {eyebrow && <span className="text-[10px] font-black uppercase tracking-widest">{eyebrow}</span>}
        </div>
      )}
      
      {/* 2. Main Title & Description */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-75 fill-mode-both">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="text-sm font-medium text-slate-500 mt-2 max-w-xl leading-relaxed">
              {description}
            </p>
          )}
        </div>
        
        {/* 3. Right-Aligned Actions (Buttons) */}
        {children && (
          <div className="flex items-center gap-3 shrink-0 animate-in fade-in zoom-in-95 duration-500 delay-150 fill-mode-both">
            {children}
          </div>
        )}
      </div>

    </header>
  );
}

// usecase
// import { PageHeader } from "@/components/ui/PageHeader";
// import { Button } from "@/components/ui/Button";
// import { Settings, Save } from "lucide-react";

// export default function WorkspaceSettingsPage() {
//   return (
//     <div className="flex-1 p-6">
      
//       {/* Look how clean this is now! */}
//       <PageHeader
//         icon={Settings}
//         eyebrow="Configuration Console"
//         title="Workspace Settings"
//         description="Manage compliance metadata, configure team access protocols, and control deep system integrations for Brand Banao Lab."
//       >
//         {/* You can optionally pass buttons here, and they will automatically align to the right! */}
//         <Button variant="secondary">Discard</Button>
//         <Button icon={<Save size={16} />}>Save Changes</Button>
//       </PageHeader>

//       {/* Rest of your page content goes here */}
//       <div className="bg-white rounded-[2rem] border border-slate-200/80 p-8 shadow-sm">
//          {/* Forms, inputs, etc. */}
//       </div>

//     </div>
//   );
// }