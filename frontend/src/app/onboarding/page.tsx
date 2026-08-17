"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { 
  Building2, ArrowRight, Loader2, HeartPulse, 
  Mail, Smartphone, MapPin, Map, Building, CheckCircle2,
  ShieldCheck, AlertCircle, Lock, ChevronDown, Globe, LocateFixed, Navigation
} from "lucide-react";

import { labService } from "@/features/labs/api/lab.service";
import { authService } from "@/features/auth/api/auth.service";
import { useAuthStore } from "@/store/useAuthStore";
import { AuthGuard } from "@/features/auth/components/AuthGuard";
import { createLabSchema, CreateLabFormValues } from "@/features/labs/schemas/lab.schema";
import { toast } from "@/lib/toast";

// Market-ready country codes for the Phone Dropdown
const countryCodes = [
  { code: '+91', flag: '🇮🇳', name: 'India', regex: /^[6-9]\d{9}$/, placeholder: '98765 43210' },
  { code: '+1', flag: '🇺🇸', name: 'United States', regex: /^[2-9]\d{9}$/, placeholder: '202 555 0123' },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom', regex: /^7\d{9}$/, placeholder: '7911 123456' },
  { code: '+61', flag: '🇦🇺', name: 'Australia', regex: /^4\d{8}$/, placeholder: '412 345 678' },
  { code: '+971', flag: '🇦🇪', name: 'UAE', regex: /^5\d{8}$/, placeholder: '50 123 4567' },
];

const SUPPORTED_COUNTRIES = ["India", "United States", "United Kingdom", "Australia", "UAE"];

const DISPOSABLE_EMAIL_DOMAINS = [
  "mailinator.com", "tempmail.com", "yopmail.com", "10minutemail.com",
  "guerrillamail.com", "trashmail.com", "test.com", "example.com", "fake.com"
];

const FAKE_PHONE_PATTERNS = ["0000000000", "1234567890", "9999999999", "8888888888"];

export default function OnboardingPage() {
  const router = useRouter();
  const { setActiveLab } = useAuthStore();
  // const setAuth = useAuthStore((state) => state.setAuth);
  const [apiError, setApiError] = useState<string | null>(null);

  // Phone Dropdown State
  const [isPhoneOpen, setIsPhoneOpen] = useState(false);
  const [selectedPhoneCountry, setSelectedPhoneCountry] = useState(countryCodes[0]);
  const phoneDropdownRef = useRef<HTMLDivElement>(null);

  // Smart Location & GPS State
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [isGpsLocating, setIsGpsLocating] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);
  
  // Strict Locality Assembly State
  const [verifiedLocalities, setVerifiedLocalities] = useState<string[]>([]);
  const [selectedLocality, setSelectedLocality] = useState("");
  const [buildingInput, setBuildingInput] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    clearErrors,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateLabFormValues>({
    resolver: zodResolver(createLabSchema),
    mode: "onChange",
    defaultValues: { 
      address: { country: "India", state: "", city: "", postal_code: "", street_1: "" },
      timezone: "Asia/Kolkata"
    }
  });

  const selectedCountry = watch("address.country");
  const isIndia = selectedCountry === "India";

  // Sync Phone Country & Reset Location Locks when Country changes
  useEffect(() => {
    const matchedPhone = countryCodes.find(c => c.name === selectedCountry);
    if (matchedPhone) setSelectedPhoneCountry(matchedPhone);
    resetLocationLocks();
  }, [selectedCountry, setValue]);

  // 🚀 FIX: Sync Custom Building Input with React Hook Form (So Zod Validation Passes)
  useEffect(() => {
    const assembledStreet = isIndia && locationSuccess && selectedLocality
      ? `${buildingInput.trim()}, ${selectedLocality}`
      : buildingInput.trim();
    
    setValue("address.street_1", assembledStreet, { shouldValidate: buildingInput.length > 0 });
  }, [buildingInput, selectedLocality, isIndia, locationSuccess, setValue]);

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

  const resetLocationLocks = () => {
    setLocationSuccess(false);
    setVerifiedLocalities([]);
    setSelectedLocality("");
    setValue("address.state", "");
    setValue("address.city", "");
  };

  // ==========================================
  // 1. SMART PIN-CODE AUTO-FETCH (POSTAL API)
  // ==========================================
  const resolvePinCode = async (pin: string) => {
    if (!isIndia) return;

    setIsFetchingLocation(true);
    setApiError(null);
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await res.json();
      
      if (data && data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
        const postOffices = data[0].PostOffice;
        
        setValue("address.state", postOffices[0].State, { shouldValidate: true });
        setValue("address.city", postOffices[0].District, { shouldValidate: true });
        
        const localities = postOffices.map((po: any) => po.Name);
        setVerifiedLocalities(localities);
        setSelectedLocality(localities.length === 1 ? localities[0] : ""); 
        
        clearErrors(["address.state", "address.city", "address.postal_code"]);
        setLocationSuccess(true);
      } else {
        setError("address.postal_code", { type: "manual", message: "Invalid PIN code. Not found in Govt Registry." });
        resetLocationLocks();
      }
    } catch (err) {
      setError("address.postal_code", { type: "manual", message: "Postal lookup unavailable. Check network." });
      resetLocationLocks();
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let pin = e.target.value;
    
    if (!isIndia) {
      setValue("address.postal_code", pin.toUpperCase(), { shouldValidate: true });
      return;
    }

    pin = pin.replace(/\D/g, '').slice(0, 6);
    setValue("address.postal_code", pin, { shouldValidate: true });
    
    if (pin.length === 6) resolvePinCode(pin);
    else resetLocationLocks();
  };

  // ==========================================
  // 2. ONE-CLICK GPS REVERSE GEOCODING
  // ==========================================
  const handleGPSLocate = () => {
    if (!navigator.geolocation) {
      setApiError("Geolocation is not supported by your browser.");
      return;
    }

    setIsGpsLocating(true);
    setApiError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
            headers: { "Accept-Language": "en-US,en;q=0.9" }
          });
          const data = await res.json();
          
          if (data && data.address) {
            const pin = data.address.postcode;
            if (pin) {
              setValue("address.postal_code", pin, { shouldValidate: true });
              if (data.address.country_code === 'in') {
                setValue("address.country", "India", { shouldValidate: true });
                await resolvePinCode(pin);
              } else {
                setLocationSuccess(true); 
              }
            } else {
              setApiError("Could not detect Postal Code from your exact GPS location.");
            }
          }
        } catch (err) {
          setApiError("GPS resolution failed. Please enter PIN manually.");
        } finally {
          setIsGpsLocating(false);
        }
      },
      (err) => {
        setIsGpsLocating(false);
        setApiError("GPS access denied. Please allow location permissions in your browser.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ==========================================
  // 3. SECURE FORM SANITIZATION & SUBMISSION
  // ==========================================
  const validateCustomRules = (data: CreateLabFormValues): string | null => {
    if (!termsAccepted) return "You must accept the Terms of Service & Privacy Policy.";

    const rawPhone = data.contact_phone.replace(/\D/g, '');
    if (FAKE_PHONE_PATTERNS.includes(rawPhone)) return "Invalid or dummy phone number detected.";
    if (!selectedPhoneCountry.regex.test(rawPhone)) return `Invalid ${selectedPhoneCountry.name} mobile format.`;

    const emailDomain = data.support_email.split("@")[1]?.toLowerCase();
    if (emailDomain && DISPOSABLE_EMAIL_DOMAINS.includes(emailDomain)) {
      return "Disposable / temporary email domains are strictly prohibited.";
    }

    if (isIndia && locationSuccess && !selectedLocality) {
      return "Please select a verified Locality / Village from the dropdown.";
    }

    return null;
  };

  const onSubmit = async (data: CreateLabFormValues) => {
    setApiError(null);

    const validationError = validateCustomRules(data);
    if (validationError) {
      setApiError(validationError);
      return;
    }

    try {
      const cleanPhone = `${selectedPhoneCountry.code}${data.contact_phone.replace(/\D/g, '')}`;
      
      const payload = {
        ...data,
        name: data.name.trim(),
        support_email: data.support_email.trim().toLowerCase(),
        contact_phone: cleanPhone,
        address: {
          ...data.address,
          city: data.address.city.trim(),
          state: data.address.state.trim(),
          postal_code: data.address.postal_code.trim(),
          country: data.address.country.trim(),
          // Street_1 is already built securely via our useEffect hook!
        }
      };

      const newLab = await labService.createLab(payload);
      // const retoken =  await authService.refreshToken(); 
      // console.log(retoken);
      // setAuth(retoken.access_token, retoken.user.default_lab, retoken.user);
      setActiveLab(newLab.name);

      toast.success("Welcome! Go to settings and set your branding details.");
      router.push("/dashboard"); 
      
    } catch (error: any) {
      setApiError(error.response?.data?.detail || "Failed to provision Labspace. Please try again.");
    }
  };

  // 🚀 Helper to catch Zod validation errors on submit
  const onFormError = (errors: any) => {
    console.log("Validation Errors:", errors);
    setApiError("Please fill in all required fields correctly.");
  };

  return (
    <AuthGuard requireActiveLab={false}>
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-teal-100 selection:text-teal-900">
        
        {/* HEADER BRANDING */}
        <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-teal-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-xl shadow-teal-500/20 mb-5">
            <HeartPulse className="text-white" size={32} />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Provision Your Labspace</h2>
          <p className="mt-2 text-sm text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
            Create your master clinical workspace to start processing patients and managing diagnostic reports.
          </p>
        </div>

        {/* FORM CONTAINER */}
        <div className="sm:mx-auto sm:w-full sm:max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="bg-white py-8 px-6 shadow-2xl shadow-slate-200/50 rounded-3xl sm:px-10 border border-slate-100 relative">
            
            {apiError && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm font-bold rounded-xl border border-red-200 flex items-start gap-3 animate-in fade-in">
                <AlertCircle className="text-red-600 mt-0.5" size={18} />
                <div className="flex-1 leading-tight">{apiError}</div>
              </div>
            )}

            {/* Form Tag updated to catch errors */}
            <form onSubmit={handleSubmit(onSubmit, onFormError)} className="space-y-6">
              
              {/* ================= GENERAL INFO ================= */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Labspace Name <span className="text-red-500">*</span></label>
                  <div className={`relative flex items-center rounded-xl border ${errors.name ? 'border-red-300 focus-within:border-red-500 focus-within:ring-red-500/20' : 'border-slate-200 focus-within:border-teal-500 focus-within:ring-teal-500/20'} bg-white transition-all focus-within:ring-2 shadow-sm`}>
                    <div className="pl-4 pr-2 flex items-center pointer-events-none">
                      <Building2 className="h-5 w-5 text-slate-400" />
                    </div>
                    <input 
                      {...register("name")} 
                      className="w-full py-3.5 pr-4 bg-transparent text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none" 
                      placeholder="e.g. Apex Diagnostics Center" 
                    />
                  </div>
                  {errors.name && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.name.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Support Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Support Email <span className="text-red-500">*</span></label>
                    <div className={`relative flex items-center rounded-xl border ${errors.support_email ? 'border-red-300 focus-within:ring-red-500/20' : 'border-slate-200 focus-within:border-teal-500 focus-within:ring-teal-500/20'} bg-white transition-all focus-within:ring-2 shadow-sm`}>
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

                  {/* Phone Number with Country Dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Contact Phone <span className="text-red-500">*</span></label>
                    <div className={`relative flex items-center rounded-xl border ${errors.contact_phone ? 'border-red-300 focus-within:ring-red-500/20' : 'border-slate-200 focus-within:border-teal-500 focus-within:ring-teal-500/20'} bg-white transition-all focus-within:ring-2 shadow-sm`}>
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
                                    <span className="text-slate-400 text-xs font-mono">{c.code}</span>
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
                        placeholder={selectedPhoneCountry.placeholder} 
                      />
                    </div>
                    {errors.contact_phone && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.contact_phone.message}</p>}
                  </div>
                </div>
              </div>

              {/* ================= EXACT PHYSICAL LOCATION ================= */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <MapPin size={16} className="text-teal-600" /> Physical Verified Location
                  </h3>
                  
                  {/* GPS AUTO LOCATE BUTTON */}
                  <button 
                    type="button"
                    onClick={handleGPSLocate}
                    disabled={isGpsLocating || isFetchingLocation}
                    className="text-[10px] bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all outline-none disabled:opacity-50 shadow-sm"
                  >
                    {isGpsLocating ? <Loader2 size={12} className="animate-spin" /> : <LocateFixed size={12} />}
                    {isGpsLocating ? "Locating..." : "Use Current Location"}
                  </button>
                </div>
                
                {/* 🚀 PERFECT GRID ALIGNMENT */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  
                  {/* Country Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Country <span className="text-red-500">*</span></label>
                    <div className="relative flex items-center rounded-xl border border-slate-200 bg-white transition-all focus-within:border-teal-500 focus-within:ring-teal-500/20 focus-within:ring-2 shadow-sm">
                      <div className="pl-4 pr-2 flex items-center pointer-events-none text-slate-400">
                        <Globe size={18} />
                      </div>
                      <select 
                        {...register("address.country")}
                        className="w-full py-3.5 pr-8 bg-transparent text-sm font-medium text-slate-900 outline-none cursor-pointer appearance-none truncate"
                      >
                        {SUPPORTED_COUNTRIES.map(country => (
                          <option key={country} value={country}>{country}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* PIN/ZIP Code */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      {isIndia ? "PIN Code" : "ZIP Code"} <span className="text-red-500">*</span>
                    </label>
                    <div className={`relative flex items-center rounded-xl border ${errors.address?.postal_code ? 'border-red-300' : 'border-slate-200 focus-within:border-teal-500 focus-within:ring-teal-500/20'} ${locationSuccess ? 'bg-teal-50/40 border-teal-200 ring-2 ring-teal-500/20' : 'bg-white'} transition-all shadow-sm`}>
                      <div className="pl-4 pr-2 flex items-center pointer-events-none text-slate-400">
                        {isFetchingLocation ? <Loader2 size={18} className="text-teal-600 animate-spin" /> : <MapPin size={18} className={locationSuccess ? "text-teal-600" : ""} />}
                      </div>
                      <input 
                        {...register("address.postal_code", { onChange: handlePincodeChange })} 
                        maxLength={isIndia ? 6 : 12}
                        className={`w-full py-3.5 pr-4 bg-transparent text-sm font-mono font-bold placeholder:text-slate-400 placeholder:font-sans outline-none ${locationSuccess ? 'text-teal-800' : 'text-slate-900'}`} 
                        placeholder={isIndia ? "110001" : "Postal Code"} 
                      />
                      {locationSuccess && <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-teal-600" />}
                    </div>
                    {errors.address?.postal_code && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.address.postal_code.message}</p>}
                  </div>

                  {/* State (LOCKED in India) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">State <span className="text-red-500">*</span></label>
                    <div className={`relative flex items-center rounded-xl border border-slate-200 ${locationSuccess && isIndia ? 'bg-slate-50 opacity-80 cursor-not-allowed' : 'bg-white focus-within:border-teal-500 focus-within:ring-teal-500/20 focus-within:ring-2'} transition-all shadow-sm`}>
                      <div className="pl-4 pr-2 flex items-center pointer-events-none text-slate-400">
                        <Map size={18} />
                      </div>
                      <input 
                        {...register("address.state")} 
                        readOnly={locationSuccess && isIndia}
                        className="w-full py-3.5 pr-4 bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none pointer-events-none" 
                        placeholder="State" 
                        tabIndex={locationSuccess && isIndia ? -1 : 0}
                      />
                      {locationSuccess && isIndia && <Lock size={14} className="absolute right-4 text-slate-400" />}
                    </div>
                    {errors.address?.state && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.address.state.message}</p>}
                  </div>

                  {/* City / District (LOCKED in India) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">City / District <span className="text-red-500">*</span></label>
                    <div className={`relative flex items-center rounded-xl border border-slate-200 ${locationSuccess && isIndia ? 'bg-slate-50 opacity-80 cursor-not-allowed' : 'bg-white focus-within:border-teal-500 focus-within:ring-teal-500/20 focus-within:ring-2'} transition-all shadow-sm`}>
                      <input 
                        {...register("address.city")} 
                        readOnly={locationSuccess && isIndia}
                        className="w-full py-3.5 pl-4 pr-4 bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none pointer-events-none" 
                        placeholder="City" 
                        tabIndex={locationSuccess && isIndia ? -1 : 0}
                      />
                      {locationSuccess && isIndia && <Lock size={14} className="absolute right-4 text-slate-400" />}
                    </div>
                    {errors.address?.city && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.address.city.message}</p>}
                  </div>

                  {/* Verified Locality / Village Dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Verified Locality / Village <span className="text-red-500">*</span></label>
                    <div className={`relative flex items-center rounded-xl border border-slate-200 ${locationSuccess ? 'bg-white focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20' : 'bg-slate-50 opacity-60 cursor-not-allowed'} transition-all shadow-sm`}>
                      <div className="pl-4 pr-2 flex items-center pointer-events-none text-slate-400">
                        <Navigation size={18} className={locationSuccess ? "text-teal-600" : ""} />
                      </div>
                      <select 
                        value={selectedLocality}
                        onChange={(e) => setSelectedLocality(e.target.value)}
                        disabled={!locationSuccess || verifiedLocalities.length === 0}
                        className="w-full py-3.5 pr-8 bg-transparent text-sm font-medium text-slate-900 outline-none cursor-pointer appearance-none truncate disabled:pointer-events-none"
                      >
                        <option value="" disabled>Select postal area</option>
                        {verifiedLocalities.map(loc => (
                          <option key={loc} value={loc}>{loc}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Building / Plot No (Manual Entry) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Building / Plot No. <span className="text-red-500">*</span></label>
                    <div className={`relative flex items-center rounded-xl border ${errors.address?.street_1 ? 'border-red-300' : 'border-slate-200'} bg-white focus-within:border-teal-500 transition-all focus-within:ring-2 focus-within:ring-teal-500/20 shadow-sm`}>
                      <div className="pl-4 pr-2 flex items-center pointer-events-none text-slate-400">
                        <Building size={18} />
                      </div>
                      <input 
                        type="text"
                        value={buildingInput}
                        onChange={(e) => setBuildingInput(e.target.value)}
                        className="w-full py-3.5 pr-4 bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none" 
                        placeholder="Flat 101, Blue Tower..." 
                      />
                    </div>
                    {errors.address?.street_1 && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.address.street_1.message}</p>}
                  </div>

                </div>
              </div>

              {/* ================= COMPLIANCE & SUBMIT ================= */}
              <div className="pt-6 border-t border-slate-100">
                
                {/* Terms Checkbox */}
                <div className="flex items-start gap-3 mb-6">
                  <div className="flex items-center h-5">
                    <input 
                      id="terms" 
                      type="checkbox" 
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-600 cursor-pointer" 
                    />
                  </div>
                  <label htmlFor="terms" className="text-[11px] text-slate-500 leading-relaxed cursor-pointer select-none">
                    I agree to the <a href="#" className="font-bold text-teal-600 hover:underline">Terms of Service</a>, <a href="#" className="font-bold text-teal-600 hover:underline">Privacy Policy</a>, and confirm that this facility complies with all regional Healthcare Data Protection laws (e.g., HIPAA, DISHA).
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isFetchingLocation || isGpsLocating || !termsAccepted}
                  className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-teal-500/30 text-sm font-extrabold text-white bg-teal-600 hover:bg-teal-700 transition-all active:scale-[0.99] disabled:opacity-50 outline-none"
                >
                  {isSubmitting ? (
                    <><Loader2 className="animate-spin" size={18} /> Provisioning Secure Labspace...</>
                  ) : (
                    <>Initialize Labspace <ArrowRight size={18} /></>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

// "use client";

// import { useEffect, useRef, useState } from "react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { useRouter } from "next/navigation";
// import { 
//   Building2, ArrowRight, Loader2, HeartPulse, 
//   Mail, Smartphone, MapPin, Map, Building, CheckCircle2
// } from "lucide-react";

// import { labService } from "@/features/labs/api/lab.service";
// import { authService } from "@/features/auth/api/auth.service";
// import { useAuthStore } from "@/store/useAuthStore";
// import { AuthGuard } from "@/features/auth/components/AuthGuard";
// import { createLabSchema, CreateLabFormValues } from "@/features/labs/schemas/lab.schema";

// // Market-ready country codes for the Phone Dropdown
// const countryCodes = [
//   { code: '+91', flag: '🇮🇳', name: 'India' },
//   { code: '+1', flag: '🇺🇸', name: 'United States' },
//   { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
//   { code: '+61', flag: '🇦🇺', name: 'Australia' },
//   { code: '+971', flag: '🇦🇪', name: 'UAE' },
// ];

// export default function OnboardingPage() {
//   const router = useRouter();
//   const { setActiveLab } = useAuthStore();
//   const [apiError, setApiError] = useState<string | null>(null);

//   // Phone Dropdown State
//   const [isPhoneOpen, setIsPhoneOpen] = useState(false);
//   const [selectedPhoneCountry, setSelectedPhoneCountry] = useState(countryCodes[0]);
//   const phoneDropdownRef = useRef<HTMLDivElement>(null);

//   // Location Auto-Fetch State
//   const [isFetchingLocation, setIsFetchingLocation] = useState(false);
//   const [locationSuccess, setLocationSuccess] = useState(false);

//   const {
//     register,
//     handleSubmit,
//     setValue,
//     clearErrors,
//     setError,
//     formState: { errors, isSubmitting, isValid },
//   } = useForm<CreateLabFormValues>({
//     resolver: zodResolver(createLabSchema),
//     mode: "onTouched",
//     defaultValues: { 
//       address: { country: "India" }, // Silently defaults to India
//       timezone: "Asia/Kolkata"
//     }
//   });

//   // Close phone dropdown when clicking outside
//   useEffect(() => {
//     function handleClickOutside(event: MouseEvent) {
//       if (phoneDropdownRef.current && !phoneDropdownRef.current.contains(event.target as Node)) {
//         setIsPhoneOpen(false);
//       }
//     }
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   // ==========================================
//   // SMART PIN-CODE AUTO-FETCH (INDIA ONLY)
//   // ==========================================
//   const handlePincodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const pin = e.target.value.replace(/\D/g, '').slice(0, 6);
//     setValue("address.postal_code", pin, { shouldValidate: true });
//     setLocationSuccess(false);

//     // Auto-fetch if PIN is exactly 6 digits
//     if (pin.length === 6) {
//       setIsFetchingLocation(true);
//       try {
//         const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
//         const data = await res.json();
        
//         if (data && data[0].Status === "Success") {
//           const postOffice = data[0].PostOffice[0];
//           // Auto-fill fields
//           setValue("address.state", postOffice.State, { shouldValidate: true });
//           setValue("address.city", postOffice.District, { shouldValidate: true });
//           clearErrors(["address.state", "address.city", "address.postal_code"]);
//           setLocationSuccess(true);
//         } else {
//           setError("address.postal_code", { type: "manual", message: "Invalid PIN code." });
//           setValue("address.state", "");
//           setValue("address.city", "");
//         }
//       } catch (err) {
//         console.error("Location fetch error:", err);
//       } finally {
//         setIsFetchingLocation(false);
//       }
//     } else if (pin.length < 6) {
//       // Clear auto-filled data if they backspace
//       setValue("address.state", "");
//       setValue("address.city", "");
//     }
//   };

//   // ==========================================
//   // FORM SUBMISSION
//   // ==========================================
//   const onSubmit = async (data: CreateLabFormValues) => {
//     setApiError(null);
//     try {
//       // 🚀 Combine country code with the raw phone number before submitting
//       const payload = {
//         ...data,
//         contact_phone: `${selectedPhoneCountry.code}${data.contact_phone.trim()}`,
//       };

//       const newLab = await labService.createLab(payload);

//       // Refresh the JWT from FastAPI so the token gets the new Labspace permissions
//       await authService.refreshToken(); 

//       // Set Active Lab and Unlock Dashboard
//       setActiveLab(newLab.name);
//       window.location.href = "/dashboard"; 
      
//     } catch (error: any) {
//       setApiError(error.response?.data?.detail || "Failed to provision Labspace.");
//     }
//   };

//   return (
//     <AuthGuard requireActiveLab={false}>
//       <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-teal-100 selection:text-teal-900">
        
//         <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
//           <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-teal-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-xl shadow-teal-500/20 mb-5">
//             <HeartPulse className="text-white" size={32} />
//           </div>
//           <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Provision Your Labspace</h2>
//           <p className="mt-2 text-sm text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
//             Create your master clinical workspace to start processing patients and managing diagnostic reports.
//           </p>
//         </div>

//         <div className="sm:mx-auto sm:w-full sm:max-w-xl animate-in fade-in slide-in-from-bottom-8 duration-700">
//           <div className="bg-white py-8 px-6 shadow-2xl shadow-slate-200/50 rounded-3xl sm:px-10 border border-slate-100">
            
//             {apiError && (
//               <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm font-bold rounded-xl border border-red-200 flex items-center gap-3">
//                 <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
//                   <span className="text-red-600 font-black">!</span>
//                 </div>
//                 {apiError}
//               </div>
//             )}

//             <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
//               {/* ================= GENERAL INFO ================= */}
//               <div>
//                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Labspace Name <span className="text-red-500">*</span></label>
//                 <div className={`relative flex items-center rounded-xl border ${errors.name ? 'border-red-300 focus-within:border-red-500 focus-within:ring-red-500/20' : 'border-slate-200 focus-within:border-teal-500 focus-within:ring-teal-500/20'} bg-white transition-all focus-within:ring-2`}>
//                   <div className="pl-4 pr-2 flex items-center pointer-events-none">
//                     <Building2 className="h-5 w-5 text-slate-400" />
//                   </div>
//                   <input 
//                     {...register("name")} 
//                     className="w-full py-3.5 pr-4 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none" 
//                     placeholder="e.g. Apex Diagnostics Center" 
//                   />
//                 </div>
//                 {errors.name && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.name.message}</p>}
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
//                 {/* Support Email */}
//                 <div>
//                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Support Email <span className="text-red-500">*</span></label>
//                   <div className={`relative flex items-center rounded-xl border ${errors.support_email ? 'border-red-300 focus-within:ring-red-500/20' : 'border-slate-200 focus-within:border-teal-500 focus-within:ring-teal-500/20'} bg-white transition-all focus-within:ring-2`}>
//                     <div className="pl-4 pr-2 flex items-center pointer-events-none">
//                       <Mail className="h-5 w-5 text-slate-400" />
//                     </div>
//                     <input 
//                       {...register("support_email")} 
//                       type="email" 
//                       className="w-full py-3.5 pr-4 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none" 
//                       placeholder="lab@example.com" 
//                     />
//                   </div>
//                   {errors.support_email && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.support_email.message}</p>}
//                 </div>

//                 {/* 🚀 Phone Number with Country Dropdown */}
//                 <div>
//                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Contact Phone <span className="text-red-500">*</span></label>
//                   <div className={`relative flex items-center rounded-xl border ${errors.contact_phone ? 'border-red-300 focus-within:ring-red-500/20' : 'border-slate-200 focus-within:border-teal-500 focus-within:ring-teal-500/20'} bg-white transition-all focus-within:ring-2`}>
//                     <div className="pl-4 pr-1 flex items-center pointer-events-none">
//                       <Smartphone className="h-5 w-5 text-slate-400" />
//                     </div>
                    
//                     <div ref={phoneDropdownRef} className="relative flex h-full">
//                       <button
//                         type="button"
//                         onClick={() => setIsPhoneOpen(!isPhoneOpen)}
//                         className="flex items-center gap-1.5 h-full py-3.5 pl-1 pr-2 bg-transparent border-r border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none"
//                       >
//                         <span>{selectedPhoneCountry.flag}</span>
//                         <span className="text-slate-600 text-xs">({selectedPhoneCountry.code})</span>
//                       </button>
                      
//                       {isPhoneOpen && (
//                         <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden py-1.5">
//                           <ul className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
//                             {countryCodes.map((c, i) => (
//                               <li key={i}>
//                                 <button
//                                   type="button"
//                                   onClick={() => { setSelectedPhoneCountry(c); setIsPhoneOpen(false); }}
//                                   className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm transition-colors ${
//                                     selectedPhoneCountry.code === c.code ? "bg-teal-50 text-teal-700 font-semibold" : "text-slate-600 hover:bg-teal-50"
//                                   }`}
//                                 >
//                                   <div className="flex items-center gap-2"><span>{c.flag}</span><span>{c.name}</span></div>
//                                   <span className="text-slate-400 text-xs">{c.code}</span>
//                                 </button>
//                               </li>
//                             ))}
//                           </ul>
//                         </div>
//                       )}
//                     </div>

//                     <input 
//                       {...register("contact_phone")} 
//                       type="tel" 
//                       className="w-full pl-3 pr-4 py-3.5 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none" 
//                       placeholder="9876543210" 
//                     />
//                   </div>
//                   {errors.contact_phone && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.contact_phone.message}</p>}
//                 </div>
//               </div>

//               {/* ================= LOCATION VERIFICATION ================= */}
//               <div className="pt-4 border-t border-slate-100">
//                 <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
//                   <MapPin size={16} className="text-teal-600" /> Location Verification
//                 </h3>
                
//                 <div className="space-y-5">
                  
//                   {/* Street Address */}
//                   <div>
//                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Street Address <span className="text-red-500">*</span></label>
//                     <div className={`relative flex items-center rounded-xl border ${errors.address?.street_1 ? 'border-red-300 focus-within:ring-red-500/20' : 'border-slate-200 focus-within:border-teal-500 focus-within:ring-teal-500/20'} bg-white transition-all focus-within:ring-2`}>
//                       <div className="pl-4 pr-2 flex items-center pointer-events-none">
//                         <Building className="h-5 w-5 text-slate-400" />
//                       </div>
//                       <input 
//                         {...register("address.street_1")} 
//                         className="w-full py-3.5 pr-4 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none" 
//                         placeholder="Suite, Building, Street..." 
//                       />
//                     </div>
//                     {errors.address?.street_1 && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.address.street_1.message}</p>}
//                   </div>
                  
//                   {/* 🚀 Compact Grid: City, State, Pin */}
//                   <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    
//                     {/* City */}
//                     <div className="col-span-2 md:col-span-1">
//                       <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">City <span className="text-red-500">*</span></label>
//                       <div className={`relative flex items-center rounded-xl border ${errors.address?.city ? 'border-red-300 focus-within:ring-red-500/20' : 'border-slate-200 focus-within:border-teal-500 focus-within:ring-teal-500/20'} ${locationSuccess ? 'bg-teal-50/30' : 'bg-white'} transition-all focus-within:ring-2`}>
//                         <div className="pl-3 pr-1.5 flex items-center pointer-events-none">
//                           <MapPin className={`h-4 w-4 ${locationSuccess ? 'text-teal-600' : 'text-slate-400'}`} />
//                         </div>
//                         <input 
//                           {...register("address.city")} 
//                           className="w-full py-3 pr-3 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none" 
//                           placeholder="City" 
//                         />
//                       </div>
//                       {errors.address?.city && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.address.city.message}</p>}
//                     </div>

//                     {/* State */}
//                     <div>
//                       <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">State <span className="text-red-500">*</span></label>
//                       <div className={`relative flex items-center rounded-xl border ${errors.address?.state ? 'border-red-300 focus-within:ring-red-500/20' : 'border-slate-200 focus-within:border-teal-500 focus-within:ring-teal-500/20'} ${locationSuccess ? 'bg-teal-50/30' : 'bg-white'} transition-all focus-within:ring-2`}>
//                         <div className="pl-3 pr-1.5 flex items-center pointer-events-none">
//                           <Map className={`h-4 w-4 ${locationSuccess ? 'text-teal-600' : 'text-slate-400'}`} />
//                         </div>
//                         <input 
//                           {...register("address.state")} 
//                           className="w-full py-3 pr-3 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none" 
//                           placeholder="State" 
//                         />
//                       </div>
//                       {errors.address?.state && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.address.state.message}</p>}
//                     </div>

//                     {/* PIN Code */}
//                     <div>
//                       <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Pin Code <span className="text-red-500">*</span></label>
//                       <div className={`relative flex items-center rounded-xl border ${errors.address?.postal_code ? 'border-red-300 focus-within:ring-red-500/20' : 'border-slate-200 focus-within:border-teal-500 focus-within:ring-teal-500/20'} bg-white transition-all focus-within:ring-2`}>
//                         <div className="pl-3 pr-1.5 flex items-center pointer-events-none">
//                           {isFetchingLocation ? <Loader2 className="h-4 w-4 text-teal-600 animate-spin" /> : <MapPin className="h-4 w-4 text-slate-400" />}
//                         </div>
//                         <input 
//                           {...register("address.postal_code")} 
//                           onChange={handlePincodeChange}
//                           maxLength={6}
//                           className="w-full py-3 pr-3 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none" 
//                           placeholder="e.g. 110001" 
//                         />
//                         {locationSuccess && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />}
//                       </div>
//                       {errors.address?.postal_code && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.address.postal_code.message}</p>}
//                     </div>

//                   </div>
//                 </div>
//               </div>

//               {/* ================= SUBMIT ================= */}
//               <div className="pt-6">
//                 <button
//                   type="submit"
//                   disabled={isSubmitting || !isValid || isFetchingLocation}
//                   className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-teal-500/30 text-sm font-extrabold text-white bg-teal-600 hover:bg-teal-700 transition-all disabled:opacity-50"
//                 >
//                   {isSubmitting ? (
//                     <><Loader2 className="animate-spin" size={18} /> Provisioning Environment...</>
//                   ) : (
//                     <>Initialize Labspace <ArrowRight size={18} /></>
//                   )}
//                 </button>
//                 <p className="text-center text-[11px] font-semibold text-slate-400 mt-4 uppercase tracking-wider">
//                   AES-256 Encrypted & HIPAA Compliant
//                 </p>
//               </div>

//             </form>
//           </div>
//         </div>
//       </div>
//     </AuthGuard>
//   );
// }