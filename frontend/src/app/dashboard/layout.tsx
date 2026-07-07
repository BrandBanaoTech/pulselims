import { AuthGuard } from "@/features/auth/components/AuthGuard";
import { DashboardShell } from "@/features/labs/components/DashboardShell";
import { ReactNode } from "react";
import { Metadata } from "next";
// import { CreateLabModal } from "@/components/models/CreateLabModal";

export const metadata: Metadata = {
  title: "Workspace | PulseLIMS",
  description: "Enterprise Laboratory Information Management System",
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard requireActiveLab={true}>
      <DashboardShell>
        {children}
      </DashboardShell>
    {/* //   <CreateLabModal /> */}
    </AuthGuard>
  );
}