import ReportTemplate from "@/features/reports/ReportTemplate";
import { LabResponse } from "../api/lab.service";

interface ReportTemplateTabProps {
  labData: LabResponse;
}

export default function ReportTemplateTab({ labData }: ReportTemplateTabProps) {
    // Header: logo, name, address, mobile, email
    // const lablogo = labData?.logo_url || "";
    // const labName = labData?.name || "PulseLIMS";
    // const labadd = labData?.address || "";
    // const labmobile = labData?.contact_phone || "";
    // const labemail = labData?.support_email || "";

    // Footer: sign, name
    // const dirsign = labData?.director_signature_url || "";
    // const dirname = labData?.director_name || "";

  return (
    <div>
        <ReportTemplate labData={labData} />
        {/* Header */}
        {/* {lablogo}
        {labadd.street_1}, 
        {labadd.street_2}, 
        {labadd.city}, 
        {labadd.state}, 
        {labadd.country}, 
        {labadd.postal_code}, 
        {labName}
        {labmobile}
        {labemail} */}

        {/* Intake , Petient Info */}

        {/* Footer */}
        {/* {dirsign},
        {dirsign} */}
    </div>
  );
}