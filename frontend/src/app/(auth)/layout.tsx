import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen w-full bg-slate-50 selection:bg-teal-100 selection:text-teal-900 font-sans flex flex-col">
      {children}
    </main>
  );
}