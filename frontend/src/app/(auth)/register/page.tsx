import { Metadata } from "next";
import { RegistrationWizard } from "@/features/auth/components/RegistrationWizard";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Create Workspace | LIMS Pro",
  description: "Register and verify your new Laboratory Information Management System workspace.",
};

export default function RegisterPage() {
  return (
    <div className="w-full flex flex-col items-center">
      {/* The Multi-Step Form */}
      <RegistrationWizard />

      {/* Footer Navigation */}
      <p className="mt-8 text-sm text-slate-500">
        Already have a workspace configured?{" "}
        <Link 
          href="/login" 
          className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
        >
          Sign in here
        </Link>
      </p>
    </div>
  );
}