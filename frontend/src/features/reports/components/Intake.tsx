"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "@/lib/toast";
import { useAuthStore } from "@/store/useAuthStore";
import { intakeApi } from "@/features/intake/api/intake.api";
import type { IntakeRecord } from "@/features/intake/schemas/intake.schema";

export default function Intake() {
  const token = useAuthStore((state) => state.token);
  const params = useParams();
  const id = params?.patientId as string | undefined;

  const [intake, setIntake] = useState<IntakeRecord>();
  const [isLoadingQueue, setIsLoadingQueue] = useState(true);

  useEffect(() => {
    if (!token || !id) return;

    const fetchIntakesQueue = async () => {
      try {
        setIsLoadingQueue(true);
        const data = await intakeApi.getById(id);
        setIntake(data);
      } catch (error) {
        toast.error("Failed to load operations queue.");
      } finally {
        setIsLoadingQueue(false);
      }
    };

    fetchIntakesQueue();
  }, [token, id]);

  if (isLoadingQueue) {
    return (
      <section className="border border-black rounded-sm mb-6 text-[11px] bg-white p-3 animate-pulse">
        <div className="h-3 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
      </section>
    );
  }

  return (
    <section className="border border-black rounded-sm mb-6 text-[11px] bg-white print:break-inside-avoid w-full">
      {/* Forced 3-column grid regardless of screen size */}
      <div className="grid grid-cols-3 divide-x divide-black">
        
        {/* Column 1 */}
        <div className="p-2 space-y-1.5">
          <div className="flex justify-between">
            <span className="text-gray-600">Patient Name:</span>
            <span className="font-bold text-black uppercase">{intake?.patient_name || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Age / Gender:</span>
            <span className="font-bold text-black">
              {intake?.patient_age ? `${intake.patient_age} Y` : "—"} / {intake?.patient_gender || "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">PID / UHID:</span>
            <span className="font-bold text-black">UHID-2026-8891</span>
          </div>
        </div>

        {/* Column 2 */}
        <div className="p-2 space-y-1.5">
          <div className="flex justify-between">
            <span className="text-gray-600">Referred By:</span>
            <span className="font-bold text-black uppercase">Dr. A. SMITH, MD</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Sample ID (SID):</span>
            <span className="font-bold text-black">SID-992811</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Sample Type:</span>
            <span className="font-bold text-black">Serum & EDTA</span>
          </div>
        </div>

        {/* Column 3 */}
        <div className="p-2 space-y-1.5 bg-gray-50">
          <div className="flex justify-between">
            <span className="text-gray-600">Collected:</span>
            <span className="font-bold text-black">24 Oct 2026, 08:45 AM</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Received:</span>
            <span className="font-bold text-black">24 Oct 2026, 09:15 AM</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Reported:</span>
            <span className="font-bold text-black">24 Oct 2026, 02:15 PM</span>
          </div>
        </div>

      </div>
    </section>
  );
}
// import { useEffect, useState } from "react";
// import { useParams } from "next/navigation";
// import { toast } from "@/lib/toast";
// import { useAuthStore } from "@/store/useAuthStore";
// import { intakeApi } from "@/features/intake/api/intake.api";
// import type { IntakeRecord } from "@/features/intake/schemas/intake.schema";

// export default function Intake() {
//   const token = useAuthStore((state) => state.token);
//   const params = useParams();
//   const id = params?.patientId as string | undefined;
  
//   const [intake, setIntake] = useState<IntakeRecord>();
//   const [isLoadingQueue, setIsLoadingQueue] = useState(true);

//   useEffect(() => {
//   if (!token || !id) return;

//   const fetchIntakesQueue = async () => {
//     try {
//       setIsLoadingQueue(true);
//       const data = await intakeApi.getById(id);
//       setIntake(data);
//     } catch (error) {
//       toast.error("Failed to load operations queue.");
//     } finally {
//       setIsLoadingQueue(false);
//     }
//   };

//   fetchIntakesQueue();
// }, [token, id]);

//     return (
//         <section className="border-[1.5px] border-black rounded-sm mb-6 text-[11px] bg-white">
//             <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-black">
//               <div className="p-2 space-y-1.5">
//                 <div className="flex justify-between"><span className="text-gray-600">Patient Name:</span> <span className="font-bold text-black uppercase">{intake?.patient_name}</span></div>
//                 <div className="flex justify-between"><span className="text-gray-600">Age / Gender:</span> <span className="font-bold text-black">{intake?.patient_age} Y / {intake?.patient_gender}</span></div>
//                 <div className="flex justify-between"><span className="text-gray-600">PID / UHID:</span> <span className="font-bold text-black">UHID-2026-8891</span></div>
//               </div>
//               <div className="p-2 space-y-1.5">
//                 <div className="flex justify-between"><span className="text-gray-600">Referred By:</span> <span className="font-bold text-black uppercase">Dr. A. SMITH, MD</span></div>
//                 <div className="flex justify-between"><span className="text-gray-600">Sample ID (SID):</span> <span className="font-bold text-black">SID-992811</span></div>
//                 <div className="flex justify-between"><span className="text-gray-600">Sample Type:</span> <span className="font-bold text-black">Serum & EDTA</span></div>
//               </div>
//               <div className="p-2 space-y-1.5 bg-gray-50 print:bg-transparent">
//                 <div className="flex justify-between"><span className="text-gray-600">Collected:</span> <span className="font-bold text-black">24 Oct 2026, 08:45 AM</span></div>
//                 <div className="flex justify-between"><span className="text-gray-600">Received:</span> <span className="font-bold text-black">24 Oct 2026, 09:15 AM</span></div>
//                 <div className="flex justify-between"><span className="text-gray-600">Reported:</span> <span className="font-bold text-black">24 Oct 2026, 02:15 PM</span></div>
//               </div>
//             </div>
//         </section>
//     )
// }