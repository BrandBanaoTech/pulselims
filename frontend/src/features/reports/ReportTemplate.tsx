import React from "react";

interface ReportTemplate {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  header_layout: "left-aligned" | "centered" | "split";
  font_family: string;
}

interface LabAddress {
  street_1?: string;
  street_2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
}

interface ReportTemplateTabProps {
  labData: {
    name: string;
    logo_url?: string;
    address?: LabAddress;
    contact_phone?: string;
    mobile_2?: string;
    support_email?: string;
    website?: string;
    accreditation?: string;
    template?: ReportTemplate;
  };
}

export default function ReportTemplateTab({ labData }: ReportTemplateTabProps) {
  const template: ReportTemplate = labData?.template || {
    primary_color: "#1e3a8a", // Darker, more professional blue
    secondary_color: "#475569",
    accent_color: "#059669",
    header_layout: "split",
    font_family: "'Inter', sans-serif",
  };

  const headerLayouts = {
    "left-aligned": "flex-row text-left",
    "centered": "flex-col items-center text-center gap-4",
    "split": "flex-row justify-between text-left",
  };

  const formatAddress = (address?: LabAddress) => {
    if (!address) return "123 Health Avenue, Medical District, Cityville, 100021"; 
    const addressParts = [
      address.street_1,
      address.street_2,
      address.city,
      `${address.state || ''} ${address.zip_code || ''}`.trim(),
      address.country
    ];
    return addressParts.filter(Boolean).join(", ");
  };

  return (
    <div
      // A4 sizing and print optimization classes
      className="relative mx-auto bg-white shadow-md print:shadow-none print:m-0 w-full max-w-[210mm] min-h-[297mm] p-[10mm] sm:p-[15mm] text-gray-900 text-sm leading-snug"
      style={{
        "--primary-color": template.primary_color,
        "--secondary-color": template.secondary_color,
        "--accent-color": template.accent_color,
        fontFamily: template.font_family,
      } as React.CSSProperties}
    >
      {/* Background Watermark (Visible mostly in print) */}
      {labData?.logo_url && (
        <div className="absolute inset-0 flex justify-center items-center opacity-[0.03] pointer-events-none z-0">
          <img src={labData.logo_url} alt="watermark" className="w-96 grayscale" />
        </div>
      )}

      <div className="relative z-10 flex flex-col h-full">
        
        {/* --- HEADER --- */}
        <header className={`flex items-center pb-4 mb-4 border-b-4 border-[var(--primary-color)] ${headerLayouts[template.header_layout]}`}>
          <div className={`${template.header_layout === 'split' ? 'order-1' : ''}`}>
            <h1 className="text-3xl font-black text-[var(--primary-color)] tracking-tight uppercase">
              {labData?.name || "PulseLIMS Diagnostics"}
            </h1>
            {/* <p className="text-xs font-bold text-gray-600 mt-1 uppercase tracking-wider">
              {labData?.accreditation || "ISO 15189:2012 & NABL Accredited Laboratory"}
            </p> */}
            <p className="text-xs text-gray-500 mt-1 max-w-sm">
              {formatAddress(labData?.address)}
              {/* {labData?.address.street_1 || "123 Health Avenue, Medical District, Cityville, 100021"} */}
            </p>
            <p className="text-xs text-gray-500">
              {labData?.contact_phone || ""}  {labData?.mobile_2 || ""}  {labData?.support_email || ""}  {labData?.website || ""}
            </p>
          </div>
          
          {labData?.logo_url && (
            <div className={`${template.header_layout === 'split' ? 'order-2' : ''}`}>
              <img src={labData.logo_url} alt="Lab Logo" className="h-16 w-auto object-contain" />
            </div>
          )}
        </header>

        {/* --- PATIENT DEMOGRAPHICS (Dense Medical Grid) --- */}
        <section className="border border-gray-400 rounded-sm mb-6 text-xs">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-300">
            {/* Column 1 */}
            <div className="p-2 space-y-1">
              <div className="flex justify-between"><span className="text-gray-500">Patient Name:</span> <span className="font-bold">Mr. JOHN DOE</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Age / Sex:</span> <span className="font-semibold">34 Y / Male</span></div>
              <div className="flex justify-between"><span className="text-gray-500">PID / UHID:</span> <span className="font-semibold">UHID-2026-8891</span></div>
            </div>
            
            {/* Column 2 */}
            <div className="p-2 space-y-1">
              <div className="flex justify-between"><span className="text-gray-500">Referred By:</span> <span className="font-bold">Dr. A. SMITH, MD</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Client / Ward:</span> <span className="font-semibold">OPD - General</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Sample ID:</span> <span className="font-semibold">SID-992811</span></div>
            </div>

            {/* Column 3 */}
            <div className="p-2 space-y-1 md:col-span-2 bg-gray-50">
              <div className="flex justify-between"><span className="text-gray-500">Registered On:</span> <span className="font-semibold">24 Oct 2026, 08:30 AM</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Collected On:</span> <span className="font-semibold">24 Oct 2026, 08:45 AM</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Reported On:</span> <span className="font-semibold">24 Oct 2026, 02:15 PM</span></div>
            </div>
          </div>
        </section>

        {/* --- REPORT TITLE --- */}
        <div className="text-center mb-4">
          <h2 className="inline-block px-4 py-1 text-sm font-bold uppercase tracking-widest border-b-2 border-gray-800">
            Department of Hematology
          </h2>
        </div>

        {/* --- RESULTS TABLE --- */}
        <main className="flex-grow">
          <table className="w-full text-left text-sm border-b-2 border-gray-300">
            <thead>
              <tr className="border-y-2 border-gray-800 bg-gray-50 text-gray-800">
                <th className="py-2 pl-2 font-bold w-1/3">Investigation</th>
                <th className="py-2 font-bold">Result</th>
                <th className="py-2 font-bold text-center">Flag</th>
                <th className="py-2 font-bold">Unit</th>
                <th className="py-2 pr-2 font-bold">Reference Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {/* Group Header */}
              <tr>
                <td colSpan={5} className="py-2 pl-2 font-bold bg-gray-100/50 text-[var(--primary-color)]">
                  COMPLETE BLOOD COUNT (CBC)
                </td>
              </tr>
              
              {/* Normal Result Row */}
              <tr className="hover:bg-gray-50 print:hover:bg-transparent">
                <td className="py-2 pl-2 font-medium text-gray-700">Hemoglobin (Hb)</td>
                <td className="py-2 font-bold">14.2</td>
                <td className="py-2 text-center text-gray-400">-</td>
                <td className="py-2 text-gray-500 text-xs">g/dL</td>
                <td className="py-2 pr-2 text-gray-600 text-xs">13.0 - 17.0</td>
              </tr>
              
              {/* Abnormal Result Row */}
              <tr className="hover:bg-gray-50 print:hover:bg-transparent">
                <td className="py-2 pl-2 font-medium text-gray-700">Total Leukocyte Count (TLC)</td>
                <td className="py-2 font-bold text-red-600 print:text-black">11,500</td>
                <td className="py-2 text-center font-bold text-red-600 print:text-black">High</td>
                <td className="py-2 text-gray-500 text-xs">cells/cu.mm</td>
                <td className="py-2 pr-2 text-gray-600 text-xs">4,000 - 10,000</td>
              </tr>

              <tr className="hover:bg-gray-50 print:hover:bg-transparent">
                <td className="py-2 pl-2 font-medium text-gray-700">Platelet Count</td>
                <td className="py-2 font-bold">250</td>
                <td className="py-2 text-center text-gray-400">-</td>
                <td className="py-2 text-gray-500 text-xs">x10^3/µL</td>
                <td className="py-2 pr-2 text-gray-600 text-xs">150 - 450</td>
              </tr>

              {/* Group Header 2 */}
              <tr>
                <td colSpan={5} className="py-2 pl-2 font-bold bg-gray-100/50 text-[var(--primary-color)] mt-4">
                  BIOCHEMISTRY
                </td>
              </tr>
              
              <tr className="hover:bg-gray-50 print:hover:bg-transparent">
                <td className="py-2 pl-2 font-medium text-gray-700">Fasting Blood Sugar (FBS)</td>
                <td className="py-2 font-bold text-red-600 print:text-black">115</td>
                <td className="py-2 text-center font-bold text-red-600 print:text-black">High</td>
                <td className="py-2 text-gray-500 text-xs">mg/dL</td>
                <td className="py-2 pr-2 text-gray-600 text-xs">70 - 99</td>
              </tr>
            </tbody>
          </table>

          {/* --- INTERPRETATION & NOTES --- */}
          <div className="mt-6 text-xs text-gray-600 space-y-2">
            <p><span className="font-bold text-gray-800">Methodology:</span> Cell counter, Hexokinase method for Glucose.</p>
            <p><span className="font-bold text-gray-800">Note:</span> A slightly elevated Fasting Blood Sugar indicates impaired fasting glucose (Prediabetes). Clinical correlation is advised.</p>
          </div>
        </main>

        {/* --- FOOTER & SIGNATURES --- */}
        <footer className="mt-12 pt-4 border-t border-gray-300 page-break-inside-avoid">
          <div className="grid grid-cols-3 gap-4 text-center">
            {/* Tech Signature */}
            <div className="flex flex-col items-center justify-end">
              {/* Optional: Add image of signature here */}
              <div className="h-10"></div> 
              <p className="font-bold text-sm text-gray-800">Mr. Robert Chen</p>
              <p className="text-xs text-gray-500">Senior Technician</p>
            </div>
            
            {/* QR Code / Barcode Placeholder */}
            <div className="flex flex-col items-center justify-end">
              <div className="w-16 h-16 border-2 border-gray-200 bg-gray-50 flex items-center justify-center text-[10px] text-gray-400 mb-1">
                [QR CODE]
              </div>
              <p className="text-[10px] text-gray-400">Scan to verify</p>
            </div>

            {/* Pathologist Signature */}
            <div className="flex flex-col items-center justify-end">
              <div className="h-10"></div>
              <p className="font-bold text-sm text-gray-800">Dr. Sarah Jenkins</p>
              <p className="text-xs text-gray-500">MD Pathologist (Reg No: 88219)</p>
            </div>
          </div>
          
          <div className="mt-6 text-center text-[10px] text-gray-400 border-t border-gray-200 pt-2">
            <p>*** END OF REPORT ***</p>
            <p>This report is electronically generated and verified. Not valid for medico-legal purposes without physical stamp/signature.</p>
          </div>
        </footer>

      </div>
    </div>
  );
}