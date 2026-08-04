"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Loader2, AlertTriangle, ArrowRight, ArrowLeft, 
  ShieldCheck, Lock, Eye, EyeOff, 
  Smartphone
} from "lucide-react";

import { useAuthStore } from "@/store/useAuthStore";
import { authService } from "../api/auth.service";
import { combinedLoginSchema, LoginWizardValues } from "../schemas/login.schema";

// Market-ready, scalable country codes array
const countryCodes = [
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+1', flag: '🇺🇸', name: 'United States' },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
];

// 🛡️ Safe Error Parsing for FastAPI (Handles 422 Arrays and 401 Strings)
const parseApiError = (error: any, fallback: string) => {
  const detail = error.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0 && detail[0].msg) return detail[0].msg;
  return fallback;
};

export function LoginForm() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  // UI State
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Custom Dropdown State
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countryCodes[0]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Security State (Matches backend LoginOTPResponse)
  const [verificationToken, setVerificationToken] = useState("");

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    watch,
    formState: { errors },
  } = useForm<LoginWizardValues>({
    resolver: zodResolver(combinedLoginSchema),
    mode: "onChange",
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

  const watchedMobile = watch("mobile");
  const watchedPassword = watch("password");
  const watchedOtp = watch("mobile_otp");

  // Step 1 is valid only if BOTH mobile and password are provided without errors
  const isStep1Valid = !!watchedMobile && !!watchedPassword && !errors.mobile && !errors.password;
  const isStep2Valid = watchedOtp?.length === 6 && !errors.mobile_otp;

  // ==========================================
  // STEP 1: REQUEST OTP
  // ==========================================
  const handleRequestOTP = async () => {
    setAuthError(null);
    
    // Trigger validation on both fields
    const isMobileValid = await trigger("mobile");
    const isPasswordValid = await trigger("password");
    if (!isMobileValid || !isPasswordValid) return;

    setIsLoading(true);
    try {
      const rawMobile = getValues("mobile");
      const password = getValues("password"); // Get actual password from form
      
      // 🚀 Combine dropdown code with the inputted number
      const fullMobile = `${selectedCountry.code}${rawMobile.trim()}`;
      
      const response = await authService.requestLoginOtp({ mobile: fullMobile, password });
      
      // Store the cryptographic state token returned from backend
      setVerificationToken(response.mobile_verification_token);
      setCurrentStep(2);
    } catch (error: any) {
      setAuthError(parseApiError(error, "Could not verify your credentials."));
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // STEP 2: VERIFY OTP
  // ==========================================
  const onSubmitFinal = async (data: LoginWizardValues) => {
    setAuthError(null);
    setIsLoading(true);

    try {
      // 🚀 Combine dropdown code with the inputted number for the final verification
      const fullMobile = `${selectedCountry.code}${data.mobile.trim()}`;

      const response = await authService.verifyLoginOtp({
        mobile: fullMobile,
        mobile_otp: data.mobile_otp as string,
        mobile_verification_token: verificationToken,
      });
      
      // Extract the JWT and User Profile from the `Token` response
      const token = response.access_token;
      const defaultLab = response.user?.default_lab || null;
      const userData = response.user;

      // Hydrate Zustand state immediately
      setAuth(token, defaultLab, userData);
      
      // Route transition (AuthGuard will handle the final destination automatically)
      if (defaultLab && token) {
        router.push("/dashboard");
      }
      else if (!defaultLab && token) {
        router.push('/onboarding')
      } 
      else {
        router.push('/login')
      }

    } catch (error: any) {
      setAuthError(parseApiError(error, "Invalid or expired OTP. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-white p-8 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-100">
      
      <div className="mb-6 text-center">
        <h2 className="text-xl font-extrabold text-slate-900">
          {currentStep === 1 ? "Welcome Back" : "Verify Identity"}
        </h2>
        <p className="text-slate-500 mt-1 text-sm font-medium">
          {currentStep === 1 
            ? "Enter your credentials to sign in." 
            : "Enter the secure code sent to your email."}
        </p>
      </div>

      {authError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={18} />
          <p className="text-sm font-bold text-red-700 leading-tight">{authError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmitFinal)} className="space-y-5">
        
        {/* ================= STEP 1: CREDENTIALS ================= */}
        <div className={currentStep === 1 ? "block space-y-5 animate-in slide-in-from-left-4 duration-300" : "hidden"}>
          
          {/* 🚀 Sleek Country Code + Mobile Number Input */}
          <div>
            <label htmlFor="mobile" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Registered Mobile Number
            </label>

            <div className={`flex relative rounded-xl border ${errors.mobile ? 'border-red-300 focus-within:border-red-500 focus-within:ring-red-500/20' : 'border-slate-200 focus-within:border-teal-500 focus-within:ring-teal-500/20'} bg-white shadow-sm transition-all focus-within:ring-2 hover:border-slate-300`}>
              <div className="inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Smartphone className="h-5 w-5 text-slate-400" />
              </div>
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
                autoComplete="tel"
                className="w-full px-4 py-3 bg-transparent rounded-r-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                placeholder="9876543210"
              />
            </div>

            {errors?.mobile && (
              <p className="text-red-500 text-[10px] mt-1.5 font-bold">
                {errors.mobile.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Password
              </label>
              <Link href="/forgot-password" className="text-[11px] font-bold text-teal-600 hover:text-teal-700 transition-colors">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                className={`w-full pl-12 pr-12 py-3 bg-white border ${errors.password ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-teal-500'} rounded-xl text-sm focus:ring-2 outline-none transition-all`}
                placeholder="••••••••"
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
            {errors.password && (
              <p className="text-red-500 text-[10px] mt-1.5 font-bold">{errors.password.message}</p>
            )}
          </div>

          <button
            type="button"
            onClick={handleRequestOTP}
            disabled={isLoading || !isStep1Valid}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-teal-500/30 disabled:opacity-50 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed mt-2 group"
          >
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Get OTP on Registered Email"}
            {!isLoading && isStep1Valid && <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />}
          </button>
        </div>

        {/* ================= STEP 2: OTP ================= */}
        <div className={currentStep === 2 ? "block space-y-5 animate-in slide-in-from-right-4 duration-300" : "hidden"}>
          
          <div className="p-4 bg-teal-50 border border-teal-100 rounded-xl flex items-start gap-3 mb-2">
            <ShieldCheck className="text-teal-600 shrink-0 mt-0.5" size={18} />
            <p className="text-xs font-bold text-teal-800 leading-relaxed">
              <span>A OTP was sent to your </span>
              <span className="text-teal-600 tracking-wide font-mono">Email</span> 
              <span> Please check your Email.</span>
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
              Enter 6-Digit Code
            </label>
            <input
              {...register("mobile_otp")}
              type="text"
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              className="w-full text-center tracking-[0.7em] font-mono text-2xl px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
              placeholder="••••••"
            />
            {errors.mobile_otp && (
              <p className="text-red-500 text-[10px] mt-1.5 font-bold text-center">{errors.mobile_otp.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              disabled={isLoading}
              className="w-1/3 py-3.5 px-4 bg-white border border-slate-200 text-slate-600 font-extrabold text-sm rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
            >
              <ArrowLeft size={16} /> Edit
            </button>
            <button
              type="submit"
              disabled={isLoading || !isStep2Valid}
              className="w-2/3 flex items-center justify-center gap-2 py-3.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-teal-500/30 disabled:opacity-50 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <><Loader2 className="animate-spin" size={18} /> Verifying...</>
              ) : "Verify & Sign In"}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}