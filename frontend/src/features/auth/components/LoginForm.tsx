// "use client";

// import { useState } from "react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { useRouter } from "next/navigation";
// import { useAuthStore } from "@/store/useAuthStore";
// import { authService } from "../api/auth.service";
// import { loginFormSchema, LoginFormValues } from "../schemas/login.schema";

// export function LoginForm() {
//   const router = useRouter();
//   const setToken = useAuthStore((state) => state.setToken);
  
//   const [isLoading, setIsLoading] = useState(false);
//   const [authError, setAuthError] = useState<string | null>(null);

//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//   } = useForm<LoginFormValues>({
//     resolver: zodResolver(loginFormSchema),
//     mode: "onSubmit",
//   });

//   const onSubmit = async (data: LoginFormValues) => {
//     setAuthError(null);
//     setIsLoading(true);

//     try {
//       const response = await authService.login(data);
      
//       // 1. Securely store the JWT in our Zustand store
//       setToken(response.access_token);
      
//       // 2. Redirect to the Dashboard (or lab selection screen)
//       router.push("/dashboard");
//     } catch (error: any) {
//       // Catch FastAPI 401/403 errors and display them cleanly
//       setAuthError(
//         error.response?.data?.detail || "Invalid credentials. Please try again."
//       );
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="w-full max-w-md mx-auto p-8 bg-white shadow-xl rounded-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-300">
//       <div className="mb-8 text-center">
//         <h2 className="text-3xl font-extrabold text-gray-900">Welcome Back</h2>
//         <p className="text-gray-500 mt-2 text-sm">
//           Sign in to your LIMS workspace.
//         </p>
//       </div>

//       {authError && (
//         <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-md">
//           {authError}
//         </div>
//       )}

//       <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
//         <div>
//           <label className="block text-sm font-semibold text-gray-700 mb-1">
//             Email Address
//           </label>
//           <input
//             {...register("email")}
//             type="email"
//             className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
//             placeholder="admin@yourlab.com"
//           />
//           {errors.email && (
//             <p className="text-red-500 text-xs mt-1 font-medium">{errors.email.message}</p>
//           )}
//         </div>

//         <div>
//           <div className="flex items-center justify-between mb-1">
//             <label className="block text-sm font-semibold text-gray-700">
//               Password
//             </label>
//             {/* Future Feature Placeholder */}
//             <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors">
//               Forgot password?
//             </a>
//           </div>
//           <input
//             {...register("password")}
//             type="password"
//             className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
//             placeholder="••••••••••••"
//           />
//           {errors.password && (
//             <p className="text-red-500 text-xs mt-1 font-medium">{errors.password.message}</p>
//           )}
//         </div>

//         <button
//           type="submit"
//           disabled={isLoading}
//           className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center mt-2"
//         >
//           {isLoading ? "Authenticating..." : "Sign In"}
//         </button>
//       </form>
//     </div>
//   );
// }

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { authService } from "../api/auth.service";
import { loginFormSchema, LoginFormValues } from "../schemas/login.schema";
import { Loader2, AlertTriangle, ArrowRight } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const setToken = useAuthStore((state) => state.setToken);
  
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: LoginFormValues) => {
    setAuthError(null);
    setIsLoading(true);

    try {
      const response = await authService.login(data);
      setToken(response.access_token);
      router.push("/dashboard");
    } catch (error: any) {
      setAuthError(
        error.response?.data?.detail || "Invalid credentials. Please verify your email and password."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-white p-8 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-100">
      
      <div className="mb-6 text-center">
        <h2 className="text-xl font-extrabold text-slate-900">Welcome Back</h2>
        <p className="text-slate-500 mt-1 text-sm font-medium">
          Sign in to your clinical workspace.
        </p>
      </div>

      {authError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={18} />
          <p className="text-sm font-bold text-red-700 leading-tight">{authError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Email Address
          </label>
          <input
            {...register("email")}
            type="email"
            autoComplete="email"
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
            placeholder="admin@yourlab.com"
          />
          {errors.email && (
            <p className="text-red-500 text-[10px] mt-1.5 font-bold">{errors.email.message}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Password
            </label>
            <a href="#" className="text-[11px] font-bold text-teal-600 hover:text-teal-700 transition-colors">
              Forgot password?
            </a>
          </div>
          <input
            {...register("password")}
            type="password"
            autoComplete="current-password"
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
            placeholder="••••••••••••"
          />
          {errors.password && (
            <p className="text-red-500 text-[10px] mt-1.5 font-bold">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || !isValid}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-teal-500/30 disabled:opacity-50 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed mt-2 group"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            "Secure Sign In"
          )}
          {!isLoading && isValid && (
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          )}
        </button>
      </form>
    </div>
  );
}