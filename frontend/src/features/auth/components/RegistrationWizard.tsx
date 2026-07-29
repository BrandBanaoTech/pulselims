"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { authService } from "../api/auth.service";
import { registerFormSchema, RegisterFormValues } from "../schemas/register.schema";
import { Loader2, AlertTriangle, ArrowRight, ArrowLeft, ShieldCheck, Mail, Eye, EyeOff } from "lucide-react"; 

// Market-ready, scalable country codes array
const countryCodes = [
  { code: '+91', flag: '🇮🇳', name: 'India' },
];

// 🛡️ Enhanced Error Parser for FastAPI
const parseApiError = (error: any, fallback: string) => {
  const detail = error.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0 && detail[0].msg) return detail[0].msg;
  return fallback;
};

export function RegistrationWizard() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  // UI State
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  
  // UX & Compliance State
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Custom Dropdown State
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countryCodes[0]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // API Lock to prevent double-submissions
  const isRequestingRef = useRef(false);

  // Cryptographic State (Holding FastAPI tokens between steps)
  const [authTokens, setAuthTokens] = useState({
    emailToken: "",
  });

  // Form Initialization
  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    mode: "onTouched",
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 1. SMART VALIDATION
  const watched = watch();

  const isStep1Valid = 
    !!(watched.full_name && watched.email && watched.mobile && watched.password) &&
    !errors.full_name && !errors.email && !errors.mobile && !errors.password && 
    termsAccepted;

  const isStep2Valid = 
    watched.email_otp?.length === 6 &&
    !errors.email_otp;

  // STEP 1 HANDLER: Validates user data and requests OTPs
  const handleRequestOTP = async () => {
    if (isRequestingRef.current) return;
    setGlobalError(null);
    
    const isStepOneValid = await trigger(["full_name", "email", "mobile", "password"]);
    if (!isStepOneValid || !termsAccepted) return;

    setIsLoading(true);
    isRequestingRef.current = true;

    try {
      const { email, mobile } = getValues();
      
      // 🚀 FIX: Properly reference the selected country code, not the entire array object
      const fullMobile = `${selectedCountry.code}${mobile.trim()}`;
      
      const response = await authService.requestRegistrationOtps({ 
        email, 
        mobile: fullMobile 
      });

      setAuthTokens({
        emailToken: response.email_verification_token,
      });

      setCurrentStep(2);
    } catch (error: any) {
      setGlobalError(parseApiError(error, "Failed to initiate verification. Please check your details."));
    } finally {
      setIsLoading(false);
      isRequestingRef.current = false;
    }
  };

  /**
   * STEP 2 HANDLER: Finalizes registration
   */
  const onSubmitFinal = async (data: RegisterFormValues) => {
    if (isRequestingRef.current) return;
    setGlobalError(null);
    setIsLoading(true);
    isRequestingRef.current = true;

    try {
      const payload = {
        full_name: data.full_name.trim(),
        email: data.email.trim(),
        mobile: `${selectedCountry.code}${data.mobile.trim()}`,
        password: data.password,
        email_otp: data.email_otp as string,
        email_verification_token: authTokens.emailToken,
        mobile_otp: "", // Bypassed for Email-Only Flow
        mobile_verification_token: "", // Bypassed for Email-Only Flow
      };

      const response = await authService.registerOwner(payload);
      const defaultLabId = null;
      setAuth(response.access_token, defaultLabId);
      
      router.push("/onboarding");

    } catch (error: any) {
      setGlobalError(parseApiError(error, "Verification failed. Please ensure your OTP is correct."));
    } finally {
      setIsLoading(false);
      isRequestingRef.current = false;
    }
  };

  return (
    <div className="w-full bg-white p-8 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-100">
      
      <div className="mb-6 text-center">
        <h2 className="text-xl font-extrabold text-slate-900">
          {currentStep === 1 ? "Owner Details" : "Verify Identity"}
        </h2>
        <p className="text-slate-500 mt-1 text-sm font-medium">
          {currentStep === 1 
            ? "Create your master administrative account." 
            : "Enter the 6-digit secure code sent to your email."}
        </p>
      </div>

      {globalError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={18} />
          <p className="text-sm font-bold text-red-700 leading-tight">{globalError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmitFinal)} className="space-y-5">
        
        {/* ================= STEP 1 FIELDS ================= */}
        <div className={currentStep === 1 ? "block space-y-5" : "hidden"}>
          
          <div>
            <label htmlFor="full_name" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
            <input
              id="full_name"
              {...register("full_name")}
              className={`w-full px-4 py-3 bg-white border ${errors.full_name ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-teal-500'} rounded-xl text-sm focus:ring-2 outline-none transition-all`}
              placeholder="e.g. Dr. Jane Doe"
            />
            {errors.full_name && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.full_name.message}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email</label>
            <input
              id="email"
              {...register("email")}
              type="email"
              className={`w-full px-4 py-3 bg-white border ${errors.email ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-teal-500'} rounded-xl text-sm focus:ring-2 outline-none transition-all`}
              placeholder="admin@yourlab.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.email.message}</p>}
          </div>

          {/* 🚀 Sleek Country Code + Mobile Number Input */}
          <div>
            <label htmlFor="mobile" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Mobile Number
            </label>

            <div className={`flex relative rounded-xl border ${errors.mobile ? 'border-red-300 focus-within:border-red-500 focus-within:ring-red-500/20' : 'border-slate-200 focus-within:border-teal-500 focus-within:ring-teal-500/20'} bg-white shadow-sm transition-all focus-within:ring-2 hover:border-slate-300`}>
              
              {/* Custom Dropdown Container */}
              <div ref={dropdownRef} className="relative flex">
                <button
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={isOpen}
                  onClick={() => setIsOpen(!isOpen)}
                  className="flex items-center gap-2 h-full py-3 pl-3 pr-2 bg-slate-50/50 rounded-l-xl border-r border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none"
                >
                  <span aria-hidden="true">{selectedCountry.flag}</span>
                  <span className="text-slate-600">({selectedCountry.code})</span>
                  
                  <svg
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden py-1.5 animate-in fade-in zoom-in-95 duration-100">
                    <ul role="listbox" className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                      {countryCodes.map((country, index) => (
                        <li key={index} role="option" aria-selected={selectedCountry.code === country.code}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCountry(country);
                              setIsOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm transition-colors ${
                              selectedCountry.code === country.code
                                ? "bg-teal-50 text-teal-700 font-semibold border-l-2 border-teal-500" 
                                : "text-slate-600 hover:bg-teal-50 hover:text-teal-700 border-l-2 border-transparent"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-base" aria-hidden="true">{country.flag}</span>
                              <span>{country.name}</span>
                            </div>
                            <span className="text-slate-400 font-mono text-xs">
                              {country.code}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Number Input */}
              <input
                id="mobile"
                {...register("mobile")}
                type="tel"
                className="w-full px-4 py-3 bg-transparent rounded-r-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                placeholder="9876543210"
              />
            </div>

            {errors?.mobile && (
              <p className="text-red-500 text-xs mt-1.5 font-medium">
                {errors.mobile.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Secure Password</label>
            <div className="relative">
              <input
                id="password"
                {...register("password")}
                type={showPassword ? "text" : "password"}
                className={`w-full pl-4 pr-12 py-3 bg-white border ${errors.password ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-teal-500'} rounded-xl text-sm focus:ring-2 outline-none transition-all`}
                placeholder="••••••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.password.message}</p>}
          </div>

          <div className="flex items-start gap-3 mt-4">
            <input
              type="checkbox"
              id="terms"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-slate-300 text-teal-600 accent-teal-600 focus:ring-teal-500 cursor-pointer shrink-0 transition-all"
            />
            <label htmlFor="terms" className="text-xs font-medium text-slate-500 leading-relaxed cursor-pointer select-none">
              I agree to the <span className="text-teal-600 hover:underline font-bold">Terms of Service</span>, <span className="text-teal-600 hover:underline font-bold">Privacy Policy</span>, and BAA (HIPAA) data processing agreements.
            </label>
          </div>

          <button
            type="button"
            onClick={handleRequestOTP}
            disabled={isLoading || !isStep1Valid}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-teal-500/30 disabled:opacity-50 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed mt-2 group"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              "Continue to Verify Email"
            )}
            {!isLoading && isStep1Valid && (
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            )}
          </button>
        </div>

        {/* ================= STEP 2 FIELDS ================= */}
        <div className={currentStep === 2 ? "block space-y-5 animate-in slide-in-from-right-4 duration-300" : "hidden"}>
          
          <div className="p-4 bg-teal-50 border border-teal-100 rounded-xl flex items-start gap-3 mb-6">
            <ShieldCheck className="text-teal-600 shrink-0 mt-0.5" size={18} />
            <p className="text-xs font-bold text-teal-800 leading-relaxed">
              We've sent a verification code to <br/>
              <span className="text-teal-600">{watched.email}</span>.
            </p>
          </div>

          <div>
            <label htmlFor="email_otp" className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <Mail size={14} /> Email OTP
            </label>
            <input
              id="email_otp"
              {...register("email_otp")}
              maxLength={6}
              className={`w-full text-center tracking-[0.5em] font-mono text-xl px-4 py-3 bg-white border ${errors.email_otp ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-teal-500'} rounded-xl focus:ring-2 outline-none transition-all`}
              placeholder="••••••"
            />
            {errors.email_otp && <p className="text-red-500 text-xs mt-1.5 font-medium text-center">{errors.email_otp.message}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              disabled={isLoading}
              className="w-1/3 py-3.5 px-4 bg-white border border-slate-200 text-slate-600 font-extrabold text-sm rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
            >
              <ArrowLeft size={16} /> Back
            </button>
            <button
              type="submit"
              disabled={isLoading || !isStep2Valid}
              className="w-2/3 flex items-center justify-center gap-2 py-3.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-teal-500/30 disabled:opacity-50 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Complete Setup"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}