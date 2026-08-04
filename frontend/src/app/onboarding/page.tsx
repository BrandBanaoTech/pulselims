"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { 
  Building2, ArrowRight, Loader2, HeartPulse, 
  Mail, Smartphone, MapPin, Map, Building, CheckCircle2
} from "lucide-react";

import { labService } from "@/features/labs/api/lab.service";
import { authService } from "@/features/auth/api/auth.service";
import { useAuthStore } from "@/store/useAuthStore";
import { AuthGuard } from "@/features/auth/components/AuthGuard";
import { createLabSchema, CreateLabFormValues } from "@/features/labs/schemas/lab.schema";

// Market-ready country codes for the Phone Dropdown
const countryCodes = [
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+1', flag: '🇺🇸', name: 'United States' },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { setActiveLab } = useAuthStore();
  const [apiError, setApiError] = useState<string | null>(null);

  // Phone Dropdown State
  const [isPhoneOpen, setIsPhoneOpen] = useState(false);
  const [selectedPhoneCountry, setSelectedPhoneCountry] = useState(countryCodes[0]);
  const phoneDropdownRef = useRef<HTMLDivElement>(null);

  // Location Auto-Fetch State
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    clearErrors,
    setError,
    formState: { errors, isSubmitting, isValid },
  } = useForm<CreateLabFormValues>({
    resolver: zodResolver(createLabSchema),
    mode: "onTouched",
    defaultValues: { 
      address: { country: "India" }, // Silently defaults to India
      timezone: "Asia/Kolkata"
    }
  });

  // Close phone dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (phoneDropdownRef.current && !phoneDropdownRef.current.contains(event.target as Node)) {
        setIsPhoneOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ==========================================
  // SMART PIN-CODE AUTO-FETCH (INDIA ONLY)
  // ==========================================
  const handlePincodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const pin = e.target.value.replace(/\D/g, '').slice(0, 6);
    setValue("address.postal_code", pin, { shouldValidate: true });
    setLocationSuccess(false);

    // Auto-fetch if PIN is exactly 6 digits
    if (pin.length === 6) {
      setIsFetchingLocation(true);
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
        const data = await res.json();
        
        if (data && data[0].Status === "Success") {
          const postOffice = data[0].PostOffice[0];
          // Auto-fill fields
          setValue("address.state", postOffice.State, { shouldValidate: true });
          setValue("address.city", postOffice.District, { shouldValidate: true });
          clearErrors(["address.state", "address.city", "address.postal_code"]);
          setLocationSuccess(true);
        } else {
          setError("address.postal_code", { type: "manual", message: "Invalid PIN code." });
          setValue("address.state", "");
          setValue("address.city", "");
        }
      } catch (err) {
        console.error("Location fetch error:", err);
      } finally {
        setIsFetchingLocation(false);
      }
    } else if (pin.length < 6) {
      // Clear auto-filled data if they backspace
      setValue("address.state", "");
      setValue("address.city", "");
    }
  };

  // ==========================================
  // FORM SUBMISSION
  // ==========================================
  const onSubmit = async (data: CreateLabFormValues) => {
    setApiError(null);
    try {
      // 🚀 Combine country code with the raw phone number before submitting
      const payload = {
        ...data,
        contact_phone: `${selectedPhoneCountry.code}${data.contact_phone.trim()}`,
      };

      const newLab = await labService.createLab(payload);

      // Refresh the JWT from FastAPI so the token gets the new Labspace permissions
      await authService.refreshToken(); 

      // Set Active Lab and Unlock Dashboard
      setActiveLab(newLab.name);
      window.location.href = "/dashboard"; 
      
    } catch (error: any) {
      setApiError(error.response?.data?.detail || "Failed to provision Labspace.");
    }
  };

  return (
    <AuthGuard requireActiveLab={false}>
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-teal-100 selection:text-teal-900">
        
        <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-teal-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-xl shadow-teal-500/20 mb-5">
            <HeartPulse className="text-white" size={32} />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Provision Your Labspace</h2>
          <p className="mt-2 text-sm text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
            Create your master clinical workspace to start processing patients and managing diagnostic reports.
          </p>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-xl animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="bg-white py-8 px-6 shadow-2xl shadow-slate-200/50 rounded-3xl sm:px-10 border border-slate-100">
            
            {apiError && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm font-bold rounded-xl border border-red-200 flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-red-600 font-black">!</span>
                </div>
                {apiError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              {/* ================= GENERAL INFO ================= */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Labspace Name <span className="text-red-500">*</span></label>
                <div className={`relative flex items-center rounded-xl border ${errors.name ? 'border-red-300 focus-within:border-red-500 focus-within:ring-red-500/20' : 'border-slate-200 focus-within:border-teal-500 focus-within:ring-teal-500/20'} bg-white transition-all focus-within:ring-2`}>
                  <div className="pl-4 pr-2 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-slate-400" />
                  </div>
                  <input 
                    {...register("name")} 
                    className="w-full py-3.5 pr-4 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none" 
                    placeholder="e.g. Apex Diagnostics Center" 
                  />
                </div>
                {errors.name && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Support Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Support Email <span className="text-red-500">*</span></label>
                  <div className={`relative flex items-center rounded-xl border ${errors.support_email ? 'border-red-300 focus-within:ring-red-500/20' : 'border-slate-200 focus-within:border-teal-500 focus-within:ring-teal-500/20'} bg-white transition-all focus-within:ring-2`}>
                    <div className="pl-4 pr-2 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-400" />
                    </div>
                    <input 
                      {...register("support_email")} 
                      type="email" 
                      className="w-full py-3.5 pr-4 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none" 
                      placeholder="lab@example.com" 
                    />
                  </div>
                  {errors.support_email && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.support_email.message}</p>}
                </div>

                {/* 🚀 Phone Number with Country Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Contact Phone <span className="text-red-500">*</span></label>
                  <div className={`relative flex items-center rounded-xl border ${errors.contact_phone ? 'border-red-300 focus-within:ring-red-500/20' : 'border-slate-200 focus-within:border-teal-500 focus-within:ring-teal-500/20'} bg-white transition-all focus-within:ring-2`}>
                    <div className="pl-4 pr-1 flex items-center pointer-events-none">
                      <Smartphone className="h-5 w-5 text-slate-400" />
                    </div>
                    
                    <div ref={phoneDropdownRef} className="relative flex h-full">
                      <button
                        type="button"
                        onClick={() => setIsPhoneOpen(!isPhoneOpen)}
                        className="flex items-center gap-1.5 h-full py-3.5 pl-1 pr-2 bg-transparent border-r border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none"
                      >
                        <span>{selectedPhoneCountry.flag}</span>
                        <span className="text-slate-600 text-xs">({selectedPhoneCountry.code})</span>
                      </button>
                      
                      {isPhoneOpen && (
                        <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden py-1.5">
                          <ul className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                            {countryCodes.map((c, i) => (
                              <li key={i}>
                                <button
                                  type="button"
                                  onClick={() => { setSelectedPhoneCountry(c); setIsPhoneOpen(false); }}
                                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm transition-colors ${
                                    selectedPhoneCountry.code === c.code ? "bg-teal-50 text-teal-700 font-semibold" : "text-slate-600 hover:bg-teal-50"
                                  }`}
                                >
                                  <div className="flex items-center gap-2"><span>{c.flag}</span><span>{c.name}</span></div>
                                  <span className="text-slate-400 text-xs">{c.code}</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <input 
                      {...register("contact_phone")} 
                      type="tel" 
                      className="w-full pl-3 pr-4 py-3.5 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none" 
                      placeholder="9876543210" 
                    />
                  </div>
                  {errors.contact_phone && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.contact_phone.message}</p>}
                </div>
              </div>

              {/* ================= LOCATION VERIFICATION ================= */}
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <MapPin size={16} className="text-teal-600" /> Location Verification
                </h3>
                
                <div className="space-y-5">
                  
                  {/* Street Address */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Street Address <span className="text-red-500">*</span></label>
                    <div className={`relative flex items-center rounded-xl border ${errors.address?.street_1 ? 'border-red-300 focus-within:ring-red-500/20' : 'border-slate-200 focus-within:border-teal-500 focus-within:ring-teal-500/20'} bg-white transition-all focus-within:ring-2`}>
                      <div className="pl-4 pr-2 flex items-center pointer-events-none">
                        <Building className="h-5 w-5 text-slate-400" />
                      </div>
                      <input 
                        {...register("address.street_1")} 
                        className="w-full py-3.5 pr-4 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none" 
                        placeholder="Suite, Building, Street..." 
                      />
                    </div>
                    {errors.address?.street_1 && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.address.street_1.message}</p>}
                  </div>
                  
                  {/* 🚀 Compact Grid: City, State, Pin */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    
                    {/* City */}
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">City <span className="text-red-500">*</span></label>
                      <div className={`relative flex items-center rounded-xl border ${errors.address?.city ? 'border-red-300 focus-within:ring-red-500/20' : 'border-slate-200 focus-within:border-teal-500 focus-within:ring-teal-500/20'} ${locationSuccess ? 'bg-teal-50/30' : 'bg-white'} transition-all focus-within:ring-2`}>
                        <div className="pl-3 pr-1.5 flex items-center pointer-events-none">
                          <MapPin className={`h-4 w-4 ${locationSuccess ? 'text-teal-600' : 'text-slate-400'}`} />
                        </div>
                        <input 
                          {...register("address.city")} 
                          className="w-full py-3 pr-3 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none" 
                          placeholder="City" 
                        />
                      </div>
                      {errors.address?.city && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.address.city.message}</p>}
                    </div>

                    {/* State */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">State <span className="text-red-500">*</span></label>
                      <div className={`relative flex items-center rounded-xl border ${errors.address?.state ? 'border-red-300 focus-within:ring-red-500/20' : 'border-slate-200 focus-within:border-teal-500 focus-within:ring-teal-500/20'} ${locationSuccess ? 'bg-teal-50/30' : 'bg-white'} transition-all focus-within:ring-2`}>
                        <div className="pl-3 pr-1.5 flex items-center pointer-events-none">
                          <Map className={`h-4 w-4 ${locationSuccess ? 'text-teal-600' : 'text-slate-400'}`} />
                        </div>
                        <input 
                          {...register("address.state")} 
                          className="w-full py-3 pr-3 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none" 
                          placeholder="State" 
                        />
                      </div>
                      {errors.address?.state && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.address.state.message}</p>}
                    </div>

                    {/* PIN Code */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Pin Code <span className="text-red-500">*</span></label>
                      <div className={`relative flex items-center rounded-xl border ${errors.address?.postal_code ? 'border-red-300 focus-within:ring-red-500/20' : 'border-slate-200 focus-within:border-teal-500 focus-within:ring-teal-500/20'} bg-white transition-all focus-within:ring-2`}>
                        <div className="pl-3 pr-1.5 flex items-center pointer-events-none">
                          {isFetchingLocation ? <Loader2 className="h-4 w-4 text-teal-600 animate-spin" /> : <MapPin className="h-4 w-4 text-slate-400" />}
                        </div>
                        <input 
                          {...register("address.postal_code")} 
                          onChange={handlePincodeChange}
                          maxLength={6}
                          className="w-full py-3 pr-3 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none" 
                          placeholder="e.g. 110001" 
                        />
                        {locationSuccess && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />}
                      </div>
                      {errors.address?.postal_code && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.address.postal_code.message}</p>}
                    </div>

                  </div>
                </div>
              </div>

              {/* ================= SUBMIT ================= */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting || !isValid || isFetchingLocation}
                  className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-teal-500/30 text-sm font-extrabold text-white bg-teal-600 hover:bg-teal-700 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <><Loader2 className="animate-spin" size={18} /> Provisioning Environment...</>
                  ) : (
                    <>Initialize Labspace <ArrowRight size={18} /></>
                  )}
                </button>
                <p className="text-center text-[11px] font-semibold text-slate-400 mt-4 uppercase tracking-wider">
                  AES-256 Encrypted & HIPAA Compliant
                </p>
              </div>

            </form>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}