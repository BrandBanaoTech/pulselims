import React from "react";

export default function Results() {
const data = [
    {
      groupName: "Complete Blood Count (CBC)",
      parameters: [
        { id: "p1", name: "Hemoglobin (Hb)", result: "14.2", flag: "Normal", unit: "g/dL", referenceValue: "13.0 - 17.0" },
        { id: "p2", name: "Total Leukocyte Count (TLC)", result: "11,500", flag: "High", unit: "cells/cu.mm", referenceValue: "4,000 - 10,000" },
        { id: "p3", name: "Platelet Count", result: "250", flag: "Normal", unit: "x10³/µL", referenceValue: "150 - 450" },
      ]
    },
    {
      groupName: "Kidney Function Test (KFT)",
      parameters: [
        { id: "p4", name: "Blood Urea Nitrogen (BUN)", result: "15", flag: "Normal", unit: "mg/dL", referenceValue: "7 - 20" },
        { id: "p5", name: "Serum Creatinine", result: "1.4", flag: "High", unit: "mg/dL", referenceValue: "0.6 - 1.2" },
        { id: "p6", name: "Calcium", result: "7.8", flag: "Low", unit: "mg/dL", referenceValue: "8.5 - 10.2" },
      ]
    }
  ];
    return (
        <main className="flex-grow w-full">
           <table className="w-full text-left text-xs border-collapse">
             <thead className="table-header-group">
               <tr className="border-y-[1.5px] border-black bg-gray-100 print:bg-transparent text-black">
                 <th className="py-2 pl-2 font-bold w-[45%] uppercase tracking-wide">Investigation</th>
                 <th className="py-2 font-bold w-[15%] uppercase tracking-wide">Result</th>
                 <th className="py-2 font-bold text-center w-[10%] uppercase tracking-wide">Flag</th>
                 <th className="py-2 font-bold w-[12%] uppercase tracking-wide">Unit</th>
                 <th className="py-2 pr-2 font-bold uppercase tracking-wide">Reference Value</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-300 text-black">
              
               {/* Loop through test groups dynamically */}
               {data.map((group, groupIndex) => (
                <React.Fragment key={groupIndex}>
                  
                  {/* Group Header */}
                  <tr className="break-inside-avoid">
                    <td colSpan={5} className="py-2.5 pl-2 font-extrabold bg-gray-50 print:bg-transparent uppercase mt-2 border-t-[1.5px] border-black underline decoration-gray-400 underline-offset-4">
                      {group.groupName}
                    </td>
                  </tr>

                  {/* Loop through parameters within the group */}
                  {group.parameters.map((param) => {
                    const isAbnormal = param.flag === "High" || param.flag === "Low";
                    
                    // Formatting the flag string visually for B&W
                    let displayFlag = "-";
                    if (param.flag === "High") displayFlag = "High (↑)";
                    if (param.flag === "Low") displayFlag = "Low (↓)";

                    return (
                      <tr 
                        key={param.id} 
                        // If abnormal, font-bold applies to the ENTIRE row
                        className={`break-inside-avoid transition-colors ${
                          isAbnormal 
                            ? "font-extrabold bg-gray-100/50 print:bg-transparent" 
                            : "font-medium hover:bg-gray-50 print:hover:bg-transparent"
                        }`}
                      >
                        <td className="py-2 pl-2 text-black">{param.name}</td>
                        <td className="py-2 text-[13px] text-black">{param.result}</td>
                        <td className="py-2 text-center text-black">{displayFlag}</td>
                        <td className={`py-2 text-[11px] ${isAbnormal ? "text-black" : "text-gray-700"}`}>{param.unit}</td>
                        <td className={`py-2 pr-2 text-[11px] ${isAbnormal ? "text-black" : "text-gray-700"}`}>{param.referenceValue}</td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>

          {/* Clinical Notes */}
          <div className="mt-5 text-[11px] text-black space-y-1.5 break-inside-avoid">
            <p><span className="font-bold">Interpretation Note:</span> Results flagged as High (↑) or Low (↓) are outside the biological reference interval. Clinical correlation is advised. Please consult your referring physician.</p>
          </div>
        </main>
    )
}