"use client";

import { useState } from "react";
import { ShieldCheck, Loader2, AlertTriangle, KeyRound } from "lucide-react";
import { totpService } from "@/services/totp.service";
import { OtpInput } from "./OtpInput";

interface TotpChallengeProps {
  email: string;
  onSuccess: (token: string) => void;
}

export function TotpChallenge({ email, onSuccess }: TotpChallengeProps) {
  const [isBackupMode, setIsBackupMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backupCode, setBackupCode] = useState("");

  const verifyAppCode = async (code: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await totpService.verify(email, code);
      onSuccess(res.access_token);
    } catch (err: any) {
      setError(err.message || "Invalid authentication code.");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (backupCode.length < 8) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await totpService.verifyBackup(email, backupCode);
      onSuccess(res.access_token);
    } catch (err: any) {
      setError(err.message || "Invalid backup code.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mb-4">
          <ShieldCheck className="text-teal-600" size={32} />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900">Two-Step Verification</h2>
        <p className="text-slate-500 text-sm mt-2">
          {isBackupMode
            ? "Enter one of your 8-character emergency backup codes."
            : "Enter the 6-digit code from your authenticator app."}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
          <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={18} />
          <p className="text-sm font-bold text-red-700">{error}</p>
        </div>
      )}

      {!isBackupMode ? (
        <div className="space-y-8">
          <OtpInput onComplete={verifyAppCode} disabled={isLoading} />
          {isLoading && (
            <div className="flex justify-center">
              <Loader2 className="animate-spin text-teal-600" size={24} />
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={verifyBackup} className="space-y-4">
          <input
            type="text"
            placeholder="e.g. A1B2C3D4"
            value={backupCode}
            onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
            disabled={isLoading}
            className="w-full text-center tracking-[0.25em] font-mono text-xl px-4 py-4 bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none uppercase transition-all"
          />
          <button
            type="submit"
            disabled={isLoading || backupCode.length < 8}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl disabled:opacity-50 transition-all"
          >
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Verify Backup Code"}
          </button>
        </form>
      )}

      <div className="mt-8 pt-6 border-t border-slate-100 text-center">
        <button
          onClick={() => {
            setIsBackupMode(!isBackupMode);
            setError(null);
          }}
          className="text-sm font-semibold text-teal-600 hover:text-teal-700 flex items-center justify-center gap-2 mx-auto"
        >
          <KeyRound size={16} />
          {isBackupMode ? "Use Authenticator App instead" : "Lost phone? Use a backup code"}
        </button>
      </div>
    </div>
  );
}