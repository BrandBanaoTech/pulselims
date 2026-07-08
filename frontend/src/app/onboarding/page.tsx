"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Building2, ArrowRight, Loader2, HeartPulse } from "lucide-react";
import { labService } from "@/features/labs/api/lab.service";
import { authService } from "@/features/auth/api/auth.service";
import { useAuthStore } from "@/store/useAuthStore";
import { AuthGuard } from "@/features/auth/components/AuthGuard";

// 1. Import the centralized, highly secure schema we built earlier
import { createLabSchema, CreateLabFormValues } from "@/features/labs/schemas/lab.schema";

export default function OnboardingPage() {
  const router = useRouter();
  const { setActiveLabId } = useAuthStore();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<CreateLabFormValues>({
    resolver: zodResolver(createLabSchema),
    mode: "onTouched",
    defaultValues: { 
      address: { country: "India" },
      timezone: "Asia/Kolkata"
    }
  });

  const onSubmit = async (data: CreateLabFormValues) => {
    setApiError(null);
    try {
      const newLab = await labService.createLab(data);

      // Refresh the JWT from FastAPI so the token gets the new Labspace permissions
      await authService.refreshToken(); 

      // Set Active Lab and Unlock Dashboard
      setActiveLabId(newLab.id);
      window.location.href = "/dashboard"; 
      
    } catch (error: any) {
      setApiError(error.response?.data?.detail || "Failed to provision Labspace.");
    }
  };

  return (
    <AuthGuard requireActiveLab={false}>
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        
        <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-teal-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-xl shadow-teal-500/20 mb-4">
            <HeartPulse className="text-white" size={32} />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Provision Your Labspace</h2>
          <p className="mt-2 text-sm text-slate-500 font-medium max-w-sm mx-auto">
            You must create a verified Labspace before accessing the clinical dashboard.
          </p>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-xl">
          <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 rounded-3xl sm:px-10 border border-slate-100">
            
            {apiError && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm font-bold rounded-xl border border-red-200">
                {apiError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Labspace Name *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-slate-400" />
                  </div>
                  <input {...register("name")} className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm outline-none transition-all" placeholder="e.g. Apex Diagnostics" />
                </div>
                {errors.name && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Support Email *</label>
                  <input {...register("support_email")} type="email" className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm outline-none" />
                  {errors.support_email && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.support_email.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Contact Phone *</label>
                  <input {...register("contact_phone")} className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm outline-none" placeholder="+91..." />
                  {errors.contact_phone && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.contact_phone.message}</p>}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">Location Verification</h3>
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Street Address *</label>
                    <input {...register("address.street_1")} className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm outline-none" />
                    {errors.address?.street_1 && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.address.street_1.message}</p>}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">City *</label>
                      <input {...register("address.city")} className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm outline-none" />
                      {errors.address?.city && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.address.city.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">State *</label>
                      <input {...register("address.state")} className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm outline-none" />
                      {errors.address?.state && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.address.state.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Pin Code *</label>
                      <input {...register("address.postal_code")} className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm outline-none" />
                      {errors.address?.postal_code && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.address.postal_code.message}</p>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting || !isValid}
                  className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-teal-500/30 text-sm font-extrabold text-white bg-teal-600 hover:bg-teal-700 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Initialize Labspace"}
                  {!isSubmitting && <ArrowRight size={18} />}
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}