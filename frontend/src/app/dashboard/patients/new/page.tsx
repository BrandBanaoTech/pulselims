"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  User, 
  Phone, 
  MapPin, 
  Droplet, 
  Save, 
  Loader2, 
  ArrowLeft, 
  AlertTriangle 
} from "lucide-react";

import { patientIntakeSchema, PatientIntakeValues } from "@/features/patients/schemas/patient.schema";
import { patientService } from "@/features/patients/api/patient.service";

// Safely parse FastAPI validation errors
const parseApiError = (error: any, fallback: string) => {
  const detail = error.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0 && detail[0].msg) return detail[0].msg;
  return fallback;
};

export default function NewPatientPage() {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<PatientIntakeValues>({
    resolver: zodResolver(patientIntakeSchema),
    mode: "onTouched",
  });

  const onSubmit = async (data: PatientIntakeValues) => {
    setApiError(null);
    try {
      // Send to FastAPI
      const newPatient = await patientService.createPatient(data);
      
      // Navigate back to patient list or directly to their profile
      router.push(`/dashboard/patients/${newPatient.id}`);
      
    } catch (error: any) {
      setApiError(parseApiError(error, "Failed to register patient. Please check the data."));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8">
        <Link 
          href="/dashboard/patients" 
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Register New Patient</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Enter the patient's demographic and contact information.
          </p>
        </div>
      </div>

      {apiError && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
          <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={18} />
          <p className="text-sm font-bold text-red-700 leading-tight">{apiError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* ================= SECTION: PERSONAL DETAILS ================= */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
            <User className="text-teal-600" size={18} />
            Personal Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">First Name *</label>
              <input {...register("first_name")} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm outline-none transition-all" placeholder="Rahul" />
              {errors.first_name && <p className="text-red-500 text-[10px] mt-1.5 font-bold">{errors.first_name.message}</p>}
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Last Name</label>
              <input {...register("last_name")} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm outline-none transition-all" placeholder="Sharma" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Date of Birth *</label>
              <input type="date" {...register("date_of_birth")} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm outline-none transition-all text-slate-700" />
              {errors.date_of_birth && <p className="text-red-500 text-[10px] mt-1.5 font-bold">{errors.date_of_birth.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Gender *</label>
              <select {...register("gender")} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm outline-none transition-all text-slate-700">
                <option value="">Select Gender...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && <p className="text-red-500 text-[10px] mt-1.5 font-bold">{errors.gender.message}</p>}
            </div>
          </div>
        </div>

        {/* ================= SECTION: CONTACT & LOCATION ================= */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
            <Phone className="text-teal-600" size={18} />
            Contact & Location
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Mobile Number *</label>
              <input {...register("mobile")} type="tel" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm outline-none transition-all" placeholder="+919876543210" />
              {errors.mobile && <p className="text-red-500 text-[10px] mt-1.5 font-bold">{errors.mobile.message}</p>}
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email (Optional)</label>
              <input {...register("email")} type="email" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm outline-none transition-all" placeholder="patient@example.com" />
              {errors.email && <p className="text-red-500 text-[10px] mt-1.5 font-bold">{errors.email.message}</p>}
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><MapPin size={14}/> Street Address *</label>
              <input {...register("address.street_1")} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm outline-none transition-all" placeholder="House/Flat No., Street, Landmark" />
              {errors.address?.street_1 && <p className="text-red-500 text-[10px] mt-1.5 font-bold">{errors.address.street_1.message}</p>}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">City *</label>
                <input {...register("address.city")} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm outline-none transition-all" placeholder="New Delhi" />
                {errors.address?.city && <p className="text-red-500 text-[10px] mt-1.5 font-bold">{errors.address.city.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">State *</label>
                <input {...register("address.state")} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm outline-none transition-all" placeholder="Delhi" />
                {errors.address?.state && <p className="text-red-500 text-[10px] mt-1.5 font-bold">{errors.address.state.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Pin Code *</label>
                <input {...register("address.postal_code")} maxLength={6} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm outline-none transition-all" placeholder="110001" />
                {errors.address?.postal_code && <p className="text-red-500 text-[10px] mt-1.5 font-bold">{errors.address.postal_code.message}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* ================= SECTION: MEDICAL SNAPSHOT ================= */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
            <Droplet className="text-teal-600" size={18} />
            Medical Snapshot
          </h3>
          
          <div className="w-full md:w-1/2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Blood Group (Optional)</label>
            <select {...register("blood_group")} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm outline-none transition-all text-slate-700">
              <option value="">Unknown</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>
        </div>

        {/* ================= SUBMIT ACTIONS ================= */}
        <div className="flex justify-end pt-4 pb-12">
          <button
            type="submit"
            disabled={isSubmitting || !isValid}
            className="group flex items-center gap-2 py-4 px-8 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-teal-500/30 disabled:opacity-50 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {isSubmitting ? "Registering..." : "Register & Continue"}
          </button>
        </div>

      </form>
    </div>
  );
}