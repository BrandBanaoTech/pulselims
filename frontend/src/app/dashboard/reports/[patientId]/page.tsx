"use client";
import { ReportPreview } from "@/features/reports/components/ReportPreview";
import { useReportStore } from "@/store/useReportStore";
import { ClassicTemplate } from "@/features/reports/templates/ClassicTemplate";
import { ModernTemplate } from "@/features/reports/templates/ModernTemplate";
import { MinimalTemplate } from "@/features/reports/templates/MinimalTemplate";

export default function DocumentEditorPage(){
   const { status, config } = useReportStore();
  // const { patient, setPatient, status, setStatus, resetReport } = useReportStore();
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
    <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden animate-in fade-in duration-500">
      <main className="flex-1 space-y-8 w-full max-w-7xl mx-auto">
        {/* <ReportPreview /> */}
        {renderTemplate()}
      </main>
    </div>
  )
}

// "use client";

// import { useEffect, useState } from "react";
// import { 
//   ArrowLeft, Printer, CheckCircle2, Settings2, 
//   Download, Send, ZoomIn, ZoomOut, Maximize, FileText
// } from "lucide-react";
// import { useReportStore } from "@/store/useReportStore";
// import { toast } from "@/lib/toast";

// import { Button } from "@/components/ui/Button";
// import { ReportPreview } from "@/features/reports/components/ReportPreview";
// import { ReportSettingsDrawer } from "@/features/reports/components/ReportSettingsDrawer";

// export default function DocumentEditorPage({ params }: { params: { patientId: string } }) {
//   const { patient, setPatient, status, setStatus, resetReport } = useReportStore();
  
//   // New Studio States
//   const [isSettingsOpen, setIsSettingsOpen] = useState(false);
//   const [zoom, setZoom] = useState(1); // 1 = 100%

//   useEffect(() => {
//     setPatient({
//       id: params.patientId || "PT-10024",
//       name: "Rahul Sharma",
//       age: 42,
//       gender: "M",
//       phone: "9876543210",
//       refDoctor: "Dr. A.K. Gupta",
//       registeredAt: "15 Oct 2026",
//       barcode: (params.patientId || "10024").replace("PT-", "10024883")
//     });
//     return () => resetReport();
//   }, [params.patientId, setPatient, resetReport]);

//   const handleApprove = () => {
//     setStatus("Approved");
//     toast.success("Report Approved", "The report is digitally signed and ready to print.");
//   };

//   if (!patient) return null;

//   return (
//     <div className="app-wrapper flex flex-col h-screen w-full bg-slate-50 overflow-hidden font-sans relative">
      
//       {/* 🚀 THE PRINT MAGIC CSS (Kept strictly intact) */}
//       <style jsx global>{`
//         @media print {
//           @page { size: A4 portrait; margin: 0; }
//           body, html { background: #ffffff !important; margin: 0 !important; padding: 0 !important; height: auto !important; }
//           .no-print { display: none !important; }
//           .app-wrapper { height: auto !important; display: block !important; background: transparent !important; }
//           .print-paper-container { padding: 0 !important; margin: 0 !important; display: block !important; overflow: visible !important; transform: scale(1) !important; }
//           .print-paper-document {
//             width: 210mm !important; height: 297mm !important; max-height: 297mm !important;
//             box-shadow: none !important; border: none !important; margin: 0 !important; padding: 0 !important; 
//             page-break-after: avoid !important; page-break-inside: avoid !important; overflow: hidden !important;
//           }
//           * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
//           input[type="number"]::-webkit-outer-spin-button, input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
//           input[type="number"] { -moz-appearance: textfield; }
//         }
//       `}</style>

//       {/* ================= TOP NAVIGATION BAR ================= */}
//       <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 z-30 no-print">
//         <div className="flex items-center gap-4">
//           <button onClick={() => window.history.back()} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all outline-none active:scale-95">
//             <ArrowLeft size={20} strokeWidth={2.5} />
//           </button>
//           <div className="border-l border-slate-200 pl-4 flex items-center gap-3">
//             <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100/50">
//               <FileText size={18} strokeWidth={2.5} />
//             </div>
//             <div>
//               <div className="flex items-center gap-2">
//                 <h1 className="text-sm font-black text-slate-900 tracking-tight">{patient.name}</h1>
//                 <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${status === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
//                   {status}
//                 </span>
//               </div>
//               <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
//                 {patient.id} • {patient.age}Y/{patient.gender} • Ref: {patient.refDoctor}
//               </p>
//             </div>
//           </div>
//         </div>

//         <div className="flex items-center gap-2">
//           <Button variant="secondary" size="sm" onClick={() => setIsSettingsOpen(true)} icon={<Settings2 size={14} />}>
//             <span className="hidden md:inline">Design</span>
//           </Button>
//           <Button onClick={handleApprove} disabled={status === "Approved"} size="sm" icon={<CheckCircle2 size={16} strokeWidth={2.5} />}>
//             {status === "Approved" ? "Approved" : "Approve"}
//           </Button>
//         </div>
//       </header>

//       {/* ================= THE TACTILE WORKSPACE ================= */}
//       {/* The background uses a subtle grid pattern to feel like a design studio */}
//       <div className="flex-1 relative overflow-hidden flex flex-col bg-[#F8FAFC] bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px]">
        
//         {/* Zoom Controls (Top Right) */}
//         <div className="absolute top-6 right-8 z-20 no-print flex items-center bg-white/90 backdrop-blur border border-slate-200/80 shadow-sm rounded-xl p-1 animate-in fade-in slide-in-from-top-4">
//           <button onClick={() => setZoom(Math.max(0.5, zoom - 0.1))} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors outline-none" title="Zoom Out">
//             <ZoomOut size={16} strokeWidth={2.5} />
//           </button>
//           <div className="px-3 text-xs font-black font-mono text-slate-600 select-none w-14 text-center">
//             {Math.round(zoom * 100)}%
//           </div>
//           <button onClick={() => setZoom(Math.min(1.5, zoom + 0.1))} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors outline-none" title="Zoom In">
//             <ZoomIn size={16} strokeWidth={2.5} />
//           </button>
//           <div className="w-px h-4 bg-slate-200 mx-1" />
//           <button onClick={() => setZoom(1)} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors outline-none" title="Fit to Screen">
//             <Maximize size={16} strokeWidth={2.5} />
//           </button>
//         </div>

//         {/* The Scrollable Canvas Wrapper */}
//         <div className="print-paper-container flex-1 overflow-y-auto p-4 sm:p-12 flex justify-center items-start custom-scrollbar">
//           {/* Zoom Wrapper */}
//           <div 
//             className="transition-transform duration-200 ease-out origin-top pb-32" 
//             style={{ transform: `scale(${zoom})` }}
//           >
//             {/* Added ambient colored shadow for hyper-realistic paper depth */}
//             <div className="relative group/canvas">
//               <div className="absolute -inset-4 bg-teal-500/10 blur-2xl rounded-[3rem] opacity-0 group-hover/canvas:opacity-100 transition-opacity duration-700 pointer-events-none no-print"></div>
//               <ReportPreview />
//             </div>
//           </div>
//         </div>

//         {/* ================= THE FLOATING ACTION DOCK (macOS Style) ================= */}
//         <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 no-print animate-in fade-in slide-in-from-bottom-8">
//           <div className="flex items-center gap-1.5 p-1.5 bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl shadow-slate-900/40 rounded-2xl">
            
//             <button 
//               onClick={() => window.print()} 
//               className="flex items-center gap-2 px-5 py-2.5 rounded-xl hover:bg-white/10 text-slate-200 hover:text-white transition-all outline-none"
//             >
//               <Printer size={16} strokeWidth={2.5} />
//               <span className="text-xs font-bold tracking-wide">Print</span>
//             </button>

//             <button 
//               onClick={() => window.print()} // Print handles PDF generation native to browsers
//               className="flex items-center gap-2 px-5 py-2.5 rounded-xl hover:bg-white/10 text-slate-200 hover:text-white transition-all outline-none"
//             >
//               <Download size={16} strokeWidth={2.5} />
//               <span className="text-xs font-bold tracking-wide">PDF</span>
//             </button>
            
//             <div className="w-px h-6 bg-white/10 mx-1" />

//             <button 
//               className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] outline-none"
//             >
//               <Send size={16} strokeWidth={2.5} />
//               <span className="text-xs font-black tracking-wide">WhatsApp</span>
//             </button>

//           </div>
//         </div>

//       </div>

//       {isSettingsOpen && <ReportSettingsDrawer onClose={() => setIsSettingsOpen(false)} />}
//     </div>
//   );
// }
// "use client";

// import { useEffect, useState } from "react";
// import { ArrowLeft, Printer, CheckCircle2, Settings2, Download, Send } from "lucide-react";
// import { useReportStore } from "@/store/useReportStore";
// import { toast } from "@/lib/toast";

// import { Button } from "@/components/ui/Button";
// import { ReportPreview } from "@/features/reports/components/ReportPreview";
// import { ReportSettingsDrawer } from "@/features/reports/components/ReportSettingsDrawer";

// export default function DocumentEditorPage({ params }: { params: { patientId: string } }) {
//   const { patient, setPatient, status, setStatus, resetReport } = useReportStore();
//   const [isSettingsOpen, setIsSettingsOpen] = useState(false);

//   useEffect(() => {
//     setPatient({
//       id: params.patientId || "PT-10024",
//       name: "Rahul Sharma",
//       age: 42,
//       gender: "M",
//       phone: "9876543210",
//       refDoctor: "Dr. A.K. Gupta",
//       registeredAt: "15 Oct 2026",
//       barcode: (params.patientId || "10024").replace("PT-", "10024883")
//     });
//     return () => resetReport();
//   }, [params.patientId, setPatient, resetReport]);

//   const handleApprove = () => {
//     setStatus("Approved");
//     toast.success("Report Approved", "The report is digitally signed and ready to print.");
//   };

//   if (!patient) return null;

//   return (
//     // Added 'app-wrapper' class here for the print CSS to target
//     <div className="app-wrapper flex flex-col h-screen w-full bg-slate-200/50 overflow-hidden font-sans relative">
      
//       {/* 🚀 THE BULLETPROOF PRINT CSS */}
//       <style jsx global>{`
//         @media print {
//           @page { 
//             size: A4 portrait; 
//             margin: 0; /* Let the document handle its own padding */
//           }
          
//           /* 1. Reset entire body so it doesn't force a 2nd page */
//           body, html { 
//             background: #ffffff !important; 
//             margin: 0 !important; 
//             padding: 0 !important; 
//             height: auto !important;
//           }
          
//           /* 2. Hide ALL surrounding UI (Headers, sidebars, buttons) */
//           .no-print { display: none !important; }
          
//           /* 3. Strip the flexbox and 100vh height from the wrappers */
//           .app-wrapper {
//             height: auto !important;
//             display: block !important;
//             background: transparent !important;
//           }

//           .print-paper-container { 
//             padding: 0 !important; 
//             margin: 0 !important; 
//             display: block !important;
//             overflow: visible !important; 
//           }
          
//           /* 4. Strictly lock the A4 dimensions to kill the ghost page */
//           .print-paper-document {
//             width: 210mm !important; 
//             height: 297mm !important; /* Exact A4 height */
//             max-height: 297mm !important;
//             box-shadow: none !important; 
//             border: none !important; 
//             margin: 0 !important; 
//             padding: 0 !important; 
//             page-break-after: avoid !important;
//             page-break-inside: avoid !important;
//             overflow: hidden !important; /* Hides any 1px spillover */
//           }

//           /* 5. Force precise colors (Teal, backgrounds, badges) */
//           * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

//           /* 6. Clean up native browser input rendering */
//           input[type="number"]::-webkit-outer-spin-button,
//           input[type="number"]::-webkit-inner-spin-button {
//             -webkit-appearance: none;
//             margin: 0;
//           }
//           input[type="number"] { -moz-appearance: textfield; }
//         }
//       `}</style>

//       {/* ================= TOP NAVIGATION BAR ================= */}
//       <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 z-30 shadow-sm no-print">
//         <div className="flex items-center gap-4">
//           <button onClick={() => window.history.back()} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors outline-none">
//             <ArrowLeft size={20} strokeWidth={2.5} />
//           </button>
//           <div className="border-l border-slate-200 pl-4">
//             <div className="flex items-center gap-2">
//               <h1 className="text-sm font-black text-slate-900 tracking-tight">{patient.name}</h1>
//               <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${status === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
//                 {status}
//               </span>
//             </div>
//             <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
//               {patient.id} • {patient.age}Y/{patient.gender} • Ref: {patient.refDoctor}
//             </p>
//           </div>
//         </div>

//         <div className="flex items-center gap-2">
//           <Button variant="secondary" size="sm" onClick={() => setIsSettingsOpen(true)} icon={<Settings2 size={14} />}>
//             <span className="hidden md:inline">Design</span>
//           </Button>
//           <Button onClick={handleApprove} disabled={status === "Approved"} size="sm" icon={<CheckCircle2 size={16} strokeWidth={2.5} />}>
//             {status === "Approved" ? "Approved" : "Approve"}
//           </Button>
//         </div>
//       </header>

//       {/* ================= THE CENTERED WORKSPACE ================= */}
//       <div className="flex-1 relative overflow-hidden flex flex-col">
        
//         {/* Floating Quick Actions */}
//         <div className="absolute top-6 right-8 flex items-center gap-2 z-20 no-print">
//           <button onClick={() => window.print()} className="p-3 bg-white text-slate-700 rounded-2xl shadow-lg border border-slate-200 hover:text-teal-600 hover:scale-105 active:scale-95 transition-all outline-none" title="Print to PDF">
//             <Printer size={18} strokeWidth={2.5} />
//           </button>
//           <button className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 hover:scale-105 active:scale-95 transition-all outline-none" title="Send WhatsApp">
//             <Send size={18} strokeWidth={2.5} />
//           </button>
//         </div>

//         {/* The Scrollable A4 Canvas Wrapper */}
//         <div className="print-paper-container flex-1 overflow-y-auto p-4 sm:p-10 flex justify-center items-start custom-scrollbar">
//           <ReportPreview />
//         </div>
//       </div>

//       {isSettingsOpen && <ReportSettingsDrawer onClose={() => setIsSettingsOpen(false)} />}
//     </div>
//   );
// }
// "use client";

// import { useEffect, useState } from "react";
// import { ArrowLeft, Printer, CheckCircle2, Settings2 } from "lucide-react";
// import { useReportStore } from "@/store/useReportStore";
// import { toast } from "@/lib/toast";
// import { Button } from "@/components/ui/Button";

// // The 3 Core Architectural Pieces
// import { ReportLayout } from "@/components/layouts/ReportLayout";
// import { ReportForm } from "@/features/reports/components/ReportForm";
// import { ReportPreview } from "@/features/reports/components/ReportPreview";
// import { ReportSettingsDrawer } from "@/features/reports/components/ReportSettingsDrawer";

// export default function ReportBuilderPage({ params }: { params: { patientId: string } }) {
//   const { patient, setPatient, status, setStatus, resetReport } = useReportStore();
//   const [isSettingsOpen, setIsSettingsOpen] = useState(false);

//   // 1. Initial Fetch & Setup
//   useEffect(() => {
//     // Simulated API Fetch
//     const fetchedPatient = {
//       id: params.patientId || "PT-10024",
//       name: "Rahul Sharma",
//       age: 42,
//       gender: "M" as const,
//       phone: "9876543210",
//       refDoctor: "Dr. A.K. Gupta",
//       registeredAt: "15 Oct 2026, 10:30 AM",
//       barcode: (params.patientId || "10024").replace("PT-", "10024883")
//     };
    
//     setPatient(fetchedPatient);

//     // Cleanup memory when leaving page
//     return () => resetReport();
//   }, [params.patientId, setPatient, resetReport]);

//   // 2. Action Handlers
//   const handleWhatsApp = () => {
//     if (!patient) return;
//     const formattedPhone = patient.phone.startsWith("91") ? patient.phone : `91${patient.phone}`;
//     const message = encodeURIComponent(`Hello ${patient.name},\n\nYour diagnostic report is ready.\n\nThank you.`);
//     window.open(`https://wa.me/${formattedPhone}?text=${message}`, "_blank");
//   };

//   const handleApprove = () => {
//     setStatus("Approved");
//     toast.success("Report Approved", "The report has been digitally signed and is ready for dispatch.");
//   };

//   if (!patient) return null; // Or a loading spinner

//   // 3. Render Header Component
//   const renderHeader = () => (
//     <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm">
//       <div className="flex items-center gap-4">
//         <button onClick={() => window.history.back()} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors outline-none">
//           <ArrowLeft size={20} strokeWidth={2.5} />
//         </button>
//         <div className="hidden sm:block border-l border-slate-200 pl-4">
//           <div className="flex items-center gap-2">
//             <h1 className="text-sm font-black text-slate-900 tracking-tight">{patient.name}</h1>
//             <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${status === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
//               {status}
//             </span>
//           </div>
//           <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
//             {patient.id} • {patient.age}Y/{patient.gender} • Ref: {patient.refDoctor}
//           </p>
//         </div>
//       </div>

//       <div className="flex items-center gap-2">
//         <Button variant="secondary" size="sm" onClick={() => setIsSettingsOpen(true)} icon={<Settings2 size={14} />}>
//           <span className="hidden md:inline">Design</span>
//         </Button>
//         <Button 
//           onClick={handleApprove}
//           disabled={status === "Approved"}
//           size="sm"
//           icon={<CheckCircle2 size={16} strokeWidth={2.5} />}
//         >
//           {status === "Approved" ? "Approved" : "Approve"}
//         </Button>
//       </div>
//     </div>
//   );

//   // 4. The Grand Assembly
//   return (
//     <>
//       <ReportLayout 
//         header={renderHeader()}
//         formPane={<ReportForm />}
//         previewPane={<ReportPreview />}
//         onWhatsApp={handleWhatsApp}
//       />
      
//       {/* 5. Customization Engine Drawer */}
//       {isSettingsOpen && (
//         <ReportSettingsDrawer onClose={() => setIsSettingsOpen(false)} />
//       )}
//     </>
//   );
// }