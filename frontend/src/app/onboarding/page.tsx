"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Building2, ArrowRight, Loader2, HeartPulse } from "lucide-react";
import { labService, LabResponse } from "@/features/labs/api/lab.service";
import { authService } from "@/features/auth/api/auth.service";
import { useAuthStore } from "@/store/useAuthStore";
import { AuthGuard } from "@/features/auth/components/AuthGuard";
// import { createLabSchema, CreateLabFormValues } from "@/features/labs/schemas/lab.schema";


export default function OnboardingPage() {
    const router = useRouter();
    const { activeLabId, setActiveLabId } = useAuthStore();
    const [workspace, setWorkspace] = useState<LabResponse | null>(null);
    const [apiError, setApiError] = useState<string | null>(null);

//     const {
//     register,
//     handleSubmit,
//     formState: { errors, isSubmitting },
//   } = useForm<CreateLabFormValues>({
//     resolver: zodResolver(createLabSchema),
//     defaultValues: { 
//       address: { country: "India" },
//       timezone: "Asia/Kolkata"
//     }
//   });


  return (
    // requireActiveLab is false, so empty users are allowed here
    <AuthGuard requireActiveLab={false}>
      <div className="min-h-screen w-full bg-slate-900 flex flex-col justify-center items-center p-6 relative overflow-hidden">
        
        {/* Background Styling */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900 via-slate-900 to-black opacity-50"></div>
        
        {/* Top Branding */}
        <div className="relative z-10 flex items-center gap-3 mb-10 text-white">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-500/30">
            L
          </div>
          <h1 className="text-2xl font-bold tracking-tight">LIMS Pro</h1>
        </div>

        {/* The Form Component */}
        <div className="relative z-10 w-full max-w-4xl">
           {/* <CreateLabForm onSuccess={() => console.log("Form submitted successfully")}/> */}
        </div>
        
      </div>
    </AuthGuard>
  );
}