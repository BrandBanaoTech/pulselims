import { LabResponse } from "@/features/labs/api/lab.service";

interface HeaderProps {
    labData: LabResponse;
}

interface ReportTemplate {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  header_layout: "left-aligned" | "centered" | "split";
  font_family: string;
}

interface LabAddress {
  street_1?: string;
  street_2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
}

  const headerLayouts = {
    "left-aligned": "flex-row text-left",
    centered: "flex-col items-center text-center gap-4",
    split: "flex-row justify-between text-left items-center",
  };


export default function Header({ labData }: HeaderProps) {
    
    const template: ReportTemplate = labData?.template || {
        primary_color: "#0f172a", 
        secondary_color: "#475569",
        accent_color: "#059669",
        header_layout: "split",
        font_family: "'Inter', system-ui, sans-serif",
    };
    
    const formatAddress = (address?: LabAddress) => {
        if (!address) return "123 Health Avenue, Medical District, Cityville, 100021";
        const addressParts = [
        address.street_1, address.street_2, address.city,
        `${address.state || ""} ${address.zip_code || ""}`.trim(), address.country,
        ];
        return addressParts.filter(Boolean).join(", ");
    };
    
  return (
  <header className={`flex pb-4 mb-4 border-b-[3px] border-[var(--primary-color)] ${headerLayouts[template.header_layout]}`}>
    <div className={`${template.header_layout === "split" ? "order-1" : ""}`}>
      <h1 className="text-3xl font-black text-[var(--primary-color)] tracking-tight uppercase">
        {labData?.name || "PulseLIMS Diagnostics"}
      </h1>
      <p className="text-[11px] font-bold text-gray-700 mt-1 uppercase tracking-wider">
        {labData?.accreditation || "ISO 15189:2012 & NABL Accredited"}
      </p>
      <p className="text-[11px] text-gray-700 mt-1 max-w-md">
        {formatAddress(labData?.address)}
      </p>
      <p className="text-[11px] text-gray-700 mt-0.5 font-medium">
        {[labData?.contact_phone, labData?.support_email, labData?.website].filter(Boolean).join(" | ")}
      </p>
    </div>
    {labData?.logo_url && (
      <div className={`${template.header_layout === "split" ? "order-2" : ""}`}>
        <img src={labData.logo_url} alt="Lab Logo" className="h-16 w-auto object-contain" />
      </div>
    )}
  </header>
);
}