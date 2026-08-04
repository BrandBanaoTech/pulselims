"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { labUpdateSchema, LabUpdateValues } from "../schemas/labUpdate.schema";
import { labService, LabResponse } from "../api/lab.service";
import { 
  Loader2, CheckCircle2, Building2, MapPin, Palette, FileSignature, 
  Mail, Smartphone, Globe, Building, Link2, ImageIcon, Award, 
  FileText, UserCircle, PenTool, AlertCircle
} from "lucide-react";

// Market-ready country codes
const countryCodes = [
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+1', flag: '🇺🇸', name: 'United States' },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
];

const globalCountries = ["India", "United States", "United Kingdom", "Australia", "UAE", "Canada", "Singapore"];

interface LabProfileTabProps {
  labData: LabResponse;
}

export function LabProfileTab({ labData }: LabProfileTabProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // --- Phone Dropdown Logic ---
  const initialMatchedCountry = countryCodes.find(c => labData.contact_phone?.startsWith(c.code)) || countryCodes[0];
  const initialLocalPhone = labData.contact_phone?.replace(initialMatchedCountry.code, "") || "";

  const [isPhoneOpen, setIsPhoneOpen] = useState(false);
  const [selectedPhoneCountry, setSelectedPhoneCountry] = useState(initialMatchedCountry);
  const phoneDropdownRef = useRef<HTMLDivElement>(null);

  // --- Location Auto-Fetch State ---
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);

  // --- Image Preview Error States ---
  const [logoError, setLogoError] = useState(false);
  const [signatureError, setSignatureError] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    clearErrors,
    setError,
    formState: { errors, isDirty },
    reset
  } = useForm<LabUpdateValues>({
    resolver: zodResolver(labUpdateSchema),
    defaultValues: {
      name: labData.name,
      license_number: labData.license_number || "",
      support_email: labData.support_email,
      contact_phone: initialLocalPhone, 
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

  const selectedCountry = watch("address.country");
  const watchLogoUrl = watch("logo_url");
  const watchSignatureUrl = watch("director_signature_url");

  // Reset image error states when URLs change
  useEffect(() => setLogoError(false), [watchLogoUrl]);
  useEffect(() => setSignatureError(false), [watchSignatureUrl]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (phoneDropdownRef.current && !phoneDropdownRef.current.contains(event.target as Node)) {
        setIsPhoneOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Smart Pin Code Fetcher ---
  const handlePincodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const pin = e.target.value.replace(/\D/g, '').slice(0, 6);
    setValue("address.postal_code", pin, { shouldValidate: true, shouldDirty: true });
    setLocationSuccess(false);

    if (pin.length === 6 && selectedCountry === "India") {
      setIsFetchingLocation(true);
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
        const data = await res.json();
        
        if (data && data[0].Status === "Success") {
          const postOffice = data[0].PostOffice[0];
          setValue("address.state", postOffice.State, { shouldValidate: true, shouldDirty: true });
          setValue("address.city", postOffice.District, { shouldValidate: true, shouldDirty: true });
          clearErrors(["address.state", "address.city", "address.postal_code"]);
          setLocationSuccess(true);
        } else {
          setError("address.postal_code", { type: "manual", message: "Invalid PIN code." });
        }
      } catch (err) {
        console.error("Location fetch error:", err);
      } finally {
        setIsFetchingLocation(false);
      }
    }
  };

  // --- Form Submission ---
  const onSubmit = async (data: LabUpdateValues) => {
    setIsSaving(true);
    setApiError(null);
    setSaveSuccess(false);

    const fullPhone = `${selectedPhoneCountry.code}${data.contact_phone?.trim()}`;

    const sanitizedPayload = {
      ...data,
      contact_phone: fullPhone,
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
      const updatedLab = await labService.updateLab(labData.name, sanitizedPayload);
      
      const returnedMatchedCountry = countryCodes.find(c => updatedLab.contact_phone?.startsWith(c.code)) || selectedPhoneCountry;
      const returnedLocalPhone = updatedLab.contact_phone?.replace(returnedMatchedCountry.code, "") || "";

      reset({
        ...data,
        contact_phone: returnedLocalPhone,
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
    <form onSubmit={handleSubmit(onSubmit)} className="relative animate-in fade-in duration-500 space-y-10">
      
      {apiError && (
        <div className="p-4 bg-red-50 text-red-700 text-sm font-bold rounded-2xl border border-red-200 flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
            <AlertCircle size={18} className="text-red-600" />
          </div>
          {apiError}
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 1: Core Information                                    */}
      {/* ============================================================== */}
      <section id="section-core" className="scroll-mt-40 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50/50 border-b border-slate-100 px-6 py-4 flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-200">
            <Building2 size={18} className="text-slate-700" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight">Core Information</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Basic Workspace Details</p>
          </div>
        </div>
        
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Registered Lab Name <span className="text-red-500">*</span></label>
            <div className={`relative flex items-center rounded-xl border ${errors.name ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'} transition-all focus-within:ring-4 focus-within:ring-teal-500/10 focus-within:border-teal-500 shadow-sm`}>
              <div className="pl-4 pr-2 flex items-center pointer-events-none">
                <Building2 className="h-5 w-5 text-slate-400" />
              </div>
              <input {...register("name")} className="w-full py-3.5 pr-4 bg-transparent text-sm font-bold text-slate-900 placeholder:text-slate-400 outline-none" />
            </div>
            {errors.name && <p className="text-red-500 text-[10px] mt-1.5 font-bold">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Support Email <span className="text-red-500">*</span></label>
            <div className={`relative flex items-center rounded-xl border ${errors.support_email ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'} transition-all focus-within:ring-4 focus-within:ring-teal-500/10 focus-within:border-teal-500 shadow-sm`}>
              <div className="pl-4 pr-2 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input {...register("support_email")} type="email" className="w-full py-3.5 pr-4 bg-transparent text-sm font-bold text-slate-900 outline-none" />
            </div>
            {errors.support_email && <p className="text-red-500 text-[10px] mt-1.5 font-bold">{errors.support_email.message}</p>}
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Contact Phone <span className="text-red-500">*</span></label>
            <div className={`relative flex items-center rounded-xl border ${errors.contact_phone ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'} transition-all focus-within:ring-4 focus-within:ring-teal-500/10 focus-within:border-teal-500 shadow-sm`}>
              <div className="pl-4 pr-1 flex items-center pointer-events-none">
                <Smartphone className="h-5 w-5 text-slate-400" />
              </div>
              
              <div ref={phoneDropdownRef} className="relative flex h-full">
                <button type="button" onClick={() => setIsPhoneOpen(!isPhoneOpen)} className="flex items-center gap-1.5 h-full py-3 pl-1 pr-2 bg-transparent border-r border-slate-200 text-sm font-extrabold text-slate-700 hover:text-slate-900 outline-none transition-colors">
                  <span>{selectedPhoneCountry.flag}</span>
                  <span className="text-slate-500 text-xs">({selectedPhoneCountry.code})</span>
                </button>
                {isPhoneOpen && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden py-1.5 animate-in fade-in zoom-in-95">
                    <ul className="max-h-60 overflow-y-auto no-scrollbar">
                      {countryCodes.map((c, i) => (
                        <li key={i}>
                          <button type="button" onClick={() => { setSelectedPhoneCountry(c); setIsPhoneOpen(false); }} className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${selectedPhoneCountry.code === c.code ? "bg-slate-100 text-slate-900 font-bold" : "text-slate-600 hover:bg-slate-50 font-semibold"}`}>
                            <div className="flex items-center gap-2"><span>{c.flag}</span><span>{c.name}</span></div>
                            <span className="text-slate-400 text-xs">{c.code}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <input {...register("contact_phone")} type="tel" className="w-full pl-3 pr-4 py-3.5 bg-transparent text-sm font-bold text-slate-900 outline-none rounded-r-xl" placeholder="9876543210" />
            </div>
            {errors.contact_phone && <p className="text-red-500 text-[10px] mt-1.5 font-bold">{errors.contact_phone.message}</p>}
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* SECTION 2: Physical Address & Auto-fill                        */}
      {/* ============================================================== */}
      <section id="section-location" className="scroll-mt-40 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50/50 border-b border-slate-100 px-6 py-4 flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-200">
            <MapPin size={18} className="text-slate-700" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight">Location & Address</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Physical Hub Location</p>
          </div>
        </div>
        
        <div className="p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Pin / Zip Code <span className="text-red-500">*</span></label>
              <div className={`relative flex items-center rounded-xl border ${errors.address?.postal_code ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'} transition-all focus-within:ring-4 focus-within:ring-teal-500/10 focus-within:border-teal-500 shadow-sm`}>
                <div className="pl-4 pr-2 flex items-center pointer-events-none">
                  {isFetchingLocation ? <Loader2 className="h-5 w-5 text-teal-600 animate-spin" /> : <MapPin className="h-5 w-5 text-slate-400" />}
                </div>
                <input 
                  {...register("address.postal_code")} 
                  onChange={handlePincodeChange}
                  maxLength={6}
                  placeholder="e.g. 110001"
                  className="w-full py-3.5 pr-4 bg-transparent text-sm font-bold text-slate-900 outline-none" 
                />
                {locationSuccess && <CheckCircle2 className="absolute right-4 h-5 w-5 text-emerald-500" />}
              </div>
              {errors.address?.postal_code && <p className="text-red-500 text-[10px] mt-1.5 font-bold">{errors.address.postal_code.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">City <span className="text-red-500">*</span></label>
                <div className={`relative flex items-center rounded-xl border ${errors.address?.city ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'} transition-all focus-within:ring-4 focus-within:ring-teal-500/10 focus-within:border-teal-500 shadow-sm`}>
                  <input {...register("address.city")} className="w-full py-3.5 px-4 bg-transparent text-sm font-bold text-slate-900 outline-none" placeholder="City" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">State <span className="text-red-500">*</span></label>
                <div className={`relative flex items-center rounded-xl border ${errors.address?.state ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'} transition-all focus-within:ring-4 focus-within:ring-teal-500/10 focus-within:border-teal-500 shadow-sm`}>
                  <input {...register("address.state")} className="w-full py-3.5 px-4 bg-transparent text-sm font-bold text-slate-900 outline-none" placeholder="State" />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Primary Street Address <span className="text-red-500">*</span></label>
            <div className={`relative flex items-center rounded-xl border ${errors.address?.street_1 ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'} transition-all focus-within:ring-4 focus-within:ring-teal-500/10 focus-within:border-teal-500 shadow-sm`}>
              <div className="pl-4 pr-2 flex items-center pointer-events-none">
                <Building className="h-5 w-5 text-slate-400" />
              </div>
              <input {...register("address.street_1")} className="w-full py-3.5 pr-4 bg-transparent text-sm font-bold text-slate-900 outline-none" placeholder="Suite, Building, Street..." />
            </div>
            {errors.address?.street_1 && <p className="text-red-500 text-[10px] mt-1.5 font-bold">{errors.address.street_1.message}</p>}
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Country <span className="text-red-500">*</span></label>
            <div className="relative flex items-center rounded-xl border border-slate-200 bg-white focus-within:ring-4 focus-within:ring-teal-500/10 focus-within:border-teal-500 transition-all w-full md:w-1/2 shadow-sm">
              <div className="pl-4 pr-2 flex items-center pointer-events-none">
                <Globe className="h-5 w-5 text-slate-400" />
              </div>
              <select {...register("address.country")} className="w-full py-3.5 pr-8 bg-transparent text-sm font-bold text-slate-900 outline-none cursor-pointer appearance-none">
                {globalCountries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* SECTION 3: Branding & Live Previews                            */}
      {/* ============================================================== */}
      <section id="section-branding" className="scroll-mt-40 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50/50 border-b border-slate-100 px-6 py-4 flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-200">
            <Palette size={18} className="text-slate-700" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight">Branding & Assets</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Logos & Web Presence</p>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          
          {/* Logo Input with Live Preview */}
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center bg-slate-50 overflow-hidden shrink-0 shadow-inner relative group">
              {watchLogoUrl && !logoError ? (
                <img 
                  src={watchLogoUrl} 
                  alt="Logo Preview" 
                  onError={() => setLogoError(true)} 
                  className="w-full h-full object-contain p-2 animate-in fade-in zoom-in-95" 
                />
              ) : (
                <>
                  <ImageIcon className="text-slate-300 mb-1" size={24} />
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Logo</span>
                </>
              )}
            </div>
            
            <div className="flex-1 w-full">
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Logo URL (Cloud Storage)</label>
              <div className="relative flex items-center rounded-xl border border-slate-200 bg-white transition-all focus-within:ring-4 focus-within:ring-teal-500/10 focus-within:border-teal-500 shadow-sm">
                <div className="pl-4 pr-2 flex items-center pointer-events-none">
                  <Link2 className="h-5 w-5 text-slate-400" />
                </div>
                <input {...register("logo_url")} type="url" className="w-full py-3.5 pr-4 bg-transparent text-sm font-bold text-slate-900 placeholder:text-slate-300 outline-none" placeholder="https://storage.provider.com/logo.png" />
              </div>
              <p className="text-[11px] font-semibold text-slate-400 mt-2">Leave blank if no logo is configured. Used in PDF report generation headers.</p>
            </div>
          </div>

          <div className="w-full h-px bg-slate-100"></div>

          {/* Website */}
          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Official Website</label>
            <div className="relative flex items-center rounded-xl border border-slate-200 bg-white transition-all focus-within:ring-4 focus-within:ring-teal-500/10 focus-within:border-teal-500 shadow-sm">
              <div className="pl-4 pr-2 flex items-center pointer-events-none">
                <Globe className="h-5 w-5 text-slate-400" />
              </div>
              <input {...register("website")} type="url" className="w-full py-3.5 pr-4 bg-transparent text-sm font-bold text-slate-900 placeholder:text-slate-300 outline-none" placeholder="https://www.yourlab.com" />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* SECTION 4: Compliance & Digital Signature                      */}
      {/* ============================================================== */}
      <section id="section-compliance" className="scroll-mt-40 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50/50 border-b border-slate-100 px-6 py-4 flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-200">
            <FileSignature size={18} className="text-slate-700" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight">Compliance & Signatures</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Medical Council Standards</p>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">NABL / License Number</label>
              <div className="relative flex items-center rounded-xl border border-slate-200 bg-white transition-all focus-within:ring-4 focus-within:ring-teal-500/10 focus-within:border-teal-500 shadow-sm">
                <div className="pl-4 pr-2 flex items-center pointer-events-none">
                  <Award className="h-5 w-5 text-slate-400" />
                </div>
                <input {...register("license_number")} className="w-full py-3.5 pr-4 bg-transparent text-sm font-bold text-slate-900 placeholder:text-slate-300 outline-none" placeholder="Optional License No." />
              </div>
            </div>
            
            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Lab Director / CMO Name</label>
              <div className="relative flex items-center rounded-xl border border-slate-200 bg-white transition-all focus-within:ring-4 focus-within:ring-teal-500/10 focus-within:border-teal-500 shadow-sm">
                <div className="pl-4 pr-2 flex items-center pointer-events-none">
                  <UserCircle className="h-5 w-5 text-slate-400" />
                </div>
                <input {...register("director_name")} className="w-full py-3.5 pr-4 bg-transparent text-sm font-bold text-slate-900 placeholder:text-slate-300 outline-none" placeholder="e.g. Dr. Jane Doe, MD" />
              </div>
            </div>
          </div>

          {/* Signature Input with Live Preview */}
          <div className="flex flex-col md:flex-row gap-6 items-start p-5 bg-slate-50 rounded-2xl border border-slate-200/60">
            <div className="w-full md:w-48 h-20 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center bg-white overflow-hidden shrink-0 shadow-inner relative">
              {watchSignatureUrl && !signatureError ? (
                <img 
                  src={watchSignatureUrl} 
                  alt="Signature Preview" 
                  onError={() => setSignatureError(true)} 
                  className="w-full h-full object-contain p-2 animate-in fade-in zoom-in-95" 
                />
              ) : (
                <>
                  <PenTool className="text-slate-300 mb-1" size={20} />
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Signature</span>
                </>
              )}
            </div>
            
            <div className="flex-1 w-full">
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Digital Signature URL</label>
              <div className="relative flex items-center rounded-xl border border-slate-200 bg-white transition-all focus-within:ring-4 focus-within:ring-teal-500/10 focus-within:border-teal-500 shadow-sm">
                <div className="pl-4 pr-2 flex items-center pointer-events-none">
                  <Link2 className="h-5 w-5 text-slate-400" />
                </div>
                <input {...register("director_signature_url")} type="url" className="w-full py-3.5 pr-4 bg-transparent text-sm font-bold text-slate-900 placeholder:text-slate-300 outline-none" placeholder="https://storage.provider.com/signature.png" />
              </div>
              <p className="text-[11px] font-semibold text-slate-400 mt-2">Appended to the bottom of all verified clinical reports.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Custom Report Header Text</label>
              <div className="relative rounded-xl border border-slate-200 bg-white transition-all focus-within:ring-4 focus-within:ring-teal-500/10 focus-within:border-teal-500 flex shadow-sm">
                <div className="pl-4 pt-3.5 pr-2 pointer-events-none">
                  <FileText className="h-5 w-5 text-slate-400" />
                </div>
                <textarea {...register("report_header_text")} rows={3} className="w-full py-3.5 pr-4 bg-transparent text-sm font-bold text-slate-900 placeholder:text-slate-300 outline-none resize-none leading-relaxed" placeholder="A Center of Excellence in Diagnostics..." />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Legal Footer / Disclaimer</label>
              <div className="relative rounded-xl border border-slate-200 bg-white transition-all focus-within:ring-4 focus-within:ring-teal-500/10 focus-within:border-teal-500 flex shadow-sm">
                <div className="pl-4 pt-3.5 pr-2 pointer-events-none">
                  <FileText className="h-5 w-5 text-slate-400" />
                </div>
                <textarea {...register("report_footer_text")} rows={3} className="w-full py-3.5 pr-4 bg-transparent text-sm font-bold text-slate-900 placeholder:text-slate-300 outline-none resize-none leading-relaxed" placeholder="This is a computer-generated report. Please consult your physician..." />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* FLOATING ACTION BAR (Sticky Footer)                            */}
      {/* ============================================================== */}
      {isDirty ? (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 p-2.5 rounded-2xl shadow-2xl z-50 flex items-center justify-between transition-all duration-300">
        <div className="flex items-center gap-3 px-4">
          {saveSuccess ? (
            <div className="flex items-center gap-2 text-emerald-400 animate-in fade-in slide-in-from-left-2">
              <CheckCircle2 size={18} strokeWidth={3} />
              <span className="text-sm font-black tracking-wide">Saved successfully</span>
            </div>
          ) : (
            <p className="text-sm font-bold text-slate-300">
              {isDirty ? "Unsaved changes detected" : "Configuration is up to date"}
            </p>
          )}
        </div>
        
        <button
          type="submit"
          disabled={!isDirty || isSaving}
          className="px-6 py-2.5 bg-white text-slate-900 hover:bg-slate-200 text-sm font-black rounded-xl shadow-lg transition-all disabled:opacity-30 disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none flex items-center gap-2 outline-none"
        >
          {isSaving ? <Loader2 className="animate-spin" size={18} /> : <FileSignature size={18} strokeWidth={2.5} />}
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    )      : null}
    </form>
  );
}

// "use client";

// import { useState } from "react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { labUpdateSchema, LabUpdateValues } from "../schemas/labUpdate.schema";
// import { labService, LabResponse } from "../api/lab.service";
// import { Loader2, CheckCircle2, Building2, MapPin, Palette, FileSignature } from "lucide-react";

// interface LabProfileTabProps {
//   labData: LabResponse;
// }

// export function LabProfileTab({ labData }: LabProfileTabProps) {
//   const [isSaving, setIsSaving] = useState(false);
//   const [saveSuccess, setSaveSuccess] = useState(false);
//   const [apiError, setApiError] = useState<string | null>(null);

//   const {
//     register,
//     handleSubmit,
//     formState: { errors, isDirty },
//     reset
//   } = useForm<LabUpdateValues>({
//     resolver: zodResolver(labUpdateSchema),
//     // Fallback optional nulls to "" to prevent React "uncontrolled input" warnings
//     defaultValues: {
//       name: labData.name,
//       license_number: labData.license_number || "",
//       support_email: labData.support_email,
//       contact_phone: labData.contact_phone,
//       timezone: labData.timezone,
      
//       address: {
//         street_1: labData.address.street_1,
//         street_2: labData.address.street_2 || "",
//         city: labData.address.city,
//         state: labData.address.state,
//         postal_code: labData.address.postal_code,
//         country: labData.address.country,
//       },

//       logo_url: labData.logo_url || "",
//       website: labData.website || "",
//       report_header_text: labData.report_header_text || "",
//       report_footer_text: labData.report_footer_text || "",
//       director_name: labData.director_name || "",
//       director_signature_url: labData.director_signature_url || "",
//     },
//   });

//   const onSubmit = async (data: LabUpdateValues) => {
//     setIsSaving(true);
//     setApiError(null);
//     setSaveSuccess(false);

//     // 🔒 DATA SANITIZATION: Convert empty strings to null for FastAPI HttpUrl/Optional fields
//     const sanitizedPayload = {
//       ...data,
//       license_number: data.license_number?.trim() || null,
//       logo_url: data.logo_url?.trim() || null,
//       website: data.website?.trim() || null,
//       report_header_text: data.report_header_text?.trim() || null,
//       report_footer_text: data.report_footer_text?.trim() || null,
//       director_name: data.director_name?.trim() || null,
//       director_signature_url: data.director_signature_url?.trim() || null,
//       address: {
//         ...data.address!,
//         street_2: data.address?.street_2?.trim() || null,
//       }
//     };

//     try {
//       // Send the sanitized payload to your Axios service
//       const updatedLab = await labService.updateLab(labData.id, sanitizedPayload);
      
//       // Reset form state with the exact backend response to clear the `isDirty` flag
//       reset({
//         ...data,
//         logo_url: updatedLab.logo_url || "",
//         website: updatedLab.website || "",
//         director_signature_url: updatedLab.director_signature_url || ""
//       });

//       setSaveSuccess(true);
//       setTimeout(() => setSaveSuccess(false), 4000); 
//     } catch (error: any) {
//       setApiError(error.response?.data?.detail || "Failed to update workspace configuration.");
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-in fade-in duration-300">
      
//       {/* Header Area */}
//       <div className="flex items-center justify-between border-b border-slate-100 pb-4">
//         <div>
//           <h2 className="text-lg font-bold text-slate-900">Lab Profile & Details</h2>
//           <p className="text-xs text-slate-500 mt-1">Manage public-facing info and report compliance metadata.</p>
//         </div>
//         {saveSuccess && (
//           <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 animate-in fade-in slide-in-from-top-2">
//             <CheckCircle2 size={14} /> Configuration Saved
//           </span>
//         )}
//       </div>

//       {apiError && (
//         <div className="p-4 bg-red-50 text-red-700 text-sm font-bold rounded-xl border border-red-200">
//           {apiError}
//         </div>
//       )}

//       {/* SECTION 1: Core Information */}
//       <div className="space-y-4">
//         <div className="flex items-center gap-2 text-slate-800">
//           <Building2 size={18} className="text-blue-600" />
//           <h3 className="text-sm font-extrabold uppercase tracking-wider">Core Information</h3>
//         </div>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
//           <div className="md:col-span-2">
//             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Registered Lab Name *</label>
//             <input {...register("name")} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
//             {errors.name && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.name.message}</p>}
//           </div>
//           <div>
//             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Support Email *</label>
//             <input {...register("support_email")} type="email" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
//             {errors.support_email && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.support_email.message}</p>}
//           </div>
//           <div>
//             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Contact Phone (E.164) *</label>
//             <input {...register("contact_phone")} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="+919876543210" />
//             {errors.contact_phone && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.contact_phone.message}</p>}
//           </div>
//         </div>
//       </div>

//       {/* SECTION 2: Physical Address */}
//       <div className="space-y-4">
//         <div className="flex items-center gap-2 text-slate-800">
//           <MapPin size={18} className="text-blue-600" />
//           <h3 className="text-sm font-extrabold uppercase tracking-wider">Physical Location</h3>
//         </div>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
//           <div className="md:col-span-2">
//             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Primary Street Address *</label>
//             <input {...register("address.street_1")} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
//           </div>
//           <div>
//             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">City *</label>
//             <input {...register("address.city")} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
//           </div>
//           <div>
//             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">State / Province *</label>
//             <input {...register("address.state")} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
//           </div>
//           <div>
//             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Postal Code *</label>
//             <input {...register("address.postal_code")} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
//           </div>
//           <div>
//             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Country</label>
//             <input {...register("address.country")} className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500" readOnly />
//           </div>
//         </div>
//       </div>

//       {/* SECTION 3: Branding */}
//       <div className="space-y-4">
//         <div className="flex items-center gap-2 text-slate-800">
//           <Palette size={18} className="text-blue-600" />
//           <h3 className="text-sm font-extrabold uppercase tracking-wider">Branding & Web</h3>
//         </div>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
//           <div className="md:col-span-2">
//             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Logo URL (Cloud Storage)</label>
//             <input {...register("logo_url")} type="url" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://..." />
//             <p className="text-[10px] text-slate-400 mt-1">Leave blank if no logo is configured. Used in report generation.</p>
//           </div>
//           <div className="md:col-span-2">
//             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Official Website</label>
//             <input {...register("website")} type="url" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://..." />
//           </div>
//         </div>
//       </div>

//       {/* SECTION 4: Report Compliance */}
//       <div className="space-y-4">
//         <div className="flex items-center gap-2 text-slate-800">
//           <FileSignature size={18} className="text-blue-600" />
//           <h3 className="text-sm font-extrabold uppercase tracking-wider">Report Compliance & Legals</h3>
//         </div>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
//           <div>
//             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">NABL / License Number</label>
//             <input {...register("license_number")} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Optional" />
//           </div>
          
//           <div>
//             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Lab Director / CMO Name</label>
//             <input {...register("director_name")} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Dr. Jane Doe, MD" />
//           </div>

//           <div className="md:col-span-2">
//             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Director Digital Signature URL</label>
//             <input {...register("director_signature_url")} type="url" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://..." />
//           </div>

//           <div className="md:col-span-2">
//             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Custom Report Header Text</label>
//             <textarea {...register("report_header_text")} rows={2} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="A Center of Excellence in Diagnostics..." />
//           </div>

//           <div className="md:col-span-2">
//             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Legal Report Footer / Disclaimer</label>
//             <textarea {...register("report_footer_text")} rows={3} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="This is a computer-generated report..." />
//           </div>
//         </div>
//       </div>

//       {/* Submit Area */}
//       <div className="pt-4 flex justify-end sticky bottom-4 bg-white/90 backdrop-blur-md p-4 rounded-xl border border-slate-200 shadow-diffused z-10">
//         <button
//           type="submit"
//           disabled={!isDirty || isSaving}
//           className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
//         >
//           {isSaving ? <Loader2 className="animate-spin" size={16} /> : <FileSignature size={16} />}
//           {isSaving ? "Synchronizing Data..." : "Save Workspace Configuration"}
//         </button>
//       </div>
//     </form>
//   );
// }