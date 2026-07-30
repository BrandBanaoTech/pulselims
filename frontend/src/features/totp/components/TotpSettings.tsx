"use client";

import { useState } from "react";
import { 
  ShieldCheck, AlertTriangle, Smartphone, Copy, Download, Loader2, CheckCircle2 
} from "lucide-react";
import { totpService } from "@/services/totp.service";
import { OtpInput } from "./OtpInput";

interface TotpSettingsProps {
  email: string;
  initialIsActive: boolean;
}

type ModalState = "NONE" | "SETUP_QR" | "SETUP_BACKUP" | "DISABLE" | "REGENERATE";

export function TotpSettings({ email, initialIsActive }: TotpSettingsProps) {
  const [isActive, setIsActive] = useState(initialIsActive);
  const [modal, setModal] = useState<ModalState>("NONE");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Setup Wizard State
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [savedCodes, setSavedCodes] = useState(false);

  // -------------------------------------------------------------
  // ACTIONS
  // -------------------------------------------------------------
  const startSetup = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await totpService.setup(email);
      setSecret(res.secret);
      setQrCode(res.qr_code_base64);
      setModal("SETUP_QR");
    } catch (err: any) {
      alert("Failed to initialize setup.");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAndEnable = async (code: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await totpService.enable(email, code);
      setBackupCodes(res.backup_codes);
      setModal("SETUP_BACKUP");
      setIsActive(true);
    } catch (err: any) {
      setError("Invalid code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAndDisable = async (code: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await totpService.disable(email, code);
      setIsActive(false);
      setModal("NONE");
    } catch (err: any) {
      setError("Invalid code.");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAndRegenerate = async (code: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await totpService.regenerateBackups(email, code);
      setBackupCodes(res.backup_codes);
      setSavedCodes(false);
      setModal("SETUP_BACKUP"); // Re-use the backup code display view
    } catch (err: any) {
      setError("Invalid code.");
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // UTILS
  // -------------------------------------------------------------
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const downloadCodes = () => {
    const text = `PulseLIMS Backup Codes for ${email}\n\n` + backupCodes.join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pulselims-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  // -------------------------------------------------------------
  // RENDER MODALS
  // -------------------------------------------------------------
  const renderModal = () => {
    if (modal === "NONE") return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
          
          {/* HEADER */}
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-900">
              {modal === "SETUP_QR" && "Set Up Authenticator"}
              {modal === "SETUP_BACKUP" && "Save Backup Codes"}
              {modal === "DISABLE" && "Disable 2FA"}
              {modal === "REGENERATE" && "Regenerate Codes"}
            </h3>
            {modal !== "SETUP_BACKUP" && (
              <button onClick={() => setModal("NONE")} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            )}
          </div>

          {/* BODY */}
          <div className="p-8 overflow-y-auto custom-scrollbar">
            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl text-sm font-bold text-red-700 flex gap-2">
                <AlertTriangle size={18} /> {error}
              </div>
            )}

            {/* STEP 1: SCAN QR */}
            {modal === "SETUP_QR" && (
              <div className="space-y-6 text-center">
                <p className="text-sm text-slate-600">Scan this QR code with Google Authenticator, Authy, or your preferred 2FA app.</p>
                <div className="mx-auto w-48 h-48 p-2 border-2 border-slate-100 rounded-2xl bg-white shadow-sm">
                  <img src={`data:image/png;base64,${qrCode}`} alt="2FA QR Code" className="w-full h-full object-contain" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">Or enter code manually</p>
                  <div className="flex items-center justify-center gap-2">
                    <code className="bg-slate-100 px-3 py-1.5 rounded-lg text-sm font-mono font-bold text-slate-700">{secret}</code>
                    <button onClick={() => copyToClipboard(secret)} className="p-2 text-slate-400 hover:text-teal-600"><Copy size={16}/></button>
                  </div>
                </div>
                <div className="pt-6 border-t border-slate-100">
                  <p className="text-sm font-bold text-slate-900 mb-4">Enter the 6-digit code to verify</p>
                  <OtpInput onComplete={verifyAndEnable} disabled={isLoading} />
                </div>
              </div>
            )}

            {/* STEP 2: BACKUP CODES */}
            {modal === "SETUP_BACKUP" && (
              <div className="space-y-6">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3 text-amber-800">
                  <AlertTriangle className="shrink-0" size={20} />
                  <div className="text-sm">
                    <p className="font-bold mb-1">Save these codes safely!</p>
                    <p>If you lose your phone, these codes are the ONLY way to access your account. Each code can only be used once.</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {backupCodes.map((code, i) => (
                    <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg py-2 text-center font-mono font-bold text-slate-800 tracking-wider">
                      {code}
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button onClick={() => copyToClipboard(backupCodes.join("\n"))} className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 flex justify-center gap-2 items-center text-sm"><Copy size={16}/> Copy All</button>
                  <button onClick={downloadCodes} className="flex-1 py-2.5 bg-teal-50 text-teal-700 font-bold rounded-xl hover:bg-teal-100 flex justify-center gap-2 items-center text-sm"><Download size={16}/> Download TXT</button>
                </div>

                <div className="flex items-start gap-3 pt-4">
                  <input type="checkbox" id="saved" checked={savedCodes} onChange={(e) => setSavedCodes(e.target.checked)} className="mt-1 w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                  <label htmlFor="saved" className="text-sm text-slate-600 font-medium cursor-pointer">I have securely saved these backup codes.</label>
                </div>

                <button 
                  disabled={!savedCodes}
                  onClick={() => setModal("NONE")}
                  className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl disabled:opacity-50 disabled:bg-slate-300 transition-all"
                >
                  Complete Setup
                </button>
              </div>
            )}

            {/* ACTION MODALS: DISABLE / REGENERATE */}
            {(modal === "DISABLE" || modal === "REGENERATE") && (
              <div className="space-y-6 text-center">
                <p className="text-sm text-slate-600">
                  {modal === "DISABLE" 
                    ? "Disabling 2FA will make your account less secure. Please enter a 6-digit code from your authenticator app to confirm."
                    : "Regenerating backup codes will invalidate all your existing backup codes. Enter a 6-digit code to confirm."}
                </p>
                <OtpInput onComplete={modal === "DISABLE" ? verifyAndDisable : verifyAndRegenerate} disabled={isLoading} />
              </div>
            )}

          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* 2FA SETTINGS CARD */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6 border-b border-slate-100 pb-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Smartphone className="text-teal-600" /> Two-Factor Authentication
            </h2>
            <p className="text-slate-500 text-sm mt-1">Protect your account with an extra layer of clinical-grade security.</p>
          </div>
          
          <div className={`px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold ${isActive ? 'bg-teal-50 text-teal-700 border border-teal-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
            {isActive ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            {isActive ? "Currently Active" : "Currently Inactive"}
          </div>
        </div>

        {!isActive ? (
          <div>
            <button 
              onClick={startSetup} 
              disabled={isLoading}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center gap-2 transition-all shadow-md shadow-teal-600/20 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Enable Authenticator App"}
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => { setError(null); setModal("REGENERATE"); }} className="px-5 py-2.5 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 text-sm transition-colors">
              Regenerate Backup Codes
            </button>
            <button onClick={() => { setError(null); setModal("DISABLE"); }} className="px-5 py-2.5 bg-red-50 text-red-700 font-bold rounded-xl hover:bg-red-100 text-sm transition-colors">
              Disable 2FA
            </button>
          </div>
        )}
      </div>

      {renderModal()}
    </>
  );
}