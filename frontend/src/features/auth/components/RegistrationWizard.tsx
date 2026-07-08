"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { authService } from "../api/auth.service";
import { registerFormSchema, RegisterFormValues } from "../schemas/register.schema";
import { Loader2, AlertTriangle, ArrowRight, ArrowLeft, ShieldCheck, Mail, Smartphone } from "lucide-react";

export function RegistrationWizard() {
  const router = useRouter();
  const setToken = useAuthStore((state) => state.setToken);

  // UI State
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Cryptographic State (Holding FastAPI tokens between steps)
  const [authTokens, setAuthTokens] = useState({
    emailToken: "",
    mobileToken: "",
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

  // 1. SMART VALIDATION: Watch fields to dynamically enable/disable buttons per step
  const watched = watch();

  const isStep1Valid = 
    !!(watched.full_name && watched.email && watched.mobile && watched.password) &&
    !errors.full_name && !errors.email && !errors.mobile && !errors.password;

  const isStep2Valid = 
    watched.email_otp?.length === 6 && watched.mobile_otp?.length === 6 &&
    !errors.email_otp && !errors.mobile_otp;

  //  STEP 1 HANDLER: Validates user data and requests OTPs
  const handleRequestOTP = async () => {
    setGlobalError(null);
    
    // Strictly validate only Step 1 fields before hitting the API
    const isStepOneValid = await trigger(["full_name", "email", "mobile", "password"]);
    if (!isStepOneValid) return;

    setIsLoading(true);
    try {
      const { email, mobile } = getValues();
      const response = await authService.requestRegistrationOtps({ email, mobile });

      // Securely store the stateless JWTs returned by FastAPI
      setAuthTokens({
        emailToken: response.email_verification_token,
        mobileToken: response.mobile_verification_token,
      });

      // Transition to Step 2
      setCurrentStep(2);
    } catch (error: any) {
      setGlobalError(
        error.response?.data?.detail || "Failed to initiate verification. Please check your details."
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * STEP 2 HANDLER: Finalizes registration with OTPs and State Tokens
   */
  const onSubmitFinal = async (data: RegisterFormValues) => {
    setGlobalError(null);
    setIsLoading(true);

    try {
      // Construct the exact OwnerRegisterRequest payload
      const payload = {
        full_name: data.full_name,
        email: data.email,
        mobile: data.mobile,
        password: data.password,
        mobile_otp: data.mobile_otp as string,
        email_otp: data.email_otp as string,
        mobile_verification_token: authTokens.mobileToken,
        email_verification_token: authTokens.emailToken,
      };

      const response = await authService.registerOwner(payload);

      // 1. Persist the access token to Zustand (which saves to localStorage)
      setToken(response.access_token);
      
      // 2. Redirect to the main LIMS dashboard
      router.push("/onboarding");

    } catch (error: any) {
      setGlobalError(
        error.response?.data?.detail || "Verification failed. Please ensure your OTPs are correct."
      );
    } finally {
      setIsLoading(false);
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
            : "Enter the 6-digit secure codes sent to you."}
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
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
            <input
              {...register("full_name")}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
              placeholder="e.g. Dr. Jane Doe"
            />
            {errors.full_name && <p className="text-red-500 text-[10px] mt-1.5 font-bold">{errors.full_name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email</label>
            <input
              {...register("email")}
              type="email"
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
              placeholder="admin@yourlab.com"
            />
            {errors.email && <p className="text-red-500 text-[10px] mt-1.5 font-bold">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Mobile Number</label>
            <input
              {...register("mobile")}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
              placeholder="+919876543210"
            />
            {errors.mobile && <p className="text-red-500 text-[10px] mt-1.5 font-bold">{errors.mobile.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Secure Password</label>
            <input
              {...register("password")}
              type="password"
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
              placeholder="••••••••••••"
            />
            {errors.password && <p className="text-red-500 text-[10px] mt-1.5 font-bold">{errors.password.message}</p>}
          </div>

          {/* Step 1 Submit */}
          <button
            type="button"
            onClick={handleRequestOTP}
            disabled={isLoading || !isStep1Valid}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-teal-500/30 disabled:opacity-50 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed mt-2 group"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              "Generate Secure Tokens"
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
              We've sent verification codes to <br/>
              <span className="text-teal-600">{watched.email}</span> and <span className="text-teal-600">{watched.mobile}</span>.
            </p>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <Mail size={14} /> Email OTP
            </label>
            <input
              {...register("email_otp")}
              maxLength={6}
              className="w-full text-center tracking-[0.5em] font-mono text-xl px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
              placeholder="••••••"
            />
            {errors.email_otp && <p className="text-red-500 text-[10px] mt-1.5 font-bold text-center">{errors.email_otp.message}</p>}
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <Smartphone size={14} /> Mobile OTP
            </label>
            <input
              {...register("mobile_otp")}
              maxLength={6}
              className="w-full text-center tracking-[0.5em] font-mono text-xl px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
              placeholder="••••••"
            />
            {errors.mobile_otp && <p className="text-red-500 text-[10px] mt-1.5 font-bold text-center">{errors.mobile_otp.message}</p>}
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
              {isLoading ? "Verifying..." : "Complete Setup"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}