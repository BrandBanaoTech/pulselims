

// // "use client";

// // import { useState, useMemo, useEffect } from "react";
// // import { 
// //   ArrowLeft, Save, Printer, Send, CheckCircle2, AlertCircle, 
// //   PanelLeftClose, PanelRightClose, Columns, LayoutTemplate,
// //   User, Calendar, Activity, Check, Download, Info
// // } from "lucide-react";

// // // ⚠️ ADJUST THIS IMPORT TO POINT TO YOUR ACTUAL ZUSTAND STORE
// // import { useAuthStore } from "@/store/useAuthStore";

// // // ==========================================
// // // TYPES & MOCK DATA
// // // ==========================================
// // type LayoutMode = "split" | "form-only" | "preview-only";

// // interface ReportEntryPageProps {
// //   patientId: string;
// // }

// // interface TestParameter {
// //   id: string;
// //   name: string;
// //   unit: string;
// //   minRange: number;
// //   maxRange: number;
// //   referenceText: string;
// // }

// // interface PatientRecord {
// //   id: string;
// //   name: string;
// //   age: number;
// //   gender: "M" | "F" | "Other";
// //   phone: string;
// //   refDoctor: string;
// //   registeredAt: string;
// //   barcode: string;
// // }

// // // Simulated Master Catalog Parameters for a "Complete Blood Count (CBC)"
// // const cbcParameters: TestParameter[] = [
// //   { id: "p1", name: "Hemoglobin (Hb)", unit: "g/dL", minRange: 13.0, maxRange: 17.0, referenceText: "13.0 - 17.0" },
// //   { id: "p2", name: "Total RBC Count", unit: "mill/cumm", minRange: 4.5, maxRange: 5.5, referenceText: "4.5 - 5.5" },
// //   { id: "p3", name: "Total WBC Count (TLC)", unit: "cells/cumm", minRange: 4000, maxRange: 11000, referenceText: "4000 - 11000" },
// //   { id: "p4", name: "Platelet Count", unit: "lakhs/cumm", minRange: 1.5, maxRange: 4.5, referenceText: "1.5 - 4.5" },
// //   { id: "p5", name: "Packed Cell Volume (PCV)", unit: "%", minRange: 40.0, maxRange: 50.0, referenceText: "40.0 - 50.0" },
// //   { id: "p6", name: "Mean Corpuscular Vol (MCV)", unit: "fL", minRange: 83.0, maxRange: 101.0, referenceText: "83.0 - 101.0" },
// // ];

// // export default function ReportEntryPage({ patientId }: ReportEntryPageProps) {
// //     // Simulated data passed down from the previous IntakesPage
// // const mockPatient: PatientRecord = {
// //   id: patientId,
// //   name: "Rahul Sharma",
// //   age: 42,
// //   gender: "M",
// //   phone: "9876543210",
// //   refDoctor: "Dr. A.K. Gupta",
// //   registeredAt: "15 Oct 2026, 10:30 AM",
// //   barcode: "100248839201"
// // };
// //   // Auth & Branding
// //   const { activeLab, user } = useAuthStore();
// //   const labName = activeLab || "Apex Diagnostics";
// //   const labThemeColor = user?.theme_preference || "#0d9488"; // Teal-600

// //   // Component State
// //   const [layoutMode, setLayoutMode] = useState<LayoutMode>("split");
// //   const [metrics, setMetrics] = useState<Record<string, string>>({});
// //   const [pathologistNote, setPathologistNote] = useState("");
// //   const [status, setStatus] = useState<"Draft" | "Approved">("Draft");

// //   // Handle Input Changes
// //   const handleMetricChange = (paramId: string, value: string) => {
// //     setMetrics(prev => ({ ...prev, [paramId]: value }));
// //   };

// //   // NABL Clinical Auto-Flagging Logic
// //   const evaluateFlag = (paramId: string, value: string) => {
// //     if (!value) return null;
// //     const num = parseFloat(value);
// //     if (isNaN(num)) return null;

// //     const param = cbcParameters.find(p => p.id === paramId);
// //     if (!param) return null;

// //     if (num < param.minRange) return "Low";
// //     if (num > param.maxRange) return "High";
// //     return "Normal";
// //   };

// //   return (
// //     <div className="flex flex-col h-screen w-full bg-slate-100 overflow-hidden font-sans">
      
// //       {/* ========================================================= */}
// //       {/* 1. TOP NAVIGATION & ACTION BAR                            */}
// //       {/* ========================================================= */}
// //       <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 z-20 shadow-sm">
        
// //         {/* Left: Back & Patient Context */}
// //         <div className="flex items-center gap-4">
// //           <button className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors outline-none">
// //             <ArrowLeft size={20} strokeWidth={2.5} />
// //           </button>
          
// //           <div className="hidden sm:block border-l border-slate-200 pl-4">
// //             <div className="flex items-center gap-2">
// //               <h1 className="text-sm font-black text-slate-900 tracking-tight">{mockPatient.name}</h1>
// //               <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
// //                 status === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
// //               }`}>
// //                 {status}
// //               </span>
// //             </div>
// //             <p className="text-[11px] font-medium text-slate-500 mt-0.5">
// //               {mockPatient.id} • {mockPatient.age}Y/{mockPatient.gender} • Ref: {mockPatient.refDoctor}
// //             </p>
// //           </div>
// //         </div>

// //         {/* Center: Layout Toggles (Hidden on Mobile) */}
// //         <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 shadow-inner">
// //           <button 
// //             onClick={() => setLayoutMode("form-only")}
// //             className={`p-1.5 rounded-lg transition-all ${layoutMode === "form-only" ? "bg-white text-teal-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
// //             title="Form Focus Mode"
// //           >
// //             <PanelRightClose size={16} strokeWidth={2.5} />
// //           </button>
// //           <button 
// //             onClick={() => setLayoutMode("split")}
// //             className={`p-1.5 rounded-lg transition-all ${layoutMode === "split" ? "bg-white text-teal-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
// //             title="Side-by-Side View"
// //           >
// //             <Columns size={16} strokeWidth={2.5} />
// //           </button>
// //           <button 
// //             onClick={() => setLayoutMode("preview-only")}
// //             className={`p-1.5 rounded-lg transition-all ${layoutMode === "preview-only" ? "bg-white text-teal-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
// //             title="Full Preview Mode"
// //           >
// //             <PanelLeftClose size={16} strokeWidth={2.5} />
// //           </button>
// //         </div>

// //         {/* Right: Actions */}
// //         <div className="flex items-center gap-2">
// //           <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm outline-none">
// //             <Save size={14} /> Save Draft
// //           </button>
// //           <button 
// //             onClick={() => setStatus("Approved")}
// //             disabled={status === "Approved"}
// //             className="flex items-center gap-2 px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black rounded-xl shadow-lg shadow-teal-500/20 transition-all active:scale-95 outline-none disabled:opacity-50 disabled:pointer-events-none"
// //           >
// //             <CheckCircle2 size={16} strokeWidth={2.5} /> 
// //             {status === "Approved" ? "Approved" : "Approve Report"}
// //           </button>
// //         </div>
// //       </header>

// //       {/* ========================================================= */}
// //       {/* 2. MAIN WORKSPACE (Split Layout Engine)                   */}
// //       {/* ========================================================= */}
// //       <div className="flex-1 flex overflow-hidden">
        
// //         {/* ================= LEFT PANE: DATA ENTRY FORM ================= */}
// //         {(layoutMode === "split" || layoutMode === "form-only") && (
// //           <div className={`flex-1 flex flex-col h-full bg-white border-r border-slate-200 z-10 transition-all duration-300 ${layoutMode === "form-only" ? "max-w-3xl mx-auto border-x shadow-xl" : ""}`}>
            
// //             <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
// //               <div className="flex items-center gap-2.5">
// //                 <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
// //                   <Activity size={16} strokeWidth={2.5} />
// //                 </div>
// //                 <div>
// //                   <h2 className="text-sm font-black text-slate-900">Complete Blood Count (CBC)</h2>
// //                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enter Results</p>
// //                 </div>
// //               </div>
// //             </div>

// //             <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
// //               {/* Dynamic Metrics Form */}
// //               <div className="space-y-5">
// //                 {cbcParameters.map((param) => {
// //                   const val = metrics[param.id] || "";
// //                   const flag = evaluateFlag(param.id, val);
                  
// //                   return (
// //                     <div key={param.id} className="group flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors">
                      
// //                       {/* Parameter Name */}
// //                       <div className="w-full sm:w-[40%] flex flex-col shrink-0">
// //                         <label className="text-sm font-bold text-slate-800 leading-tight">{param.name}</label>
// //                         <span className="text-[10px] font-medium text-slate-400 mt-0.5">Ref: {param.referenceText} {param.unit}</span>
// //                       </div>

// //                       {/* Input & Units */}
// //                       <div className="w-full sm:w-[60%] flex items-center gap-3">
// //                         <div className="relative flex-1">
// //                           <input
// //                             type="number"
// //                             step="0.01"
// //                             value={val}
// //                             onChange={(e) => handleMetricChange(param.id, e.target.value)}
// //                             className={`w-full py-2.5 px-3 rounded-xl border text-sm font-black font-mono transition-all outline-none focus:ring-4 ${
// //                               flag === "High" ? "bg-rose-50/50 border-rose-300 text-rose-700 focus:ring-rose-500/20 focus:border-rose-500" :
// //                               flag === "Low" ? "bg-blue-50/50 border-blue-300 text-blue-700 focus:ring-blue-500/20 focus:border-blue-500" :
// //                               "bg-white border-slate-200 text-slate-900 focus:ring-teal-500/10 focus:border-teal-500"
// //                             }`}
// //                             placeholder="---"
// //                           />
// //                           {/* Live Flag Indicator inside Input */}
// //                           {flag && flag !== "Normal" && (
// //                             <div className="absolute right-3 top-1/2 -translate-y-1/2">
// //                               <span className={`flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-black ${
// //                                 flag === "High" ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"
// //                               }`}>
// //                                 {flag === "High" ? "H" : "L"}
// //                               </span>
// //                             </div>
// //                           )}
// //                         </div>
// //                         <div className="w-16 shrink-0 text-xs font-semibold text-slate-400">{param.unit}</div>
// //                       </div>

// //                     </div>
// //                   );
// //                 })}
// //               </div>

// //               {/* Pathologist Notes */}
// //               <div className="pt-4 border-t border-slate-100">
// //                 <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">Clinical Comments / Notes</label>
// //                 <textarea
// //                   value={pathologistNote}
// //                   onChange={(e) => setPathologistNote(e.target.value)}
// //                   className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all outline-none text-sm text-slate-800 resize-none min-h-[100px]"
// //                   placeholder="E.g., Mild anisocytosis observed. Advise clinical correlation."
// //                 />
// //               </div>

// //             </div>
// //           </div>
// //         )}

// //         {/* ================= RIGHT PANE: LIVE A4 PDF PREVIEW ================= */}
// //         {(layoutMode === "split" || layoutMode === "preview-only") && (
// //           <div className="flex-1 hidden md:flex flex-col bg-slate-100/80 relative overflow-hidden h-full">
            
// //             {/* Action Bar for Preview */}
// //             <div className="absolute top-4 right-6 flex items-center gap-2 z-20">
// //               <button className="p-2.5 bg-white text-slate-700 rounded-full shadow-lg border border-slate-200 hover:bg-slate-50 hover:text-teal-600 transition-colors" title="Print Report">
// //                 <Printer size={16} />
// //               </button>
// //               <button className="p-2.5 bg-white text-slate-700 rounded-full shadow-lg border border-slate-200 hover:bg-slate-50 hover:text-teal-600 transition-colors" title="Download PDF">
// //                 <Download size={16} />
// //               </button>
// //               <button className="p-2.5 bg-emerald-600 text-white rounded-full shadow-lg border border-emerald-700 hover:bg-emerald-700 transition-colors" title="Send WhatsApp">
// //                 <Send size={16} />
// //               </button>
// //             </div>

// //             {/* A4 Paper Scaled Container */}
// //             <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center items-start custom-scrollbar">
              
// //               {/* THE VIRTUAL PAPER (Maintains A4 Aspect Ratio approx 1:1.414) */}
// //               <div className="bg-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] ring-1 ring-slate-200 w-full max-w-[800px] min-h-[1130px] flex flex-col relative">
                
// //                 {/* --- PDF HEADER --- */}
// //                 <div className="px-10 pt-10 pb-6 flex items-start justify-between border-b-[4px]" style={{ borderColor: labThemeColor }}>
// //                   <div className="flex items-center gap-4">
// //                     <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(labName)}&background=${labThemeColor.replace('#', '')}&color=fff&rounded=true&bold=true`} alt="Logo" className="w-16 h-16 rounded-xl" />
// //                     <div>
// //                       <h1 className="text-2xl font-black text-slate-900 tracking-tight" style={{ color: labThemeColor }}>{labName}</h1>
// //                       <p className="text-xs font-semibold text-slate-500 mt-1">Center for Advanced Diagnostics</p>
// //                       <p className="text-[10px] text-slate-400">123 Health Avenue, Medical District • +91 98765 43210</p>
// //                     </div>
// //                   </div>
// //                   <div className="text-right">
// //                     <p className="text-xs font-bold text-slate-900">NABL Accredited Lab</p>
// //                     <p className="text-[10px] font-mono text-slate-500 mt-1">ISO 15189:2022</p>
// //                   </div>
// //                 </div>

// //                 {/* --- PATIENT DEMOGRAPHICS BOX --- */}
// //                 <div className="px-10 py-6">
// //                   <div className="grid grid-cols-2 gap-y-4 gap-x-12 border border-slate-200 rounded-xl p-4 bg-slate-50/50">
// //                     <div>
// //                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Patient Name</p>
// //                       <p className="text-sm font-black text-slate-900">{mockPatient.name}</p>
// //                     </div>
// //                     <div>
// //                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Registered On</p>
// //                       <p className="text-sm font-bold text-slate-700">{mockPatient.registeredAt}</p>
// //                     </div>
// //                     <div>
// //                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Age / Gender</p>
// //                       <p className="text-sm font-bold text-slate-700">{mockPatient.age} Yrs / {mockPatient.gender}</p>
// //                     </div>
// //                     <div>
// //                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Barcode / SID</p>
// //                       <p className="text-sm font-mono font-bold text-slate-700">{mockPatient.barcode}</p>
// //                     </div>
// //                     <div className="col-span-2 border-t border-slate-200 pt-3 mt-1">
// //                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Referred By</p>
// //                       <p className="text-sm font-bold text-slate-900">{mockPatient.refDoctor}</p>
// //                     </div>
// //                   </div>
// //                 </div>

// //                 {/* --- INVESTIGATION TITLE --- */}
// //                 <div className="px-10 text-center mb-6">
// //                   <h2 className="text-lg font-black uppercase tracking-widest underline underline-offset-4 decoration-2" style={{ color: labThemeColor }}>
// //                     Complete Blood Count (CBC)
// //                   </h2>
// //                   <p className="text-xs font-semibold text-slate-500 mt-2">Sample: Whole Blood (EDTA)</p>
// //                 </div>

// //                 {/* --- RESULTS DATA TABLE --- */}
// //                 <div className="px-10 flex-1">
// //                   <table className="w-full text-left border-collapse">
// //                     <thead>
// //                       <tr className="border-y-2 border-slate-300">
// //                         <th className="py-2.5 text-xs font-black text-slate-800 uppercase w-[40%]">Investigation</th>
// //                         <th className="py-2.5 text-xs font-black text-slate-800 uppercase text-center w-[20%]">Result</th>
// //                         <th className="py-2.5 text-xs font-black text-slate-800 uppercase text-center w-[15%]">Unit</th>
// //                         <th className="py-2.5 text-xs font-black text-slate-800 uppercase text-right w-[25%]">Ref. Interval</th>
// //                       </tr>
// //                     </thead>
// //                     <tbody className="divide-y divide-slate-100">
// //                       {cbcParameters.map((param) => {
// //                         const rawVal = metrics[param.id];
// //                         const flag = evaluateFlag(param.id, rawVal);
                        
// //                         return (
// //                           <tr key={param.id} className="group">
// //                             <td className="py-3 text-sm font-bold text-slate-800">{param.name}</td>
                            
// //                             {/* Live Result Rendering with High/Low Bold formatting */}
// //                             <td className="py-3 text-center relative">
// //                               <span className={`text-sm font-black font-mono tracking-wide ${
// //                                 flag === "High" || flag === "Low" ? "text-slate-900 text-base" : "text-slate-700"
// //                               }`}>
// //                                 {rawVal || "---"}
// //                               </span>
// //                               {/* Clinical Flag Badge */}
// //                               {flag && flag !== "Normal" && (
// //                                 <span className={`absolute -right-2 top-1/2 -translate-y-1/2 text-[10px] font-black px-1.5 py-0.5 rounded ${
// //                                   flag === "High" ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"
// //                                 }`}>
// //                                   {flag === "High" ? "H" : "L"}
// //                                 </span>
// //                               )}
// //                             </td>
                            
// //                             <td className="py-3 text-center text-xs font-semibold text-slate-500">{param.unit}</td>
// //                             <td className="py-3 text-right text-xs font-medium text-slate-600">{param.referenceText}</td>
// //                           </tr>
// //                         );
// //                       })}
// //                     </tbody>
// //                   </table>

// //                   {/* Pathologist Remarks */}
// //                   {pathologistNote && (
// //                     <div className="mt-8 p-4 bg-slate-50 border border-slate-200 rounded-lg">
// //                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Clinical Comments:</p>
// //                       <p className="text-xs font-bold text-slate-800 leading-relaxed whitespace-pre-wrap">{pathologistNote}</p>
// //                     </div>
// //                   )}
                  
// //                   {/* End of Report Marker */}
// //                   <div className="text-center mt-12 mb-8">
// //                     <span className="text-xs font-bold text-slate-400 tracking-[0.3em]">*** END OF REPORT ***</span>
// //                   </div>
// //                 </div>

// //                 {/* --- PDF FOOTER --- */}
// //                 <div className="mt-auto border-t border-slate-200 px-10 py-6">
// //                   <div className="flex justify-between items-end">
                    
// //                     {/* QR Code / Security */}
// //                     <div className="flex items-end gap-3">
// //                       <div className="w-16 h-16 bg-slate-100 rounded flex items-center justify-center border border-slate-200">
// //                         <Activity size={24} className="text-slate-300" />
// //                       </div>
// //                       <div className="pb-1">
// //                         <p className="text-[9px] font-bold text-slate-400">Scan to verify report</p>
// //                         <p className="text-[10px] font-mono text-slate-600 font-bold mt-0.5">UID: {Math.random().toString().substr(2, 10)}</p>
// //                       </div>
// //                     </div>

// //                     {/* Pathologist Signature */}
// //                     <div className="text-center w-48">
// //                       {status === "Approved" ? (
// //                         <div className="h-12 flex items-center justify-center opacity-80" style={{ fontFamily: "cursive", color: labThemeColor, fontSize: "1.5rem" }}>
// //                           Dr. Approved
// //                         </div>
// //                       ) : (
// //                         <div className="h-12 border-b-2 border-dashed border-slate-200 mb-2 w-full flex items-center justify-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">
// //                           Draft Mode
// //                         </div>
// //                       )}
// //                       <p className="text-xs font-black text-slate-900 mt-1">Dr. Chief Pathologist</p>
// //                       <p className="text-[9px] font-semibold text-slate-500">MD Path, MCI: 12345</p>
// //                     </div>

// //                   </div>
// //                 </div>

// //               </div>
// //             </div>
// //           </div>
// //         )}

// //       </div>
// //     </div>
// //   );
// // }

// "use client";

// import { useState, useMemo, useEffect } from "react";
// import { 
//   ArrowLeft, Save, Printer, Send, CheckCircle2, AlertCircle, 
//   PanelLeftClose, PanelRightClose, Columns, LayoutTemplate,
//   User, Calendar, Activity, Check, Download, Info
// } from "lucide-react";

// // ⚠️ ADJUST THIS IMPORT TO POINT TO YOUR ACTUAL ZUSTAND STORE
// import { useAuthStore } from "@/store/useAuthStore";

// type LayoutMode = "split" | "form-only" | "preview-only";

// interface TestParameter {
//   id: string;
//   name: string;
//   unit: string;
//   minRange: number;
//   maxRange: number;
//   referenceText: string;
// }

// interface PatientRecord {
//   id: string;
//   name: string;
//   age: number;
//   gender: "M" | "F" | "Other";
//   phone: string;
//   refDoctor: string;
//   registeredAt: string;
//   barcode: string;
// }

// const cbcParameters: TestParameter[] = [
//   { id: "p1", name: "Hemoglobin (Hb)", unit: "g/dL", minRange: 13.0, maxRange: 17.0, referenceText: "13.0 - 17.0" },
//   { id: "p2", name: "Total RBC Count", unit: "mill/cumm", minRange: 4.5, maxRange: 5.5, referenceText: "4.5 - 5.5" },
//   { id: "p3", name: "Total WBC Count (TLC)", unit: "cells/cumm", minRange: 4000, maxRange: 11000, referenceText: "4000 - 11000" },
//   { id: "p4", name: "Platelet Count", unit: "lakhs/cumm", minRange: 1.5, maxRange: 4.5, referenceText: "1.5 - 4.5" },
//   { id: "p5", name: "Packed Cell Volume (PCV)", unit: "%", minRange: 40.0, maxRange: 50.0, referenceText: "40.0 - 50.0" },
//   { id: "p6", name: "Mean Corpuscular Vol (MCV)", unit: "fL", minRange: 83.0, maxRange: 101.0, referenceText: "83.0 - 101.0" },
// ];

// interface ReportEntryPageProps {
//   patientId: string;
// }

// export default function ReportEntryPage({ patientId }: ReportEntryPageProps) {
//   // Auth & Branding
//   const { activeLab, user } = useAuthStore();
//   const labName = activeLab || "Apex Diagnostics";
//   const labThemeColor = user?.theme_preference || "#0d9488"; // Teal-600

//   // Component State
//   const [layoutMode, setLayoutMode] = useState<LayoutMode>("split");
//   const [metrics, setMetrics] = useState<Record<string, string>>({});
//   const [pathologistNote, setPathologistNote] = useState("");
//   const [status, setStatus] = useState<"Draft" | "Approved">("Draft");

//   const mockPatient: PatientRecord = useMemo(() => ({
//     id: patientId || "PT-10024",
//     name: "Rahul Sharma",
//     age: 42,
//     gender: "M",
//     phone: "9876543210",
//     refDoctor: "Dr. A.K. Gupta",
//     registeredAt: "15 Oct 2026, 10:30 AM",
//     barcode: (patientId || "10024").replace("PT-", "10024883")
//   }), [patientId]);

//   const handleMetricChange = (paramId: string, value: string) => {
//     setMetrics(prev => ({ ...prev, [paramId]: value }));
//   };

//   const evaluateFlag = (paramId: string, value: string) => {
//     if (!value) return null;
//     const num = parseFloat(value);
//     if (isNaN(num)) return null;

//     const param = cbcParameters.find(p => p.id === paramId);
//     if (!param) return null;

//     if (num < param.minRange) return "Low";
//     if (num > param.maxRange) return "High";
//     return "Normal";
//   };

//   // ==========================================
//   // 1. PRINT HANDLER (Frontend Native)
//   // ==========================================
//   const handlePrint = () => {
//     // If user is currently in form-only mode, temporarily switch to split/preview so the report exists in DOM
//     if (layoutMode === "form-only") {
//       setLayoutMode("split");
//       setTimeout(() => window.print(), 200);
//     } else {
//       window.print();
//     }
//   };

//   // ==========================================
//   // 2. DOWNLOAD PDF HANDLER (Triggers Print-to-PDF)
//   // ==========================================
//   const handleDownloadPDF = () => {
//     // Triggers native browser save-as-pdf dialog
//     handlePrint();
//   };

//   // ==========================================
//   // 3. WHATSAPP HANDLER (Click-to-Send Link)
//   // ==========================================
//   const handleSendWhatsApp = () => {
//     const formattedPhone = mockPatient.phone.startsWith("91") ? mockPatient.phone : `91${mockPatient.phone}`;
//     const message = encodeURIComponent(
//       `Hello ${mockPatient.name},\n\nYour diagnostic test report (${mockPatient.id}) from *${labName}* is now ready.\n\nThank you for choosing ${labName}.`
//     );
    
//     // Opens WhatsApp Web or Mobile App
//     window.open(`https://wa.me/${formattedPhone}?text=${message}`, "_blank");
//   };

//   return (
//     <div className="flex flex-col h-screen w-full bg-slate-100 overflow-hidden font-sans">
      
//       {/* 🚀 PRINT STYLES: Hides UI controls and prints ONLY the paper document */}
//       <style jsx global>{`
//         @media print {
//           /* Hide navigation, forms, sidebars, and action buttons during print */
//           header, .no-print, .left-pane-form {
//             display: none !important;
//           }
          
//           body, html {
//             background: #ffffff !important;
//             height: auto !important;
//             overflow: visible !important;
//           }

//           .print-paper-container {
//             padding: 0 !important;
//             margin: 0 !important;
//             background: transparent !important;
//           }

//           .print-paper-document {
//             box-shadow: none !important;
//             border: none !important;
//             width: 100% !important;
//             max-width: 100% !important;
//             min-height: auto !important;
//             margin: 0 !important;
//             padding: 0 !important;
//             page-break-after: avoid;
//           }
//         }
//       `}</style>
      
//       {/* ========================================================= */}
//       {/* 1. TOP NAVIGATION & ACTION BAR (Hidden on Print)          */}
//       {/* ========================================================= */}
//       <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 z-20 shadow-sm no-print">
//         <div className="flex items-center gap-4">
//           <button onClick={() => window.history.back()} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors outline-none">
//             <ArrowLeft size={20} strokeWidth={2.5} />
//           </button>
          
//           <div className="hidden sm:block border-l border-slate-200 pl-4">
//             <div className="flex items-center gap-2">
//               <h1 className="text-sm font-black text-slate-900 tracking-tight">{mockPatient.name}</h1>
//               <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
//                 status === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
//               }`}>
//                 {status}
//               </span>
//             </div>
//             <p className="text-[11px] font-medium text-slate-500 mt-0.5">
//               {mockPatient.id} • {mockPatient.age}Y/{mockPatient.gender} • Ref: {mockPatient.refDoctor}
//             </p>
//           </div>
//         </div>

//         {/* Layout Toggles */}
//         <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 shadow-inner">
//           <button 
//             onClick={() => setLayoutMode("form-only")}
//             className={`p-1.5 rounded-lg transition-all ${layoutMode === "form-only" ? "bg-white text-teal-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
//             title="Form Focus Mode"
//           >
//             <PanelRightClose size={16} strokeWidth={2.5} />
//           </button>
//           <button 
//             onClick={() => setLayoutMode("split")}
//             className={`p-1.5 rounded-lg transition-all ${layoutMode === "split" ? "bg-white text-teal-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
//             title="Side-by-Side View"
//           >
//             <Columns size={16} strokeWidth={2.5} />
//           </button>
//           <button 
//             onClick={() => setLayoutMode("preview-only")}
//             className={`p-1.5 rounded-lg transition-all ${layoutMode === "preview-only" ? "bg-white text-teal-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
//             title="Full Preview Mode"
//           >
//             <PanelLeftClose size={16} strokeWidth={2.5} />
//           </button>
//         </div>

//         {/* Main Header Actions */}
//         <div className="flex items-center gap-2">
//           <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm outline-none">
//             <Printer size={14} /> Print
//           </button>
//           <button onClick={handleSendWhatsApp} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl transition-all shadow-sm outline-none">
//             <Send size={14} /> WhatsApp
//           </button>
//           <button 
//             onClick={() => setStatus("Approved")}
//             disabled={status === "Approved"}
//             className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black rounded-xl shadow-lg shadow-teal-500/20 transition-all active:scale-95 outline-none disabled:opacity-50 disabled:pointer-events-none"
//           >
//             <CheckCircle2 size={16} strokeWidth={2.5} /> 
//             {status === "Approved" ? "Approved" : "Approve Report"}
//           </button>
//         </div>
//       </header>

//       {/* ========================================================= */}
//       {/* 2. MAIN WORKSPACE                                         */}
//       {/* ========================================================= */}
//       <div className="flex-1 flex overflow-hidden">
        
//         {/* LEFT PANE: DATA ENTRY FORM */}
//         {(layoutMode === "split" || layoutMode === "form-only") && (
//           <div className={`left-pane-form flex-1 flex flex-col h-full bg-white border-r border-slate-200 z-10 transition-all duration-300 ${layoutMode === "form-only" ? "max-w-3xl mx-auto border-x shadow-xl" : ""}`}>
//             <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
//               <div className="flex items-center gap-2.5">
//                 <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
//                   <Activity size={16} strokeWidth={2.5} />
//                 </div>
//                 <div>
//                   <h2 className="text-sm font-black text-slate-900">Complete Blood Count (CBC)</h2>
//                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enter Results</p>
//                 </div>
//               </div>
//             </div>

//             <div className="flex-1 overflow-y-auto p-6 space-y-6">
//               <div className="space-y-5">
//                 {cbcParameters.map((param) => {
//                   const val = metrics[param.id] || "";
//                   const flag = evaluateFlag(param.id, val);
                  
//                   return (
//                     <div key={param.id} className="group flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors">
//                       <div className="w-full sm:w-[40%] flex flex-col shrink-0">
//                         <label className="text-sm font-bold text-slate-800 leading-tight">{param.name}</label>
//                         <span className="text-[10px] font-medium text-slate-400 mt-0.5">Ref: {param.referenceText} {param.unit}</span>
//                       </div>

//                       <div className="w-full sm:w-[60%] flex items-center gap-3">
//                         <div className="relative flex-1">
//                           <input
//                             type="number"
//                             step="0.01"
//                             value={val}
//                             onChange={(e) => handleMetricChange(param.id, e.target.value)}
//                             className={`w-full py-2.5 px-3 rounded-xl border text-sm font-black font-mono transition-all outline-none focus:ring-4 ${
//                               flag === "High" ? "bg-rose-50/50 border-rose-300 text-rose-700 focus:ring-rose-500/20 focus:border-rose-500" :
//                               flag === "Low" ? "bg-blue-50/50 border-blue-300 text-blue-700 focus:ring-blue-500/20 focus:border-blue-500" :
//                               "bg-white border-slate-200 text-slate-900 focus:ring-teal-500/10 focus:border-teal-500"
//                             }`}
//                             placeholder="---"
//                           />
//                           {flag && flag !== "Normal" && (
//                             <div className="absolute right-3 top-1/2 -translate-y-1/2">
//                               <span className={`flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-black ${
//                                 flag === "High" ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"
//                               }`}>
//                                 {flag === "High" ? "H" : "L"}
//                               </span>
//                             </div>
//                           )}
//                         </div>
//                         <div className="w-16 shrink-0 text-xs font-semibold text-slate-400">{param.unit}</div>
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>

//               <div className="pt-4 border-t border-slate-100">
//                 <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">Clinical Comments / Notes</label>
//                 <textarea
//                   value={pathologistNote}
//                   onChange={(e) => setPathologistNote(e.target.value)}
//                   className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all outline-none text-sm text-slate-800 resize-none min-h-[100px]"
//                   placeholder="E.g., Mild anisocytosis observed. Advise clinical correlation."
//                 />
//               </div>
//             </div>
//           </div>
//         )}

//         {/* RIGHT PANE: LIVE A4 PDF PREVIEW */}
//         {(layoutMode === "split" || layoutMode === "preview-only") && (
//           <div className="flex-1 flex flex-col bg-slate-100/80 relative overflow-hidden h-full">
            
//             {/* Quick Action Floating Bar */}
//             <div className="absolute top-4 right-6 flex items-center gap-2 z-20 no-print">
//               <button onClick={handlePrint} className="p-2.5 bg-white text-slate-700 rounded-full shadow-lg border border-slate-200 hover:bg-slate-50 hover:text-teal-600 transition-colors" title="Print Report">
//                 <Printer size={16} />
//               </button>
//               <button onClick={handleDownloadPDF} className="p-2.5 bg-white text-slate-700 rounded-full shadow-lg border border-slate-200 hover:bg-slate-50 hover:text-teal-600 transition-colors" title="Download PDF">
//                 <Download size={16} />
//               </button>
//               <button onClick={handleSendWhatsApp} className="p-2.5 bg-emerald-600 text-white rounded-full shadow-lg border border-emerald-700 hover:bg-emerald-700 transition-colors" title="Send WhatsApp">
//                 <Send size={16} />
//               </button>
//             </div>

//             {/* A4 Document Container */}
//             <div className="print-paper-container flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center items-start custom-scrollbar">
              
//               <div className="print-paper-document bg-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] ring-1 ring-slate-200 w-full max-w-[800px] min-h-[1130px] flex flex-col relative">
                
//                 {/* --- PDF HEADER --- */}
//                 <div className="px-10 pt-10 pb-6 flex items-start justify-between border-b-[4px]" style={{ borderColor: labThemeColor }}>
//                   <div className="flex items-center gap-4">
//                     <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(labName)}&background=${labThemeColor.replace('#', '')}&color=fff&rounded=true&bold=true`} alt="Logo" className="w-16 h-16 rounded-xl" />
//                     <div>
//                       <h1 className="text-2xl font-black text-slate-900 tracking-tight" style={{ color: labThemeColor }}>{labName}</h1>
//                       <p className="text-xs font-semibold text-slate-500 mt-1">Center for Advanced Diagnostics</p>
//                       <p className="text-[10px] text-slate-400">123 Health Avenue, Medical District • +91 98765 43210</p>
//                     </div>
//                   </div>
//                   <div className="text-right">
//                     <p className="text-xs font-bold text-slate-900">NABL Accredited Lab</p>
//                     <p className="text-[10px] font-mono text-slate-500 mt-1">ISO 15189:2022</p>
//                   </div>
//                 </div>

//                 {/* --- PATIENT DEMOGRAPHICS --- */}
//                 <div className="px-10 py-6">
//                   <div className="grid grid-cols-2 gap-y-4 gap-x-12 border border-slate-200 rounded-xl p-4 bg-slate-50/50">
//                     <div>
//                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Patient Name</p>
//                       <p className="text-sm font-black text-slate-900">{mockPatient.name}</p>
//                     </div>
//                     <div>
//                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Registered On</p>
//                       <p className="text-sm font-bold text-slate-700">{mockPatient.registeredAt}</p>
//                     </div>
//                     <div>
//                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Age / Gender</p>
//                       <p className="text-sm font-bold text-slate-700">{mockPatient.age} Yrs / {mockPatient.gender}</p>
//                     </div>
//                     <div>
//                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Barcode / SID</p>
//                       <p className="text-sm font-mono font-bold text-slate-700">{mockPatient.barcode}</p>
//                     </div>
//                     <div className="col-span-2 border-t border-slate-200 pt-3 mt-1">
//                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Referred By</p>
//                       <p className="text-sm font-bold text-slate-900">{mockPatient.refDoctor}</p>
//                     </div>
//                   </div>
//                 </div>

//                 {/* --- INVESTIGATION TITLE --- */}
//                 <div className="px-10 text-center mb-6">
//                   <h2 className="text-lg font-black uppercase tracking-widest underline underline-offset-4 decoration-2" style={{ color: labThemeColor }}>
//                     Complete Blood Count (CBC)
//                   </h2>
//                   <p className="text-xs font-semibold text-slate-500 mt-2">Sample: Whole Blood (EDTA)</p>
//                 </div>

//                 {/* --- RESULTS DATA TABLE --- */}
//                 <div className="px-10 flex-1">
//                   <table className="w-full text-left border-collapse">
//                     <thead>
//                       <tr className="border-y-2 border-slate-300">
//                         <th className="py-2.5 text-xs font-black text-slate-800 uppercase w-[40%]">Investigation</th>
//                         <th className="py-2.5 text-xs font-black text-slate-800 uppercase text-center w-[20%]">Result</th>
//                         <th className="py-2.5 text-xs font-black text-slate-800 uppercase text-center w-[15%]">Unit</th>
//                         <th className="py-2.5 text-xs font-black text-slate-800 uppercase text-right w-[25%]">Ref. Interval</th>
//                       </tr>
//                     </thead>
//                     <tbody className="divide-y divide-slate-100">
//                       {cbcParameters.map((param) => {
//                         const rawVal = metrics[param.id];
//                         const flag = evaluateFlag(param.id, rawVal);
                        
//                         return (
//                           <tr key={param.id} className="group">
//                             <td className="py-3 text-sm font-bold text-slate-800">{param.name}</td>
//                             <td className="py-3 text-center relative">
//                               <span className={`text-sm font-black font-mono tracking-wide ${
//                                 flag === "High" || flag === "Low" ? "text-slate-900 text-base" : "text-slate-700"
//                               }`}>
//                                 {rawVal || "---"}
//                               </span>
//                               {flag && flag !== "Normal" && (
//                                 <span className={`absolute -right-2 top-1/2 -translate-y-1/2 text-[10px] font-black px-1.5 py-0.5 rounded ${
//                                   flag === "High" ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"
//                                 }`}>
//                                   {flag === "High" ? "H" : "L"}
//                                 </span>
//                               )}
//                             </td>
//                             <td className="py-3 text-center text-xs font-semibold text-slate-500">{param.unit}</td>
//                             <td className="py-3 text-right text-xs font-medium text-slate-600">{param.referenceText}</td>
//                           </tr>
//                         );
//                       })}
//                     </tbody>
//                   </table>

//                   {pathologistNote && (
//                     <div className="mt-8 p-4 bg-slate-50 border border-slate-200 rounded-lg">
//                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Clinical Comments:</p>
//                       <p className="text-xs font-bold text-slate-800 leading-relaxed whitespace-pre-wrap">{pathologistNote}</p>
//                     </div>
//                   )}
                  
//                   <div className="text-center mt-12 mb-8">
//                     <span className="text-xs font-bold text-slate-400 tracking-[0.3em]">*** END OF REPORT ***</span>
//                   </div>
//                 </div>

//                 {/* --- PDF FOOTER --- */}
//                 <div className="mt-auto border-t border-slate-200 px-10 py-6">
//                   <div className="flex justify-between items-end">
//                     <div className="flex items-end gap-3">
//                       <div className="w-16 h-16 bg-slate-100 rounded flex items-center justify-center border border-slate-200">
//                         <Activity size={24} className="text-slate-300" />
//                       </div>
//                       <div className="pb-1">
//                         <p className="text-[9px] font-bold text-slate-400">Scan to verify report</p>
//                         <p className="text-[10px] font-mono text-slate-600 font-bold mt-0.5">UID: {mockPatient.barcode}</p>
//                       </div>
//                     </div>

//                     <div className="text-center w-48">
//                       {status === "Approved" ? (
//                         <div className="h-12 flex items-center justify-center opacity-80" style={{ fontFamily: "cursive", color: labThemeColor, fontSize: "1.5rem" }}>
//                           Dr. Approved
//                         </div>
//                       ) : (
//                         <div className="h-12 border-b-2 border-dashed border-slate-200 mb-2 w-full flex items-center justify-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">
//                           Draft Mode
//                         </div>
//                       )}
//                       <p className="text-xs font-black text-slate-900 mt-1">Dr. Chief Pathologist</p>
//                       <p className="text-[9px] font-semibold text-slate-500">MD Path, MCI: 12345</p>
//                     </div>
//                   </div>
//                 </div>

//               </div>
//             </div>
//           </div>
//         )}

//       </div>
//     </div>
//   );
// }