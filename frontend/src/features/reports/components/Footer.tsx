import { LabResponse } from "@/features/labs/api/lab.service";

interface FooterProps {
  labData: LabResponse
}

export default function Footer({ labData } : FooterProps) {
  return (
    <footer className="mt-auto pt-6 border-t-[1.5px] border-black break-inside-avoid">
      <div className="grid grid-cols-2 gap-8 items-end">
        
        {/* LEFT: QR Code for Instant Verification */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 border-[1.5px] border-black flex items-center justify-center text-[8px] text-black font-bold bg-white relative shrink-0">
            <span className="absolute inset-0 flex items-center justify-center">QR CODE</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-black uppercase">Verified via LIMS</p>
            <p className="text-[9px] text-gray-600">Scan to check authenticity online.</p>
          </div>
        </div>

        {/* RIGHT: Pathologist Signature (Only 1 required for local labs) */}
        <div className="flex flex-col items-end text-right">
          <div className="h-12 w-48 border-b border-dashed border-gray-400 mb-1 flex items-end justify-end pb-1">
            <img src={labData.director_signature_url} className="h-10 object-contain" />
          </div>
          <p className="font-bold text-xs text-black uppercase">{labData?.name}, MD</p>
          <p className="text-[10px] text-gray-600">Consultant Pathologist (Reg: 88219)</p>
        </div>
        
      </div>

      <div className="mt-6 flex flex-col items-center justify-center border-t border-gray-300 pt-3">
        <p className="text-[11px] font-bold tracking-widest uppercase mb-1 text-black">*** End of Report ***</p>
        <p className="text-[9px] text-gray-500 text-center max-w-2xl">
          This is an electronically generated report authenticated by a registered medical practitioner.
        </p>
      </div>
    </footer>
  );
}