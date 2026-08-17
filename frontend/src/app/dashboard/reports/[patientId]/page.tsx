"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Printer, CheckCircle2, Settings2, Download, Send } from "lucide-react";
import { useReportStore } from "@/store/useReportStore";
import { toast } from "@/lib/toast";

import { Button } from "@/components/ui/Button";
import { ReportPreview } from "@/features/reports/components/ReportPreview";
import { ReportSettingsDrawer } from "@/features/reports/components/ReportSettingsDrawer";

export default function DocumentEditorPage({ params }: { params: { patientId: string } }) {
  const { patient, setPatient, status, setStatus, resetReport } = useReportStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    setPatient({
      id: params.patientId || "PT-10024",
      name: "Rahul Sharma",
      age: 42,
      gender: "M",
      phone: "9876543210",
      refDoctor: "Dr. A.K. Gupta",
      registeredAt: "15 Oct 2026",
      barcode: (params.patientId || "10024").replace("PT-", "10024883")
    });
    return () => resetReport();
  }, [params.patientId, setPatient, resetReport]);

  const handleApprove = () => {
    setStatus("Approved");
    toast.success("Report Approved", "The report is digitally signed and ready to print.");
  };

  if (!patient) return null;

  return (
    // Added 'app-wrapper' class here for the print CSS to target
    <div className="app-wrapper flex flex-col h-screen w-full bg-slate-200/50 overflow-hidden font-sans relative">
      
      {/* 🚀 THE BULLETPROOF PRINT CSS */}
      <style jsx global>{`
        @media print {
          @page { 
            size: A4 portrait; 
            margin: 0; /* Let the document handle its own padding */
          }
          
          /* 1. Reset entire body so it doesn't force a 2nd page */
          body, html { 
            background: #ffffff !important; 
            margin: 0 !important; 
            padding: 0 !important; 
            height: auto !important;
          }
          
          /* 2. Hide ALL surrounding UI (Headers, sidebars, buttons) */
          .no-print { display: none !important; }
          
          /* 3. Strip the flexbox and 100vh height from the wrappers */
          .app-wrapper {
            height: auto !important;
            display: block !important;
            background: transparent !important;
          }

          .print-paper-container { 
            padding: 0 !important; 
            margin: 0 !important; 
            display: block !important;
            overflow: visible !important; 
          }
          
          /* 4. Strictly lock the A4 dimensions to kill the ghost page */
          .print-paper-document {
            width: 210mm !important; 
            height: 297mm !important; /* Exact A4 height */
            max-height: 297mm !important;
            box-shadow: none !important; 
            border: none !important; 
            margin: 0 !important; 
            padding: 0 !important; 
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            overflow: hidden !important; /* Hides any 1px spillover */
          }

          /* 5. Force precise colors (Teal, backgrounds, badges) */
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

          /* 6. Clean up native browser input rendering */
          input[type="number"]::-webkit-outer-spin-button,
          input[type="number"]::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          input[type="number"] { -moz-appearance: textfield; }
        }
      `}</style>

      {/* ================= TOP NAVIGATION BAR ================= */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 z-30 shadow-sm no-print">
        <div className="flex items-center gap-4">
          <button onClick={() => window.history.back()} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors outline-none">
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <div className="border-l border-slate-200 pl-4">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black text-slate-900 tracking-tight">{patient.name}</h1>
              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${status === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                {status}
              </span>
            </div>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
              {patient.id} • {patient.age}Y/{patient.gender} • Ref: {patient.refDoctor}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setIsSettingsOpen(true)} icon={<Settings2 size={14} />}>
            <span className="hidden md:inline">Design</span>
          </Button>
          <Button onClick={handleApprove} disabled={status === "Approved"} size="sm" icon={<CheckCircle2 size={16} strokeWidth={2.5} />}>
            {status === "Approved" ? "Approved" : "Approve"}
          </Button>
        </div>
      </header>

      {/* ================= THE CENTERED WORKSPACE ================= */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        
        {/* Floating Quick Actions */}
        <div className="absolute top-6 right-8 flex items-center gap-2 z-20 no-print">
          <button onClick={() => window.print()} className="p-3 bg-white text-slate-700 rounded-2xl shadow-lg border border-slate-200 hover:text-teal-600 hover:scale-105 active:scale-95 transition-all outline-none" title="Print to PDF">
            <Printer size={18} strokeWidth={2.5} />
          </button>
          <button className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 hover:scale-105 active:scale-95 transition-all outline-none" title="Send WhatsApp">
            <Send size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* The Scrollable A4 Canvas Wrapper */}
        <div className="print-paper-container flex-1 overflow-y-auto p-4 sm:p-10 flex justify-center items-start custom-scrollbar">
          <ReportPreview />
        </div>
      </div>

      {isSettingsOpen && <ReportSettingsDrawer onClose={() => setIsSettingsOpen(false)} />}
    </div>
  );
}
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