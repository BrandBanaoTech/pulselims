import ReportEntryPage from "@/features/reports/components/ReportEntryPage";

// 1. Update the type definition to expect a Promise
interface RouteProps {
  params: Promise<{ patientId: string }>;
}

// 2. Make the component an async function
export default async function ReportRoute({ params }: RouteProps) {
  
  // 3. Await the params to unwrap them
  const resolvedParams = await params;
  
  // 4. Safely access patientId
  return <ReportEntryPage patientId={resolvedParams.patientId} />;
}