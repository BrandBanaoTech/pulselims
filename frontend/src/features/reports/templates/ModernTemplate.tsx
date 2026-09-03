import React from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useReportStore } from "@/store/useReportStore";
import { ShieldCheck } from "lucide-react";

export function ModernTemplate() {
  const { activeLab, user } = useAuthStore();
  // Notice we now pull setMetric and setPathologistNote!
  const { patient, metrics, setMetric, pathologistNote, setPathologistNote, status, config } = useReportStore();
  const labName = activeLab || "Apex Diagnostics";
  const lablogo = user?.logo_url || "https://ui-avatars.com/api/?name=${encodeURIComponent(labName)}&background=${config.themeColor.replace('#', '')}&color=fff&rounded=true&bold=true";

  const cbcParameters = [
    { id: "p1", name: "Hemoglobin (Hb)", unit: "g/dL", referenceText: "13.0 - 17.0", minRange: 13.0, maxRange: 17.0 },
    { id: "p2", name: "Total RBC Count", unit: "mill/cumm", referenceText: "4.5 - 5.5", minRange: 4.5, maxRange: 5.5 },
    { id: "p3", name: "Total WBC Count", unit: "cells/cumm", referenceText: "4000 - 11000", minRange: 4000, maxRange: 11000 },
    { id: "p4", name: "Platelet Count", unit: "lakhs/cumm", referenceText: "1.5 - 4.5", minRange: 1.5, maxRange: 4.5 },
  ];

  return (
    <div className="flex flex-col h-full bg-white relative z-10">
      {/* --- HEADER --- */}
      {config.showHeader && (
        <div className="px-12 pt-12 pb-8 flex items-start justify-between">
          <div className="flex items-center gap-5">
            {lablogo? <img src={lablogo} alt="Logo" className="w-25 h-25 rounded-2xl" /> : ""}
            <div>
              <h1 className="text-3xl font-black tracking-tight" style={{ color: config.themeColor }}>{labName}</h1>
              <p className="text-sm font-bold text-slate-500 mt-1">Center for Advanced Diagnostics</p>
              <p className="text-[11px] font-semibold text-slate-400 mt-1">123 Health Avenue • +91 98765 43210</p>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
               <ShieldCheck size={14} className="text-emerald-600" />
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">NABL Accredited</span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 mt-2">ISO 15189:2022 Certified</p>
          </div>
        </div>
      )}

      {/* --- DEMOGRAPHICS --- */}
      <div className="px-12 py-4">
        <div className="grid grid-cols-2 gap-y-5 gap-x-12 p-5 bg-slate-50 rounded-2xl border border-slate-100">
          <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Patient Name</p><p className="text-base font-black text-slate-900">{patient?.name}</p></div>
          <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Registered On</p><p className="text-sm font-bold text-slate-700">{patient?.registeredAt}</p></div>
          <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Age / Gender</p><p className="text-sm font-bold text-slate-700">{patient?.age} Yrs / {patient?.gender}</p></div>
          <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Barcode / SID</p><p className="text-sm font-mono font-black text-slate-700 tracking-wider">{patient?.barcode}</p></div>
        </div>
      </div>

      {/* --- TITLE --- */}
      <div className="px-12 text-center my-8">
        <h2 className="text-xl font-black uppercase tracking-widest" style={{ color: config.themeColor }}>Complete Blood Count (CBC)</h2>
      </div>

      {/* --- INLINE EDITABLE RESULTS TABLE --- */}
      <div className="px-12 flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 rounded-lg">
              <th className="py-3 pl-4 text-[10px] font-black text-slate-500 uppercase tracking-widest w-[45%] rounded-l-lg">Investigation</th>
              <th className="py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center w-[20%]">Result</th>
              <th className="py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center w-[10%]">Unit</th>
              <th className="py-3 pr-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right w-[25%] rounded-r-lg">Ref. Interval</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cbcParameters.map((param) => {
              const val = metrics[param.id] || "";
              const num = parseFloat(val);
              const isAbnormal = val && (num < param.minRange || num > param.maxRange);
              const isHigh = num > param.maxRange;

              return (
                <tr key={param.id} className="group">
                  <td className="py-3 pl-4 text-sm font-bold text-slate-800">{param.name}</td>
                  
                  {/* 🚀 THE INLINE INPUT CELL */}
                  <td className="py-2 text-center relative px-2">
                    <div className="relative inline-block w-24">
                      <input
                        type="number"
                        step="0.01"
                        value={val}
                        onChange={(e) => setMetric(param.id, e.target.value)}
                        placeholder="---"
                        className={`w-full text-center py-2 rounded-xl text-sm font-black font-mono transition-all outline-none 
                          border border-slate-200/60 bg-slate-50 hover:bg-white focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10
                          print:border-none print:bg-transparent print:p-0 print:shadow-none print:placeholder:text-transparent
                          ${isAbnormal ? "text-rose-700 bg-rose-50/50 border-rose-200" : "text-slate-900"}
                        `}
                      />
                      {/* Floating H/L Flag */}
                      {isAbnormal && (
                        <span className={`absolute -right-6 top-1/2 -translate-y-1/2 text-[9px] font-black px-1.5 py-0.5 rounded ${isHigh ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"}`}>
                          {isHigh ? "H" : "L"}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 text-center text-xs font-bold text-slate-400">{param.unit}</td>
                  <td className="py-3 pr-4 text-right text-xs font-bold text-slate-500">{param.referenceText}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* 🚀 INLINE TEXTAREA FOR PATHOLOGIST NOTES */}
        <div className="mt-10 p-5 bg-slate-50 border border-slate-200 rounded-xl print:border-none print:bg-transparent print:p-0 print:mt-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 print:text-slate-800">Clinical Comments:</p>
          <textarea
            value={pathologistNote}
            onChange={(e) => setPathologistNote(e.target.value)}
            placeholder="Click to add clinical comments... (Hidden on print if empty)"
            className="w-full bg-transparent border-none outline-none resize-none text-xs font-bold text-slate-800 placeholder:text-slate-400 min-h-[60px] print:placeholder:text-transparent print:p-0"
          />
        </div>
        
        <div className="text-center mt-12 mb-8"><span className="text-[10px] font-bold text-slate-400 tracking-[0.3em]">*** END OF REPORT ***</span></div>
      </div>

      {/* --- FOOTER --- */}
      {config.showFooter && (
        <div className="mt-auto border-t border-slate-200 px-12 py-8 bg-white">
          <div className="flex justify-between items-end">
            {config.showQR ? (
              <div className="flex items-end gap-4">
                <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200 p-2"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${patient?.barcode}`} alt="QR" className="w-full h-full opacity-80 mix-blend-multiply" /></div>
                <div className="pb-1"><p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Scan to Verify</p><p className="text-[10px] font-mono text-slate-900 font-black mt-0.5">UID: {patient?.barcode}</p></div>
              </div>
            ) : <div />}
            <div className="text-center w-48">
              {status === "Approved" ? (
                <div className="h-12 flex items-center justify-center opacity-90" style={{ fontFamily: "cursive", color: config.themeColor, fontSize: "1.5rem" }}>Dr. Signature</div>
              ) : (
                <div className="h-12 border-b-2 border-dashed border-slate-200 mb-2 flex items-center justify-center text-[10px] font-black text-slate-300 uppercase tracking-widest">Unsigned Draft</div>
              )}
              <p className="text-xs font-black text-slate-900 mt-2">Dr. Chief Pathologist</p>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">MD Path, MCI: 12345</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// import React from "react";
// import { useAuthStore } from "@/store/useAuthStore";
// import { useReportStore } from "@/store/useReportStore";
// import { ShieldCheck } from "lucide-react";

// export function ModernTemplate() {
//   const { activeLab } = useAuthStore();
//   const { patient, metrics, pathologistNote, status, config } = useReportStore();
//   const labName = activeLab || "Apex Diagnostics";

//   // Mock catalog just for the visual layout mapping
//   const cbcParameters = [
//     { id: "p1", name: "Hemoglobin (Hb)", unit: "g/dL", referenceText: "13.0 - 17.0", minRange: 13.0, maxRange: 17.0 },
//     { id: "p2", name: "Total RBC Count", unit: "mill/cumm", referenceText: "4.5 - 5.5", minRange: 4.5, maxRange: 5.5 },
//     { id: "p3", name: "Total WBC Count", unit: "cells/cumm", referenceText: "4000 - 11000", minRange: 4000, maxRange: 11000 },
//   ];

//   return (
//     <div className="flex flex-col h-full">
//       {/* --- HEADER --- */}
//       {config.showHeader && (
//         <div className="px-12 pt-12 pb-8 flex items-start justify-between">
//           <div className="flex items-center gap-5">
//             <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(labName)}&background=${config.themeColor.replace('#', '')}&color=fff&rounded=true&bold=true`} alt="Logo" className="w-20 h-20 rounded-2xl shadow-sm" />
//             <div>
//               <h1 className="text-3xl font-black tracking-tight" style={{ color: config.themeColor }}>{labName}</h1>
//               <p className="text-sm font-bold text-slate-500 mt-1">Center for Advanced Diagnostics</p>
//               <p className="text-[11px] font-semibold text-slate-400 mt-1">123 Health Avenue • +91 98765 43210</p>
//             </div>
//           </div>
//           <div className="text-right flex flex-col items-end">
//             <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
//                <ShieldCheck size={14} className="text-emerald-600" />
//                <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">NABL Accredited</span>
//             </div>
//             <p className="text-[10px] font-bold text-slate-400 mt-2">ISO 15189:2022 Certified</p>
//           </div>
//         </div>
//       )}

//       {/* --- DEMOGRAPHICS (Modern Rounded Grid) --- */}
//       <div className="px-12 py-4">
//         <div className="grid grid-cols-2 gap-y-5 gap-x-12 p-5 bg-slate-50 rounded-2xl border border-slate-100">
//           <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Patient Name</p><p className="text-base font-black text-slate-900">{patient?.name}</p></div>
//           <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Registered On</p><p className="text-sm font-bold text-slate-700">{patient?.registeredAt}</p></div>
//           <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Age / Gender</p><p className="text-sm font-bold text-slate-700">{patient?.age} Yrs / {patient?.gender}</p></div>
//           <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Barcode / SID</p><p className="text-sm font-mono font-black text-slate-700 tracking-wider">{patient?.barcode}</p></div>
//           <div className="col-span-2 border-t border-slate-200 pt-4 mt-1"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Referred By</p><p className="text-sm font-bold text-slate-900">{patient?.refDoctor}</p></div>
//         </div>
//       </div>

//       {/* --- TITLE --- */}
//       <div className="px-12 text-center my-8">
//         <h2 className="text-xl font-black uppercase tracking-widest" style={{ color: config.themeColor }}>Complete Blood Count (CBC)</h2>
//         <p className="text-xs font-bold text-slate-400 mt-2">Sample: Whole Blood (EDTA)</p>
//       </div>

//       {/* --- RESULTS TABLE (Modern Stripeless) --- */}
//       <div className="px-12 flex-1">
//         <table className="w-full text-left border-collapse">
//           <thead>
//             <tr className="bg-slate-100 rounded-lg">
//               <th className="py-3 pl-4 text-[10px] font-black text-slate-500 uppercase tracking-widest w-[45%] rounded-l-lg">Investigation</th>
//               <th className="py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center w-[15%]">Result</th>
//               <th className="py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center w-[15%]">Unit</th>
//               <th className="py-3 pr-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right w-[25%] rounded-r-lg">Ref. Interval</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-100">
//             {cbcParameters.map((param) => {
//               const val = metrics[param.id];
//               const num = parseFloat(val);
//               const isAbnormal = val && (num < param.minRange || num > param.maxRange);
//               const isHigh = num > param.maxRange;

//               return (
//                 <tr key={param.id}>
//                   <td className="py-4 pl-4 text-sm font-bold text-slate-800">{param.name}</td>
//                   <td className="py-4 text-center relative">
//                     <span className={`text-sm font-black font-mono tracking-wider ${isAbnormal ? "text-slate-900 text-base" : "text-slate-700"}`}>{val || "---"}</span>
//                     {isAbnormal && (
//                       <span className={`absolute -right-1 top-1/2 -translate-y-1/2 text-[9px] font-black px-1.5 py-0.5 rounded ${isHigh ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"}`}>
//                         {isHigh ? "H" : "L"}
//                       </span>
//                     )}
//                   </td>
//                   <td className="py-4 text-center text-xs font-bold text-slate-400">{param.unit}</td>
//                   <td className="py-4 pr-4 text-right text-xs font-bold text-slate-500">{param.referenceText}</td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>

//         {/* Notes */}
//         {pathologistNote && (
//           <div className="mt-10 p-5 bg-slate-50 border border-slate-200 rounded-xl">
//             <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Clinical Comments:</p>
//             <p className="text-xs font-bold text-slate-800 leading-relaxed whitespace-pre-wrap">{pathologistNote}</p>
//           </div>
//         )}
//         <div className="text-center mt-16 mb-10"><span className="text-[10px] font-bold text-slate-400 tracking-[0.3em]">*** END OF REPORT ***</span></div>
//       </div>

//       {/* --- FOOTER --- */}
//       {config.showFooter && (
//         <div className="mt-auto border-t border-slate-200 px-12 py-8 bg-white">
//           <div className="flex justify-between items-end">
//             {config.showQR ? (
//               <div className="flex items-end gap-4">
//                 <div className="w-20 h-20 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200 p-2">
//                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${patient?.barcode}`} alt="QR" className="w-full h-full opacity-80 mix-blend-multiply" />
//                 </div>
//                 <div className="pb-1">
//                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Scan to Verify</p>
//                   <p className="text-xs font-mono text-slate-900 font-black mt-1">UID: {patient?.barcode}</p>
//                 </div>
//               </div>
//             ) : <div />}
//             <div className="text-center w-56">
//               {status === "Approved" ? (
//                 <div className="h-16 flex items-center justify-center opacity-90" style={{ fontFamily: "cursive", color: config.themeColor, fontSize: "1.75rem" }}>Dr. Signature</div>
//               ) : (
//                 <div className="h-16 border-b-2 border-dashed border-slate-200 mb-2 flex items-center justify-center text-[10px] font-black text-slate-300 uppercase tracking-widest">Unsigned Draft</div>
//               )}
//               <p className="text-sm font-black text-slate-900 mt-2">Dr. Chief Pathologist</p>
//               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">MD Path, MCI: 12345</p>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }