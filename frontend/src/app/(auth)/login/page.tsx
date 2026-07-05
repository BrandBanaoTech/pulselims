import { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/LoginForm";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign In | LIMS Pro",
  description: "Securely sign in to your Laboratory Information Management System.",
};

export default function LoginPage() {
  return (
    <div className="w-full flex flex-col items-center">
      <LoginForm />

      <p className="mt-8 text-sm text-slate-500">
        Don't have a workspace yet?{" "}
        <Link 
          href="/register" 
          className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
        >
          Create one now
        </Link>
      </p>
    </div>
  );
}