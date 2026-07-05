"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { authService } from "../api/auth.service";
import { registerFormSchema, RegisterFormValues } from "../schemas/register.schema";

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
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    mode: "onTouched",
  });

  /**
   * STEP 1 HANDLER: Validates user data and requests OTPs
   */
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
      router.push("/dashboard");

    } catch (error: any) {
      setGlobalError(
        error.response?.data?.detail || "Verification failed. Please ensure your OTPs are correct."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white shadow-xl rounded-2xl border border-gray-100">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-extrabold text-gray-900">
          {currentStep === 1 ? "Create Workspace" : "Verify Identity"}
        </h2>
        <p className="text-gray-500 mt-2 text-sm">
          {currentStep === 1 
            ? "Register your Laboratory Information Management System." 
            : "Enter the 6-digit codes sent to your email and mobile."}
        </p>
      </div>

      {globalError && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-md">
          {globalError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmitFinal)} className="space-y-5">
        {/* STEP 1 FIELDS */}
        <div className={currentStep === 1 ? "block space-y-5" : "hidden"}>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
            <input
              {...register("full_name")}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
              placeholder="e.g. John Doe"
            />
            {errors.full_name && <p className="text-red-500 text-xs mt-1 font-medium">{errors.full_name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Corporate Email</label>
            <input
              {...register("email")}
              type="email"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
              placeholder="admin@yourlab.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1 font-medium">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Mobile Number</label>
            <input
              {...register("mobile")}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
              placeholder="+12345678900"
            />
            {errors.mobile && <p className="text-red-500 text-xs mt-1 font-medium">{errors.mobile.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Secure Password</label>
            <input
              {...register("password")}
              type="password"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
              placeholder="••••••••••••"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1 font-medium">{errors.password.message}</p>}
          </div>

          <button
            type="button"
            onClick={handleRequestOTP}
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center"
          >
            {isLoading ? "Generating Secure Tokens..." : "Continue to Verification"}
          </button>
        </div>

        {/* STEP 2 FIELDS */}
        <div className={currentStep === 2 ? "block space-y-5 animate-in slide-in-from-right-4 duration-300" : "hidden"}>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email OTP</label>
            <input
              {...register("email_otp")}
              maxLength={6}
              className="w-full text-center tracking-[0.5em] font-mono text-xl px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
              placeholder="••••••"
            />
            {errors.email_otp && <p className="text-red-500 text-xs mt-1 font-medium text-center">{errors.email_otp.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Mobile OTP</label>
            <input
              {...register("mobile_otp")}
              maxLength={6}
              className="w-full text-center tracking-[0.5em] font-mono text-xl px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
              placeholder="••••••"
            />
            {errors.mobile_otp && <p className="text-red-500 text-xs mt-1 font-medium text-center">{errors.mobile_otp.message}</p>}
          </div>

          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              disabled={isLoading}
              className="w-1/3 py-3.5 px-4 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-70"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="w-2/3 py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-sm disabled:opacity-70"
            >
              {isLoading ? "Authenticating..." : "Complete Setup"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}