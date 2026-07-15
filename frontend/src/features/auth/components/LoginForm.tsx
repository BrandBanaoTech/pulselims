"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, AlertTriangle, ArrowRight, ArrowLeft, Smartphone, ShieldCheck, Lock } from "lucide-react";

import { useAuthStore } from "@/store/useAuthStore";
import { authService } from "../api/auth.service";
import { combinedLoginSchema, LoginWizardValues } from "../schemas/login.schema";

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
      const mobile = getValues("mobile");
      const password = getValues("password"); // Get actual password from form
      
      const response = await authService.requestLoginOtp({ mobile, password });
      
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
      const response = await authService.verifyLoginOtp({
        mobile: data.mobile,
        mobile_otp: data.mobile_otp as string,
        mobile_verification_token: verificationToken,
      });
      
      // Extract the JWT and User Profile from the `Token` response
      const token = response.access_token;
      const defaultLabId = response.user?.default_lab_id || null;
      console.log('login -> ' + defaultLabId)

      // Hydrate Zustand state immediately
      setAuth(token, defaultLabId);
      
      // Route transition (AuthGuard will handle the final destination automatically)
      if (defaultLabId && token) {
        router.push("/dashboard");
      }
      else if (!defaultLabId && token) {
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
            : "Enter the secure code sent to your phone."}
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
          
          {/* Mobile Field */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Registered Mobile Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Smartphone className="h-5 w-5 text-slate-400" />
              </div>
              <input
                {...register("mobile")}
                type="tel"
                autoComplete="tel"
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                placeholder="+919876543210"
              />
            </div>
            {errors.mobile && (
              <p className="text-red-500 text-[10px] mt-1.5 font-bold">{errors.mobile.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                {...register("password")}
                type="password"
                autoComplete="current-password"
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                placeholder="••••••••"
              />
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
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Send Secure Code"}
            {!isLoading && isStep1Valid && <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />}
          </button>
        </div>

        {/* ================= STEP 2: OTP ================= */}
        <div className={currentStep === 2 ? "block space-y-5 animate-in slide-in-from-right-4 duration-300" : "hidden"}>
          
          <div className="p-4 bg-teal-50 border border-teal-100 rounded-xl flex items-start gap-3 mb-2">
            <ShieldCheck className="text-teal-600 shrink-0 mt-0.5" size={18} />
            <p className="text-xs font-bold text-teal-800 leading-relaxed">
              A 6-digit code was sent via SMS to <br/>
              <span className="text-teal-600 tracking-wide font-mono">{watchedMobile}</span>
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


// "use client";

// import { useState } from "react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { useRouter } from "next/navigation";
// import { useAuthStore } from "@/store/useAuthStore";
// import { authService } from "../api/auth.service";
// import { loginFormSchema, LoginFormValues } from "../schemas/login.schema";
// import { Loader2, AlertTriangle, ArrowRight } from "lucide-react";

// export function LoginForm() {
//   const router = useRouter();
//   const setToken = useAuthStore((state) => state.setToken);
  
//   const [isLoading, setIsLoading] = useState(false);
//   const [authError, setAuthError] = useState<string | null>(null);

//   const {
//     register,
//     handleSubmit,
//     formState: { errors, isValid },
//   } = useForm<LoginFormValues>({
//     resolver: zodResolver(loginFormSchema),
//     mode: "onChange",
//   });

//   const onSubmit = async (data: LoginFormValues) => {
//     setAuthError(null);
//     setIsLoading(true);

//     try {
//       const response = await authService.login(data);
//       setToken(response.access_token);
//       router.push("/dashboard");
//     } catch (error: any) {
//       setAuthError(
//         error.response?.data?.detail || "Invalid credentials. Please verify your email and password."
//       );
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="w-full bg-white p-8 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-100">
      
//       <div className="mb-6 text-center">
//         <h2 className="text-xl font-extrabold text-slate-900">Welcome Back</h2>
//         <p className="text-slate-500 mt-1 text-sm font-medium">
//           Sign in to your clinical workspace.
//         </p>
//       </div>

//       {authError && (
//         <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
//           <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={18} />
//           <p className="text-sm font-bold text-red-700 leading-tight">{authError}</p>
//         </div>
//       )}

//       <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
//         <div>
//           <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
//             Email Address
//           </label>
//           <input
//             {...register("email")}
//             type="email"
//             autoComplete="email"
//             className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
//             placeholder="admin@yourlab.com"
//           />
//           {errors.email && (
//             <p className="text-red-500 text-[10px] mt-1.5 font-bold">{errors.email.message}</p>
//           )}
//         </div>

//         <div>
//           <div className="flex items-center justify-between mb-2">
//             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
//               Password
//             </label>
//             <a href="#" className="text-[11px] font-bold text-teal-600 hover:text-teal-700 transition-colors">
//               Forgot password?
//             </a>
//           </div>
//           <input
//             {...register("password")}
//             type="password"
//             autoComplete="current-password"
//             className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
//             placeholder="••••••••••••"
//           />
//           {errors.password && (
//             <p className="text-red-500 text-[10px] mt-1.5 font-bold">{errors.password.message}</p>
//           )}
//         </div>

//         <button
//           type="submit"
//           disabled={isLoading || !isValid}
//           className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-teal-500/30 disabled:opacity-50 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed mt-2 group"
//         >
//           {isLoading ? (
//             <Loader2 className="animate-spin" size={18} />
//           ) : (
//             "Secure Sign In"
//           )}
//           {!isLoading && isValid && (
//             <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
//           )}
//         </button>
//       </form>
//     </div>
//   );
// }

// "use client";

// import { useState } from "react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import { useRouter } from "next/navigation";
// import { useAuthStore } from "@/store/useAuthStore";
// import { authService } from "../api/auth.service";
// import { Loader2, AlertTriangle, ArrowRight, ArrowLeft, Smartphone, ShieldCheck } from "lucide-react";
// import { loginMobileSchema, loginOtpSchema } from "../schemas/login.schema";

// const combinedLoginSchema = loginMobileSchema.extend({
//   mobile_otp: loginOtpSchema.shape.mobile_otp.optional(), 
// });

// type LoginWizardValues = z.infer<typeof combinedLoginSchema>;

// const parseApiError = (error: any, fallback: string) => {
//   const detail = error.response?.data?.detail;
//   if (typeof detail === "string") return detail;
//   if (Array.isArray(detail) && detail.length > 0 && detail[0].msg) return detail[0].msg;
//   return fallback;
// };

// export function LoginForm() {
//   const router = useRouter();
//   const setToken = useAuthStore((state) => state.setToken);
  
//   const [currentStep, setCurrentStep] = useState<1 | 2>(1);
//   const [isLoading, setIsLoading] = useState(false);
//   const [authError, setAuthError] = useState<string | null>(null);
  
//   // MATCHES BACKEND
//   const [mobileVerificationToken, setMobileVerificationToken] = useState("");

//   const {
//     register,
//     handleSubmit,
//     trigger,
//     getValues,
//     watch,
//     formState: { errors },
//   } = useForm<LoginWizardValues>({
//     resolver: zodResolver(combinedLoginSchema),
//     mode: "onChange",
//   });

//   const watchedMobile = watch("mobile");
//   const watchedOtp = watch("mobile_otp"); // MATCHES BACKEND

//   const isStep1Valid = !!watchedMobile && !errors.mobile;
//   const isStep2Valid = watchedOtp?.length === 6 && !errors.mobile_otp;

//   const handleRequestOTP = async () => {
//     setAuthError(null);
//     const isValid = await trigger("mobile");
//     if (!isValid) return;

//     setIsLoading(true);
//     try {
//       const mobile = getValues("mobile");
//       const response = await authService.requestLoginOtp({ mobile });
      
//       // Assumes your backend returns {"mobile_verification_token": "..."} in step 1
//       setMobileVerificationToken(response.mobile_verification_token || response.verification_token);
//       setCurrentStep(2);
//     } catch (error: any) {
//       setAuthError(parseApiError(error, "Could not send secure code. Please verify your number."));
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const onSubmitFinal = async (data: LoginWizardValues) => {
//     setAuthError(null);
//     setIsLoading(true);

//     try {
//       const response = await authService.verifyLoginOtp({
//         mobile: data.mobile,
//         mobile_otp: data.mobile_otp as string,
//         mobile_verification_token: mobileVerificationToken,
//       });
      
//       setToken(response.access_token);
//       router.push("/dashboard");
//     } catch (error: any) {
//       setAuthError(parseApiError(error, "Invalid code. Please try again."));
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="w-full bg-white p-8 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-100">
//       <div className="mb-6 text-center">
//         <h2 className="text-xl font-extrabold text-slate-900">
//           {currentStep === 1 ? "Welcome Back" : "Verify Identity"}
//         </h2>
//         <p className="text-slate-500 mt-1 text-sm font-medium">
//           {currentStep === 1 
//             ? "Sign in to your clinical workspace." 
//             : "Enter the secure code sent to your phone."}
//         </p>
//       </div>

//       {authError && (
//         <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
//           <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={18} />
//           <p className="text-sm font-bold text-red-700 leading-tight">{authError}</p>
//         </div>
//       )}

//       <form onSubmit={handleSubmit(onSubmitFinal)} className="space-y-5">
        
//         {/* STEP 1: MOBILE INPUT */}
//         <div className={currentStep === 1 ? "block space-y-5 animate-in slide-in-from-left-4 duration-300" : "hidden"}>
//           <div>
//             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
//               Registered Mobile Number
//             </label>
//             <div className="relative">
//               <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
//                 <Smartphone className="h-5 w-5 text-slate-400" />
//               </div>
//               <input
//                 {...register("mobile")}
//                 type="tel"
//                 autoComplete="tel"
//                 className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
//                 placeholder="+919876543210"
//               />
//             </div>
//             {errors.mobile && (
//               <p className="text-red-500 text-[10px] mt-1.5 font-bold">{errors.mobile.message}</p>
//             )}
//           </div>

//           <button
//             type="button"
//             onClick={handleRequestOTP}
//             disabled={isLoading || !isStep1Valid}
//             className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-teal-500/30 disabled:opacity-50 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed mt-2 group"
//           >
//             {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Send Secure Code"}
//             {!isLoading && isStep1Valid && <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />}
//           </button>
//         </div>

//         {/* STEP 2: OTP VERIFICATION */}
//         <div className={currentStep === 2 ? "block space-y-5 animate-in slide-in-from-right-4 duration-300" : "hidden"}>
//           <div className="p-4 bg-teal-50 border border-teal-100 rounded-xl flex items-start gap-3 mb-2">
//             <ShieldCheck className="text-teal-600 shrink-0 mt-0.5" size={18} />
//             <p className="text-xs font-bold text-teal-800 leading-relaxed">
//               A 6-digit code was sent via SMS to <br/>
//               <span className="text-teal-600 tracking-wide">{watchedMobile}</span>
//             </p>
//           </div>

//           <div>
//             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
//               Enter 6-Digit Code
//             </label>
//             <input
//               {...register("mobile_otp")} // MATCHES BACKEND
//               type="text"
//               inputMode="numeric"
//               maxLength={6}
//               autoComplete="one-time-code"
//               className="w-full text-center tracking-[0.7em] font-mono text-2xl px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
//               placeholder="••••••"
//             />
//             {errors.mobile_otp && (
//               <p className="text-red-500 text-[10px] mt-1.5 font-bold text-center">{errors.mobile_otp.message}</p>
//             )}
//           </div>

//           <div className="flex gap-3 pt-2">
//             <button
//               type="button"
//               onClick={() => setCurrentStep(1)}
//               disabled={isLoading}
//               className="w-1/3 py-3.5 px-4 bg-white border border-slate-200 text-slate-600 font-extrabold text-sm rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
//             >
//               <ArrowLeft size={16} /> Edit
//             </button>
//             <button
//               type="submit"
//               disabled={isLoading || !isStep2Valid}
//               className="w-2/3 flex items-center justify-center gap-2 py-3.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-teal-500/30 disabled:opacity-50 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed"
//             >
//               {isLoading ? (
//                 <><Loader2 className="animate-spin" size={18} /> Verifying...</>
//               ) : "Verify & Sign In"}
//             </button>
//           </div>
//         </div>
//       </form>
//     </div>
//   );
// }