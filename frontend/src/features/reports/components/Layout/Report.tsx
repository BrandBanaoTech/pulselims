"use client";

import { ReactNode, useRef, useState } from "react";
import { Printer, Loader2 } from "lucide-react";
import Footer from "../Footer";
import Header from "../Header";
import { LabResponse } from "@/features/labs/api/lab.service";
import { printComponent } from "@/features/reports/utils/printComponent";

interface ReportLayoutProps {
  children: ReactNode;
  labData: LabResponse;
}

export default function ReportLayout({ children, labData }: ReportLayoutProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = async () => {
    setIsPrinting(true);

    await printComponent(printRef.current, {
      pageTitle: `Lab_Report_${labData?.id || "Details"}`,
      pageSize: "A4",
      margin: "8mm",
    });

    setIsPrinting(false);
  };

  return (
    <div className="relative w-full max-w-[210mm] mx-auto">
      {/* Absolute Overlay Print Button */}
      <button
        onClick={handlePrint}
        disabled={isPrinting}
        className="absolute top-4 right-4 z-20 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 hover:border-slate-300 hover:shadow transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed print:hidden"
      >
        {isPrinting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span>Preparing...</span>
          </>
        ) : (
          <>
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print Report</span>
          </>
        )}
      </button>

      {/* Printable Report Box */}
      <div
        ref={printRef}
        className="bg-white p-6 rounded-lg shadow-sm flex flex-col h-full flex-grow text-black"
      >
        {labData ? (
          <>
            <Header labData={labData} />
            <main className="flex-grow my-4">{children}</main>
            <Footer labData={labData} />
          </>
        ) : null}
      </div>
    </div>
  );
}
// "use client";

// import { ReactNode, useRef, useState } from "react";
// import Footer from "../Footer";
// import Header from "../Header";
// import { LabResponse } from "@/features/labs/api/lab.service";
// import { printComponent } from "@/features/reports/utils/printComponent";

// interface ReportLayoutProps {
//   children: ReactNode;
//   labData: LabResponse;
// }

// export default function ReportLayout({ children, labData }: ReportLayoutProps) {
//   const printRef = useRef<HTMLDivElement>(null);
//   const [isPrinting, setIsPrinting] = useState(false);

//   const handlePrint = async () => {
//     setIsPrinting(true);

//     await printComponent(printRef.current, {
//       pageTitle: `Lab_Report_${labData?.id || "Details"}`,
//       pageSize: "A4",
//       margin: "8mm",
//     });

//     setIsPrinting(false);
//   };

//   return (
//     <div className="w-full flex flex-col items-center">
//       {/* Print Action Button */}
//       <div className="w-full max-w-[210mm] flex justify-end mb-4 print:hidden">
//         <button
//           onClick={handlePrint}
//           disabled={isPrinting}
//           className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-md transition disabled:opacity-50"
//         >
//           {isPrinting ? "Preparing Document..." : "Print Report"}
//         </button>
//       </div>

//       {/* Printable Area (Enforced A4 proportion container) */}
//       <div
//         ref={printRef}
//         className="w-full max-w-[210mm] bg-white p-4 shadow-sm print:shadow-none print:p-0 flex flex-col min-h-full flex-grow text-black"
//       >
//         {labData ? (
//           <>
//             <Header labData={labData} />
//             <main className="flex-grow my-2">{children}</main>
//             <Footer labData={labData} />
//           </>
//         ) : null}
//       </div>
//     </div>
//   );
// }
// "use client";
// import { ReactNode, useRef, useState } from "react";
// import { Printer, Loader2 } from "lucide-react";

// import Footer from "../Footer";
// import Header from "../Header";
// import { LabResponse } from "@/features/labs/api/lab.service";
// import { printComponent } from "@/features/reports/utils/printComponent";

// interface ReportLayoutProps {
//   children: ReactNode;
//   labData: LabResponse;
// }

// export default function ReportLayout({ children, labData }: ReportLayoutProps) {
//   const printRef = useRef<HTMLDivElement>(null);
//   const [isPrinting, setIsPrinting] = useState(false);

//   const handlePrint = async () => {
//     setIsPrinting(true);
    
//     await printComponent(printRef.current, {
//       pageTitle: `Lab_Report_${labData?.id || 'Details'}`,
//       pageSize: 'A4',
//       margin: '20mm',
//     });

//     setIsPrinting(false);
//   };

//   return (
//     <>
//     <button
//   onClick={handlePrint}
//   disabled={isPrinting}
//   title="Print Report"
//   className="absolute top-4 right-4 z-20 p-2.5 text-slate-600 bg-white hover:text-blue-600 hover:bg-slate-50 border border-slate-200 rounded-full shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed print:hidden"
// >
//   {isPrinting ? (
//     <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
//   ) : (
//     <Printer className="w-4 h-4" />
//   )}
// </button>
//       <div ref={printRef} className="relative z-10 flex flex-col h-full flex-grow">
//         {labData? (
//           <>
//           <Header labData={labData}/>
//           {children}
//           <Footer labData={labData}/>
//           </>
//         ):("")}
//       </div>
//     </>
//   );
// }