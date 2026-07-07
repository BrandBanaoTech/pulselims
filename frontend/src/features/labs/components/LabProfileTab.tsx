"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { labUpdateSchema, LabUpdateValues } from "../schemas/labUpdate.schema";
import { labService, LabResponse } from "../api/lab.service";
import { Loader2, CheckCircle2, Building2, MapPin, Palette, FileSignature } from "lucide-react";

interface LabProfileTabProps {
  labData: LabResponse;
}

export function LabProfileTab({ labData }: LabProfileTabProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset
  } = useForm<LabUpdateValues>({
    resolver: zodResolver(labUpdateSchema),
    // Fallback optional nulls to "" to prevent React "uncontrolled input" warnings
    defaultValues: {
      name: labData.name,
      license_number: labData.license_number || "",
      support_email: labData.support_email,
      contact_phone: labData.contact_phone,
      timezone: labData.timezone,
      
      address: {
        street_1: labData.address.street_1,
        street_2: labData.address.street_2 || "",
        city: labData.address.city,
        state: labData.address.state,
        postal_code: labData.address.postal_code,
        country: labData.address.country,
      },

      logo_url: labData.logo_url || "",
      website: labData.website || "",
      report_header_text: labData.report_header_text || "",
      report_footer_text: labData.report_footer_text || "",
      director_name: labData.director_name || "",
      director_signature_url: labData.director_signature_url || "",
    },
  });

  const onSubmit = async (data: LabUpdateValues) => {
    setIsSaving(true);
    setApiError(null);
    setSaveSuccess(false);

    // 🔒 DATA SANITIZATION: Convert empty strings to null for FastAPI HttpUrl/Optional fields
    const sanitizedPayload = {
      ...data,
      license_number: data.license_number?.trim() || null,
      logo_url: data.logo_url?.trim() || null,
      website: data.website?.trim() || null,
      report_header_text: data.report_header_text?.trim() || null,
      report_footer_text: data.report_footer_text?.trim() || null,
      director_name: data.director_name?.trim() || null,
      director_signature_url: data.director_signature_url?.trim() || null,
      address: {
        ...data.address!,
        street_2: data.address?.street_2?.trim() || null,
      }
    };

    try {
      // Send the sanitized payload to your Axios service
      const updatedLab = await labService.updateLab(labData.id, sanitizedPayload);
      
      // Reset form state with the exact backend response to clear the `isDirty` flag
      reset({
        ...data,
        logo_url: updatedLab.logo_url || "",
        website: updatedLab.website || "",
        director_signature_url: updatedLab.director_signature_url || ""
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000); 
    } catch (error: any) {
      setApiError(error.response?.data?.detail || "Failed to update workspace configuration.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header Area */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Lab Profile & Details</h2>
          <p className="text-xs text-slate-500 mt-1">Manage public-facing info and report compliance metadata.</p>
        </div>
        {saveSuccess && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 size={14} /> Configuration Saved
          </span>
        )}
      </div>

      {apiError && (
        <div className="p-4 bg-red-50 text-red-700 text-sm font-bold rounded-xl border border-red-200">
          {apiError}
        </div>
      )}

      {/* SECTION 1: Core Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-slate-800">
          <Building2 size={18} className="text-blue-600" />
          <h3 className="text-sm font-extrabold uppercase tracking-wider">Core Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Registered Lab Name *</label>
            <input {...register("name")} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            {errors.name && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Support Email *</label>
            <input {...register("support_email")} type="email" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            {errors.support_email && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.support_email.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Contact Phone (E.164) *</label>
            <input {...register("contact_phone")} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="+919876543210" />
            {errors.contact_phone && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.contact_phone.message}</p>}
          </div>
        </div>
      </div>

      {/* SECTION 2: Physical Address */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-slate-800">
          <MapPin size={18} className="text-blue-600" />
          <h3 className="text-sm font-extrabold uppercase tracking-wider">Physical Location</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Primary Street Address *</label>
            <input {...register("address.street_1")} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">City *</label>
            <input {...register("address.city")} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">State / Province *</label>
            <input {...register("address.state")} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Postal Code *</label>
            <input {...register("address.postal_code")} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Country</label>
            <input {...register("address.country")} className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500" readOnly />
          </div>
        </div>
      </div>

      {/* SECTION 3: Branding */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-slate-800">
          <Palette size={18} className="text-blue-600" />
          <h3 className="text-sm font-extrabold uppercase tracking-wider">Branding & Web</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Logo URL (Cloud Storage)</label>
            <input {...register("logo_url")} type="url" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://..." />
            <p className="text-[10px] text-slate-400 mt-1">Leave blank if no logo is configured. Used in report generation.</p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Official Website</label>
            <input {...register("website")} type="url" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://..." />
          </div>
        </div>
      </div>

      {/* SECTION 4: Report Compliance */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-slate-800">
          <FileSignature size={18} className="text-blue-600" />
          <h3 className="text-sm font-extrabold uppercase tracking-wider">Report Compliance & Legals</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">NABL / License Number</label>
            <input {...register("license_number")} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Optional" />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Lab Director / CMO Name</label>
            <input {...register("director_name")} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Dr. Jane Doe, MD" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Director Digital Signature URL</label>
            <input {...register("director_signature_url")} type="url" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://..." />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Custom Report Header Text</label>
            <textarea {...register("report_header_text")} rows={2} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="A Center of Excellence in Diagnostics..." />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Legal Report Footer / Disclaimer</label>
            <textarea {...register("report_footer_text")} rows={3} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="This is a computer-generated report..." />
          </div>
        </div>
      </div>

      {/* Submit Area */}
      <div className="pt-4 flex justify-end sticky bottom-4 bg-white/90 backdrop-blur-md p-4 rounded-xl border border-slate-200 shadow-diffused z-10">
        <button
          type="submit"
          disabled={!isDirty || isSaving}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSaving ? <Loader2 className="animate-spin" size={16} /> : <FileSignature size={16} />}
          {isSaving ? "Synchronizing Data..." : "Save Workspace Configuration"}
        </button>
      </div>
    </form>
  );
}