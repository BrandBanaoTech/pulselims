"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { authService } from "../api/auth.service";
import { loginFormSchema, LoginFormValues } from "../schemas/login.schema";

export function LoginForm() {
  const router = useRouter();
  const setToken = useAuthStore((state) => state.setToken);
  
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    mode: "onSubmit",
  });

  const onSubmit = async (data: LoginFormValues) => {
    setAuthError(null);
    setIsLoading(true);

    try {
      const response = await authService.login(data);
      
      // 1. Securely store the JWT in our Zustand store
      setToken(response.access_token);
      
      // 2. Redirect to the Dashboard (or lab selection screen)
      router.push("/dashboard");
    } catch (error: any) {
      // Catch FastAPI 401/403 errors and display them cleanly
      setAuthError(
        error.response?.data?.detail || "Invalid credentials. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white shadow-xl rounded-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-300">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-extrabold text-gray-900">Welcome Back</h2>
        <p className="text-gray-500 mt-2 text-sm">
          Sign in to your LIMS workspace.
        </p>
      </div>

      {authError && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-md">
          {authError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Email Address
          </label>
          <input
            {...register("email")}
            type="email"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
            placeholder="admin@yourlab.com"
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1 font-medium">{errors.email.message}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-semibold text-gray-700">
              Password
            </label>
            {/* Future Feature Placeholder */}
            <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors">
              Forgot password?
            </a>
          </div>
          <input
            {...register("password")}
            type="password"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
            placeholder="••••••••••••"
          />
          {errors.password && (
            <p className="text-red-500 text-xs mt-1 font-medium">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center mt-2"
        >
          {isLoading ? "Authenticating..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}