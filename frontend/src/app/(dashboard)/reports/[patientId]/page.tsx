"use client";
import { useEffect, useState } from "react";
import ReportLayout from "@/features/reports/components/Layout/Report";
import Intake from "@/features/reports/components/Intake";
import Results from "@/features/reports/components/Results";
import { LabResponse, labService } from "@/features/labs/api/lab.service";
import { useAuthStore } from "@/store/useAuthStore";


interface ReportTemplate {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  header_layout: "left-aligned" | "centered" | "split";
  font_family: string;
}


export default function Report() {
  const [labData, setLabData] = useState<LabResponse>();
  const activeLab = useAuthStore((state) => state.activeLab);

  const template: ReportTemplate = labData?.template || {
        primary_color: "#0f172a", 
        secondary_color: "#475569",
        accent_color: "#059669",
        header_layout: "split",
        font_family: "'Inter', system-ui, sans-serif",
    };

    useEffect(() => {
        const fetchLabData = async () => {
            if (!activeLab) return;
            try {
                const data = await labService.getLabDetails(activeLab);
                setLabData(data);
            } catch (error) {
                console.error("Error fetching lab data:", error);
            }
        };
        fetchLabData();
    }, [activeLab]);

  return (
    <div className="relative mx-auto bg-white shadow-lg print:shadow-none print:m-0 w-full max-w-[210mm] min-h-[297mm] p-[10mm] sm:p-[15mm] text-black text-sm leading-snug box-border flex flex-col"
      // A4 Size  
      style={
          {
            "--primary-color": template.primary_color,
            fontFamily: template.font_family,
          } as React.CSSProperties
        }
      >
      {/* Watermark */}
      {labData?.logo_url && (
          <div className="absolute inset-0 flex justify-center items-center opacity-[0.03] pointer-events-none z-0">
            <img src={labData.logo_url} alt="watermark" className="w-96 grayscale" />
          </div>
      )}
      {labData? (
      <ReportLayout labData={labData}>
        <Intake />
        <Results />
      </ReportLayout>
      ) : ("")}
    </div>
  )
}

// import React, { memo } from "react";

// // --- INTERFACES ---
// interface ReportTemplate {
//   primary_color: string;
//   secondary_color: string;
//   accent_color: string;
//   header_layout: "left-aligned" | "centered" | "split";
//   font_family: string;
// }

// interface LabAddress {
//   street_1?: string;
//   street_2?: string;
//   city?: string;
//   state?: string;
//   zip_code?: string;
//   country?: string;
// }

// // New interfaces for dynamic test results
// export interface TestParameter {
//   id: string;
//   name: string;
//   result: string | number;
//   flag: "High" | "Low" | "Normal" | "";
//   unit: string;
//   referenceValue: string;
// }

// export interface TestGroup {
//   groupName: string;
//   parameters: TestParameter[];
// }

// interface ReportTemplateTabProps {
//   labData: {
//     name: string;
//     logo_url?: string;
//     address?: LabAddress;
//     contact_phone?: string;
//     mobile_2?: string;
//     support_email?: string;
//     website?: string;
//     accreditation?: string;
//     template?: ReportTemplate;
//   };
//   // Accepts dynamic data, falls back to mock data if not provided
//   reportGroups?: TestGroup[]; 
// }

// const ReportTemplateTab = memo(({ labData, reportGroups }: ReportTemplateTabProps) => {
//   // Default Template config
//   const template: ReportTemplate = labData?.template || {
//     primary_color: "#0f172a", // Very dark professional slate
//     secondary_color: "#475569",
//     accent_color: "#059669",
//     header_layout: "split",
//     font_family: "'Inter', system-ui, sans-serif",
//   };

//   const headerLayouts = {
//     "left-aligned": "flex-row text-left",
//     centered: "flex-col items-center text-center gap-4",
//     split: "flex-row justify-between text-left items-center",
//   };

//   const formatAddress = (address?: LabAddress) => {
//     if (!address) return "123 Health Avenue, Medical District, Cityville, 100021";
//     const addressParts = [
//       address.street_1, address.street_2, address.city,
//       `${address.state || ""} ${address.zip_code || ""}`.trim(), address.country,
//     ];
//     return addressParts.filter(Boolean).join(", ");
//   };

//   // MOCK DATA: Used if no dynamic data is passed via props (Shows CBC & KFT)
//   const data: TestGroup[] = reportGroups || [
//     {
//       groupName: "Complete Blood Count (CBC)",
//       parameters: [
//         { id: "p1", name: "Hemoglobin (Hb)", result: "14.2", flag: "Normal", unit: "g/dL", referenceValue: "13.0 - 17.0" },
//         { id: "p2", name: "Total Leukocyte Count (TLC)", result: "11,500", flag: "High", unit: "cells/cu.mm", referenceValue: "4,000 - 10,000" },
//         { id: "p3", name: "Platelet Count", result: "250", flag: "Normal", unit: "x10³/µL", referenceValue: "150 - 450" },
//       ]
//     },
//     {
//       groupName: "Kidney Function Test (KFT)",
//       parameters: [
//         { id: "p4", name: "Blood Urea Nitrogen (BUN)", result: "15", flag: "Normal", unit: "mg/dL", referenceValue: "7 - 20" },
//         { id: "p5", name: "Serum Creatinine", result: "1.4", flag: "High", unit: "mg/dL", referenceValue: "0.6 - 1.2" },
//         { id: "p6", name: "Calcium", result: "7.8", flag: "Low", unit: "mg/dL", referenceValue: "8.5 - 10.2" },
//       ]
//     }
//   ];

//   return (
//     <div
//       // A4 Sizing & Print Box Model - min-h ensures it stretches to full page
//       className="relative mx-auto bg-white shadow-lg print:shadow-none print:m-0 w-full max-w-[210mm] min-h-[297mm] p-[10mm] sm:p-[15mm] text-black text-sm leading-snug box-border flex flex-col"
//       style={
//         {
//           "--primary-color": template.primary_color,
//           fontFamily: template.font_family,
//         } as React.CSSProperties
//       }
//     >
//       {/* Background Watermark (Grayscale for print safety) */}
//       {labData?.logo_url && (
//         <div className="absolute inset-0 flex justify-center items-center opacity-[0.03] pointer-events-none z-0">
//           <img src={labData.logo_url} alt="watermark" className="w-96 grayscale" />
//         </div>
//       )}

//       <div className="relative z-10 flex flex-col h-full flex-grow">
        
//         {/* ==========================================
//             HEADER (BRAND COLOR ALLOWED)
//         ========================================== */}
//         <header className={`flex pb-4 mb-4 border-b-[3px] border-[var(--primary-color)] ${headerLayouts[template.header_layout]}`}>
//           <div className={`${template.header_layout === "split" ? "order-1" : ""}`}>
//             <h1 className="text-3xl font-black text-[var(--primary-color)] tracking-tight uppercase">
//               {labData?.name || "PulseLIMS Diagnostics"}
//             </h1>
//             <p className="text-[11px] font-bold text-gray-700 mt-1 uppercase tracking-wider">
//               {labData?.accreditation || "ISO 15189:2012 & NABL Accredited"}
//             </p>
//             <p className="text-[11px] text-gray-700 mt-1 max-w-md">
//               {formatAddress(labData?.address)}
//             </p>
//             <p className="text-[11px] text-gray-700 mt-0.5 font-medium">
//               {[labData?.contact_phone, labData?.mobile_2, labData?.support_email, labData?.website].filter(Boolean).join(" | ")}
//             </p>
//           </div>
//           {labData?.logo_url && (
//             <div className={`${template.header_layout === "split" ? "order-2" : ""}`}>
//               <img src={labData.logo_url} alt="Lab Logo" className="h-16 w-auto object-contain" />
//             </div>
//           )}
//         </header>

//         {/* ==========================================
//             PATIENT DEMOGRAPHICS (STRICT B&W)
//         ========================================== */}
//         <section className="border-[1.5px] border-black rounded-sm mb-6 text-[11px] bg-white">
//           <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-black">
//             <div className="p-2 space-y-1.5">
//               <div className="flex justify-between"><span className="text-gray-600">Patient Name:</span> <span className="font-bold text-black uppercase">Mr. JOHN DOE</span></div>
//               <div className="flex justify-between"><span className="text-gray-600">Age / Gender:</span> <span className="font-bold text-black">34 Y / Male</span></div>
//               <div className="flex justify-between"><span className="text-gray-600">PID / UHID:</span> <span className="font-bold text-black">UHID-2026-8891</span></div>
//             </div>
//             <div className="p-2 space-y-1.5">
//               <div className="flex justify-between"><span className="text-gray-600">Referred By:</span> <span className="font-bold text-black uppercase">Dr. A. SMITH, MD</span></div>
//               <div className="flex justify-between"><span className="text-gray-600">Sample ID (SID):</span> <span className="font-bold text-black">SID-992811</span></div>
//               <div className="flex justify-between"><span className="text-gray-600">Sample Type:</span> <span className="font-bold text-black">Serum & EDTA</span></div>
//             </div>
//             <div className="p-2 space-y-1.5 bg-gray-50 print:bg-transparent">
//               <div className="flex justify-between"><span className="text-gray-600">Collected:</span> <span className="font-bold text-black">24 Oct 2026, 08:45 AM</span></div>
//               <div className="flex justify-between"><span className="text-gray-600">Received:</span> <span className="font-bold text-black">24 Oct 2026, 09:15 AM</span></div>
//               <div className="flex justify-between"><span className="text-gray-600">Reported:</span> <span className="font-bold text-black">24 Oct 2026, 02:15 PM</span></div>
//             </div>
//           </div>
//         </section>

//         {/* ==========================================
//             DYNAMIC CLINICAL TABLE
//         ========================================== */}
//         <main className="flex-grow w-full">
//           <table className="w-full text-left text-xs border-collapse">
//             <thead className="table-header-group">
//               <tr className="border-y-[1.5px] border-black bg-gray-100 print:bg-transparent text-black">
//                 <th className="py-2 pl-2 font-bold w-[45%] uppercase tracking-wide">Investigation</th>
//                 <th className="py-2 font-bold w-[15%] uppercase tracking-wide">Result</th>
//                 <th className="py-2 font-bold text-center w-[10%] uppercase tracking-wide">Flag</th>
//                 <th className="py-2 font-bold w-[12%] uppercase tracking-wide">Unit</th>
//                 <th className="py-2 pr-2 font-bold uppercase tracking-wide">Reference Value</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-300 text-black">
              
//               {/* Loop through test groups dynamically */}
//               {data.map((group, groupIndex) => (
//                 <React.Fragment key={groupIndex}>
                  
//                   {/* Group Header */}
//                   <tr className="break-inside-avoid">
//                     <td colSpan={5} className="py-2.5 pl-2 font-extrabold bg-gray-50 print:bg-transparent uppercase mt-2 border-t-[1.5px] border-black underline decoration-gray-400 underline-offset-4">
//                       {group.groupName}
//                     </td>
//                   </tr>

//                   {/* Loop through parameters within the group */}
//                   {group.parameters.map((param) => {
//                     const isAbnormal = param.flag === "High" || param.flag === "Low";
                    
//                     // Formatting the flag string visually for B&W
//                     let displayFlag = "-";
//                     if (param.flag === "High") displayFlag = "High (↑)";
//                     if (param.flag === "Low") displayFlag = "Low (↓)";

//                     return (
//                       <tr 
//                         key={param.id} 
//                         // If abnormal, font-bold applies to the ENTIRE row
//                         className={`break-inside-avoid transition-colors ${
//                           isAbnormal 
//                             ? "font-extrabold bg-gray-100/50 print:bg-transparent" 
//                             : "font-medium hover:bg-gray-50 print:hover:bg-transparent"
//                         }`}
//                       >
//                         <td className="py-2 pl-2 text-black">{param.name}</td>
//                         <td className="py-2 text-[13px] text-black">{param.result}</td>
//                         <td className="py-2 text-center text-black">{displayFlag}</td>
//                         <td className={`py-2 text-[11px] ${isAbnormal ? "text-black" : "text-gray-700"}`}>{param.unit}</td>
//                         <td className={`py-2 pr-2 text-[11px] ${isAbnormal ? "text-black" : "text-gray-700"}`}>{param.referenceValue}</td>
//                       </tr>
//                     );
//                   })}
//                 </React.Fragment>
//               ))}
//             </tbody>
//           </table>

//           {/* Clinical Notes */}
//           <div className="mt-5 text-[11px] text-black space-y-1.5 break-inside-avoid">
//             <p><span className="font-bold">Interpretation Note:</span> Results flagged as High (↑) or Low (↓) are outside the biological reference interval. Clinical correlation is advised. Please consult your referring physician.</p>
//           </div>
//         </main>

//         {/* ==========================================
//             FOOTER (MT-AUTO PUSHES TO BOTTOM)
//         ========================================== */}
//         {/* ==========================================
//     FOOTER (FLEXIBLE / SINGLE SIGNATURE)
// ========================================== */}
// <footer className="mt-auto pt-6 border-t-[1.5px] border-black break-inside-avoid">
//   <div className="grid grid-cols-2 gap-8 items-end">
    
//     {/* LEFT: QR Code for Instant Verification */}
//     <div className="flex items-center gap-4">
//       <div className="w-14 h-14 border-[1.5px] border-black flex items-center justify-center text-[8px] text-black font-bold bg-white relative shrink-0">
//         <span className="absolute inset-0 flex items-center justify-center">QR CODE</span>
//       </div>
//       <div>
//         <p className="text-[10px] font-bold text-black uppercase">Verified via LIMS</p>
//         <p className="text-[9px] text-gray-600">Scan to check authenticity online.</p>
//       </div>
//     </div>

//     {/* RIGHT: Pathologist Signature (Only 1 required for local labs) */}
//     <div className="flex flex-col items-end text-right">
//       <div className="h-12 w-48 border-b border-dashed border-gray-400 mb-1 flex items-end justify-end pb-1">
//         {/* Optional: <img src={labData.pathologist_signature} className="h-10 object-contain" /> */}
//       </div>
//       <p className="font-bold text-xs text-black uppercase">Dr. Sarah Jenkins, MD</p>
//       <p className="text-[10px] text-gray-600">Consultant Pathologist (Reg: 88219)</p>
//     </div>
    
//   </div>

//   <div className="mt-6 flex flex-col items-center justify-center border-t border-gray-300 pt-3">
//     <p className="text-[11px] font-bold tracking-widest uppercase mb-1 text-black">*** End of Report ***</p>
//     <p className="text-[9px] text-gray-500 text-center max-w-2xl">
//       This is an electronically generated report authenticated by a registered medical practitioner.
//     </p>
//   </div>
// </footer>

//       </div>
//     </div>
//   );
// });

// export default ReportTemplateTab;
// // "use client";
// // import { ReportPreview } from "@/features/reports/components/ReportPreview";
// // import { useReportStore } from "@/store/useReportStore";
// // import { ClassicTemplate } from "@/features/reports/templates/ClassicTemplate";
// // import { ModernTemplate } from "@/features/reports/templates/ModernTemplate";
// // import { MinimalTemplate } from "@/features/reports/templates/MinimalTemplate";

// // export default function DocumentEditorPage(){
// //    const { status, config } = useReportStore();
// //   // const { patient, setPatient, status, setStatus, resetReport } = useReportStore();
// //   // Dynamic template router
// //   const renderTemplate = () => {
// //     switch (config.template) {
// //       case "classic": return <ClassicTemplate />;
// //       case "modern": return <ModernTemplate />;
// //       case "minimal": return <MinimalTemplate />;
// //       default: return <ModernTemplate />;
// //     }
// //   };
// //   return (
// //     <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden animate-in fade-in duration-500">
// //       <main className="flex-1 space-y-8 w-full max-w-7xl mx-auto">
// //         {/* <ReportPreview /> */}
// //         {renderTemplate()}
// //       </main>
// //     </div>
// //   )
// // }

// // "use client";

// // import { useEffect, useState } from "react";
// // import { 
// //   ArrowLeft, Printer, CheckCircle2, Settings2, 
// //   Download, Send, ZoomIn, ZoomOut, Maximize, FileText
// // } from "lucide-react";
// // import { useReportStore } from "@/store/useReportStore";
// // import { toast } from "@/lib/toast";

// // import { Button } from "@/components/ui/Button";
// // import { ReportPreview } from "@/features/reports/components/ReportPreview";
// // import { ReportSettingsDrawer } from "@/features/reports/components/ReportSettingsDrawer";

// // export default function DocumentEditorPage({ params }: { params: { patientId: string } }) {
// //   const { patient, setPatient, status, setStatus, resetReport } = useReportStore();
  
// //   // New Studio States
// //   const [isSettingsOpen, setIsSettingsOpen] = useState(false);
// //   const [zoom, setZoom] = useState(1); // 1 = 100%

// //   useEffect(() => {
// //     setPatient({
// //       id: params.patientId || "PT-10024",
// //       name: "Rahul Sharma",
// //       age: 42,
// //       gender: "M",
// //       phone: "9876543210",
// //       refDoctor: "Dr. A.K. Gupta",
// //       registeredAt: "15 Oct 2026",
// //       barcode: (params.patientId || "10024").replace("PT-", "10024883")
// //     });
// //     return () => resetReport();
// //   }, [params.patientId, setPatient, resetReport]);

// //   const handleApprove = () => {
// //     setStatus("Approved");
// //     toast.success("Report Approved", "The report is digitally signed and ready to print.");
// //   };

// //   if (!patient) return null;

// //   return (
// //     <div className="app-wrapper flex flex-col h-screen w-full bg-slate-50 overflow-hidden font-sans relative">
      
// //       {/* 🚀 THE PRINT MAGIC CSS (Kept strictly intact) */}
// //       <style jsx global>{`
// //         @media print {
// //           @page { size: A4 portrait; margin: 0; }
// //           body, html { background: #ffffff !important; margin: 0 !important; padding: 0 !important; height: auto !important; }
// //           .no-print { display: none !important; }
// //           .app-wrapper { height: auto !important; display: block !important; background: transparent !important; }
// //           .print-paper-container { padding: 0 !important; margin: 0 !important; display: block !important; overflow: visible !important; transform: scale(1) !important; }
// //           .print-paper-document {
// //             width: 210mm !important; height: 297mm !important; max-height: 297mm !important;
// //             box-shadow: none !important; border: none !important; margin: 0 !important; padding: 0 !important; 
// //             page-break-after: avoid !important; page-break-inside: avoid !important; overflow: hidden !important;
// //           }
// //           * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
// //           input[type="number"]::-webkit-outer-spin-button, input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
// //           input[type="number"] { -moz-appearance: textfield; }
// //         }
// //       `}</style>

// //       {/* ================= TOP NAVIGATION BAR ================= */}
// //       <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 z-30 no-print">
// //         <div className="flex items-center gap-4">
// //           <button onClick={() => window.history.back()} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all outline-none active:scale-95">
// //             <ArrowLeft size={20} strokeWidth={2.5} />
// //           </button>
// //           <div className="border-l border-slate-200 pl-4 flex items-center gap-3">
// //             <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100/50">
// //               <FileText size={18} strokeWidth={2.5} />
// //             </div>
// //             <div>
// //               <div className="flex items-center gap-2">
// //                 <h1 className="text-sm font-black text-slate-900 tracking-tight">{patient.name}</h1>
// //                 <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${status === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
// //                   {status}
// //                 </span>
// //               </div>
// //               <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
// //                 {patient.id} • {patient.age}Y/{patient.gender} • Ref: {patient.refDoctor}
// //               </p>
// //             </div>
// //           </div>
// //         </div>

// //         <div className="flex items-center gap-2">
// //           <Button variant="secondary" size="sm" onClick={() => setIsSettingsOpen(true)} icon={<Settings2 size={14} />}>
// //             <span className="hidden md:inline">Design</span>
// //           </Button>
// //           <Button onClick={handleApprove} disabled={status === "Approved"} size="sm" icon={<CheckCircle2 size={16} strokeWidth={2.5} />}>
// //             {status === "Approved" ? "Approved" : "Approve"}
// //           </Button>
// //         </div>
// //       </header>

// //       {/* ================= THE TACTILE WORKSPACE ================= */}
// //       {/* The background uses a subtle grid pattern to feel like a design studio */}
// //       <div className="flex-1 relative overflow-hidden flex flex-col bg-[#F8FAFC] bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px]">
        
// //         {/* Zoom Controls (Top Right) */}
// //         <div className="absolute top-6 right-8 z-20 no-print flex items-center bg-white/90 backdrop-blur border border-slate-200/80 shadow-sm rounded-xl p-1 animate-in fade-in slide-in-from-top-4">
// //           <button onClick={() => setZoom(Math.max(0.5, zoom - 0.1))} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors outline-none" title="Zoom Out">
// //             <ZoomOut size={16} strokeWidth={2.5} />
// //           </button>
// //           <div className="px-3 text-xs font-black font-mono text-slate-600 select-none w-14 text-center">
// //             {Math.round(zoom * 100)}%
// //           </div>
// //           <button onClick={() => setZoom(Math.min(1.5, zoom + 0.1))} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors outline-none" title="Zoom In">
// //             <ZoomIn size={16} strokeWidth={2.5} />
// //           </button>
// //           <div className="w-px h-4 bg-slate-200 mx-1" />
// //           <button onClick={() => setZoom(1)} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors outline-none" title="Fit to Screen">
// //             <Maximize size={16} strokeWidth={2.5} />
// //           </button>
// //         </div>

// //         {/* The Scrollable Canvas Wrapper */}
// //         <div className="print-paper-container flex-1 overflow-y-auto p-4 sm:p-12 flex justify-center items-start custom-scrollbar">
// //           {/* Zoom Wrapper */}
// //           <div 
// //             className="transition-transform duration-200 ease-out origin-top pb-32" 
// //             style={{ transform: `scale(${zoom})` }}
// //           >
// //             {/* Added ambient colored shadow for hyper-realistic paper depth */}
// //             <div className="relative group/canvas">
// //               <div className="absolute -inset-4 bg-teal-500/10 blur-2xl rounded-[3rem] opacity-0 group-hover/canvas:opacity-100 transition-opacity duration-700 pointer-events-none no-print"></div>
// //               <ReportPreview />
// //             </div>
// //           </div>
// //         </div>

// //         {/* ================= THE FLOATING ACTION DOCK (macOS Style) ================= */}
// //         <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 no-print animate-in fade-in slide-in-from-bottom-8">
// //           <div className="flex items-center gap-1.5 p-1.5 bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl shadow-slate-900/40 rounded-2xl">
            
// //             <button 
// //               onClick={() => window.print()} 
// //               className="flex items-center gap-2 px-5 py-2.5 rounded-xl hover:bg-white/10 text-slate-200 hover:text-white transition-all outline-none"
// //             >
// //               <Printer size={16} strokeWidth={2.5} />
// //               <span className="text-xs font-bold tracking-wide">Print</span>
// //             </button>

// //             <button 
// //               onClick={() => window.print()} // Print handles PDF generation native to browsers
// //               className="flex items-center gap-2 px-5 py-2.5 rounded-xl hover:bg-white/10 text-slate-200 hover:text-white transition-all outline-none"
// //             >
// //               <Download size={16} strokeWidth={2.5} />
// //               <span className="text-xs font-bold tracking-wide">PDF</span>
// //             </button>
            
// //             <div className="w-px h-6 bg-white/10 mx-1" />

// //             <button 
// //               className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] outline-none"
// //             >
// //               <Send size={16} strokeWidth={2.5} />
// //               <span className="text-xs font-black tracking-wide">WhatsApp</span>
// //             </button>

// //           </div>
// //         </div>

// //       </div>

// //       {isSettingsOpen && <ReportSettingsDrawer onClose={() => setIsSettingsOpen(false)} />}
// //     </div>
// //   );
// // }
// // "use client";

// // import { useEffect, useState } from "react";
// // import { ArrowLeft, Printer, CheckCircle2, Settings2, Download, Send } from "lucide-react";
// // import { useReportStore } from "@/store/useReportStore";
// // import { toast } from "@/lib/toast";

// // import { Button } from "@/components/ui/Button";
// // import { ReportPreview } from "@/features/reports/components/ReportPreview";
// // import { ReportSettingsDrawer } from "@/features/reports/components/ReportSettingsDrawer";

// // export default function DocumentEditorPage({ params }: { params: { patientId: string } }) {
// //   const { patient, setPatient, status, setStatus, resetReport } = useReportStore();
// //   const [isSettingsOpen, setIsSettingsOpen] = useState(false);

// //   useEffect(() => {
// //     setPatient({
// //       id: params.patientId || "PT-10024",
// //       name: "Rahul Sharma",
// //       age: 42,
// //       gender: "M",
// //       phone: "9876543210",
// //       refDoctor: "Dr. A.K. Gupta",
// //       registeredAt: "15 Oct 2026",
// //       barcode: (params.patientId || "10024").replace("PT-", "10024883")
// //     });
// //     return () => resetReport();
// //   }, [params.patientId, setPatient, resetReport]);

// //   const handleApprove = () => {
// //     setStatus("Approved");
// //     toast.success("Report Approved", "The report is digitally signed and ready to print.");
// //   };

// //   if (!patient) return null;

// //   return (
// //     // Added 'app-wrapper' class here for the print CSS to target
// //     <div className="app-wrapper flex flex-col h-screen w-full bg-slate-200/50 overflow-hidden font-sans relative">
      
// //       {/* 🚀 THE BULLETPROOF PRINT CSS */}
// //       <style jsx global>{`
// //         @media print {
// //           @page { 
// //             size: A4 portrait; 
// //             margin: 0; /* Let the document handle its own padding */
// //           }
          
// //           /* 1. Reset entire body so it doesn't force a 2nd page */
// //           body, html { 
// //             background: #ffffff !important; 
// //             margin: 0 !important; 
// //             padding: 0 !important; 
// //             height: auto !important;
// //           }
          
// //           /* 2. Hide ALL surrounding UI (Headers, sidebars, buttons) */
// //           .no-print { display: none !important; }
          
// //           /* 3. Strip the flexbox and 100vh height from the wrappers */
// //           .app-wrapper {
// //             height: auto !important;
// //             display: block !important;
// //             background: transparent !important;
// //           }

// //           .print-paper-container { 
// //             padding: 0 !important; 
// //             margin: 0 !important; 
// //             display: block !important;
// //             overflow: visible !important; 
// //           }
          
// //           /* 4. Strictly lock the A4 dimensions to kill the ghost page */
// //           .print-paper-document {
// //             width: 210mm !important; 
// //             height: 297mm !important; /* Exact A4 height */
// //             max-height: 297mm !important;
// //             box-shadow: none !important; 
// //             border: none !important; 
// //             margin: 0 !important; 
// //             padding: 0 !important; 
// //             page-break-after: avoid !important;
// //             page-break-inside: avoid !important;
// //             overflow: hidden !important; /* Hides any 1px spillover */
// //           }

// //           /* 5. Force precise colors (Teal, backgrounds, badges) */
// //           * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

// //           /* 6. Clean up native browser input rendering */
// //           input[type="number"]::-webkit-outer-spin-button,
// //           input[type="number"]::-webkit-inner-spin-button {
// //             -webkit-appearance: none;
// //             margin: 0;
// //           }
// //           input[type="number"] { -moz-appearance: textfield; }
// //         }
// //       `}</style>

// //       {/* ================= TOP NAVIGATION BAR ================= */}
// //       <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 z-30 shadow-sm no-print">
// //         <div className="flex items-center gap-4">
// //           <button onClick={() => window.history.back()} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors outline-none">
// //             <ArrowLeft size={20} strokeWidth={2.5} />
// //           </button>
// //           <div className="border-l border-slate-200 pl-4">
// //             <div className="flex items-center gap-2">
// //               <h1 className="text-sm font-black text-slate-900 tracking-tight">{patient.name}</h1>
// //               <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${status === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
// //                 {status}
// //               </span>
// //             </div>
// //             <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
// //               {patient.id} • {patient.age}Y/{patient.gender} • Ref: {patient.refDoctor}
// //             </p>
// //           </div>
// //         </div>

// //         <div className="flex items-center gap-2">
// //           <Button variant="secondary" size="sm" onClick={() => setIsSettingsOpen(true)} icon={<Settings2 size={14} />}>
// //             <span className="hidden md:inline">Design</span>
// //           </Button>
// //           <Button onClick={handleApprove} disabled={status === "Approved"} size="sm" icon={<CheckCircle2 size={16} strokeWidth={2.5} />}>
// //             {status === "Approved" ? "Approved" : "Approve"}
// //           </Button>
// //         </div>
// //       </header>

// //       {/* ================= THE CENTERED WORKSPACE ================= */}
// //       <div className="flex-1 relative overflow-hidden flex flex-col">
        
// //         {/* Floating Quick Actions */}
// //         <div className="absolute top-6 right-8 flex items-center gap-2 z-20 no-print">
// //           <button onClick={() => window.print()} className="p-3 bg-white text-slate-700 rounded-2xl shadow-lg border border-slate-200 hover:text-teal-600 hover:scale-105 active:scale-95 transition-all outline-none" title="Print to PDF">
// //             <Printer size={18} strokeWidth={2.5} />
// //           </button>
// //           <button className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 hover:scale-105 active:scale-95 transition-all outline-none" title="Send WhatsApp">
// //             <Send size={18} strokeWidth={2.5} />
// //           </button>
// //         </div>

// //         {/* The Scrollable A4 Canvas Wrapper */}
// //         <div className="print-paper-container flex-1 overflow-y-auto p-4 sm:p-10 flex justify-center items-start custom-scrollbar">
// //           <ReportPreview />
// //         </div>
// //       </div>

// //       {isSettingsOpen && <ReportSettingsDrawer onClose={() => setIsSettingsOpen(false)} />}
// //     </div>
// //   );
// // }
// // "use client";

// // import { useEffect, useState } from "react";
// // import { ArrowLeft, Printer, CheckCircle2, Settings2 } from "lucide-react";
// // import { useReportStore } from "@/store/useReportStore";
// // import { toast } from "@/lib/toast";
// // import { Button } from "@/components/ui/Button";

// // // The 3 Core Architectural Pieces
// // import { ReportLayout } from "@/components/layouts/ReportLayout";
// // import { ReportForm } from "@/features/reports/components/ReportForm";
// // import { ReportPreview } from "@/features/reports/components/ReportPreview";
// // import { ReportSettingsDrawer } from "@/features/reports/components/ReportSettingsDrawer";

// // export default function ReportBuilderPage({ params }: { params: { patientId: string } }) {
// //   const { patient, setPatient, status, setStatus, resetReport } = useReportStore();
// //   const [isSettingsOpen, setIsSettingsOpen] = useState(false);

// //   // 1. Initial Fetch & Setup
// //   useEffect(() => {
// //     // Simulated API Fetch
// //     const fetchedPatient = {
// //       id: params.patientId || "PT-10024",
// //       name: "Rahul Sharma",
// //       age: 42,
// //       gender: "M" as const,
// //       phone: "9876543210",
// //       refDoctor: "Dr. A.K. Gupta",
// //       registeredAt: "15 Oct 2026, 10:30 AM",
// //       barcode: (params.patientId || "10024").replace("PT-", "10024883")
// //     };
    
// //     setPatient(fetchedPatient);

// //     // Cleanup memory when leaving page
// //     return () => resetReport();
// //   }, [params.patientId, setPatient, resetReport]);

// //   // 2. Action Handlers
// //   const handleWhatsApp = () => {
// //     if (!patient) return;
// //     const formattedPhone = patient.phone.startsWith("91") ? patient.phone : `91${patient.phone}`;
// //     const message = encodeURIComponent(`Hello ${patient.name},\n\nYour diagnostic report is ready.\n\nThank you.`);
// //     window.open(`https://wa.me/${formattedPhone}?text=${message}`, "_blank");
// //   };

// //   const handleApprove = () => {
// //     setStatus("Approved");
// //     toast.success("Report Approved", "The report has been digitally signed and is ready for dispatch.");
// //   };

// //   if (!patient) return null; // Or a loading spinner

// //   // 3. Render Header Component
// //   const renderHeader = () => (
// //     <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm">
// //       <div className="flex items-center gap-4">
// //         <button onClick={() => window.history.back()} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors outline-none">
// //           <ArrowLeft size={20} strokeWidth={2.5} />
// //         </button>
// //         <div className="hidden sm:block border-l border-slate-200 pl-4">
// //           <div className="flex items-center gap-2">
// //             <h1 className="text-sm font-black text-slate-900 tracking-tight">{patient.name}</h1>
// //             <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${status === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
// //               {status}
// //             </span>
// //           </div>
// //           <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
// //             {patient.id} • {patient.age}Y/{patient.gender} • Ref: {patient.refDoctor}
// //           </p>
// //         </div>
// //       </div>

// //       <div className="flex items-center gap-2">
// //         <Button variant="secondary" size="sm" onClick={() => setIsSettingsOpen(true)} icon={<Settings2 size={14} />}>
// //           <span className="hidden md:inline">Design</span>
// //         </Button>
// //         <Button 
// //           onClick={handleApprove}
// //           disabled={status === "Approved"}
// //           size="sm"
// //           icon={<CheckCircle2 size={16} strokeWidth={2.5} />}
// //         >
// //           {status === "Approved" ? "Approved" : "Approve"}
// //         </Button>
// //       </div>
// //     </div>
// //   );

// //   // 4. The Grand Assembly
// //   return (
// //     <>
// //       <ReportLayout 
// //         header={renderHeader()}
// //         formPane={<ReportForm />}
// //         previewPane={<ReportPreview />}
// //         onWhatsApp={handleWhatsApp}
// //       />
      
// //       {/* 5. Customization Engine Drawer */}
// //       {isSettingsOpen && (
// //         <ReportSettingsDrawer onClose={() => setIsSettingsOpen(false)} />
// //       )}
// //     </>
// //   );
// // }